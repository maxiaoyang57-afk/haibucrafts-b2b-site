import { priorMedia, addedSupplementSkus } from './helpers/supplement-20261018.js';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';
const batch=JSON.parse(await readFile('scripts/data/haibu-new-products-20261016-evening.json','utf8'));
const manifest=JSON.parse(await readFile('docs/tasks/haibu-new-products-20261016-evening-manifest.json','utf8'));
const newSkus = new Set((await Promise.all(['20261017','20261018','20261018-supplement'].map(date=>readFile('scripts/data/haibu-new-products-'+date+'.json','utf8')))).flatMap(text=>JSON.parse(text).products).filter(p=>!p.preserveCatalogOrder).map(p=>p.sku));
const catalog=JSON.parse(await readFile('assets/v2/product-catalog.json','utf8'));
test('evening batch preserves catalog identities and separate pizza sizes and attachment facts',async()=>{
 const added=new Set(batch.products.map(p=>p.sku));
 assert.equal(added.size,11);assert.equal(catalog.count,manifest.catalogCountBefore+11+newSkus.size);
 assert.deepEqual(catalog.products.map(priorMedia).filter(p=>!added.has(p.sku)&&!newSkus.has(p.sku)),manifest.previousProducts);
 assert.equal(new Set(catalog.products.map(p=>p.category)).size,4);
 for(const source of batch.products){
  const media=manifest.products.find(p=>p.sku===source.sku);
  if(media.sourceImageDimensions) assert.ok(source.imageDimensions[0].width<=media.sourceImageDimensions.width);
  for(const output of media.outputs) assert.equal(createHash('sha256').update(await readFile(output.path)).digest('hex'),output.sha256);
  const p=catalog.products.find(p=>p.sku===source.sku);assert.ok(p);assert.equal(source.sourceFields.sku.trim(),p.sku);
  const html=await readFile(p.productionPath.slice(1)+'index.html','utf8');
  const schema=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])).find(v=>v['@type']==='Product');
  assert.equal(schema.sku,p.sku);assert.equal(schema.offers,undefined);assert.equal(schema.image.length,3);
  assert.equal(schema.additionalProperty.find(v=>v.name==='Hole').value,source.holeDescription);
  assert.ok(html.includes('product_code='+encodeURIComponent(p.sku)));
  assert.ok(html.includes('This pack quantity is not the MOQ.'));
 }
 const pizza=batch.products.find(p=>p.sku==='RW337/285');
 assert.match(pizza.dimensions,/RW337: 32 × 32 × 12 mm; RW285: 15 × 17 × 11 mm/);
 assert.match(batch.products.find(p=>p.sku==='RW26821').holeDescription,/decorative opening/);
});
