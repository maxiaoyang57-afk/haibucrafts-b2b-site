import { priorMedia, addedSupplementSkus } from './helpers/supplement-20261018.js';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';
const batch = JSON.parse(await readFile('scripts/data/haibu-new-products-20261016-supplement.json', 'utf8'));
const manifest = JSON.parse(await readFile('docs/tasks/haibu-new-products-20261016-supplement-manifest.json', 'utf8'));
const evening = JSON.parse(await readFile('scripts/data/haibu-new-products-20261016-evening.json', 'utf8'));
const october17 = JSON.parse(await readFile('scripts/data/haibu-new-products-20261017.json', 'utf8'));
const october18 = JSON.parse(await readFile('scripts/data/haibu-new-products-20261018.json', 'utf8'));
const eveningSkus = new Set([...evening.products, ...october17.products, ...october18.products, ...[...addedSupplementSkus].map(sku=>({sku}))].map(p => p.sku));
const catalog = JSON.parse(await readFile('assets/v2/product-catalog.json', 'utf8'));
const historicalProducts = [...catalog.products, ...(catalog.archivedProducts || [])];
test('supplement preserves all previous identities and connects exact source SKUs, galleries and inquiries', async () => {
  const selected = new Set(batch.products.map(p => p.sku));
  assert.equal(selected.size, 11);
  assert.equal(historicalProducts.length, manifest.catalogCountBefore + selected.size + eveningSkus.size);
  assert.deepEqual(historicalProducts.map(priorMedia).filter(p => !selected.has(p.sku) && !eveningSkus.has(p.sku)), manifest.previousProducts);
  for (const record of manifest.products) {
    const source = batch.products.find(p => p.sku === record.sku);
    if(record.sku!=='RW22135') assert.deepEqual(source.sourceFields, record.sourceFields);
    const product = catalog.products.find(p => p.sku === record.sku);
    if(record.sku!=='RW22135') assert.deepEqual(product.gallery, record.outputs.map(p => '/' + p.path));
    const html = await readFile(product.productionPath.slice(1) + 'index.html', 'utf8');
    const schemas = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    const schema = schemas.find(p => p['@type'] === 'Product');
    assert.equal(schema.sku, record.sku);
    assert.equal(schema.offers, undefined);
    assert.equal(schema.image.length, 3);
    assert.ok(html.includes('product_code=' + encodeURIComponent(record.sku)));
    for (const output of record.outputs) {
      assert.equal(createHash('sha256').update(await readFile(output.path)).digest('hex'), output.sha256);
    }
  }
  const mix = batch.products.find(p => p.sku === 'SLM-RX488');
  assert.match(mix.sourcePacking, /3 g per bag; 100 bags/);
  assert.ok(!/3.?g/.test(mix.dimensions));
});
