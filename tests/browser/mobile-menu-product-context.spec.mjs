import { test, expect } from '@playwright/test';

const sku = 'RW20423/RW22336/RW22338';
const productPath = '/products/resin-charms-for-slime/rw20423-rw22336-rw22338-mixed-mini-antler-black-hat-craft-decorations/';
async function dismissConsent(page) {
  const decline = page.locator('[data-analytics-decline]');
  if (await decline.isVisible()) await decline.click();
}

test('mobile category menu stays in the viewport and its last actions remain tappable', async ({ page }) => {
  await page.goto('/products/polymer-clay-slices-wholesale/');
  await dismissConsent(page);
  const toggle = page.locator('.site-header .menu-btn');
  const nav = page.locator('#primary-navigation');
  const dock = page.locator('.category-mobile-quote');
  await expect(dock).toBeVisible();
  await toggle.tap();
  await expect(dock).toBeHidden();
  await expect(nav).toBeVisible();
  const bounds = await nav.boundingBox();
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize().height + 1);
  const quote = nav.locator('a.quote-btn');
  await quote.scrollIntoViewIfNeeded();
  await expect(quote).toBeInViewport({ ratio: 1 });
  const reachable = await quote.evaluate(el => {
    const r = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  });
  expect(reachable).toBe(true);
  await page.screenshot({ path: test.info().outputPath('menu-bottom.png') });
  await toggle.tap();
  await expect(dock).toBeVisible();
  await toggle.tap();
  await quote.tap();
  await expect(page).toHaveURL(/\/request-quote\//);
});

test('header inquiry preserves complete PDP identity and does not convert the quote-list entry to a single product', async ({ page }) => {
  await page.goto(productPath);
  await dismissConsent(page);
  const list = new URL(await page.locator('.quote-list-link').getAttribute('href'), page.url());
  expect(list.searchParams.get('quote_list')).toBe('1');
  expect(list.searchParams.has('product_code')).toBe(false);
  await page.locator('.site-header .menu-btn').tap();
  await page.locator('#primary-navigation a.quote-btn').tap();
  await expect(page.locator('input[name="sku"]')).toHaveValue(sku);
  await expect(page.locator('input[name="product"]')).toHaveValue('Mixed Mini Antler & Black Hat Craft Decorations');
  await expect(page.locator('select[name="category"]')).toHaveValue('resin-charms');
  await expect(page.locator('input[name="product_image"]')).toHaveValue(/mixed-mini-antler-black-hat-craft-decorations-01\.jpg$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  await page.screenshot({ path: test.info().outputPath('header-inquiry.png') });
});
