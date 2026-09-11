import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const batch = JSON.parse(await readFile(path.join(root, 'scripts/data/haibu-new-products-20260911.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(root, 'docs/tasks/haibu-new-products-20260911-manifest.json'), 'utf8'));
const catalog = JSON.parse(await readFile(path.join(root, 'assets/v2/product-catalog.json'), 'utf8'));
const previewCatalog = JSON.parse(await readFile(path.join(root, 'v2-preview/assets/product-catalog.json'), 'utf8'));
const bySku = new Map(catalog.products.map((product) => [product.sku, product]));

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('adds only the two new 2026-09-11 HAIBU SKUs', () => {
  assert.equal(batch.expectedSkuCount, 2);
  assert.deepEqual(batch.products.map((product) => product.sku), ['RW26746', 'RW26768']);
  assert.equal(new Set(batch.products.map((product) => product.sku)).size, 2);
  assert.equal(catalog.count, 114);
  assert.equal(catalog.products.length, 114);
  assert.equal(new Set(catalog.products.map((product) => product.sku)).size, 114);
  assert.deepEqual(catalog, previewCatalog);
  for (const product of batch.products) {
    assert.equal(bySku.get(product.sku)?.category, 'resin-charms');
    assert.equal(bySku.get(product.sku)?.title, product.title);
  }
});

test('publishes three traceable source-derived JPEG images per SKU', async () => {
  for (const product of manifest.products) {
    const catalogProduct = bySku.get(product.sku);
    assert.equal(product.outputs.length, 3);
    assert.deepEqual(catalogProduct.gallery.map((item) => item.slice(1)), product.outputs.map((item) => item.path));
    for (const output of product.outputs) {
      const file = path.join(root, output.path);
      const bytes = await readFile(file);
      const info = await stat(file);
      assert.equal(info.size, output.bytes);
      assert.ok(info.size <= 500_000, `${output.path} exceeds 500 KB`);
      assert.deepEqual([...bytes.subarray(0, 2)], [0xff, 0xd8], `${output.path} is not JPEG`);
      assert.equal(sha256(bytes), output.sha256);
      assert.deepEqual(output.pixels, [1000, 1000]);
    }
  }
});

test('keeps cards, product pages, SEO and inquiry attribution synchronized', async () => {
  const categoryFiles = [
    'products/resin-charms-for-slime/index.html',
    'v2-preview/products/resin-charms/index.html'
  ];
  for (const product of batch.products) {
    const catalogProduct = bySku.get(product.sku);
    for (const categoryFile of categoryFiles) {
      const categoryHtml = await readFile(path.join(root, categoryFile), 'utf8');
      assert.equal(categoryHtml.split(`<span class="sku-badge">${product.sku}</span>`).length - 1, 1);
      assert.ok(categoryHtml.includes(catalogProduct.image));
    }

    for (const pagePath of [catalogProduct.previewPath, catalogProduct.productionPath]) {
      const html = await readFile(path.join(root, pagePath.slice(1), 'index.html'), 'utf8');
      assert.ok(html.includes(product.title));
      assert.ok(html.includes(`product_code=${product.sku}`));
      assert.ok(html.includes(product.description));
      assert.ok(html.includes(product.detailedDescription));
      for (const image of catalogProduct.gallery) assert.ok(html.includes(image));
      const productJson = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
      const structuredData = JSON.parse(productJson);
      assert.equal(structuredData.sku, product.sku);
      assert.equal(structuredData.offers, undefined);
    }

    const productionHtml = await readFile(path.join(root, catalogProduct.productionPath.slice(1), 'index.html'), 'utf8');
    assert.ok(productionHtml.includes(`<link rel="canonical" href="https://www.haibucrafts.com${catalogProduct.productionPath}">`));
  }
});
