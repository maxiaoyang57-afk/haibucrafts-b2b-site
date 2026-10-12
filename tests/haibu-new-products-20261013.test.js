import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const batch = JSON.parse(await readFile('scripts/data/haibu-new-products-20261013.json', 'utf8'));
const manifest = JSON.parse(await readFile('docs/tasks/haibu-new-products-20261013-manifest.json', 'utf8'));
const catalog = JSON.parse(await readFile('assets/v2/product-catalog.json', 'utf8'));
const selected = new Set(batch.products.map((item) => item.sku));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('eight additions preserve the previous 143 catalog identities and grouped bear code', () => {
  assert.equal(selected.size, 8);
  assert.equal(catalog.count, 151);
  const previous = catalog.products.filter((item) => !selected.has(item.sku));
  assert.equal(previous.length, 143);
  const identity = previous.sort((a, b) => a.sku.localeCompare(b.sku));
  assert.equal(hash(JSON.stringify(identity)), manifest.previousCatalogIdentitySha256);
  const grouped = catalog.products.find((item) => item.sku === 'RW1672/RW2072/RW3492/RW20104');
  assert.ok(grouped);
  assert.equal(grouped.productionPath.split('/').filter(Boolean).length, 3);
  for (const code of grouped.sku.split('/')) assert.equal(catalog.products.some((item) => item.sku === code), false);
});

test('all 24 images match the inspected references, including the transparent candy image', async () => {
  for (const record of manifest.products) {
    const product = catalog.products.find((item) => item.sku === record.sku);
    assert.equal(record.outputs.length, 3);
    assert.deepEqual(product.gallery, record.outputs.map((image) => `/${image.path}`));
    for (const image of record.outputs) {
      const bytes = await readFile(image.path);
      assert.equal(hash(bytes), image.sha256);
      assert.equal(bytes.length, image.bytes);
      assert.ok(image.width <= 1000 && image.height <= 1000);
    }
  }
  assert.match(catalog.products.find((item) => item.sku === 'RW1112').image, /\.png$/);
});

test('published facts and decoded quote parameters preserve exact source codes and packing', async () => {
  for (const record of batch.products) {
    const product = catalog.products.find((item) => item.sku === record.sku);
    const html = await readFile(`${product.productionPath.slice(1)}index.html`, 'utf8');
    assert.ok(html.includes(record.sourcePacking));
    assert.ok(html.includes('This pack quantity is not the MOQ.'));
    assert.ok(html.includes(record.dimensions));
    assert.equal(/QULA/i.test(html), false);
    const quoteLinks = [...html.matchAll(/href="([^"]+)"/g)]
      .map((match) => new URL(match[1].replaceAll('&amp;', '&'), 'https://www.haibucrafts.com'))
      .filter((url) => url.searchParams.has('product_code'));
    assert.ok(quoteLinks.length >= 2);
    for (const url of quoteLinks) {
      assert.equal(url.searchParams.get('product_code'), record.sku);
      assert.equal(url.searchParams.get('product'), product.title);
      assert.equal(url.searchParams.get('image'), product.image);
      assert.equal(url.searchParams.get('category'), product.category);
    }
  }
});
