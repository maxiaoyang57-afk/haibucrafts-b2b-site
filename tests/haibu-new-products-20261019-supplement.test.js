import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';
test('YX4137 supplement preserves 251 products and publishes its supplied image and confirmed packing',async()=>{
 const manifest=JSON.parse(await readFile('docs/tasks/haibu-new-products-20261019-supplement-manifest.json','utf8'));
 const catalog=JSON.parse(await readFile('assets/v2/product-catalog.json','utf8'));
 assert.equal(catalog.count,252);assert.equal(manifest.previousProducts.length,251);
 for(const old of manifest.previousProducts)assert.deepEqual(catalog.products.find(p=>p.sku===old.sku),old,old.sku);
 const p=catalog.products.find(p=>p.sku==='YX4137');assert.ok(p);assert.equal(p.gallery.length,3);
 const page=await readFile(p.productionPath.slice(1)+'index.html','utf8');
 assert.ok(page.includes('3 g per bag'));assert.ok(page.includes('Confirm dimensions by inquiry'));
 assert.ok(page.includes('product_code=YX4137'));
 for(const i of manifest.products[0].imageOutputs)assert.equal(createHash('sha256').update(await readFile(i.path.slice(1))).digest('hex'),i.sha256);
});
