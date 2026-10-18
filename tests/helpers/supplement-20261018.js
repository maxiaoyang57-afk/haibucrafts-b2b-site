import { readFileSync } from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../../docs/tasks/haibu-new-products-20261018-supplement-manifest.json',import.meta.url),'utf8'));
const previous=new Map(manifest.previousProducts.map(p=>[p.sku,p]));
export const addedSupplementSkus=new Set(manifest.products.filter(p=>p.operation==='new').map(p=>p.sku));
export function priorMedia(product){
 const old=previous.get(product.sku);
 return old?{...product,image:old.image,gallery:old.gallery}:product;
}
