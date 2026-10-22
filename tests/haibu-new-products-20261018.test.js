import { priorMedia, addedSupplementSkus } from './helpers/supplement-20261018.js';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
const batch=JSON.parse(await readFile('scripts/data/haibu-new-products-20261018.json','utf8'));
const manifest=JSON.parse(await readFile('docs/tasks/haibu-new-products-20261018-manifest.json','utf8'));
const catalog=JSON.parse(await readFile('assets/v2/product-catalog.json','utf8'));
test('October 18 adds nine source-backed products while preserving all 200 previous identities',async()=>{
 const newSkus=new Set(batch.products.map(p=>p.sku));
 assert.equal(newSkus.size,9);assert.equal(catalog.count,315);
 assert.deepEqual(catalog.products.map(priorMedia).filter(p=>!newSkus.has(p.sku)&&!addedSupplementSkus.has(p.sku)),manifest.previousProducts);
 for(const sku of ['RW26800','RW26796','RW20809'])assert.equal(catalog.products.filter(p=>p.sku===sku).length,1);
 for(const source of batch.products){
  const p=catalog.products.find(p=>p.sku===source.sku);
  assert.equal(p.category,'resin-charms');
  assert.equal(source.sourceFields.sku.trim(),p.sku);
  const html=await readFile(p.productionPath.slice(1)+'index.html','utf8');
  const schema=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])).find(v=>v['@type']==='Product');
  assert.equal(schema.sku,p.sku);assert.equal(schema.size,source.dimensions);assert.equal(schema.image.length,3);assert.equal(schema.offers,undefined);
  assert.ok(html.includes('This pack quantity is not the MOQ.'));assert.ok(!html.includes('QULA'));
 }
 const acorn=catalog.products.find(p=>p.sku==='RW26808');
 assert.match(acorn.productionPath,/acorn/);
 assert.ok(!JSON.parse(await readFile('vercel.json','utf8')).redirects.some(r=>r.source===acorn.productionPath));
});
