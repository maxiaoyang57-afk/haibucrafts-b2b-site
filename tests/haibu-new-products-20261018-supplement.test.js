import { EXPECTED_CATEGORIES } from './catalog-release-contract.js';
import { EXPECTED_TOTAL } from './catalog-release-contract.js';
import { priorExtensionMedia } from './helpers/supplement-20261018.js';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';
const manifest=JSON.parse(await readFile('docs/tasks/haibu-new-products-20261018-supplement-manifest.json','utf8'));
const catalog=JSON.parse(await readFile('assets/v2/product-catalog.json','utf8'));
test('supplement adds exactly eleven identities and refreshes only four approved galleries',async()=>{
 assert.equal(catalog.count,EXPECTED_TOTAL);assert.equal(new Set(catalog.products.map(p=>p.sku)).size,EXPECTED_TOTAL);
 assert.equal(manifest.products.filter(p=>p.operation==='new').length,11);
 assert.equal(manifest.products.filter(p=>p.operation==='update').length,4);
 for(const old of manifest.previousProducts){
  const now=priorExtensionMedia(catalog.products.find(p=>p.sku===old.sku));assert.ok(now);
  const update=manifest.products.some(p=>p.sku===old.sku&&p.operation==='update');
  assert.deepEqual(update?{...now,image:old.image,gallery:old.gallery}:now,old,old.sku);
 }
 for(const record of manifest.products){
  const p=catalog.products.find(p=>p.sku===record.sku);
  assert.deepEqual(p.gallery,record.imageOutputs.map(i=>i.path));
  for(const image of record.imageOutputs){assert.ok(image.width<=1000);assert.equal(createHash('sha256').update(await readFile(image.path.slice(1))).digest('hex'),image.sha256);}
  const page=await readFile(p.productionPath.slice(1)+'index.html','utf8');
  const product=[...page.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])).find(s=>s['@type']==='Product');
  assert.equal(product.sku,p.sku);assert.deepEqual(product.image,p.gallery.map(i=>'https://www.haibucrafts.com'+i));assert.equal(product.offers,undefined);
  assert.ok(page.includes('product_code='+encodeURIComponent(p.sku)));assert.ok(!page.includes('QULA'));assert.ok(page.includes('This pack quantity is not the MOQ.'));
 }
 assert.deepEqual([...new Set(catalog.products.map(p=>p.category))].sort(), [...EXPECTED_CATEGORIES].sort());
 for(const sku of ['YA001','YH049','OOH026'])assert.ok(!catalog.products.some(p=>p.sku===sku));
});
