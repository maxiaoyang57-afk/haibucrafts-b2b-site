import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sourceRoot = path.join(root, 'v2-preview');
const outRoot = path.join(root, '.release-candidate', 'site-v2');
const seoMap = JSON.parse(await readFile(path.join(sourceRoot, 'seo-production-map.json'), 'utf8'));
const migrationMap = JSON.parse(await readFile(path.join(sourceRoot, 'production-config', 'file-migration-map.json'), 'utf8'));

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function destinationFile(productionPath) {
  if (productionPath === '/') return path.join(outRoot, 'index.html');
  return path.join(outRoot, productionPath.slice(1), 'index.html');
}

function replacePaths(content) {
  return content
    .replace(/(["'])(?:\.\.\/)*assets\//gi, '$1/assets/v2/')
    .replaceAll('/v2-preview/assets/', '/assets/v2/')
    .replaceAll('/v2-preview/products/slime-charms/', '/products/slime-charms-wholesale/')
    .replaceAll('/v2-preview/products/polymer-clay-slices/', '/products/polymer-clay-slices-wholesale/')
    .replaceAll('/v2-preview/products/resin-charms/', '/products/resin-charms-for-slime/')
    .replaceAll('/v2-preview/products/sequins-glitter-confetti/', '/products/sequins-glitter-confetti/')
    .replaceAll('/v2-preview/products/', '/products/')
    .replaceAll('/v2-preview/custom-solutions/', '/custom-solutions/')
    .replaceAll('/v2-preview/manufacturing/', '/manufacturing/')
    .replaceAll('/v2-preview/quality-control/', '/quality-control/')
    .replaceAll('/v2-preview/certificates/', '/certificates/')
    .replaceAll('/v2-preview/about/', '/about/')
    .replaceAll('/v2-preview/blog/how-to-prepare-a-wholesale-product-brief/', '/blog/how-to-prepare-a-wholesale-product-brief/')
    .replaceAll('/v2-preview/blog/sample-approval-checklist/', '/blog/sample-approval-checklist/')
    .replaceAll('/v2-preview/blog/packaging-quality-checkpoints/', '/blog/packaging-quality-checkpoints/')
    .replaceAll('/v2-preview/blog/', '/blog/')
    .replaceAll('/v2-preview/quote/', '/request-quote/')
    .replaceAll('/v2-preview/', '/');
}

function applyProductionMetadata(html, route, { canonical = true } = {}) {
  const robots = route.index ? 'index,follow' : 'noindex,follow';
  const canonicalUrl = `${seoMap.site.origin}${route.productionPath}`;
  let next = html
    .replace(/<title>[^<]*<\/title>/i, `<title>${route.title}</title>`)
    .replace(/<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i, `<meta name="description" content="${route.description}">`)
    .replace(/<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?>/i, `<meta name="robots" content="${robots}">`)
    .replaceAll('Preview branch only. Not published to production.', 'Wholesale craft supply and B2B sourcing support.')
    .replaceAll('Site V2 Preview', 'HAIBUCRAFT')
    .replaceAll('V2 Preview', 'HAIBUCRAFT');

  if (canonical && !/<link\s+rel=["']canonical["']/i.test(next)) {
    next = next.replace('</head>', `<link rel="canonical" href="${canonicalUrl}"></head>`);
  }
  if (!/<meta\s+property=["']og:title["']/i.test(next)) {
    next = next.replace('</head>', `<meta property="og:title" content="${route.title}"><meta property="og:description" content="${route.description}"><meta property="og:type" content="${route.type}"><meta property="og:url" content="${canonicalUrl}"><meta property="og:image" content="${seoMap.site.origin}${seoMap.site.defaultOgImage}"></head>`);
  }
  return replacePaths(next);
}

for (const route of seoMap.routes) {
  const relative = route.previewPath === '/v2-preview/'
    ? 'index.html'
    : `${route.previewPath.slice('/v2-preview/'.length)}index.html`;
  const sourceFile = path.join(sourceRoot, relative);
  const targetFile = destinationFile(route.productionPath);
  const html = await readFile(sourceFile, 'utf8');
  await mkdir(path.dirname(targetFile), { recursive: true });
  await writeFile(targetFile, applyProductionMetadata(html, route), 'utf8');
}

const notFoundRoute = {
  productionPath: '/404.html',
  title: 'Page Not Found | HAIBUCRAFT',
  description: 'The requested HAIBUCRAFT page could not be found. Return to the wholesale product directory or send a quotation request.',
  type: 'website',
  index: false
};
const notFoundHtml = await readFile(path.join(sourceRoot, '404.html'), 'utf8');
await writeFile(path.join(outRoot, '404.html'), applyProductionMetadata(notFoundHtml, notFoundRoute, { canonical: false }), 'utf8');

const assetsOut = path.join(outRoot, 'assets', 'v2');
await cp(path.join(sourceRoot, 'assets'), assetsOut, { recursive: true });
for (const file of (await walk(assetsOut)).filter((item) => item.endsWith('.js'))) {
  const source = await readFile(file, 'utf8');
  await writeFile(file, replacePaths(source), 'utf8');
}

await cp(path.join(sourceRoot, 'production-config', 'sitemap.xml'), path.join(outRoot, 'sitemap.xml'));
await cp(path.join(sourceRoot, 'production-config', 'robots.txt'), path.join(outRoot, 'robots.txt'));
await writeFile(path.join(outRoot, 'release-manifest.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: 'codex/v2-takeover',
  routes: seoMap.routes.map(({ previewPath, productionPath, index }) => ({ previewPath, productionPath, index })),
  supportPages: ['/404.html'],
  migrationVersion: migrationMap.version || 'unspecified',
  quoteMode: 'validation-only',
  productionPublished: false
}, null, 2));

console.log(`Release candidate generated at ${path.relative(root, outRoot)} with ${seoMap.routes.length} routed pages and a production 404 page.`);
