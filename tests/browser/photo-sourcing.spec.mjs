import {test,expect} from '@playwright/test';
test('photo sourcing identifies components and opens the exact product inquiry',async({page},testInfo)=>{
 await page.route(/google-analytics\.com|googletagmanager\.com|clarity\.ms/,r=>r.abort());
 await page.route('**/api/inquiry',r=>r.abort());
 for(const sku of ['RW26801','RW26795','YX693','YX329']){
  await page.goto('/blog/source-craft-supplies-from-reference-photos/',{waitUntil:'domcontentloaded'});
  const action=page.locator(`[data-photo-product-inquiry="${sku}"]`);
  await action.scrollIntoViewIfNeeded();
  const photo=action.locator('xpath=..').locator('img');
  await expect.poll(()=>photo.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(sku==='RW26801')await page.screenshot({path:testInfo.outputPath('photo-guide.png'),fullPage:true});
  const dest=new URL(await action.getAttribute('href'),page.url());
  expect(dest.searchParams.get('product_code')).toBe(sku);
  await action.click();
  await expect(page.locator('[name="sku"]')).toHaveValue(sku);
 }
});
