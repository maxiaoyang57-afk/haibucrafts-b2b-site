import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const selection = JSON.parse(readFileSync('scripts/data/buyer-card-selection-20261107.json', 'utf8')).products;
const products = JSON.parse(readFileSync('assets/v2/product-catalog.json', 'utf8')).products;
const paths = { 'slime-charms': '/products/slime-charms-wholesale/', 'polymer-clay-slices': '/products/polymer-clay-slices-wholesale/', 'resin-charms': '/products/resin-charms-for-slime/' };

for (const [category, path] of Object.entries(paths)) {
  test(`${category}: compare facts, exact SKU search and inquiry context`, async ({ page }) => {
    await page.route('**/*', route => {
      const req = route.request();
      return req.url().startsWith('http://127.0.0.1:4173/') && ['GET', 'HEAD'].includes(req.method()) ? route.continue() : route.abort();
    });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(path);
    const records = selection.filter(p => p.category === category);
    await page.getByRole('button', { name: `Compare specs (${records.length})`, exact: true }).click();
    await expect(page.locator('[data-product-count]')).toHaveText(`${records.length} products`);
    await expect(page.locator('[data-product-card]:visible')).toHaveCount(records.length);
    for (const record of records) {
      const product = products.find(p => p.sku === record.sku);
      await page.locator('[data-product-search]').fill(record.sku);
      const card = page.locator(`[data-buyer-comparison="${record.sku}"]`);
      await expect(card).toBeVisible();
      await card.scrollIntoViewIfNeeded();
      await expect(card.locator('[data-buyer-specs]')).toContainText('Size reference');
      await expect.poll(() => card.locator('img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await card.locator('a.get-quote').click();
      await expect(page.locator('input[name="sku"]')).toHaveValue(record.sku);
      await expect(page.locator('input[name="product"]')).toHaveValue(product.title);
      await expect(page.locator('input[name="product_image"]')).toHaveValue(product.image);
      await expect(page.locator('[name="category"]')).toHaveValue(category);
      await expect(page.locator('input[name="source_page"]')).toHaveValue(product.productionPath);
      await expect(page.locator('input[name="entry_page"]')).toHaveValue(`https://www.haibucrafts.com${path}`);
      await page.goto(path);
      await page.getByRole('button', { name: `Compare specs (${records.length})`, exact: true }).click();
    }
    await page.locator('[data-product-search]').fill('nonexistent-product-zz');
    await expect(page.locator('[data-product-count]')).toHaveText('0 products');
    await page.getByRole('button', { name: 'Show All Products', exact: true }).click();
    await expect(page.locator('[data-product-count]')).toHaveText(`${products.filter(p => p.category === category).length} products`);
    expect(errors).toEqual([]);
  });
}
