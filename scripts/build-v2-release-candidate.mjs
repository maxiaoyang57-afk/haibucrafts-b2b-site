import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sourceRoot = path.join(root, 'v2-preview');
const outRoot = path.join(root, '.release-candidate', 'site-v2');
const seoMap = JSON.parse(await readFile(path.join(sourceRoot, 'seo-production-map.json'), 'utf8'));
const migrationMap = JSON.parse(await readFile(path.join(sourceRoot, 'production-config', 'file-migration-map.json'), 'utf8'));
const productionApproval = JSON.parse(await readFile(path.join(root, 'docs', 'site-v2-production-approval.json'), 'utf8'));
const rootVercelConfig = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
const redirectDraft = JSON.parse(await readFile(path.join(sourceRoot, 'production-config', 'vercel-redirects.json'), 'utf8'));
const faviconTags = [
  '<link rel="icon" href="/brand/favicon.ico" sizes="any">',
  '<link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32x32.png">',
  '<link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png">'
].join('');

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
  const replacements = [
    ['/v2-preview/assets/', '/assets/v2/'],
    ['/v2-preview/products/slime-charms/', '/products/slime-charms-wholesale/'],
    ['/v2-preview/products/polymer-clay-slices/', '/products/polymer-clay-slices-wholesale/'],
    ['/v2-preview/products/resin-charms/', '/products/resin-charms-for-slime/'],
    ['/v2-preview/products/sequins-glitter-confetti/', '/products/sequins-glitter-confetti/'],
    ['/v2-preview/products/', '/products/'],
    ['/v2-preview/custom-solutions/', '/custom-solutions/'],
    ['/v2-preview/manufacturing/', '/manufacturing/'],
    ['/v2-preview/quality-control/', '/quality-control/'],
    ['/v2-preview/certificates/', '/certificates/'],
    ['/v2-preview/about/', '/about/'],
    ['/v2-preview/privacy/', '/privacy/'],
    ['/v2-preview/blog/', '/blog/'],
    ['/v2-preview/quote/', '/request-quote/'],
    ['${ROOT}products/slime-charms/', '${ROOT}products/slime-charms-wholesale/'],
    ['${ROOT}products/polymer-clay-slices/', '${ROOT}products/polymer-clay-slices-wholesale/'],
    ['${ROOT}products/resin-charms/', '${ROOT}products/resin-charms-for-slime/'],
    ['${ROOT}quote/', '${ROOT}request-quote/']
  ];
  const encodedReplacements = [
    ['%2Fv2-preview%2Fproducts%2Fslime-charms%2F', '%2Fproducts%2Fslime-charms-wholesale%2F'],
    ['%2Fv2-preview%2Fproducts%2Fpolymer-clay-slices%2F', '%2Fproducts%2Fpolymer-clay-slices-wholesale%2F'],
    ['%2Fv2-preview%2Fproducts%2Fresin-charms%2F', '%2Fproducts%2Fresin-charms-for-slime%2F'],
    ['%2Fv2-preview%2Fproducts%2Fsequins-glitter-confetti%2F', '%2Fproducts%2Fsequins-glitter-confetti%2F'],
    ['%2Fv2-preview%2F', '%2F']
  ];

  let next = content.replace(/(["'])(?:\.\.\/)*assets\//gi, '$1/assets/v2/');
  for (const [from, to] of replacements) next = next.replaceAll(from, to);
  for (const [from, to] of encodedReplacements) next = next.replaceAll(from, to);
  return next
    .replaceAll('/v2-preview/', '/')
    .replace("const ASSET_ROOT = ROOT === '/' ? '/assets/v2/' : `${ROOT}assets/`;", "const ASSET_ROOT = '/assets/v2/';")
    .replace(/preview structure/gi, 'production site')
    .replace(/[ \t]+$/gm, '');
}

function applyProductionMetadata(html, route, { canonical = true } = {}) {
  const robots = route.index ? 'index,follow' : 'noindex,follow';
  const canonicalUrl = `${seoMap.site.origin}${route.productionPath}`;
  const brandImageUrl = `${seoMap.site.origin}${seoMap.site.defaultOgImage}`;
  let next = html
    .replace(/<link\b(?=[^>]*\brel=["'](?:icon|shortcut icon|apple-touch-icon)["'])[^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, '')
    .replace(/<meta\s+(?:property|name)=["'](?:og:image|og:image:width|og:image:height|twitter:card|twitter:title|twitter:description|twitter:image)["'][^>]*>\s*/gi, '')
    .replace(/<title>[^<]*<\/title>/i, `<title>${route.title}</title>`)
    .replace(/<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i, `<meta name="description" content="${route.description}">`)
    .replaceAll('Preview branch only. Not published to production.', 'Wholesale craft supply and B2B sourcing support.')
    .replaceAll(
      'Current status:</strong> required-field validation and source tracking are active. Email sending and reference-image uploads remain disabled until production approval.',
      'Inquiry status:</strong> secure email delivery and source tracking are active. Reference-image uploads remain disabled; include product links or requirements in Project Details.'
    )
    .replaceAll('>Validate Quote Request</button>', '>Send Quote Request</button>')
    .replaceAll('Site V2 Preview', 'HAIBUCRAFT')
    .replaceAll('V2 Preview', 'HAIBUCRAFT')
    .replaceAll('https://www.haibucrafts.com/assets/images/logo-haibu.webp', 'https://www.haibucrafts.com/brand/haibu-logo-header.png');

  const canonicalTag = canonical ? `<link rel="canonical" href="${canonicalUrl}">` : '';
  next = next.replace('</head>', `<meta name="robots" content="${robots}">${canonicalTag}</head>`);
  next = next.replace('</head>', `${faviconTags}</head>`);
  if (!/<meta\s+property=["']og:title["']/i.test(next)) {
    next = next.replace('</head>', `<meta property="og:title" content="${route.title}"><meta property="og:description" content="${route.description}"><meta property="og:type" content="${route.type}"><meta property="og:url" content="${canonicalUrl}"></head>`);
  }
  next = next.replace('</head>', `<meta property="og:image" content="${brandImageUrl}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${route.title}"><meta name="twitter:description" content="${route.description}"><meta name="twitter:image" content="${brandImageUrl}"></head>`);
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
await cp(path.join(root, 'brand'), path.join(outRoot, 'brand'), { recursive: true });
for (const file of (await walk(assetsOut)).filter((item) => item.endsWith('.js'))) {
  const source = await readFile(file, 'utf8');
  await writeFile(file, replacePaths(source), 'utf8');
}
await writeFile(path.join(assetsOut, 'quote-runtime-config.js'), `window.HAIBU_QUOTE_CONFIG = Object.freeze({
  mode: 'live',
  endpoint: '/api/inquiry',
  enableReferenceUploads: false,
  maxReferenceImages: 4
});
`, 'utf8');

await cp(path.join(sourceRoot, 'production-config', 'sitemap.xml'), path.join(outRoot, 'sitemap.xml'));
await cp(path.join(sourceRoot, 'production-config', 'robots.txt'), path.join(outRoot, 'robots.txt'));
const redirectsBySource = new Map();
for (const redirect of rootVercelConfig.redirects || []) redirectsBySource.set(redirect.source, redirect);
for (const redirect of redirectDraft.redirects || []) redirectsBySource.set(redirect.source, redirect);
const productionVercelConfig = {
  ...rootVercelConfig,
  cleanUrls: redirectDraft.cleanUrls,
  trailingSlash: redirectDraft.trailingSlash,
  redirects: [...redirectsBySource.values()],
  headers: rootVercelConfig.headers || []
};
await writeFile(path.join(outRoot, 'vercel.json'), `${JSON.stringify(productionVercelConfig, null, 2)}\n`, 'utf8');
await writeFile(path.join(outRoot, 'release-manifest.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: 'codex/v2-takeover',
  routes: seoMap.routes.map(({ previewPath, productionPath, index }) => ({ previewPath, productionPath, index })),
  supportPages: ['/404.html'],
  migrationVersion: migrationMap.version || 'unspecified',
  productionConfig: 'vercel.json',
  productionApproved: productionApproval.status === 'approved',
  approvalDate: productionApproval.approvedAt,
  catalogDecisions: productionApproval.catalogDecisions,
  inquiryTest: productionApproval.inquiryTest,
  quoteMode: 'live',
  productionPublished: false
}, null, 2));

console.log(`Release candidate generated at ${path.relative(root, outRoot)} with ${seoMap.routes.length} routed pages and a production 404 page.`);
