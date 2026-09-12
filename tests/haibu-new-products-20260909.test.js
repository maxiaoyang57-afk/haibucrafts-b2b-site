import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const batch = JSON.parse(await readFile(path.join(root, 'scripts/data/haibu-new-products-20260909.json'), 'utf8'));
const catalog = JSON.parse(await readFile(path.join(root, 'assets/v2/product-catalog.json'), 'utf8'));
const previewCatalog = JSON.parse(await readFile(path.join(root, 'v2-preview/assets/product-catalog.json'), 'utf8'));
const bySku = new Map(catalog.products.map((product) => [product.sku, product]));

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const productGridHtml = (html) => {
  const start = html.indexOf('<div class="product-grid-v2">');
  assert.ok(start >= 0, 'product grid is missing');
  const divToken = /<div\b[^>]*>|<\/div>/gi;
  divToken.lastIndex = start;
  let depth = 0;
  for (const match of html.matchAll(divToken)) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(start, match.index + match[0].length);
  }
  assert.fail('product grid is not closed');
};

test('publishes exactly the 27 audited new SKUs without replacing skipped SKUs', () => {
  assert.equal(batch.expectedSkuCount, 27);
  assert.equal(batch.products.length, 27);
  assert.equal(new Set(batch.products.map((product) => product.sku)).size, 27);
  assert.equal(catalog.count, 126);
  assert.equal(catalog.products.length, 126);
  assert.equal(new Set(catalog.products.map((product) => product.sku)).size, 126);
  assert.deepEqual(catalog, previewCatalog);
  for (const product of batch.products) assert.ok(bySku.has(product.sku), product.sku);
  for (const sku of ['RW2694', 'RW20340', 'RW21805']) assert.equal(bySku.has(sku), false, sku);
  assert.equal(bySku.get('SLM10017').title, 'Christmas Tree & Snowman Slime Charm Mix');
});

test('new product pages preserve approved content and image order', async () => {
  for (const product of batch.products) {
    const catalogProduct = bySku.get(product.sku);
    assert.equal(catalogProduct.category, product.categorySlug, product.sku);
    assert.equal(catalogProduct.title, product.title, product.sku);
    assert.equal(catalogProduct.gallery.length, 3, product.sku);
    assert.equal(catalogProduct.image, catalogProduct.gallery[0], product.sku);

    for (const [index, imageUrl] of catalogProduct.gallery.entries()) {
      assert.match(imageUrl, new RegExp(`/${product.sku.toLowerCase()}/${product.imagePrefix}-${String(index + 1).padStart(2, '0')}\\.jpg$`));
      const imagePath = path.join(root, imageUrl.slice(1));
      const imageStat = await stat(imagePath);
      assert.ok(imageStat.size <= 500_000, `${product.sku} image ${index + 1} exceeds 500 KB`);
      const bytes = await readFile(imagePath);
      assert.deepEqual([...bytes.subarray(0, 2)], [0xff, 0xd8], `${product.sku} image ${index + 1} is not JPEG`);
    }

    const productionPage = await readFile(path.join(root, catalogProduct.productionPath.slice(1), 'index.html'), 'utf8');
    const previewPage = await readFile(path.join(root, catalogProduct.previewPath.slice(1), 'index.html'), 'utf8');
    for (const html of [productionPage, previewPage]) {
      for (const expected of [
        product.title,
        product.description,
        product.detailedDescription,
        product.seasonalTheme,
        product.customizationOptions,
        product.recommendedApplications,
        product.packagingMoq,
        product.seoKeywords,
        product.metaTitle,
        product.metaDescription,
        ...product.keySellingPoints,
        ...product.specificationLines,
      ]) {
        assert.ok(html.includes(escapeHtml(expected)), `${product.sku} is missing approved content: ${expected}`);
      }
      const first = html.indexOf(catalogProduct.gallery[0]);
      const second = html.indexOf(catalogProduct.gallery[1]);
      const third = html.indexOf(catalogProduct.gallery[2]);
      assert.ok(first >= 0 && second > first && third > second, `${product.sku} gallery order is incorrect`);
    }
  }
});

test('places every new product card inside its category product grid', async () => {
  const categoryPaths = new Map([
    ['polymer-clay-slices', ['products/polymer-clay-slices-wholesale/index.html', 'v2-preview/products/polymer-clay-slices/index.html']],
    ['resin-charms', ['products/resin-charms-for-slime/index.html', 'v2-preview/products/resin-charms/index.html']],
    ['slime-charms', ['products/slime-charms-wholesale/index.html', 'v2-preview/products/slime-charms/index.html']],
    ['sequins-glitter-confetti', ['products/sequins-glitter-confetti/index.html', 'v2-preview/products/sequins-glitter-confetti/index.html']],
  ]);

  for (const [category, paths] of categoryPaths) {
    const expectedSkus = batch.products.filter((product) => product.categorySlug === category).map((product) => product.sku);
    for (const relativePath of paths) {
      const html = await readFile(path.join(root, relativePath), 'utf8');
      const grid = productGridHtml(html);
      for (const sku of expectedSkus) {
        assert.ok(grid.includes(`<span class="sku-badge">${sku}</span>`), `${sku} is outside the product grid in ${relativePath}`);
        assert.equal(html.split(`<span class="sku-badge">${sku}</span>`).length - 1, 1, `${sku} card is duplicated in ${relativePath}`);
      }
    }
  }
});
