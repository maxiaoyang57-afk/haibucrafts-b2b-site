import { expect, test } from '@playwright/test';

const noOverflow = async (page) => expect(await page.evaluate(() =>
  document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

test('homepage first-screen choices, catalog links and cookie controls work on phones', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/inquiry', () => { throw new Error('Homepage QA must not submit an inquiry'); });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Wholesale charms & mix-ins for slime & craft brands.');
  await noOverflow(page);
  const consent = page.locator('.analytics-consent');
  await expect(consent).toBeVisible();
  const cta = await page.locator('.hero .actions').boundingBox();
  const banner = await consent.boundingBox();
  expect(cta.y + cta.height).toBeLessThan(banner.y);
  await page.screenshot({ path: testInfo.outputPath('homepage-phone-first-screen.png') });
  await page.locator('[data-analytics-decline]').tap();
  await expect(consent).toBeHidden();
  await expect(page.locator('.category-visual-card')).toHaveCount(4);
  await expect(page.locator('.home-product-card')).toHaveCount(8);
  for (const card of await page.locator('.home-product-card').all()) {
    await card.scrollIntoViewIfNeeded();
    const image = card.locator('img');
    await expect.poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(await image.evaluate((img) => getComputedStyle(img).objectFit)).toBe('contain');
    await noOverflow(page);
  }
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
  await page.screenshot({ path: testInfo.outputPath('homepage-phone-full.png'), fullPage: true });
  const product = page.locator('.home-product-card').first();
  const href = await product.getAttribute('href');
  await product.tap();
  await expect(page).toHaveURL(new RegExp(href));
  await page.goBack();
  await page.locator('.hero .btn-light').tap();
  await expect(page).toHaveURL(/\/request-quote\/\?source=homepage-samples/);
  await expect(page.locator('textarea[name="message"]')).toBeVisible();
  await page.goBack();
  await page.locator('[data-cookie-settings]').click();
  await expect(consent).toBeVisible();
  await page.locator('[data-analytics-decline]').click();
  await expect(consent).toBeHidden();
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('desktop homepage keeps actions above consent and reports one safe event per click', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone-390', 'One desktop run alongside the four phone widths');
  await page.setViewportSize({ width: 1180, height: 757 });
  await page.goto('/');
  await noOverflow(page);
  const cta = await page.locator('.hero .actions').boundingBox();
  const banner = await page.locator('.analytics-consent').boundingBox();
  expect(cta.y + cta.height).toBeLessThan(banner.y);
  expect((await page.locator('h1').boundingBox()).height).toBeLessThan(230);
  expect((await page.locator('#categories').boundingBox()).y).toBeLessThan(850);
  console.log('Homepage desktop geometry', await page.evaluate(() => ({ heading: document.querySelector('h1').getBoundingClientRect().toJSON(), actions: document.querySelector('.hero .actions').getBoundingClientRect().toJSON(), categories: document.querySelector('#categories').getBoundingClientRect().toJSON(), consent: document.querySelector('.analytics-consent').getBoundingClientRect().toJSON() })));
  await page.screenshot({ path: testInfo.outputPath('homepage-desktop-first-screen.png') });
  await page.locator('[data-analytics-decline]').click();
  await page.evaluate(() => {
    window.clickEvents = [];
    window.HAIBU_TRACK = (name, properties) => window.clickEvents.push({ name, properties });
    document.addEventListener('click', (event) => {
      if (event.target.closest('a[href]')) event.preventDefault();
    });
  });
  await page.locator('.home-product-card').first().click();
  let events = await page.evaluate(() => window.clickEvents);
  expect(events).toHaveLength(1);
  expect(events[0].name).toBe('product_link_click');
  expect(events[0].properties.product_code).toBe('SLM10008');
  expect(events[0].properties.link_location).toBe('homepage_featured');
  expect(events[0].properties.target_url).toMatch(/\/products\/slime-charms-wholesale\/slm10008-/);
  await page.locator('.hero .btn-light').click();
  events = await page.evaluate(() => window.clickEvents);
  expect(events).toHaveLength(2);
  expect(events[1].name).toBe('quote_cta_click');
  expect(events[1].properties.link_location).toBe('homepage_hero');
  expect(events[1].properties.target_url).toMatch(/\/request-quote\/$/);
  expect(JSON.stringify(events)).not.toContain('homepage-samples');
  await page.locator('.hero .btn-primary').click();
  events = await page.evaluate(() => window.clickEvents);
  expect(events).toHaveLength(3);
  expect(events[2].name).toBe('product_link_click');
  expect(events[2].properties.link_location).toBe('homepage_hero');
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
  await page.screenshot({ path: testInfo.outputPath('homepage-desktop-full.png'), fullPage: true });
});
