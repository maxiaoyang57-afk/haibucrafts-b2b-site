import { priorAfternoonMedia } from './helpers/afternoon-20261019.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('docs/tasks/haibu-new-products-20261018-night-manifest.json','utf8'));
const catalog=JSON.parse(await readFile('assets/v2/product-catalog.json','utf8'));
test('six resin additions preserve previous identities and both existing product URLs',async()=>{
 assert.equal(catalog.count,284);
 assert.equal(manifest.products.filter(p=>p.operation==='new').length,6);
 assert.deepEqual(manifest.products.filter(p=>p.operation==='update').map(p=>p.sku).sort(),['RW26746','RW474']);
 const selected=new Set(manifest.products.map(p=>p.sku));
 for(const old of manifest.previousProducts){
  const current=priorAfternoonMedia(catalog.products.find(p=>p.sku===old.sku));assert.ok(current,old.sku);
  assert.deepEqual(selected.has(old.sku)?{...current,image:old.image,gallery:old.gallery}:current,old);
 }
 for(const record of manifest.products){
  const p=catalog.products.find(p=>p.sku===record.sku);
  assert.equal(catalog.products.filter(v=>v.sku===p.sku).length,1);
  assert.equal(p.category,'resin-charms');assert.equal(p.gallery.length,3);
  const page=await readFile(p.productionPath.slice(1)+'index.html','utf8');
  assert.ok(!page.includes('QULA'));
  assert.ok(page.includes('This pack quantity is not the MOQ.'));
  if(p.sku==='RW26746')assert.ok(page.includes('10 sets per bag'));
  if(p.sku==='RW26748')assert.ok(page.includes('hole diameter requires confirmation'));
 }
 for(const code of ['FHA366','CDK002732/CDK002377/CDK004077/CDK22001/CDK003096','CDK004808-3/CDK921-1/CDK22726-3/CDK420-1'])assert.ok(!catalog.products.some(p=>p.sku===code));
});
