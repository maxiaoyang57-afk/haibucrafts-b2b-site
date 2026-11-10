import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync('assets/v2/product-catalog.json', 'utf8')).products;
const guide = '/blog/keychain-bag-charm-components-sourcing-guide/';

test('component guide preserves exact product and quote context on phone and desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone-375', 'One bounded run at 375 and 1440 pixels');
  await page.route('**/*', route => {
    const r = route.request();
    return r.url().startsWith('http://127.0.0.1:4173/') && ['GET','HEAD'].includes(r.method()) ? route.continue() : route.abort();
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/blog/');
    await page.locator(`a[href="${guide}"]`).click();
    await expect(page.locator('h1')).toHaveText('Sourcing Components for Keychain and Bag Charm Projects');
    await expect(page.locator('[data-guide-sku]')).toHaveCount(4);
    await expect(page.locator('#attachment')).toContainText('no hole');
    for (const sku of ['RW26795','RW26801','YX693','YX329']) {
      const product = catalog.find(p => p.sku === sku);
      const card = page.locator(`[data-guide-sku="${sku}"]`);
      const image = card.locator('img');
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await card.locator(`[data-guide-quote="${sku}"]`).click();
      await expect(page.locator('input[name="sku"]')).toHaveValue(sku);
      await expect(page.locator('input[name="product"]')).toHaveValue(product.title);
      await expect(page.locator('input[name="product_image"]')).toHaveValue(product.image);
      await expect(page.locator('[name="category"]')).toHaveValue(product.category);
      await page.goto(guide);
    }
    await page.locator('[data-guide-products]').screenshot({path:`test-results/keychain-components-${width}.png`});
  }
  expect(errors).toEqual([]);
});
