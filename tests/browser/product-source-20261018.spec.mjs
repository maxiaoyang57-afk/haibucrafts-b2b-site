import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const batch=JSON.parse(readFileSync('scripts/data/haibu-new-products-20261018.json','utf8'));
const catalog=JSON.parse(readFileSync('assets/v2/product-catalog.json','utf8'));
test('October 18 product gallery and exact quote selection work',async({page})=>{
 await page.route('**/api/inquiry',r=>r.abort());
 for(const record of batch.products){
  const p=catalog.products.find(p=>p.sku===record.sku);
  await page.goto(p.productionPath,{waitUntil:'domcontentloaded'});
  await expect(page.locator('h1')).toHaveText(p.title);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const main=page.locator('[data-product-gallery-main]'),thumbs=page.locator('[data-product-gallery-thumb]');
  await expect(thumbs).toHaveCount(3);
  for(let i=0;i<3;i++){await thumbs.nth(i).click();await expect(main).toHaveAttribute('src',p.gallery[i]);await expect.poll(()=>main.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);}
  if(['RW26808','RW26804'].includes(p.sku))await page.screenshot({path:`test-results/oct18-${p.sku}-${test.info().project.name}.png`,fullPage:true});
  await page.locator('.product-detail-copy a.btn-primary').click();
  await expect(page.locator('input[name="sku"]')).toHaveValue(p.sku);
  await expect(page.locator('input[name="product"]')).toHaveValue(p.title);
  await expect(page.locator('input[name="product_image"]')).toHaveValue(p.image);
 }
 for(const sku of ['RW26800','RW26796']){
  expect(catalog.products.filter(p=>p.sku===sku)).toHaveLength(1);
  await page.goto(catalog.products.find(p=>p.sku===sku).productionPath);
  await expect(page.locator('h1')).toBeVisible();
 }
});
