import { EXPECTED_CATEGORIES } from '../catalog-release-contract.js';
import { test, expect } from '@playwright/test';

test.beforeEach(async({page,context})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await context.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4173/')&&['GET','HEAD'].includes(route.request().method())?route.continue():route.abort());
});
test('phone catalogs retain every card, search later products and use original images for zoom',async({page})=>{
 await page.goto('/products/resin-charms-for-slime/');
 const cards=page.locator('[data-product-card]');const total=await cards.count();
 const lastSku=(await cards.last().locator('.sku-badge').textContent()).trim();
 await expect(page.locator('[data-mobile-browse-hidden]')).toHaveCount(total-12);
 await page.getByRole('button',{name:'Show 12 more products',exact:true}).press('Enter');
 await expect(page.locator('[data-mobile-browse-hidden]')).toHaveCount(total-24);
 await page.getByRole('button',{name:`Show all ${total} products`,exact:true}).press('Enter');
 await expect(page.locator('[data-mobile-browse-hidden]')).toHaveCount(0);
 await expect(cards).toHaveCount(total);
 await page.locator('[data-product-search]').fill(lastSku);
 await expect(cards.last()).toBeVisible();
 await expect(page.locator('[data-mobile-browse-hidden]')).toHaveCount(0);
 const image=cards.last().locator('.product-image-button img');const original=await image.getAttribute('src');
 await cards.last().locator('.product-image-button').press('Enter');
 await expect(page.locator('.product-image-dialog-visual img')).toHaveAttribute('src',new URL(original,page.url()).href);
 await page.getByRole('button',{name:'Close product image preview',exact:true}).press('Enter');
 const quote=await cards.last().locator('.get-quote').getAttribute('href');
 expect(quote).toContain('product_code=');
 await page.locator('[data-product-search]').fill('');
 await expect(page.locator('[data-mobile-browse-hidden]')).toHaveCount(total-12);
 await page.setViewportSize({width:1440,height:900});
 await expect(page.locator('[data-mobile-browse-hidden]')).toHaveCount(0);
 await expect(cards).toHaveCount(total);
});
test('phone homepage keeps all featured products and exposes them on request',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.home-product-card')).toHaveCount(8);
 await expect(page.locator('.home-product-grid>[data-mobile-browse-hidden]')).toHaveCount(4);
 await page.getByRole('button',{name:'Show all 8 featured products',exact:true}).press('Enter');
 await expect(page.locator('.home-product-grid>[data-mobile-browse-hidden]')).toHaveCount(0);
 await expect(page.locator('.category-visual-card')).toHaveCount(EXPECTED_CATEGORIES.length);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
