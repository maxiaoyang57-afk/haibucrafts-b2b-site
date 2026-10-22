import { priorAfternoonMedia } from './helpers/afternoon-20261019.js';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';
const manifest=JSON.parse(await readFile('docs/tasks/haibu-new-products-20261019-manifest.json','utf8'));
const catalog=JSON.parse(await readFile('assets/v2/product-catalog.json','utf8'));
test('October 19 keeps all 240 earlier identities and publishes eleven distinct source-backed groups',async()=>{
 assert.equal(catalog.count,305);assert.equal(new Set(catalog.products.map(p=>p.sku)).size,305);
 assert.equal(manifest.products.length,11);
 for(const old of manifest.previousProducts)assert.deepEqual(priorAfternoonMedia(catalog.products.find(p=>p.sku===old.sku)),old,old.sku);
 for(const record of manifest.products){
  const p=catalog.products.find(p=>p.sku===record.sku);assert.ok(p);
  assert.deepEqual(p.gallery,record.imageOutputs.map(i=>i.path));
  for(const image of record.imageOutputs)assert.equal(createHash('sha256').update(await readFile(image.path.slice(1))).digest('hex'),image.sha256);
  const page=await readFile(p.productionPath.slice(1)+'index.html','utf8');
  assert.ok(page.includes('product_code='+encodeURIComponent(p.sku)));
  assert.ok(!page.includes('QULA'));assert.ok(page.includes('This pack quantity is not the MOQ.'));
 }
 assert.ok(!catalog.products.some(p=>['CDK201','FHA044'].includes(p.sku)));
 const bows=catalog.products.find(p=>p.sku==='RW203-RW564-RW21165');
 const page=await readFile(bows.productionPath.slice(1)+'index.html','utf8');
 assert.match(page,/RW564: 27 × 45 mm; RW21165 and RW203: 30 × 45 mm/);
 const rainbow=catalog.products.find(p=>p.sku==='RX327');
 assert.ok((await readFile(rainbow.productionPath.slice(1)+'index.html','utf8')).includes('source title says soft rubber'));
});
