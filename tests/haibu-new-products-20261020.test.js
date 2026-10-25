import { EXPECTED_TOTAL } from './catalog-release-contract.js';
import { priorAfternoonMedia } from './helpers/afternoon-20261019.js';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';
const manifest=JSON.parse(await readFile('docs/tasks/haibu-new-products-20261020-manifest.json','utf8'));
const catalog=JSON.parse(await readFile('assets/v2/product-catalog.json','utf8'));
const plan=JSON.parse(await readFile('scripts/data/product-plan-20261020.json','utf8'));

test('October 20 preserves every earlier product and publishes the eleven supplied HAIBU additions',async()=>{
 assert.equal(catalog.count,EXPECTED_TOTAL);
 assert.equal(new Set(catalog.products.map(p=>p.sku)).size,EXPECTED_TOTAL);
 assert.equal(manifest.products.length,11);
 for(const old of manifest.previousProducts)assert.deepEqual(((p)=>['RW22135','RW24224','RW20175'].includes(p.sku)?priorAfternoonMedia(p):p)(catalog.products.find(p=>p.sku===old.sku)),old,old.sku);
 assert.equal(catalog.products.filter(p=>p.sku==='RW24359').length,1);
 for(const sku of ['RX399','YA459','YM381','YQ039'])assert.ok(!catalog.products.some(p=>p.sku===sku));
 for(const record of manifest.products){
  const p=catalog.products.find(p=>p.sku===record.sku);
  const source=plan.find(p=>p.sku===record.sku);
  assert.deepEqual(p.gallery,record.imageOutputs.map(i=>i.path));
  const html=await readFile(p.productionPath.slice(1)+'index.html','utf8');
  const schema=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])).find(v=>v['@type']==='Product');
  assert.equal(schema.sku,p.sku);assert.equal(schema.size,source.dimensions);assert.equal(schema.material,source.material);
  assert.equal(schema.offers,undefined);
  assert.ok(html.includes(source.packing));assert.ok(html.includes('product_code='+encodeURIComponent(p.sku)));
  assert.ok(!html.includes('QULA'));
  for(const i of record.imageOutputs)assert.equal(createHash('sha256').update(await readFile(i.path.slice(1))).digest('hex'),i.sha256);
 }
 assert.equal(catalog.products.find(p=>p.sku==='MA182').gallery.length,4);
});
