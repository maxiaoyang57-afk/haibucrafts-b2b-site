import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const batch=JSON.parse(readFileSync('scripts/data/haibu-new-products-20261017.json','utf8'));
const catalog=JSON.parse(readFileSync('assets/v2/product-catalog.json','utf8'));
test('October 17 catalog products, three-image gallery and exact quote context work on phones',async({page})=>{
 test.setTimeout(180000);
 await page.route('**/api/inquiry',r=>r.abort());
 for(const record of batch.products){
  const product=catalog.products.find(p=>p.sku===record.sku);
  await page.goto(product.productionPath,{waitUntil:'domcontentloaded'});
  await expect(page.locator('h1')).toHaveText(product.title);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const main=page.locator('[data-product-gallery-main]'),thumbs=page.locator('[data-product-gallery-thumb]');
  await expect(thumbs).toHaveCount(3);
  for(let i=0;i<3;i++){await thumbs.nth(i).click();await expect(main).toHaveAttribute('src',product.gallery[i]);await expect.poll(()=>main.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);}
  if(['RW26811','RW26817','RW21765','RW20809'].includes(product.sku)) {
   await page.screenshot({path:`test-results/source-${record.assetKey}-${test.info().project.name}.png`,fullPage:true});
  }
  await page.locator('.product-detail-copy a.btn-primary').click();
  await expect(page.locator('input[name="sku"]')).toHaveValue(product.sku);
  await expect(page.locator('input[name="product"]')).toHaveValue(product.title);
  await expect(page.locator('input[name="product_image"]')).toHaveValue(product.image);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
});
