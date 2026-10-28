import { test, expect } from 'playwright/test';
import { readFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync('docs/tasks/haibu-new-products-20261028-monica-09-manifest.json', 'utf8'));
const catalog = JSON.parse(readFileSync('assets/v2/product-catalog.json', 'utf8')).products;

async function checkProducts(page) {
  await page.route('**/api/inquiry', route => route.abort());
  await page.route('https://**/*', route => route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const record of manifest.products) {
    const product = catalog.find(p => p.sku === record.sku);
    await page.goto(product.productionPath, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveText(product.title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const main = page.locator('[data-product-gallery-main]');
    const thumbs = page.locator('[data-product-gallery-thumb]');
    await expect(thumbs).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await thumbs.nth(i).click();
      await expect(main).toHaveAttribute('src', product.gallery[i]);
      await expect.poll(() => main.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    }
    await page.locator('.product-detail-copy a.btn-primary').click();
    await expect(page.locator('input[name="sku"]')).toHaveValue(product.sku);
    await expect(page.locator('input[name="product"]')).toHaveValue(product.title);
    await expect(page.locator('input[name="product_image"]')).toHaveValue(product.image);
  }
  expect(errors).toEqual([]);
}

test('Ninth Monica batch keeps exact gallery and inquiry context on phones and desktop', async ({ page, browser }) => {
  test.setTimeout(300_000);
  const width = page.viewportSize().width;
  await checkProducts(page);
  if (width === 375) {
    const desktop = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false });
    try { await checkProducts(await desktop.newPage()); }
    finally { await desktop.close(); }
  }
});
