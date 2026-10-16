import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const batch = JSON.parse(readFileSync('scripts/data/haibu-new-products-20261016-supplement.json', 'utf8'));
const catalog = JSON.parse(readFileSync('assets/v2/product-catalog.json', 'utf8'));

test('all 11 supplemental products preserve three images, SKU, category and quote prefills', async ({ page }) => {
  test.setTimeout(180000);
  await page.route('**/api/inquiry', route => route.abort());
  for (const record of batch.products) {
    const product = catalog.products.find(item => item.sku === record.sku);
    await page.goto(product.productionPath, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveText(product.title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const main = page.locator('[data-product-gallery-main]');
    const thumbs = page.locator('[data-product-gallery-thumb]');
    await expect(thumbs).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await thumbs.nth(i).click();
      await expect(main).toHaveAttribute('src', product.gallery[i]);
      await expect.poll(() => main.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await main.evaluate(img => getComputedStyle(img).objectFit)).toBe('contain');
    }
    await page.locator('.product-detail-copy a.btn-primary').click();
    await expect(page.locator('input[name="sku"]')).toHaveValue(product.sku);
    await expect(page.locator('input[name="product"]')).toHaveValue(product.title);
    await expect(page.locator('input[name="product_image"]')).toHaveValue(product.image);
    await expect(page.locator('select[name="category"]')).toHaveValue(product.category);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
