import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const batch = JSON.parse(await readFile(path.join(root, 'scripts/data/haibu-new-products-20260920.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(root, 'docs/tasks/haibu-new-products-20260920-manifest.json'), 'utf8'));
const catalog = JSON.parse(await readFile(path.join(root, 'assets/v2/product-catalog.json'), 'utf8'));
const previewCatalog = JSON.parse(await readFile(path.join(root, 'v2-preview/assets/product-catalog.json'), 'utf8'));
const bySku = new Map(catalog.products.map((product) => [product.sku, product]));
const expectedSkus = ['RW26460', 'RW26774', 'RW26775', 'RW26776', 'RW26777', 'RW26796', 'RW26800', 'RW26813', 'RW26814', 'RW26819', 'YX162', 'YX3150', 'YX3461'];
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('publishes 13 new September 20 SKUs and skips existing RW002155', () => {
  assert.equal(batch.expectedSkuCount, 13);
  assert.deepEqual(batch.products.map((product) => product.sku), expectedSkus);
  assert.equal(new Set(expectedSkus).size, 13);
  assert.equal(catalog.count, 139);
  assert.equal(catalog.products.length, 139);
  assert.equal(new Set(catalog.products.map((product) => product.sku)).size, 139);
  assert.deepEqual(catalog, previewCatalog);
  assert.equal(batch.products.filter((product) => product.categorySlug === 'resin-charms').length, 10);
  assert.equal(batch.products.filter((product) => product.categorySlug === 'polymer-clay-slices').length, 3);
  assert.equal(catalog.products.filter((product) => product.sku === 'RW002155').length, 1);
  assert.match(bySku.get('RW002155').image, /batch-2026-09-09\/rw002155\//);
  assert.deepEqual(manifest.deduplication.duplicateSkipped, ['RW002155']);
});

test('publishes three traceable web-ready JPEG images per new SKU', async () => {
  for (const product of manifest.products) {
    const catalogProduct = bySku.get(product.sku);
    assert.equal(product.outputs.length, 3);
    assert.deepEqual(catalogProduct.gallery.map((item) => item.slice(1)), product.outputs.map((item) => item.path));
    const directory = path.join(root, 'assets/images/products', batch.assetDirectory, product.sku.toLowerCase());
    const files = (await readdir(directory)).filter((file) => file.endsWith('.jpg')).sort();
    assert.equal(files.length, 3, `${product.sku} must have exactly three JPEG images`);
    for (const output of product.outputs) {
      const file = path.join(root, output.path);
      const bytes = await readFile(file);
      assert.deepEqual([...bytes.subarray(0, 2)], [0xff, 0xd8], `${output.path} is not JPEG`);
      assert.equal((await stat(file)).size, output.bytes);
      assert.ok(output.bytes <= 500_000, `${output.path} exceeds 500 KB`);
      assert.ok(output.pixels[0] <= 1000 && output.pixels[1] <= 1000, `${output.path} exceeds 1000 px`);
      assert.equal(output.pixels[0], output.pixels[1], `${output.path} must remain square`);
      assert.equal(sha256(bytes), output.sha256);
    }
  }
});

test('keeps cards, galleries, SEO and inquiry attribution synchronized', async () => {
  for (const product of batch.products) {
    const catalogProduct = bySku.get(product.sku);
    assert.ok(catalogProduct, `missing catalog product ${product.sku}`);
    assert.equal(catalogProduct.category, product.categorySlug);
    assert.equal(catalogProduct.gallery.length, 3);

    const previewCategory = product.categorySlug === 'resin-charms'
      ? 'v2-preview/products/resin-charms/index.html'
      : 'v2-preview/products/polymer-clay-slices/index.html';
    const productionCategory = product.categorySlug === 'resin-charms'
      ? 'products/resin-charms-for-slime/index.html'
      : 'products/polymer-clay-slices-wholesale/index.html';
    for (const categoryFile of [previewCategory, productionCategory]) {
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
      assert.ok(html.includes('Sample time: 3–7 days'));
      assert.ok(html.includes('Product image reference'));
      assert.doesNotMatch(html, /QULA\s*CRAFT/i);
      for (const image of catalogProduct.gallery) assert.ok(html.includes(image));

      const structuredData = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
        .map((match) => JSON.parse(match[1]));
      assert.equal(structuredData.find((item) => item['@type'] === 'Product')?.sku, product.sku);
      assert.ok(structuredData.some((item) => item['@type'] === 'BreadcrumbList'));
    }

    const productionHtml = await readFile(path.join(root, catalogProduct.productionPath.slice(1), 'index.html'), 'utf8');
    assert.ok(productionHtml.includes(`<link rel="canonical" href="https://www.haibucrafts.com${catalogProduct.productionPath}">`));
  }
});
