import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const errors = [];
const catalog = JSON.parse(await readFile(path.join(root, 'assets/v2/product-catalog.json'), 'utf8'));
const previewCatalog = JSON.parse(await readFile(path.join(root, 'v2-preview/assets/product-catalog.json'), 'utf8'));
const sourceCategoryPath = {
  'polymer-clay-slices': 'products/polymer-clay-slices-wholesale/index.html',
  'slime-charms': 'products/slime-charms-wholesale/index.html',
  'resin-charms': 'products/resin-charms-for-slime/index.html',
  'sequins-glitter-confetti': 'products/sequins-glitter-confetti/index.html'
};
const previewCategoryPath = {
  'polymer-clay-slices': 'v2-preview/products/polymer-clay-slices/index.html',
  'slime-charms': 'v2-preview/products/slime-charms/index.html',
  'resin-charms': 'v2-preview/products/resin-charms/index.html',
  'sequins-glitter-confetti': 'v2-preview/products/sequins-glitter-confetti/index.html'
};

const read = (file) => readFile(path.join(root, file), 'utf8');
const exists = async (file) => { try { await access(path.join(root, file)); return true; } catch { return false; } };
const cardsOf = (html) => [...html.matchAll(/<article class="product-card-v2"[\s\S]*?<\/article>/g)].map((match) => match[0]);
const skuOf = (card) => card.match(/<span class="sku-badge">([^<]+)<\/span>/)?.[1]?.trim() || '';
const esc = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

if (catalog.products.length !== previewCatalog.products.length) errors.push('Production and Preview catalogs have different product counts');
const catalogSkus = catalog.products.map((product) => product.sku);
if (new Set(catalogSkus).size !== catalogSkus.length) errors.push('Production catalog contains duplicate SKU codes');
if (JSON.stringify(catalog.products) !== JSON.stringify(previewCatalog.products)) errors.push('Production and Preview catalog records differ');

for (const [category, sourcePath] of Object.entries(sourceCategoryPath)) {
  const products = catalog.products.filter((product) => product.category === category);
  if (!products.length) { errors.push(`catalog has no products for ${category}`); continue; }
  for (const [label, categoryPath] of [['Production', sourcePath], ['Preview', previewCategoryPath[category]]]) {
    const html = await read(categoryPath);
    const cards = cardsOf(html);
    if (cards.length !== products.length) errors.push(`${label} ${category} category has ${cards.length} cards; catalog has ${products.length}`);
    for (const product of products) {
      const matches = cards.filter((card) => skuOf(card) === product.sku);
      if (matches.length !== 1) { errors.push(`${label} ${category} has ${matches.length} cards for ${product.sku}`); continue; }
      const card = matches[0];
      const htmlTitle = product.title.replaceAll('&', '&amp;');
      if (!card.includes(htmlTitle)) errors.push(`${label} card ${product.sku} title differs from catalog`);
      if (!card.includes(product.image)) errors.push(`${label} card ${product.sku} image differs from catalog`);
      const expectedHref = label === 'Preview' ? product.previewPath : product.productionPath;
      if (!card.includes(`href="${expectedHref}"`)) errors.push(`${label} card ${product.sku} detail link differs from catalog`);
      if (!card.includes(`product_code=${product.sku}`)) errors.push(`${label} card ${product.sku} quote attribution is missing or stale`);
    }
  }
}

for (const product of catalog.products) {
  const relative = product.productionPath.replace(/^\//, '');
  if (!await exists(`${relative}index.html`)) { errors.push(`missing Production detail for ${product.sku}: ${product.productionPath}`); continue; }
  const html = await read(`${relative}index.html`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)/)?.[1];
  if (canonical !== `https://www.haibucrafts.com${product.productionPath}`) errors.push(`canonical mismatch for ${product.sku}`);
  if (!html.includes(`<span class="sku-badge">${product.sku}</span>`)) errors.push(`detail badge mismatch for ${product.sku}`);
  if (!html.includes(`"sku":"${product.sku}"`)) errors.push(`JSON-LD SKU mismatch for ${product.sku}`);
  if (!html.includes(`product_code=${product.sku}`)) errors.push(`detail quote attribution is stale for ${product.sku}`);
  if (!html.includes(product.image)) errors.push(`detail image identity mismatch for ${product.sku}`);
}

const sitemap = await read('sitemap.xml');
for (const product of catalog.products) if (!sitemap.includes(`<loc>https://www.haibucrafts.com${product.productionPath}</loc>`)) errors.push(`sitemap missing ${product.productionPath}`);

if (process.argv.includes('--live')) {
  const base = (process.env.AUDIT_BASE_URL || 'https://www.haibucrafts.com').replace(/\/$/, '');
  const fetchPage = async (route) => fetch(`${base}${route}`, { redirect: 'manual' });
  const categoryResults = await Promise.all(Object.entries(sourceCategoryPath).map(async ([category]) => {
    const route = catalog.products.find((product) => product.category === category)?.productionPath.split('/').slice(0, 3).join('/') + '/';
    const response = await fetchPage(route);
    const html = await response.text();
    return { category, route, response, html };
  }));
  for (const { category, route, response, html } of categoryResults) {
    const expected = catalog.products.filter((product) => product.category === category).length;
    if (response.status !== 200) errors.push(`live ${route} returned HTTP ${response.status}`);
    if (cardsOf(html).length !== expected) errors.push(`live ${route} card count differs from catalog`);
  }
  const concurrency = 8;
  for (let offset = 0; offset < catalog.products.length; offset += concurrency) {
    const batch = catalog.products.slice(offset, offset + concurrency);
    await Promise.all(batch.map(async (product) => {
      const response = await fetchPage(product.productionPath);
      const html = await response.text();
      const canonical = html.match(/<link rel="canonical" href="([^"]+)/)?.[1];
      if (response.status !== 200) errors.push(`live ${product.productionPath} returned HTTP ${response.status}`);
      if (canonical !== `https://www.haibucrafts.com${product.productionPath}`) errors.push(`live canonical mismatch for ${product.sku}`);
      if (!html.includes(`<span class="sku-badge">${product.sku}</span>`)) errors.push(`live badge mismatch for ${product.sku}`);
    }));
  }
}

if (errors.length) {
  console.error(`Full product catalog consistency audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Full product catalog consistency audit passed: ${catalog.products.length} products across ${Object.keys(sourceCategoryPath).length} categories; cards, details, quote attribution, JSON-LD, canonical, sitemap and Preview/Production catalogs are synchronized${process.argv.includes('--live') ? ' with live HTTP checks' : ''}.`);
}
