import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const batch = JSON.parse(await readFile(path.join(root, 'scripts/data/haibu-new-products-20260912.json'), 'utf8'));
const catalog = JSON.parse(await readFile(path.join(root, 'assets/v2/product-catalog.json'), 'utf8'));
const previewCatalog = JSON.parse(await readFile(path.join(root, 'v2-preview/assets/product-catalog.json'), 'utf8'));
const bySku = new Map(catalog.products.map((product) => [product.sku, product]));
const expectedSkus = ['RW26692', 'YX004', 'YX002', 'YX051', 'RW927', 'YX4138', 'RW2445', 'RW370', 'RW22405', 'RW1394', 'RW001078', 'RW26637'];

function webpDimensions(buffer) {
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP');
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (type === 'VP8X') return {
      width: 1 + buffer[data + 4] + (buffer[data + 5] << 8) + (buffer[data + 6] << 16),
      height: 1 + buffer[data + 7] + (buffer[data + 8] << 8) + (buffer[data + 9] << 16)
    };
    if (type === 'VP8 ') return {
      width: buffer.readUInt16LE(data + 6) & 0x3fff,
      height: buffer.readUInt16LE(data + 8) & 0x3fff
    };
    if (type === 'VP8L') {
      const b1 = buffer[data + 1];
      const b2 = buffer[data + 2];
      const b3 = buffer[data + 3];
      const b4 = buffer[data + 4];
      return {
        width: 1 + (((b2 & 0x3f) << 8) | b1),
        height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | (b2 >> 6))
      };
    }
    offset = data + size + (size % 2);
  }
  throw new Error('Unsupported WebP image');
}

test('publishes the 12 approved September 12 SKUs without duplicates', () => {
  assert.equal(batch.expectedSkuCount, 12);
  assert.deepEqual(batch.products.map((product) => product.sku), expectedSkus);
  assert.equal(new Set(expectedSkus).size, 12);
  assert.equal(catalog.count, 126);
  assert.equal(catalog.products.length, 126);
  assert.equal(new Set(catalog.products.map((product) => product.sku)).size, 126);
  assert.deepEqual(catalog, previewCatalog);
  assert.equal(batch.products.filter((product) => product.categorySlug === 'resin-charms').length, 8);
  assert.equal(batch.products.filter((product) => product.categorySlug === 'polymer-clay-slices').length, 4);
});

test('publishes three square, web-sized WebP views per SKU', async () => {
  for (const product of batch.products) {
    const directory = path.join(root, 'assets/images/products', batch.assetDirectory, product.sku.toLowerCase());
    const files = (await readdir(directory)).filter((file) => file.endsWith('.webp')).sort();
    assert.equal(files.length, 3, `${product.sku} must have three WebP images`);
    assert.ok(files.every((file) => file.startsWith(product.imagePrefix)));
    for (const file of files) {
      const filePath = path.join(directory, file);
      const bytes = await readFile(filePath);
      const dimensions = webpDimensions(bytes);
      assert.equal(dimensions.width, dimensions.height, `${product.sku}/${file} must be square`);
      assert.ok(dimensions.width <= 1000, `${product.sku}/${file} exceeds 1000 px`);
      assert.ok((await stat(filePath)).size <= 500_000, `${product.sku}/${file} exceeds 500 KB`);
    }
  }
});

test('keeps HAIBU cards, galleries, SEO and inquiry attribution synchronized', async () => {
  for (const product of batch.products) {
    const catalogProduct = bySku.get(product.sku);
    assert.ok(catalogProduct, `missing catalog product ${product.sku}`);
    assert.equal(catalogProduct.category, product.categorySlug);
    assert.equal(catalogProduct.gallery.length, 3);

    for (const pagePath of [catalogProduct.previewPath, catalogProduct.productionPath]) {
      const html = await readFile(path.join(root, pagePath.slice(1), 'index.html'), 'utf8');
      assert.ok(html.includes(product.title));
      assert.ok(html.includes(`product_code=${product.sku}`));
      assert.ok(html.includes('Product image reference'));
      assert.ok(html.includes(batch.galleryNote));
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
