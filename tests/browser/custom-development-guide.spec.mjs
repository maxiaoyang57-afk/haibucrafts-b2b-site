import { expect, test } from '@playwright/test';

const articlePath = '/blog/custom-resin-polymer-clay-development-process/';
const noOverflow = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
const dismissConsent = async (page) => {
  const button = page.locator('[data-analytics-decline]');
  if (await button.isVisible()) await button.click();
};

async function checkGuide(page, testInfo, screen) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/inquiry', () => { throw new Error('Read-only custom guide QA must not send inquiries'); });
  await page.goto(articlePath);
  await expect(page.locator('h1')).toHaveText('Custom Resin and Polymer Clay: From Your Brief to Bulk Delivery');
  await dismissConsent(page);
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath(`custom-guide-${screen}-hero.png`) });
  const diagram = page.locator('.custom-order-flow img');
  await expect.poll(() => diagram.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await diagram.evaluate((img) => img.currentSrc)).toContain(screen === 'desktop' ? 'haibu-custom-order-flow.svg' : 'haibu-custom-order-flow-mobile.svg');
  await page.locator('.custom-order-flow').screenshot({ path: testInfo.outputPath(`custom-guide-${screen}-flowchart.png`) });
  await page.locator('.custom-process-overview').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath(`custom-guide-${screen}-process.png`) });
  for (const route of ['resin-route', 'polymer-route']) {
    await page.locator(`.custom-guide-nav a[href="#${route}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#${route}$`));
    await expect(page.locator(`#${route} h2`)).toBeInViewport();
    await noOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`custom-guide-${screen}-${route}.png`) });
    await page.goBack();
  }
  await expect(page.locator('.custom-approval-note')).toHaveCount(3);
  await expect(page.locator('.custom-stage-handoff')).toHaveCount(0);
  const hrefs = await page.locator('main a[href^="/"]').evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute('href').split('?')[0].split('#')[0]))]);
  for (const href of hrefs) expect((await page.request.get(href)).status(), href).toBe(200);
  await page.locator('.blog-checklist-card .btn').click();
  await expect(page).toHaveURL(/\/request-quote\/\?source=blog/);
  await expect(page.locator('textarea[name="message"]')).toBeVisible();
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Custom Resin and Polymer Clay: From Your Brief to Bulk Delivery');
  await page.goto('/custom-solutions/');
  await dismissConsent(page);
  await page.locator('#material-routes').scrollIntoViewIfNeeded();
  await noOverflow(page);
  await expect(page.locator('#material-routes .card')).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath(`custom-service-${screen}-materials.png`) });
  await page.locator('a[href*="source=custom-resin-service"]').click();
  await expect(page).toHaveURL(/category=resin-charms/);
  await expect(page.locator('textarea[name="message"]')).toBeVisible();
  await page.goBack();
  await page.locator('a[href*="source=custom-polymer-service"]').click();
  await expect(page).toHaveURL(/category=polymer-clay-slices/);
  await expect(page.locator('textarea[name="message"]')).toBeVisible();
  await page.goBack();
  await page.locator('#material-routes a').filter({ hasText: 'Read the Custom Development Guide' }).click();
  await expect(page).toHaveURL(articlePath);
  await page.goto('/blog/');
  await page.locator(`.blog-guide-card[href="${articlePath}"]`).click();
  await expect(page).toHaveURL(articlePath);
  await noOverflow(page);
  expect(errors).toEqual([]);
}

test('custom guide and both OEM material routes work on phones', async ({ page }, testInfo) => {
  await checkGuide(page, testInfo, testInfo.project.name);
});

test('custom guide and OEM material routes remain usable on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone-390', 'One desktop run in addition to the four phone widths');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await checkGuide(page, testInfo, 'desktop');
});
