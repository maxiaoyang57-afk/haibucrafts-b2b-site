import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const manifest=JSON.parse(await readFile('docs/tasks/haibu-new-products-20261021-manifest.json','utf8'));
const catalog=JSON.parse(await readFile('assets/v2/product-catalog.json','utf8'));
const plans=JSON.parse(await readFile('scripts/data/product-plan-20261021.json','utf8'));
test('October 21 preserves identities and connects source dimensions, complete groups and exact images',async()=>{
 assert.equal(catalog.count,293);
 assert.equal(new Set(catalog.products.map(p=>p.sku)).size,293);
 assert.equal(manifest.products.filter(p=>p.operation==='new').length,9);
 const updated=new Set(['RW22135','RW24224']);
 for(const old of manifest.previousProducts){
  const current=catalog.products.find(p=>p.sku===old.sku);
  assert.deepEqual(updated.has(old.sku)?{...current,image:old.image,gallery:old.gallery}:current,old,old.sku);
 }
 for(const item of manifest.products){
  const p=catalog.products.find(p=>p.sku===item.sku),source=plans.find(p=>p.sku===item.sku);
  const page=await readFile(p.productionPath.slice(1)+'index.html','utf8');
  const schemas=[...page.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const product=schemas.find(s=>s['@type']==='Product');
  assert.equal(product.sku,p.sku);assert.equal(product.size,source.dimensions);assert.equal(product.material,source.material);
  assert.equal(product.offers,undefined);
  assert.deepEqual(p.gallery,item.imageOutputs.map(i=>i.path));
  assert.ok(page.includes('product_code='+encodeURIComponent(p.sku)));
  for(const i of item.imageOutputs)assert.equal(createHash('sha256').update(await readFile(i.path.slice(1))).digest('hex'),i.sha256);
 }
 assert.ok(!catalog.products.some(p=>p.sku==='YM377'||p.sku.startsWith('CDK24643-2')));
 assert.equal(catalog.products.find(p=>p.sku==='YX3092/YX3093/YX3094/YX3095').gallery.length,5);
});
