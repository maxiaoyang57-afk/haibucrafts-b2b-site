import { priorMedia, addedSupplementSkus } from './helpers/supplement-20261018.js';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const batch = JSON.parse(await readFile('scripts/data/haibu-new-products-20261013-v2.json', 'utf8'));
const manifest = JSON.parse(await readFile('docs/tasks/haibu-new-products-20261013-v2-manifest.json', 'utf8'));
const supplement = JSON.parse(await readFile('scripts/data/haibu-new-products-20261016-supplement.json', 'utf8'));
const supplementSkus = new Set(supplement.products.map(p => p.sku));
const evening = JSON.parse(await readFile('scripts/data/haibu-new-products-20261016-evening.json', 'utf8'));
const october17 = JSON.parse(await readFile('scripts/data/haibu-new-products-20261017.json', 'utf8'));
const october18 = JSON.parse(await readFile('scripts/data/haibu-new-products-20261018.json', 'utf8'));
const eveningSkus = new Set([...evening.products, ...october17.products, ...october18.products, ...[...addedSupplementSkus].map(sku=>({sku}))].map(p => p.sku));
const catalog = JSON.parse(await readFile('assets/v2/product-catalog.json', 'utf8'));
const selected = new Set(batch.products.map((product) => product.sku));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('11 new products preserve all 151 earlier identities with only two approved gallery replacements', () => {
  assert.equal(batch.products.length, 11);
  assert.equal(selected.size, 11);
  assert.equal(catalog.count, 293);
  assert.equal(new Set(catalog.products.map((product) => product.sku)).size, 293);
  const previous = catalog.products.map(priorMedia).filter((product) => !selected.has(product.sku) && !supplementSkus.has(product.sku) && !eveningSkus.has(product.sku) && !['RW3628','RW26856','RW26857','RW26858','RW26859'].includes(product.sku)).map((product) => {
    // Normalize the owner-approved 2026-10-14 title correction to this earlier batch baseline.
    if (product.sku === 'YX048') {
      assert.equal(product.title, 'Pink Strawberry Polymer Clay Slices');
      return { ...product, title: 'Pink Candy & Ceramic Dish Mix' };
    }
    const before = manifest.previousMedia.find((reference) => reference.sku === product.sku);
    if (!before) return product;
    const { image: oldImage, gallery: oldGallery, ...oldIdentity } = before;
    const { image, gallery, ...identity } = product;
    assert.deepEqual(identity, oldIdentity, product.sku);
    return { ...product, image: oldImage, gallery: oldGallery };
  });
  assert.equal(previous.length, 151);
  assert.equal(hash(JSON.stringify(previous.sort((a,b) => a.sku.localeCompare(b.sku)))), manifest.previousCatalogIdentitySha256);
  const mixed = catalog.products.find((product) => product.sku === 'RW20423/RW22336/RW22338');
  assert.ok(mixed);
  assert.equal(mixed.productionPath.split('/').filter(Boolean).length, 3);
  assert.ok(catalog.products.some((product) => product.sku === 'RW22338'));
  for (const code of ['RW20423', 'RW22336']) assert.equal(selected.has(code), false);
});

test('all 39 inspected gallery assets retain their approved bytes and order', async () => {
  for (const record of manifest.products) {
    const product = catalog.products.find((item) => item.sku === record.sku);
    assert.equal(record.outputs.length, 3);
    assert.equal(new Set(product.gallery).size, 3);
    if(record.sku!=='RW24224') assert.deepEqual(product.gallery, record.outputs.map((image) => `/${image.path}`));
    assert.equal(product.image, product.gallery[0]);
    for (const image of record.outputs) {
      const bytes = await readFile(image.path);
      assert.equal(hash(bytes), image.sha256, record.sku);
      assert.equal(bytes.length, image.bytes, record.sku);
    }
  }
});

test('mixed components and every full SKU reach the inquiry and public Product schema', async () => {
  for (const record of batch.products) {
    const product = catalog.products.find((item) => item.sku === record.sku);
    const html = await readFile(`${product.productionPath.slice(1)}index.html`, 'utf8');
    const schemas = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
    const schema = schemas.find((item) => item['@type'] === 'Product');
    assert.equal(schema.sku, record.sku);
    assert.equal(schema.image.length, 3);
    assert.equal(schema.offers, undefined);
    const quoteLinks = [...html.matchAll(/href="([^"]*request-quote[^\"]*)"/g)].map((match) => new URL(match[1].replaceAll('&amp;', '&'), 'https://www.haibucrafts.com'));
    assert.ok(quoteLinks.some((url) => url.searchParams.get('product_code') === record.sku), record.sku);
    assert.ok(html.includes('This pack quantity is not the MOQ.'), record.sku);
    assert.ok(html.includes(record.sku==='RW24224'?'supplied product reference':'styling illustrations'), record.sku);
    assert.ok(record.imageDimensions.every((image) => image.width > 0 && image.width <= 1000 && image.height > 0));
  }
  const mixed = batch.products.find((product) => product.sku === 'RW20423/RW22336/RW22338');
  assert.match(mixed.material, /plastic black hats/);
  assert.match(mixed.dimensions, /each antler and hat design/);
  assert.ok(mixed.specificationLines.some((line) => line.includes('mixing ratio')));
});
