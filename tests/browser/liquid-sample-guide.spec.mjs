import { test, expect } from '@playwright/test';

test('liquid-project guide leads to the existing form with an editable sample brief', async ({page}) => {
  await page.route('**/api/inquiry', route => route.abort());
  await page.goto('/blog/polymer-clay-slice-buying-guide/');
  await expect(page.locator('#liquid-filled-tumblers')).toContainText('water-glycerin');
  await expect(page.locator('#liquid-filled-tumblers')).toContainText('has not been established');
  for (const code of ['YX043', 'YX3194']) await expect(page.locator('main a').filter({hasText:code})).toHaveCount(1);
  await expect(page.locator('main')).not.toContainText('Kimberly');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('link', {name:'Prepare an Inquiry',exact:true}).click();
  await expect(page.locator('[data-inquiry-intent]')).toContainText('Plan samples for a liquid-filled project');
  await expect(page.locator('[name="category"]')).toHaveValue('polymer-clay-slices');
  const message=page.locator('textarea[name="message"]');
  await expect(message).toHaveAttribute('placeholder', /Liquid formulation/);
  await message.fill('YX043 and YX3194: please discuss samples for my formulation.');
  await expect(message).toHaveValue('YX043 and YX3194: please discuss samples for my formulation.');
  await expect(page.locator('[data-inquiry-whatsapp]')).toHaveAttribute('href', /YX043/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
