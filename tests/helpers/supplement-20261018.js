import { readFileSync } from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../../docs/tasks/haibu-new-products-20261018-supplement-manifest.json',import.meta.url),'utf8'));
const previous=new Map(manifest.previousProducts.map(p=>[p.sku,p]));
const extension=JSON.parse(readFileSync(new URL('../../docs/tasks/haibu-new-products-20261018-extension-manifest.json',import.meta.url),'utf8'));
const finalBatch=JSON.parse(readFileSync(new URL('../../docs/tasks/haibu-new-products-20261018-final-manifest.json',import.meta.url),'utf8'));
export function priorFinalMedia(product){const old=finalBatch.previousProducts.find(p=>p.sku===product.sku);return old?{...product,image:old.image,gallery:old.gallery}:product;}
export function priorExtensionMedia(product){const old=extension.previousProducts.find(p=>p.sku===product.sku);return old?{...product,image:old.image,gallery:old.gallery}:product;}
export const addedExtensionSkus=new Set(extension.products.filter(p=>p.operation==='new').map(p=>p.sku));
const night=JSON.parse(readFileSync(new URL("../../docs/tasks/haibu-new-products-20261018-night-manifest.json",import.meta.url),"utf8"));
export const addedSupplementSkus=new Set([...manifest.products.filter(p=>p.operation==='new').map(p=>p.sku),...addedExtensionSkus,...finalBatch.products.filter(p=>p.operation==='new').map(p=>p.sku),...night.products.filter(p=>p.operation==='new').map(p=>p.sku)]);
export function priorMedia(product){
 const old=previous.get(product.sku);
 return old?{...product,image:old.image,gallery:old.gallery}:product;
}
