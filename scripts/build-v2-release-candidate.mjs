import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sourceRoot = path.join(root, 'v2-preview');
const outRoot = path.join(root, '.release-candidate', 'site-v2');
const seoMap = JSON.parse(await readFile(path.join(sourceRoot, 'seo-production-map.json'), 'utf8'));
const migrationMap = JSON.parse(await readFile(path.join(sourceRoot, 'production-config', 'file-migration-map.json'), 'utf8'));

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });

const routeMap = new Map(seoMap.routes.map((route) => [route.previewPath, route]));

function destinationFile(productionPath) {
  if (productionPath === '/') return path.join(outRoot, 'index.html');
  return path.join(outRoot, productionPath.slice(1), 'index.html');
}

function replacePaths(html) {
  return html
    .replaceAll('/v2-preview/assets/', '/assets/v2/')
    .replaceAll('/v2-preview/products/slime-charms/', '/products/slime-charms-wholesale/')
    .replaceAll('/v2-preview/products/polymer-clay-slices/', '/products/polymer-clay-slices-wholesale/')
    .replaceAll('/v2-preview/products/resin-charms/', '/products/resin-charms-for-slime/')
    .replaceAll('/v2-preview/products/sequins-glitter-confetti/', '/products/sequins-glitter-confetti/')
    .replaceAll('/v2-preview/products/', '/products/')
    .replaceAll('/v2-preview/custom-solutions/', '/custom-solutions/')
    .replaceAll('/v2-preview/manufacturing/', '/manufacturing/')
    .replaceAll('/v2-preview/quality-control/', '/quality-control/')
    .replaceAll('/v2-preview/about/', '/about/')
    .replaceAll('/v2-preview/blog/how-to-prepare-a-wholesale-product-brief/', '/blog/how-to-prepare-a-wholesale-product-brief/')
    .replaceAll('/v2-preview/blog/sample-approval-checklist/', '/blog/sample-approval-checklist/')
    .replaceAll('/v2-preview/blog/packaging-quality-checkpoints/', '/blog/packaging-quality-checkpoints/')
    .replaceAll('/v2-preview/blog/', '/blog/')
    .replaceAll('/v2-preview/quote/', '/request-quote/')
    .replaceAll('/v2-preview/', '/');
}

function applyProductionMetadata(html, route) {
  const robots = route.index ? 'index,follow' : 'noindex,follow';
  const canonical = `${seoMap.site.origin}${route.productionPath}`;
  let next = html
    .replace(/<title>[^<]*<\/title>/i, `<title>${route.title}</title>`)
    .replace(/<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i, `<meta name="description" content="${route.description}">`)
    .replace(/<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?>/i, `<meta name="robots" content="${robots}">`)
    .replaceAll('Preview branch only. Not published to production.', 'Wholesale craft supply and B2B sourcing support.');

  if (!/<link\s+rel=["']canonical["']/i.test(next)) {
    next = next.replace('</head>', `<link rel="canonical" href="${canonical}"></head>`);
  }
  if (!/<meta\s+property=["']og:title["']/i.test(next)) {
    next = next.replace('</head>', `<meta property="og:title" content="${route.title}"><meta property="og:description" content="${route.description}"><meta property="og:type" content="${route.type}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${seoMap.site.origin}${seoMap.site.defaultOgImage}"></head>`);
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

await cp(path.join(sourceRoot, 'assets'), path.join(outRoot, 'assets', 'v2'), { recursive: true });
await cp(path.join(sourceRoot, 'production-config', 'sitemap.xml'), path.join(outRoot, 'sitemap.xml'));
await cp(path.join(sourceRoot, 'production-config', 'robots.txt'), path.join(outRoot, 'robots.txt'));
await writeFile(path.join(outRoot, 'release-manifest.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: 'site-v2-integrated-preview',
  routes: seoMap.routes.map(({ previewPath, productionPath, index }) => ({ previewPath, productionPath, index })),
  migrationVersion: migrationMap.version || 'unspecified',
  productionPublished: false
}, null, 2));

console.log(`Release candidate generated at ${path.relative(root, outRoot)} with ${seoMap.routes.length} routed pages.`);
