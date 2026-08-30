import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const config = JSON.parse(await readFile(path.join(root, 'scripts/data/issue-37-sequins-sku-migration.json'), 'utf8'));
const category = config.category;
const mapping = config.mapping;
const legacyPaths = Object.keys(mapping);
const finalSkus = [...new Set(Object.values(mapping))];
const errors = [];

const exists = async (file) => { try { await access(file); return true; } catch { return false; } };
const read = (file) => readFile(path.join(root, file), 'utf8');
const cardsOf = (html) => [...html.matchAll(/<article class="product-card-v2"[\s\S]*?<\/article>/g)].map((match) => match[0]);
const skuOf = (card) => card.match(/<span class="sku-badge">([^<]+)<\/span>/)?.[1]?.trim() || '';
const hrefsOf = (html) => [...html.matchAll(/href="(\/products\/sequins-glitter-confetti\/[^"?]+\/?)"/g)].map((match) => match[1]);

const catalog = JSON.parse(await read('assets/v2/product-catalog.json'));
const products = catalog.products.filter((product) => product.category === category);
if (products.length !== config.expectedActiveCount) errors.push(`catalog has ${products.length} active products; expected ${config.expectedActiveCount}`);
if (new Set(products.map((product) => product.sku)).size !== products.length) errors.push('catalog contains duplicate active SKU codes');
if (finalSkus.some((sku) => !products.some((product) => product.sku === sku))) errors.push('catalog is missing a corrected SKU from the Issue #37 authority map');

for (const source of ['products/sequins-glitter-confetti/index.html', 'v2-preview/products/sequins-glitter-confetti/index.html']) {
  const html = await read(source);
  const cards = cardsOf(html);
  if (cards.length !== config.expectedActiveCount) errors.push(`${source} has ${cards.length} cards; expected ${config.expectedActiveCount}`);
  for (const sku of finalSkus) {
    const matches = cards.filter((card) => skuOf(card) === sku);
    if (matches.length !== 1) errors.push(`${source} has ${matches.length} cards for corrected SKU ${sku}`);
    const product = products.find((item) => item.sku === sku);
    if (product && matches[0] && (!matches[0].includes(product.title) || !matches[0].includes(product.image))) errors.push(`${source} card ${sku} does not match catalog title/image identity`);
  }
  for (const href of hrefsOf(html)) if (!href.startsWith('/products/sequins-glitter-confetti/')) errors.push(`${source} contains an out-of-category product href ${href}`);
}

const sitemap = await read('sitemap.xml');
const vercel = JSON.parse(await read('vercel.json'));
for (const product of products) if (!sitemap.includes(`<loc>https://www.haibucrafts.com${product.productionPath}</loc>`)) errors.push(`sitemap is missing ${product.productionPath}`);
for (const sourceSku of legacyPaths) {
  const sourceProduct = products.find((product) => product.sku === mapping[sourceSku]);
  const redirect = vercel.redirects.find((item) => item.destination === sourceProduct?.productionPath && item.source.startsWith(`/products/${category}/`));
  const legacyPath = redirect?.source;
  if (!legacyPath) { errors.push(`redirect missing for original SKU ${sourceSku}`); continue; }
  if (sitemap.includes(`<loc>https://www.haibucrafts.com${legacyPath}</loc>`)) errors.push(`sitemap still contains legacy path ${legacyPath}`);
  if (!redirect || redirect.permanent !== true || redirect.destination !== sourceProduct?.productionPath) errors.push(`redirect mismatch for ${legacyPath}`);
}

if (process.argv.includes('--live')) {
  const base = (process.env.AUDIT_BASE_URL || 'https://www.haibucrafts.com').replace(/\/$/, '');
  const fetchPage = async (route, options = {}) => fetch(`${base}${route}`, { redirect: 'manual', ...options });
  const categoryResponse = await fetchPage(`/products/${category}/`);
  const categoryHtml = await categoryResponse.text();
  if (categoryResponse.status !== 200) errors.push(`live category returned HTTP ${categoryResponse.status}`);
  if (cardsOf(categoryHtml).length !== config.expectedActiveCount) errors.push('live category card count does not match authority map');
  for (const product of products) {
    const response = await fetchPage(product.productionPath);
    const html = await response.text();
    const canonical = html.match(/<link rel="canonical" href="([^"]+)/)?.[1];
    if (response.status !== 200) errors.push(`live ${product.productionPath} returned HTTP ${response.status}`);
    if (canonical !== `https://www.haibucrafts.com${product.productionPath}`) errors.push(`live canonical mismatch for ${product.sku}`);
  }
  for (const sourceSku of legacyPaths) {
    const destination = products.find((product) => product.sku === mapping[sourceSku]);
    const redirect = vercel.redirects.find((item) => item.destination === destination?.productionPath && item.source.startsWith(`/products/${category}/`));
    if (!redirect) continue;
    const response = await fetchPage(redirect.source);
    if (response.status !== 308 || response.headers.get('location') !== redirect.destination) errors.push(`live redirect mismatch for original SKU ${sourceSku}`);
  }
}

if (errors.length) {
  console.error(`Catalog consistency audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Catalog consistency audit passed: ${products.length} active products, ${finalSkus.length} unique corrected SKUs, sitemap and legacy redirects synchronized${process.argv.includes('--live') ? ' with live HTTP checks' : ''}.`);
}
