import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const releaseRoot = path.join(root, '.release-candidate', 'site-v2');
const seoMap = JSON.parse(await readFile(path.join(root, 'v2-preview', 'seo-production-map.json'), 'utf8'));
const routeByProductionPath = new Map(seoMap.routes.map((route) => [route.productionPath, route]));
const errors = [];
const titles = new Map();
const descriptions = new Map();
const auditedCanonicalUrls = new Set();
const noindexPaths = [];
let auditedRedirectCount = 0;
const requiredFaviconTags = [
  '<link rel="icon" href="/brand/favicon.ico" sizes="any">',
  '<link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32x32.png">',
  '<link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png">'
];
const requiredFaviconAssets = [
  'brand/favicon.ico',
  'brand/favicon-32x32.png',
  'brand/apple-touch-icon.png'
];
const requiredBrandAssets = [
  'brand/haibu-logo-header.png',
  'brand/haibu-logo-mobile.png',
  'brand/haibu-logo-footer.png',
  'brand/haibu-logo-black.png',
  'brand/haibu-og.png',
  'assets/v2/brand-v2.css'
];
const expectedBrandImage = `${seoMap.site.origin}${seoMap.site.defaultOgImage}`;
const legacyInternalRoutes = [
  '/products/slime-charms/',
  '/products/polymer-clay-slices/',
  '/products/resin-charms/',
  '/quote/',
  '/custom-services/'
];
const previewResiduePattern = /\/v2-preview\/|%2Fv2-preview%2F|V2 Preview|Preview branch|Not published to production|preview structure/i;

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

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

function collectAttributes(html, attribute) {
  const regex = new RegExp(`${attribute}=["']([^"']+)["']`, 'gi');
  return [...html.matchAll(regex)].map((match) => match[1]);
}

function structuredDataObjects(value) {
  if (!value || typeof value !== 'object') return [];
  return Array.isArray(value['@graph']) ? value['@graph'] : [value];
}

function isExternal(value) {
  return /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(value);
}

function resolveTarget(sourceFile, rawValue) {
  const value = rawValue.split('#')[0].split('?')[0];
  if (!value || value === '/') return path.join(releaseRoot, 'index.html');
  if (value.startsWith('/assets/images/')) return path.join(root, value.slice(1));
  if (value.startsWith('/')) {
    const relative = value.slice(1);
    if (path.extname(relative)) return path.join(releaseRoot, relative);
    return path.join(releaseRoot, relative, 'index.html');
  }
  const resolved = path.resolve(path.dirname(sourceFile), value);
  return value.endsWith('/') ? path.join(resolved, 'index.html') : resolved;
}

if (!await exists(releaseRoot)) {
  console.error('ERROR: release candidate directory does not exist. Run build-v2-release-candidate.mjs first.');
  process.exit(1);
}

const files = await walk(releaseRoot);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const jsFiles = files.filter((file) => file.endsWith('.js'));
const routedHtmlFiles = new Set();

for (const relative of requiredFaviconAssets) {
  const file = path.join(releaseRoot, relative);
  if (!await exists(file)) {
    errors.push(`missing favicon asset ${relative}`);
    continue;
  }
  if (!(await readFile(file)).length) errors.push(`favicon asset is empty: ${relative}`);
}

for (const relative of requiredBrandAssets) {
  const file = path.join(releaseRoot, relative);
  if (!await exists(file)) {
    errors.push(`missing final brand asset ${relative}`);
    continue;
  }
  if (!(await readFile(file)).length) errors.push(`final brand asset is empty: ${relative}`);
}

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const relative = path.relative(releaseRoot, file).split(path.sep).join('/');
  const is404 = relative === '404.html';
  const isQuote = relative === 'request-quote/index.html';
  const productionPath = relative === 'index.html' ? '/' : is404 ? null : `/${relative.replace(/index\.html$/, '')}`;
  const route = productionPath ? routeByProductionPath.get(productionPath) : null;
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.trim();
  const canonicalMatches = [...html.matchAll(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/gi)];
  const robotsMatches = [...html.matchAll(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["'][^>]*>/gi)];
  const ogImageMatches = [...html.matchAll(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/gi)];
  const ogImageAltMatches = [...html.matchAll(/<meta\s+property=["']og:image:alt["']\s+content=["']([^"']+)["'][^>]*>/gi)];
  const twitterImageMatches = [...html.matchAll(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["'][^>]*>/gi)];
  const twitterImageAltMatches = [...html.matchAll(/<meta\s+name=["']twitter:image:alt["']\s+content=["']([^"']+)["'][^>]*>/gi)];
  const twitterCardMatches = [...html.matchAll(/<meta\s+name=["']twitter:card["']\s+content=["']([^"']+)["'][^>]*>/gi)];
  const canonical = canonicalMatches[0]?.[1]?.trim();
  const robots = robotsMatches[0]?.[1]?.trim();
  const structuredData = [];
  for (const match of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      structuredData.push(...structuredDataObjects(JSON.parse(match[1])));
    } catch {
      errors.push(`${relative}: invalid JSON-LD`);
    }
  }

  if (previewResiduePattern.test(html)) errors.push(`${relative}: contains production preview residue`);
  if (/landing_page=[^"'\s>]*(?:%2Fv2-preview%2F|\/v2-preview\/)/i.test(html)) {
    errors.push(`${relative}: inquiry landing_page contains a preview path`);
  }
  if (!title) errors.push(`${relative}: missing title`);
  if (!description) errors.push(`${relative}: missing description`);
  if (ogImageMatches.length !== 1 || ogImageMatches[0]?.[1] !== expectedBrandImage) {
    errors.push(`${relative}: expected exactly one approved Open Graph brand image ${expectedBrandImage}`);
  }
  if (twitterImageMatches.length !== 1 || twitterImageMatches[0]?.[1] !== expectedBrandImage) {
    errors.push(`${relative}: expected exactly one approved Twitter brand image ${expectedBrandImage}`);
  }
  if (ogImageAltMatches.length !== 1 || !/HAIBUCRAFT/.test(ogImageAltMatches[0]?.[1] || '')) {
    errors.push(`${relative}: expected exactly one HAIBUCRAFT Open Graph image alt`);
  }
  if (twitterImageAltMatches.length !== 1 || !/HAIBUCRAFT/.test(twitterImageAltMatches[0]?.[1] || '')) {
    errors.push(`${relative}: expected exactly one HAIBUCRAFT Twitter image alt`);
  }
  if (twitterCardMatches.length !== 1 || twitterCardMatches[0]?.[1] !== 'summary_large_image') {
    errors.push(`${relative}: expected exactly one summary_large_image Twitter card`);
  }
  if (html.includes('/assets/images/logo-haibu.webp')) errors.push(`${relative}: contains obsolete visible brand logo reference`);
  for (const tag of requiredFaviconTags) {
    const count = html.split(tag).length - 1;
    if (count !== 1) errors.push(`${relative}: missing required favicon tag or duplicate detected: ${tag}`);
  }
  if (!is404 && !route) errors.push(`${relative}: production route is missing from seo-production-map.json`);
  if (route) routedHtmlFiles.add(relative);
  if (is404) {
    if (canonicalMatches.length) errors.push(`${relative}: 404 page should not declare a canonical URL`);
    if (!html.includes('data-page="404"') || !html.includes('The requested page could not be found.')) {
      errors.push(`${relative}: custom HAIBUCRAFT 404 content is missing`);
    }
  } else {
    const expectedCanonical = `${seoMap.site.origin}${productionPath}`;
    if (canonicalMatches.length !== 1) errors.push(`${relative}: expected exactly one canonical, found ${canonicalMatches.length}`);
    if (canonical !== expectedCanonical) errors.push(`${relative}: canonical must equal ${expectedCanonical}`);
    if (!/^https:\/\/www\.haibucrafts\.com\//.test(canonical || '')) errors.push(`${relative}: canonical must use absolute HTTPS www origin`);
    if (/\?|index\.html|\/v2-preview\//i.test(canonical || '')) errors.push(`${relative}: canonical contains a forbidden query, index.html or preview path`);
    if (canonical) {
      if (auditedCanonicalUrls.has(canonical)) errors.push(`${relative}: duplicate canonical URL ${canonical}`);
      auditedCanonicalUrls.add(canonical);
    }
  }
  if (robotsMatches.length !== 1) errors.push(`${relative}: expected exactly one robots directive, found ${robotsMatches.length}`);
  if (!robots) errors.push(`${relative}: missing robots directive`);
  if (html.includes('class="breadcrumbs"')) {
    const breadcrumbs = structuredData.find((entry) => entry['@type'] === 'BreadcrumbList');
    if (!breadcrumbs) {
      errors.push(`${relative}: visible breadcrumbs missing BreadcrumbList data`);
    } else {
      const items = breadcrumbs.itemListElement || [];
      if (items.length < 2) errors.push(`${relative}: BreadcrumbList must contain at least two items`);
      items.forEach((item, index) => {
        if (item.position !== index + 1 || !item.name || !item.item?.startsWith('https://www.haibucrafts.com/')) {
          errors.push(`${relative}: invalid BreadcrumbList item at position ${index + 1}`);
        }
      });
      if (!is404 && items.at(-1)?.item !== canonical) errors.push(`${relative}: final breadcrumb must match canonical URL`);
    }
  }
  for (const organization of structuredData.filter((entry) => entry['@type'] === 'Organization')) {
    if (organization.logo && organization.logo !== `${seoMap.site.origin}/brand/haibu-logo-header.png`) {
      errors.push(`${relative}: Organization logo does not use the approved HAIBUCRAFT asset`);
    }
  }
  if (isQuote || is404 || route?.index === false) {
    if (robots !== 'noindex,follow') errors.push(`${relative}: must remain noindex,follow`);
    noindexPaths.push(productionPath || '/404.html');
  } else if (robots !== 'index,follow') {
    errors.push(`${relative}: approved production page must be index,follow`);
  }
  if (isQuote && (html.includes('Validate Quote Request') || html.includes('disabled until production approval'))) {
    errors.push(`${relative}: still contains pre-approval inquiry copy`);
  }

  if (title) {
    if (titles.has(title)) errors.push(`${relative}: duplicate title also used by ${titles.get(title)}`);
    else titles.set(title, relative);
  }
  if (description) {
    if (descriptions.has(description)) errors.push(`${relative}: duplicate description also used by ${descriptions.get(description)}`);
    else descriptions.set(description, relative);
  }

  for (const href of collectAttributes(html, 'href')) {
    if (isExternal(href) || href.startsWith('#')) continue;
    const internalPath = href.split('#')[0].split('?')[0];
    if (legacyInternalRoutes.some((legacy) => internalPath === legacy || internalPath.startsWith(legacy))) {
      errors.push(`${relative}: production internal link uses legacy route ${href}`);
    }
    const target = resolveTarget(file, href);
    if (!await exists(target)) errors.push(`${relative}: broken href ${href}`);
  }
  for (const src of collectAttributes(html, 'src')) {
    if (isExternal(src)) continue;
    const target = resolveTarget(file, src);
    if (!await exists(target)) errors.push(`${relative}: broken src ${src}`);
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const image = match[0];
    if (!/\balt=["'][^"']+["']/i.test(image)) errors.push(`${relative}: image missing useful alt text`);
    if (!/\bwidth=["']?\d+/i.test(image) || !/\bheight=["']?\d+/i.test(image)) {
      errors.push(`${relative}: image missing width or height`);
    }
  }
}

for (const route of seoMap.routes) {
  const relative = route.productionPath === '/' ? 'index.html' : `${route.productionPath.slice(1)}index.html`;
  if (!routedHtmlFiles.has(relative)) errors.push(`seo-production-map.json route missing generated HTML: ${route.productionPath}`);
}
if (routedHtmlFiles.size !== seoMap.routes.length) {
  errors.push(`generated route count ${routedHtmlFiles.size} does not match seo-production-map.json count ${seoMap.routes.length}`);
}

let combinedJs = '';
for (const file of jsFiles) combinedJs += `\n${await readFile(file, 'utf8')}`;
if (previewResiduePattern.test(combinedJs)) errors.push('production runtime JavaScript contains preview residue');
for (const legacy of legacyInternalRoutes) {
  if (combinedJs.includes(legacy)) errors.push(`production runtime JavaScript contains legacy route ${legacy}`);
}
for (const obsolete of ['/blog/wholesale-product-brief/', '/blog/custom-sample-approval/']) {
  if (combinedJs.includes(obsolete)) errors.push(`production runtime JavaScript contains obsolete route ${obsolete}`);
}

const componentsPath = path.join(releaseRoot, 'assets', 'v2', 'components.js');
if (!await exists(componentsPath)) errors.push('missing production components runtime');
else {
  const components = await readFile(componentsPath, 'utf8');
  if (!components.includes("const ROOT = '/';")) errors.push('production components runtime does not use root production paths');
  for (const marker of ['class="skip-link"', 'id="primary-navigation"', 'aria-controls="primary-navigation"', "'/assets/v2/'", 'accessibility.css', 'footer-related-v2.css']) {
    if (!components.includes(marker)) errors.push(`production components runtime missing accessibility marker: ${marker}`);
  }
  for (const route of ['products/', 'products/slime-charms-wholesale/', 'products/polymer-clay-slices-wholesale/', 'products/resin-charms-for-slime/', 'products/sequins-glitter-confetti/', 'custom-solutions/', 'manufacturing/', 'quality-control/', 'certificates/', 'about/', 'blog/', 'request-quote/']) {
    if (!components.includes(route)) errors.push(`production components runtime missing canonical navigation route: ${route}`);
  }
  for (const marker of ['/_vercel/insights/script.js', 'data-sdk="analytics"']) {
    if (!components.includes(marker)) errors.push(`production components runtime missing analytics marker: ${marker}`);
  }
  for (const marker of ['/brand/haibu-logo-header.png', '/brand/haibu-logo-mobile.png', '/brand/haibu-logo-footer.png', 'Creative craft components supplier', 'brand-v2.css']) {
    if (!components.includes(marker)) errors.push(`production components runtime missing final brand marker: ${marker}`);
  }
  if (/HAIBU CRAFT/.test(components)) errors.push('production components runtime contains non-canonical textual brand spelling HAIBU CRAFT');
  for (const marker of ['Prefer WhatsApp?', 'Chat with sales']) {
    if (!components.includes(marker)) errors.push(`production components runtime missing Request Quote WhatsApp alternative: ${marker}`);
  }
  for (const marker of ["whatsappNumber: '8618632026595'", 'https://wa.me/${CONTACT_CONFIG.whatsappNumber}', 'Chat with HAIBUCRAFT on WhatsApp', 'target="_blank" rel="noopener noreferrer"', 'whatsapp-float', 'IntersectionObserver', 'avoid-form']) {
    if (!components.includes(marker)) errors.push(`production components runtime missing WhatsApp marker: ${marker}`);
  }
}

const quoteConfigPath = path.join(releaseRoot, 'assets', 'v2', 'quote-runtime-config.js');
if (!await exists(quoteConfigPath)) errors.push('missing quote runtime configuration');
else {
  const config = await readFile(quoteConfigPath, 'utf8');
  if (!config.includes("mode: 'live'")) errors.push('approved release candidate quote mode must be live');
  if (!config.includes("endpoint: '/api/inquiry'")) errors.push('quote endpoint contract is missing');
  if (!config.includes('enableReferenceUploads: false')) errors.push('reference uploads must remain disabled for the initial production release');
}

const quoteRuntimePath = path.join(releaseRoot, 'assets', 'v2', 'quote-preview.js');
if (!await exists(quoteRuntimePath)) errors.push('missing quote submission runtime');
else {
  const quoteRuntime = await readFile(quoteRuntimePath, 'utf8');
  for (const marker of ["'Content-Type': 'application/json'", 'JSON.stringify({', 'fields,', 'attachments,']) {
    if (!quoteRuntime.includes(marker)) errors.push(`quote submission runtime missing API contract marker: ${marker}`);
  }
}

const sitemap = await readFile(path.join(releaseRoot, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].trim());
const sitemapUrlSet = new Set(sitemapUrls);
const expectedSitemapUrls = new Set(
  seoMap.routes.filter((route) => route.index).map((route) => `${seoMap.site.origin}${route.productionPath}`)
);
if (sitemapUrls.length !== sitemapUrlSet.size) errors.push('sitemap contains duplicate URLs');
for (const url of sitemapUrls) {
  if (!/^https:\/\/www\.haibucrafts\.com\//.test(url)) errors.push(`sitemap URL must use absolute HTTPS www origin: ${url}`);
  if (/\?|index\.html|\/v2-preview\/|\/404\.html/i.test(url)) errors.push(`sitemap contains forbidden URL: ${url}`);
  if (!expectedSitemapUrls.has(url)) errors.push(`sitemap contains a redirect, noindex or unknown URL: ${url}`);
}
for (const url of expectedSitemapUrls) {
  if (!sitemapUrlSet.has(url)) errors.push(`sitemap missing indexable canonical URL: ${url}`);
}
if (sitemapUrlSet.has(`${seoMap.site.origin}/request-quote/`)) errors.push('sitemap must exclude /request-quote/');
const robotsText = await readFile(path.join(releaseRoot, 'robots.txt'), 'utf8');
for (const required of ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /v2-preview/', 'Sitemap: https://www.haibucrafts.com/sitemap.xml']) {
  if (!robotsText.includes(required)) errors.push(`robots.txt missing ${required}`);
}
if (/^Disallow:\s*\/request-quote\/?\s*$/mi.test(robotsText)) {
  errors.push('robots.txt must allow crawling /request-quote/ while the page remains noindex,follow');
}

const vercelConfigPath = path.join(releaseRoot, 'vercel.json');
if (!await exists(vercelConfigPath)) {
  errors.push('release candidate is missing merged vercel.json');
} else {
  const vercelConfig = JSON.parse(await readFile(vercelConfigPath, 'utf8'));
  if (vercelConfig.cleanUrls !== false || vercelConfig.trailingSlash !== true) {
    errors.push('merged vercel.json must disable cleanUrls and enable trailingSlash so explicit legacy redirects run before file normalization');
  }
  const headers = (vercelConfig.headers || []).flatMap((rule) => rule.headers || []);
  for (const key of ['Content-Security-Policy', 'Permissions-Policy', 'Referrer-Policy', 'X-Content-Type-Options', 'X-Frame-Options']) {
    if (!headers.some((header) => header.key === key)) errors.push(`merged vercel.json missing security header ${key}`);
  }
  const redirectEntries = vercelConfig.redirects || [];
  auditedRedirectCount = redirectEntries.length;
  const redirects = new Map(redirectEntries.map((redirect) => [redirect.source, redirect]));
  if (redirects.size !== redirectEntries.length) errors.push('merged vercel.json contains duplicate redirect sources');
  const requiredRedirects = new Map([
    ['/index.html', '/'],
    ['/products/index.html', '/products/'],
    ['/blog/index.html', '/blog/'],
    ['/about/index.html', '/about/'],
    ['/custom-services/', '/custom-solutions/'],
    ['/custom-services/index.html', '/custom-solutions/'],
    ['/quote/', '/request-quote/'],
    ['/quote/index.html', '/request-quote/'],
    ['/request-quote/index.html', '/request-quote/'],
    ['/products/slime-charms-wholesale.html', '/products/slime-charms-wholesale/'],
    ['/products/polymer-clay-slices-wholesale.html', '/products/polymer-clay-slices-wholesale/'],
    ['/products/resin-charms-for-slime.html', '/products/resin-charms-for-slime/'],
    ['/products/sequins-glitter-confetti.html', '/products/sequins-glitter-confetti/'],
    ['/products/plastic-sequins-wholesale.html', '/products/sequins-glitter-confetti/'],
    ['/products/resin-charms-wholesale.html', '/products/resin-charms-for-slime/'],
    ['/products/resin-charms-wholesale/', '/products/resin-charms-for-slime/'],
    ['/blog/polymer-clay-slices-buying-guide.html', '/blog/polymer-clay-slice-buying-guide/'],
    ['/blog/polymer-clay-slices-buying-guide/', '/blog/polymer-clay-slice-buying-guide/'],
    ['/privacy.html', '/privacy/'],
    ['/about/b2b-export-supplier.html', '/about/'],
    ['/about/b2b-export-supplier/', '/about/'],
    ['/products/plastic-sequins-wholesale/', '/products/sequins-glitter-confetti/'],
    ['/blog/custom-oem-process.html', '/custom-solutions/'],
    ['/blog/resin-vs-clay.html', '/blog/polymer-clay-slice-buying-guide/'],
    ['/applications/festivals-parties-weddings.html', '/blog/seasonal-craft-assortment-planning/'],
    ['/products/custom-slime-add-ins-oem-mixes.html', '/custom-solutions/'],
    ['/products/slime-supplies-wholesale-hub.html', '/products/'],
    ['/haibu-manufacturing/', '/manufacturing/'],
    ['/haibu-quality-control/', '/quality-control/']
  ]);
  for (const [source, destination] of requiredRedirects) {
    const redirect = redirects.get(source);
    if (redirect?.destination !== destination || redirect?.permanent !== true) {
      errors.push(`merged vercel.json missing permanent redirect ${source} -> ${destination}`);
    }
  }
  for (const redirect of redirectEntries) {
    if (redirects.has(redirect.destination)) errors.push(`redirect chain detected: ${redirect.source} -> ${redirect.destination}`);
    if (sitemapUrlSet.has(`${seoMap.site.origin}${redirect.source}`)) errors.push(`sitemap contains redirect source: ${redirect.source}`);
    if (/[:*()]|\(\.\*\)/.test(redirect.source)) errors.push(`catch-all redirect could mask real 404 behavior: ${redirect.source}`);
  }
}

const manifest = JSON.parse(await readFile(path.join(releaseRoot, 'release-manifest.json'), 'utf8'));
if (manifest.quoteMode !== 'live') errors.push('release manifest quoteMode must be live');
if (manifest.productionApproved !== true) errors.push('release manifest must contain explicit production approval');
if (manifest.productionPublished !== false) errors.push('release manifest must state productionPublished false');
if (!Array.isArray(manifest.supportPages) || !manifest.supportPages.includes('/404.html')) errors.push('release manifest is missing the production 404 support page');
if (manifest.productionConfig !== 'vercel.json') errors.push('release manifest does not identify the merged production config');
if (manifest.catalogDecisions?.MA022?.status !== 'excluded') errors.push('MA022 release decision is not recorded');
if (manifest.catalogDecisions?.RW2666?.status !== 'excluded') errors.push('RW2666 release decision is not recorded');
if (manifest.inquiryTest?.accepted !== true || manifest.inquiryTest?.statusCode !== 200 || !manifest.inquiryTest?.providerMessageId) {
  errors.push('controlled live inquiry acceptance evidence is missing');
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Release candidate audit passed: ${htmlFiles.length} HTML pages and ${jsFiles.length} runtime scripts.`);
  console.log(`SEO canonical audit: ${auditedCanonicalUrls.size} canonical routes match seo-production-map.json.`);
  console.log(`SEO sitemap audit: ${sitemapUrls.length} unique indexable URLs; no redirect, noindex, query, index.html, preview or 404 URLs.`);
  console.log(`SEO noindex routes: ${[...new Set(noindexPaths)].join(', ')}.`);
  console.log(`SEO redirect audit: ${auditedRedirectCount} permanent one-hop redirects; no redirect sources in sitemap.`);
  console.log('SEO 404 audit: custom noindex,follow page present without canonical; no catch-all redirect masks unknown routes.');
  console.log(`Brand favicon audit: ${htmlFiles.length} HTML pages reference ${requiredFaviconTags.length} root-path icons; ${requiredFaviconAssets.length} assets are present.`);
  console.log(`Final brand audit: ${requiredBrandAssets.length} Logo/social assets present; all ${htmlFiles.length} HTML pages use the approved Open Graph and Twitter image.`);
  console.log('WhatsApp audit: confirmed +86 186 3202 6595 configuration, safe external links, accessible label and shared floating/footer/topbar entry present.');
}
