import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const previewRoot = path.join(root, 'v2-preview');
const errors = [];
const warnings = [];
const productCodes = new Map();
let productCardCount = 0;

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

function stripQueryHash(value) {
  return value.split('#')[0].split('?')[0];
}

function isExternal(value) {
  return /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(value);
}

function resolveLocal(sourceFile, rawValue) {
  const value = stripQueryHash(rawValue);
  if (!value || value === '/') return null;
  if (value.startsWith('/v2-preview/')) {
    const relative = value.slice('/v2-preview/'.length);
    return path.join(previewRoot, relative, value.endsWith('/') ? 'index.html' : '');
  }
  if (value.startsWith('/assets/')) return path.join(root, value.slice(1));
  if (value.startsWith('/')) return path.join(root, value.slice(1));
  const resolved = path.resolve(path.dirname(sourceFile), value);
  return value.endsWith('/') ? path.join(resolved, 'index.html') : resolved;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function collectAttributes(html, attribute) {
  const regex = new RegExp(`${attribute}=["']([^"']+)["']`, 'gi');
  return [...html.matchAll(regex)].map((match) => match[1]);
}

function checkQuoteLink(file, href) {
  if (!href.startsWith('/v2-preview/quote/')) return;
  const query = href.split('?')[1]?.split('#')[0] || '';
  const params = new URLSearchParams(query.replace(/&amp;/g, '&'));
  const source = params.get('source');
  if (!source) errors.push(`${file}: quote link missing source: ${href}`);
  if (source === 'product') {
    for (const key of ['category', 'product_code', 'product', 'image', 'landing_page']) {
      if (!params.get(key)) errors.push(`${file}: product quote link missing ${key}: ${href}`);
    }
  }
}

const htmlFiles = (await walk(previewRoot)).filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const relative = path.relative(root, file);

  if (!html.includes('meta name="robots" content="noindex,nofollow"')) {
    warnings.push(`${relative}: preview page is missing noindex,nofollow`);
  }

  for (const href of collectAttributes(html, 'href')) {
    if (isExternal(href) || href.startsWith('#')) continue;
    checkQuoteLink(relative, href);
    const target = resolveLocal(file, href);
    if (target && !await exists(target)) errors.push(`${relative}: broken href ${href} -> ${path.relative(root, target)}`);
  }

  for (const src of collectAttributes(html, 'src')) {
    if (isExternal(src)) continue;
    const target = resolveLocal(file, src);
    if (target && !await exists(target)) errors.push(`${relative}: broken src ${src} -> ${path.relative(root, target)}`);
  }

  const cards = [...html.matchAll(/<article class="product-card-v2"[^>]*>([\s\S]*?)<\/article>/g)];
  productCardCount += cards.length;
  for (const card of cards) {
    const block = card[0];
    const code = block.match(/<span class="sku-badge">([^<]+)<\/span>/)?.[1]?.trim();
    const image = block.match(/<img[^>]+src="([^"]+)"/)?.[1];
    if (!code) errors.push(`${relative}: product card missing SKU badge`);
    if (!image) errors.push(`${relative}: product card ${code || '(unknown)'} missing image`);
    if (code) {
      if (productCodes.has(code)) errors.push(`${relative}: duplicate SKU ${code}; first seen in ${productCodes.get(code)}`);
      else productCodes.set(code, relative);
    }
  }
}

const expectedCounts = new Map([
  ['v2-preview/products/polymer-clay-slices/index.html', 9],
  ['v2-preview/products/slime-charms/index.html', 15],
  ['v2-preview/products/resin-charms/index.html', 20],
  ['v2-preview/products/sequins-glitter-confetti/index.html', 19]
]);
for (const [relative, expected] of expectedCounts) {
  const html = await readFile(path.join(root, relative), 'utf8');
  const actual = (html.match(/<article class="product-card-v2"/g) || []).length;
  if (actual !== expected) errors.push(`${relative}: expected ${expected} product cards, found ${actual}`);
}

console.log(`V2 audit: ${htmlFiles.length} HTML files, ${productCardCount} product cards, ${productCodes.size} unique SKUs.`);
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log('V2 audit passed: no broken local links, missing product parameters, duplicate SKUs or count mismatches found.');
}
