import { readFileSync } from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../../docs/tasks/haibu-new-products-20261019-afternoon-manifest.json',import.meta.url),'utf8'));
const updated=new Map(manifest.products.filter(p=>p.operation==='update').map(p=>[p.sku,p.previousCatalog]));
export function priorAfternoonMedia(product){const old=updated.get(product.sku);return old?{...product,image:old.image,gallery:old.gallery}:product;}
