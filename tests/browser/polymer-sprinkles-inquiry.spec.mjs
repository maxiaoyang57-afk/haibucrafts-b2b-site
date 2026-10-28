import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const collection='/products/polymer-clay-slices-wholesale/polymer-clay-sprinkles-wholesale/';
const products=JSON.parse(readFileSync('assets/v2/product-catalog.json','utf8')).products;

async function checkBuyingPath(page){
  await page.route('**/api/inquiry',route=>route.abort());
  await page.route('https://**/*',route=>route.abort());
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const sku of ['YX3318','YX660']){
    const product=products.find(p=>p.sku===sku&&p.category==='polymer-clay-slices');
    await page.goto(collection);
    await expect(page.locator('[data-sprinkle-quote]')).toHaveCount(10);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.locator(`[data-sprinkle-quote="${sku}"]`).click();
    await expect(page.locator('input[name="sku"]')).toHaveValue(sku);
    await expect(page.locator('input[name="product"]')).toHaveValue(product.title);
    await expect(page.locator('input[name="product_image"]')).toHaveValue(product.image);
    await expect(page.locator('input[name="source_page"]')).toHaveValue(collection);
    await expect(page.locator('input[name="product_page"]')).toHaveValue(product.productionPath);
    await expect(page.locator('[name="category"]')).toHaveValue('polymer-clay-slices');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  await page.goto(collection);
  await page.getByRole('link',{name:'Plan Liquid-Project Sample Checks',exact:true}).click();
  await expect(page.locator('#liquid-filled-tumblers')).toContainText('has not been established');
  expect(errors).toEqual([]);
}

test('sprinkles collection preserves SKU inquiry and sample-guide context on phones and desktop',async({page,browser})=>{
  await checkBuyingPath(page);
  if(page.viewportSize().width===375){
    const desktop=await browser.newContext({baseURL:'http://127.0.0.1:4173',viewport:{width:1440,height:900},isMobile:false,hasTouch:false});
    try{await checkBuyingPath(await desktop.newPage());}finally{await desktop.close();}
  }
});
