import test from 'node:test';
import assert from 'node:assert/strict';
import { inquiryPageSchema } from '../lib/inquiry-page-schema.js';
const item = {sku:'YX4012',title:'Verified catalog title',productionPath:'/products/polymer-clay-slices-wholesale/yx4012/',gallery:[{src:'/assets/one.jpg'},{src:'/assets/two.jpg'},{src:'/assets/three.jpg'}],image:'/assets/one.jpg'};
test('RFQ page retains exact identifier, title, URL and three-image identity without claiming product rich-result eligibility',()=>{
 const s=inquiryPageSchema(item,'Exact source description');
 assert.equal(s['@type'],'WebPage');assert.equal(s.mainEntity['@type'],'Thing');assert.equal(s.mainEntity.identifier,item.sku);assert.equal(s.name,item.title);assert.equal(s.mainEntity.name,item.title);assert.equal(s.mainEntity.url,'https://www.haibucrafts.com'+item.productionPath);assert.deepEqual(s.mainEntity.image,item.gallery.map(i=>'https://www.haibucrafts.com'+i.src));
 assert.equal(s.description,'Exact source description');assert.equal(s.mainEntity.description,s.description);
 const text=JSON.stringify(s);for(const term of ['"Product"','"offers"','"review"','"aggregateRating"','"price"','"availability"'])assert.ok(!text.includes(term),term);
});
test('main-only media policy remains main-only',()=>assert.equal(inquiryPageSchema({...item,structuredDataImageMode:'main'},'d').mainEntity.image,'https://www.haibucrafts.com/assets/one.jpg'));
test('legacy single image fallback retains original path',()=>assert.equal(inquiryPageSchema({...item,gallery:[]},'d').mainEntity.image,'https://www.haibucrafts.com/assets/one.jpg'));
test('material, dimensions and offer fields are never invented or promoted by this metadata helper',()=>{
 const s=inquiryPageSchema({...item,material:undefined,dimensions:undefined,offers:{price:0}},'d');assert.equal(s.mainEntity.material,undefined);assert.equal(s.mainEntity.offers,undefined);assert.equal(s.mainEntity.size,undefined);
});
test('compound SKU and exact source title remain unchanged',()=>{const s=inquiryPageSchema({...item,sku:'RW5319/RW25945',title:'Boat & oar <reference>'},'d');assert.equal(s.mainEntity.identifier,'RW5319/RW25945');assert.equal(s.name,'Boat & oar <reference>');assert.equal(JSON.parse(JSON.stringify(s)).name,s.name)});
