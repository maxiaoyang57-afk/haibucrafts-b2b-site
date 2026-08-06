import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const releaseRoot = path.join(root, '.release-candidate', 'site-v2');
const errors = [];
const titles = new Map();
const descriptions = new Map();

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

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const relative = path.relative(releaseRoot, file).split(path.sep).join('/');
  const is404 = relative === '404.html';
  const isQuote = relative === 'request-quote/index.html';
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.trim();
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]?.trim();
  const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1]?.trim();
  const structuredData = [];
  for (const match of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      structuredData.push(...structuredDataObjects(JSON.parse(match[1])));
    } catch {
      errors.push(`${relative}: invalid JSON-LD`);
    }
  }

  if (html.includes('/v2-preview/')) errors.push(`${relative}: contains preview path`);
  if (/Site V2 Preview|Preview branch only|V2 preview/i.test(html)) errors.push(`${relative}: contains preview-only copy`);
  if (!title) errors.push(`${relative}: missing title`);
  if (!description) errors.push(`${relative}: missing description`);
  if (!is404 && !canonical?.startsWith('https://www.haibucrafts.com/')) errors.push(`${relative}: missing or invalid canonical`);
  if (is404 && canonical) errors.push(`${relative}: 404 page should not declare a canonical URL`);
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
  if (isQuote || is404) {
    if (robots !== 'noindex,follow') errors.push(`${relative}: must remain noindex,follow`);
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

let combinedJs = '';
for (const file of jsFiles) combinedJs += `\n${await readFile(file, 'utf8')}`;
if (combinedJs.includes('/v2-preview/')) errors.push('production runtime JavaScript still contains /v2-preview/ paths');
for (const obsolete of ['/blog/wholesale-product-brief/', '/blog/custom-sample-approval/']) {
  if (combinedJs.includes(obsolete)) errors.push(`production runtime JavaScript contains obsolete route ${obsolete}`);
}

const componentsPath = path.join(releaseRoot, 'assets', 'v2', 'components.js');
if (!await exists(componentsPath)) errors.push('missing production components runtime');
else {
  const components = await readFile(componentsPath, 'utf8');
  if (!components.includes("const ROOT = '/';")) errors.push('production components runtime does not use root production paths');
  for (const marker of ['class="skip-link"', 'id="primary-navigation"', 'aria-controls="primary-navigation"', 'assets/accessibility.css']) {
    if (!components.includes(marker)) errors.push(`production components runtime missing accessibility marker: ${marker}`);
  }
  for (const marker of ['/_vercel/insights/script.js', 'data-sdk="analytics"']) {
    if (!components.includes(marker)) errors.push(`production components runtime missing analytics marker: ${marker}`);
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
if (sitemap.includes('/request-quote/') || sitemap.includes('/v2-preview/') || sitemap.includes('/404.html')) {
  errors.push('sitemap includes excluded inquiry, preview or 404 URL');
}
const robotsText = await readFile(path.join(releaseRoot, 'robots.txt'), 'utf8');
for (const required of ['Disallow: /request-quote/', 'Disallow: /api/', 'Disallow: /v2-preview/']) {
  if (!robotsText.includes(required)) errors.push(`robots.txt missing ${required}`);
}

const vercelConfigPath = path.join(releaseRoot, 'vercel.json');
if (!await exists(vercelConfigPath)) {
  errors.push('release candidate is missing merged vercel.json');
} else {
  const vercelConfig = JSON.parse(await readFile(vercelConfigPath, 'utf8'));
  if (vercelConfig.cleanUrls !== true || vercelConfig.trailingSlash !== true) {
    errors.push('merged vercel.json must enable cleanUrls and trailingSlash');
  }
  const headers = (vercelConfig.headers || []).flatMap((rule) => rule.headers || []);
  for (const key of ['Content-Security-Policy', 'Permissions-Policy', 'Referrer-Policy', 'X-Content-Type-Options', 'X-Frame-Options']) {
    if (!headers.some((header) => header.key === key)) errors.push(`merged vercel.json missing security header ${key}`);
  }
  const redirects = new Map((vercelConfig.redirects || []).map((redirect) => [redirect.source, redirect.destination]));
  const requiredRedirects = new Map([
    ['/products/slime-charms-wholesale.html', '/products/slime-charms-wholesale/'],
    ['/products/polymer-clay-slices-wholesale.html', '/products/polymer-clay-slices-wholesale/'],
    ['/products/resin-charms-for-slime.html', '/products/resin-charms-for-slime/'],
    ['/products/sequins-glitter-confetti.html', '/products/sequins-glitter-confetti/'],
    ['/custom-services/', '/custom-solutions/'],
    ['/quote/', '/request-quote/']
  ]);
  for (const [source, destination] of requiredRedirects) {
    if (redirects.get(source) !== destination) errors.push(`merged vercel.json missing redirect ${source} -> ${destination}`);
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
  console.log(`Release candidate audit passed: ${htmlFiles.length} HTML pages, ${jsFiles.length} runtime scripts, valid breadcrumbs, images, merged security config, 404 recovery and approved live inquiry mode.`);
}
