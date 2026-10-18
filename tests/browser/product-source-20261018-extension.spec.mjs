import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const manifest=JSON.parse(readFileSync('docs/tasks/haibu-new-products-20261018-extension-manifest.json','utf8'));
const catalog=JSON.parse(readFileSync('assets/v2/product-catalog.json','utf8'));
test('extension product galleries and full quote selections work',async({page})=>{
 await page.route('**/api/inquiry',r=>r.abort());
 for(const record of manifest.products){
  const p=catalog.products.find(p=>p.sku===record.sku);await page.goto(p.productionPath,{waitUntil:'domcontentloaded'});
  await expect(page.locator('h1')).toHaveText(p.title);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const main=page.locator('[data-product-gallery-main]'),thumbs=page.locator('[data-product-gallery-thumb]');await expect(thumbs).toHaveCount(3);
  for(let i=0;i<3;i++){await thumbs.nth(i).click();await expect(main).toHaveAttribute('src',p.gallery[i]);await expect.poll(()=>main.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);}
  if(['YZ26165','RW0024009'].includes(p.sku))await page.screenshot({path:`test-results/extension-${p.sku}-${test.info().project.name}.png`,fullPage:true});
  await page.locator('.product-detail-copy a.btn-primary').click();
  await expect(page.locator('input[name="sku"]')).toHaveValue(p.sku);await expect(page.locator('input[name="product"]')).toHaveValue(p.title);await expect(page.locator('input[name="product_image"]')).toHaveValue(p.image);
 }
});
