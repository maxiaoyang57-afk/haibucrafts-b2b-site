import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const batch = JSON.parse(await readFile('scripts/data/haibu-new-products-20261016.json', 'utf8'));
const manifest = JSON.parse(await readFile('docs/tasks/haibu-new-products-20261016-manifest.json', 'utf8'));
const supplement = JSON.parse(await readFile('scripts/data/haibu-new-products-20261016-supplement.json', 'utf8'));
const supplementSkus = new Set(supplement.products.map(p => p.sku));
const evening = JSON.parse(await readFile('scripts/data/haibu-new-products-20261016-evening.json', 'utf8'));
const october17 = JSON.parse(await readFile('scripts/data/haibu-new-products-20261017.json', 'utf8'));
const eveningSkus = new Set([...evening.products, ...october17.products].map(p => p.sku));
const catalog = JSON.parse(await readFile('assets/v2/product-catalog.json', 'utf8'));
const selected = new Set(batch.products.map(p => p.sku));

test('October 16 adds exactly five resin products while preserving every earlier product identity', () => {
  assert.deepEqual([...selected].sort(), ['RW26856','RW26857','RW26858','RW26859','RW3628']);
  assert.equal(catalog.count, manifest.catalogCountBefore + selected.size + supplementSkus.size + eveningSkus.size);
  assert.equal(new Set(catalog.products.map(p => p.sku)).size, catalog.count);
  const prior = catalog.products.filter(p => !selected.has(p.sku) && !supplementSkus.has(p.sku) && !eveningSkus.has(p.sku)).sort((a,b) => a.sku.localeCompare(b.sku));
  assert.deepEqual(prior, [...manifest.previousProducts].sort((a,b) => a.sku.localeCompare(b.sku)));
  assert.equal(new Set(catalog.products.map(p => p.category)).size, 4);
  for (const sku of ['CZB26813','CZB26818','CZB26846']) assert.ok(!catalog.products.some(p => p.sku === sku));
});

test('source packing, no-hole specifications, gallery bytes and inquiry attribution stay aligned', async () => {
  for (const record of manifest.products) {
    const source = batch.products.find(p => p.sku === record.sku);
    assert.deepEqual(source.sourceFields, record.sourceFields);
    assert.equal(source.sourceFields.sku.trim(), source.sku);
    assert.ok(source.specificationLines.includes('Hole: No hole'));
    const p = catalog.products.find(p => p.sku === source.sku);
    assert.equal(p.title, source.title);
    assert.deepEqual(p.gallery, record.outputs.map(v => '/' + v.path));
    for (const asset of record.outputs) {
      const bytes = await readFile(asset.path);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
    }
    const html = await readFile(p.productionPath.slice(1) + 'index.html', 'utf8');
    const schemas = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    const product = schemas.find(v => v['@type'] === 'Product');
    assert.equal(product.sku, p.sku);
    assert.equal(product.image.length, 3);
    assert.equal(product.offers, undefined);
    assert.ok(html.includes('This pack quantity is not the MOQ.'));
    const links = [...html.matchAll(/href="([^"]+)"/g)].map(m => new URL(m[1].replaceAll('&amp;','&'),'https://www.haibucrafts.com'));
    assert.ok(links.some(v => v.pathname === '/request-quote/' && v.searchParams.get('product_code') === p.sku));
  }
  const princess = batch.products.find(p => p.sku === 'RW26856');
  assert.equal(princess.sourcePacking, '12 pieces per sleeve');
  assert.ok(!princess.specificationLines.some(v => /100 pieces/.test(v)));
  assert.equal(batch.products.find(p => p.sku === 'RW3628').dimensions, 'Confirm dimensions by inquiry');
});
