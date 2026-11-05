import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { catalogIdentity, visibleSpec } from '../lib/catalog-identity.js';
test('RFQ identity reader rejects legacy Product, missing identifier and wrong entity type',()=>{
 assert.equal(catalogIdentity({'@type':'Product',sku:'A'}),undefined);
 assert.equal(catalogIdentity({'@type':'WebPage',mainEntity:{'@type':'Thing'}}),undefined);
 assert.equal(catalogIdentity({'@type':'WebPage',mainEntity:{'@type':'Product',identifier:'A'}}),undefined);
 assert.equal(catalogIdentity({'@type':'WebPage',mainEntity:{'@type':'Thing',identifier:'A'}}).sku,'A');
});
test('visible specifications require exact labels, decode entities and do not infer missing fields',()=>{
 const html='<li>Dimensions: 2 × 3 mm</li><li>Hole: No hole &amp; no ring</li>';
 assert.equal(visibleSpec(html,'Dimensions'),'2 × 3 mm');assert.equal(visibleSpec(html,'Hole'),'No hole & no ring');assert.equal(visibleSpec(html,'Material'),undefined);assert.equal(visibleSpec('<script>Material: resin</script>','Material'),undefined);
});
test('all public RFQ pages preserve exact identity and gallery while declaring no incomplete Product nodes',async()=>{
 const catalog=JSON.parse(await readFile('assets/v2/product-catalog.json','utf8'));
 for(const product of [...catalog.products,...catalog.archivedProducts]){
  const html=await readFile(product.productionPath.slice(1)+'index.html','utf8');
  const nodes=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const identities=nodes.map(catalogIdentity).filter(Boolean);assert.equal(identities.length,1,product.sku);assert.equal(identities[0].sku,product.sku);assert.equal(identities[0].name,product.title);
  const walk=n=>{if(!n||typeof n!=='object')return;assert.notEqual(n['@type'],'Product',product.sku);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else walk(v)}};nodes.forEach(walk);
 }
});
