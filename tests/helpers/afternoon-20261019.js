import { readFileSync } from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../../docs/tasks/haibu-new-products-20261019-afternoon-manifest.json',import.meta.url),'utf8'));
const updated=new Map(manifest.products.filter(p=>p.operation==='update').map(p=>[p.sku,p.previousCatalog]));
const current=JSON.parse(readFileSync(new URL('../../docs/tasks/haibu-new-products-20261021-manifest.json',import.meta.url),'utf8'));
for(const p of current.products.filter(p=>p.operation==='update')) updated.set(p.sku,p.previousCatalog);
const october22=JSON.parse(readFileSync(new URL('../../docs/tasks/haibu-new-products-20261022-manifest.json',import.meta.url),'utf8'));
for(const p of october22.products.filter(p=>p.operation==='update')) updated.set(p.sku,p.previousCatalog);
export function priorAfternoonMedia(product){const old=updated.get(product.sku);return old?{...product,image:old.image,gallery:old.gallery}:product;}
