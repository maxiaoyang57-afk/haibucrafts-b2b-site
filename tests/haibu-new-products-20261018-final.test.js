import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('docs/tasks/haibu-new-products-20261018-final-manifest.json','utf8'));
const catalog=JSON.parse(await readFile('assets/v2/product-catalog.json','utf8'));
test('new candy stick and corrected diver preserve every previous identity and exact packaging',async()=>{
 assert.equal(catalog.count,315);
 assert.equal(manifest.products.filter(p=>p.operation==='new').length,1);
 for(const old of manifest.previousProducts){const p=catalog.products.find(p=>p.sku===old.sku);assert.ok(p);assert.deepEqual({...p,image:old.image,gallery:old.gallery},old);}
 for(const record of manifest.products){
  const p=catalog.products.find(p=>p.sku===record.sku);assert.equal(catalog.products.filter(v=>v.sku===p.sku).length,1);
  const page=await readFile(p.productionPath.slice(1)+'index.html','utf8');
  assert.ok(page.includes(p.sku==='RW26637'?'4 pieces per set':'1.5 mm thickness'));
  assert.ok(!page.includes('QULA'));
  assert.ok(page.includes('This pack quantity is not the MOQ.'));
 }
});
