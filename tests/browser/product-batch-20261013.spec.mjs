import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const batch = JSON.parse(readFileSync('scripts/data/haibu-new-products-20261013.json', 'utf8'));
const catalog = JSON.parse(readFileSync('assets/v2/product-catalog.json', 'utf8'));
const products = batch.products.map((item) => catalog.products.find((product) => product.sku === item.sku));
const noOverflow = async (page) => expect(await page.evaluate(() =>
  document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

test('all eight mobile product galleries and quote prefills preserve their codes', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/inquiry', (route) => {
    throw new Error(`Unexpected inquiry submission: ${route.request().method()}`);
  });
  for (const product of products) {
    await page.goto(product.productionPath);
    await expect(page.locator('h1')).toHaveText(product.title);
    await noOverflow(page);
    const gallery = page.locator('[data-product-gallery]');
    const main = gallery.locator('[data-product-gallery-main]');
    const thumbs = gallery.locator('[data-product-gallery-thumb]');
    await expect(thumbs).toHaveCount(3);
    for (let index = 0; index < 3; index += 1) {
      await thumbs.nth(index).tap();
      await expect(main).toHaveAttribute('src', product.gallery[index]);
      await expect.poll(() => main.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
      expect(await main.evaluate((image) => getComputedStyle(image).objectFit)).toBe('contain');
      await expect(thumbs.nth(index)).toHaveAttribute('aria-current', 'true');
    }
    if (product.sku.includes('/')) {
      const badge = page.locator('.product-detail-badges .sku-badge');
      await expect(badge).toHaveText(product.sku);
      expect(await badge.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath('grouped-bear-product.png'), fullPage: true });
    }
    await page.locator('.product-detail-copy a.btn-primary').tap();
    await expect(page.locator('input[name="sku"]')).toHaveValue(product.sku);
    await expect(page.locator('input[name="product"]')).toHaveValue(product.title);
    await expect(page.locator('select[name="category"]')).toHaveValue(product.category);
    await expect(page.locator('input[name="product_image"]')).toHaveValue(product.image);
    await noOverflow(page);
  }
  expect(errors).toEqual([]);
});

test('category search and full grouped SKU remain usable on a phone', async ({ page }, testInfo) => {
  for (const category of new Set(products.map((product) => product.category))) {
    const selected = products.filter((product) => product.category === category);
    await page.goto(selected[0].productionPath.split('/').slice(0, 3).join('/') + '/');
    for (const product of selected) {
      await page.locator('[data-product-search]').fill(product.sku);
      const card = page.locator('[data-product-card]:visible');
      await expect(card).toHaveCount(1);
      await expect(card.locator('.sku-badge')).toHaveText(product.sku);
      await noOverflow(page);
      const image = card.locator('img').first();
      await expect.poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await image.evaluate((img) => getComputedStyle(img).objectFit)).toBe('contain');
      if (product.sku.includes('/')) {
        await page.screenshot({ path: testInfo.outputPath('grouped-bear-category.png'), fullPage: true });
      }
    }
  }
});
