import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const batch=JSON.parse(readFileSync('scripts/data/haibu-new-products-20261016-evening.json','utf8'));
const catalog=JSON.parse(readFileSync('assets/v2/product-catalog.json','utf8'));
test('evening catalog products, three-image gallery and exact quote context work on phones',async({page})=>{
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
  if(['RW003270','RW337/285','RW26821'].includes(product.sku)) {
   await page.screenshot({path:`test-results/evening-${record.assetKey}-${test.info().project.name}.png`,fullPage:true});
  }
  await page.locator('.product-detail-copy a.btn-primary').click();
  await expect(page.locator('input[name="sku"]')).toHaveValue(product.sku);
  await expect(page.locator('input[name="product"]')).toHaveValue(product.title);
  await expect(page.locator('input[name="product_image"]')).toHaveValue(product.image);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
});

// Search aliases must preserve the full grouped identity through the quote flow.
test('pizza component codes and new product theme filters remain discoverable', async ({page}) => {
 await page.route('**/api/inquiry',r=>r.abort());
 await page.goto('/products/resin-charms-for-slime/');
 for(const query of ['RW285','rw285','RW337','RW337/285']) {
  await page.locator('[data-product-search]').fill(query);
  await expect(page.locator('[data-product-card]:visible .sku-badge')).toHaveText(['RW337/285']);
 }
 await page.locator('[data-product-card]:visible .get-quote').click();
 await expect(page.locator('input[name="sku"]')).toHaveValue('RW337/285');
 for(const [filter,skus] of [['seasonal',['RW26818','RW26820','RW26826']],['fruit',['RW26828']],['ocean',['RW26825']],['animal',['RW26824','RW26827']],['sweet',['RW26821','RW337/285']]]) {
  await page.goto('/products/resin-charms-for-slime/');
  await page.locator('[data-product-filter="'+filter+'"]').click();
  for(const sku of skus) await expect(page.locator('[data-product-card]:visible .sku-badge').filter({hasText:sku})).toHaveCount(1);
 }
});
