import { readFileSync } from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../../docs/tasks/haibu-new-products-20261018-supplement-manifest.json',import.meta.url),'utf8'));
const previous=new Map(manifest.previousProducts.map(p=>[p.sku,p]));
const extension=JSON.parse(readFileSync(new URL('../../docs/tasks/haibu-new-products-20261018-extension-manifest.json',import.meta.url),'utf8'));
const finalBatch=JSON.parse(readFileSync(new URL('../../docs/tasks/haibu-new-products-20261018-final-manifest.json',import.meta.url),'utf8'));
export function priorFinalMedia(product){const old=finalBatch.previousProducts.find(p=>p.sku===product.sku);return old?{...product,image:old.image,gallery:old.gallery}:product;}
export function priorExtensionMedia(product){const old=extension.previousProducts.find(p=>p.sku===product.sku);return old?{...product,image:old.image,gallery:old.gallery}:product;}
export const addedExtensionSkus=new Set(extension.products.filter(p=>p.operation==='new').map(p=>p.sku));
const night=JSON.parse(readFileSync(new URL("../../docs/tasks/haibu-new-products-20261018-night-manifest.json",import.meta.url),"utf8"));
const october19=JSON.parse(readFileSync(new URL('../../scripts/data/haibu-new-products-20261019.json',import.meta.url),'utf8'));
const afternoon=JSON.parse(readFileSync(new URL('../../scripts/data/haibu-new-products-20261019-afternoon.json',import.meta.url),'utf8'));
const october20=JSON.parse(readFileSync(new URL('../../scripts/data/product-plan-20261020.json',import.meta.url),'utf8'));
const october21=JSON.parse(readFileSync(new URL('../../scripts/data/product-plan-20261021.json',import.meta.url),'utf8'));
export const addedSupplementSkus=new Set([...october21.filter(p=>p.haibu&&p.operation==='new').map(p=>p.sku),...october20.filter(p=>p.haibu).map(p=>p.sku),...afternoon.products.map(p=>p.sku),'RW26685','YX3560','YX3084-YX3087-YX3089-YX3103-YX3112-YX3115','YX4137',...october19.products.map(p=>p.sku),...manifest.products.filter(p=>p.operation==='new').map(p=>p.sku),...addedExtensionSkus,...finalBatch.products.filter(p=>p.operation==='new').map(p=>p.sku),...night.products.filter(p=>p.operation==='new').map(p=>p.sku)]);
export function priorMedia(product){
 const old=previous.get(product.sku);
 return old?{...product,image:old.image,gallery:old.gallery}:product;
}
