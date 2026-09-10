import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const previewRoot = path.join(root, 'v2-preview');
const catalog = JSON.parse(await readFile(path.join(previewRoot, 'assets', 'product-catalog.json'), 'utf8'));
const selection = JSON.parse(await readFile(path.join(root, 'scripts', 'data', 'issue-50-holiday-selection.json'), 'utf8'));
const products = new Map(catalog.products.map((product) => [product.sku, product]));
const errors = [];

for (const [season, categories] of Object.entries(selection)) {
  for (const [category, skus] of Object.entries(categories)) {
    for (const sku of skus) {
      const product = products.get(sku);
      if (!product) {
        errors.push(`${season}/${category}: missing catalog SKU ${sku}`);
        continue;
      }
      if (product.category !== category) errors.push(`${season}/${category}: ${sku} is ${product.category}`);
      const imagePath = path.join(root, product.image.replace(/^\//, '').replaceAll('/', path.sep));
      try { await access(imagePath); } catch { errors.push(`${season}/${category}: missing image ${product.image}`); }
      if (!product.productionPath || !product.previewPath) errors.push(`${season}/${category}: ${sku} missing product route`);
    }
  }
}

const read = (file) => readFile(path.join(previewRoot, file), 'utf8');
const halloween = await read('products/slime-charms/halloween-slime-charms/index.html');
const christmas = await read('products/slime-charms/christmas-slime-charms/index.html');
const holiday = await read('themes/holiday/index.html');
const expectedHalloween = selection.halloween['slime-charms'];
const expectedChristmas = selection.christmas['slime-charms'];
for (const [name, html, expected] of [['Halloween', halloween, expectedHalloween], ['Christmas', christmas, expectedChristmas]]) {
  const itemList = html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || [];
  if (!html.includes('data-page="slime-charms-seasonal"')) errors.push(`${name}: missing seasonal page marker`);
  if (!html.includes('data-seasonal-buyer-content')) errors.push(`${name}: missing buyer guidance`);
  if (!html.includes('source_page=') || !html.includes('product_page=')) errors.push(`${name}: missing seasonal attribution params`);
  for (const sku of expected) if (!html.includes(`>${sku}</span>`)) errors.push(`${name}: missing visible SKU ${sku}`);
  if (itemList.length < 2) errors.push(`${name}: missing BreadcrumbList or ItemList JSON-LD`);
}
for (const href of ['/v2-preview/products/slime-charms/halloween-slime-charms/', '/v2-preview/products/slime-charms/christmas-slime-charms/', '/v2-preview/products/slime-charms/', '/v2-preview/products/polymer-clay-slices/', '/v2-preview/products/resin-charms/', '/v2-preview/products/sequins-glitter-confetti/']) {
  if (!holiday.includes(`href="${href}"`)) errors.push(`Holiday hub missing ${href}`);
}

if (errors.length) {
  console.error(errors.map((error) => `FAIL ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Issue #50 seasonal audit passed: ${[...products.keys()].length} catalog products; ${expectedHalloween.length} Halloween slime SKUs; ${expectedChristmas.length} Christmas slime SKUs; holiday hub covers four categories.`);
}
