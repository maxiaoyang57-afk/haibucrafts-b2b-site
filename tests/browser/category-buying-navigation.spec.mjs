import { test, expect } from '@playwright/test';

for (const [family, category, label] of [
  ['polymer', '/products/polymer-clay-slices-wholesale/', 'Polymer clay slices buying resources'],
  ['sequins', '/products/sequins-glitter-confetti/', 'Sequins and confetti buying resources']
]) {
for (const width of [360, 1440]) {
  test(`${family} buying navigation reaches real content at ${width}px`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone-390', 'Bounded mobile and desktop viewport checks');
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/*', route => {
      const request = route.request();
      if (!request.url().startsWith('http://127.0.0.1:4173/') || !['GET', 'HEAD'].includes(request.method())) return route.abort();
      return route.continue();
    });
    await page.goto(category);
    const nav = page.getByRole('navigation', { name: label });
    await expect(nav.getByRole('link')).toHaveCount(4);
    await nav.getByRole('link', { name: 'Buying Notes', exact: true }).click();
    await expect(page).toHaveURL(new RegExp('#buyer-resources$'));
    await expect(page.locator('#buyer-resources')).toHaveCount(1);
    await expect(page.locator('#buyer-resources')).toBeInViewport();
    await page.goto(category);
    await nav.getByRole('link', { name: 'Products', exact: true }).click();
    await expect(page.locator('#product-grid')).toBeInViewport();
    for (const [label, target] of [['Custom Options', 'services'], ['Custom FAQ', 'faq']]) {
      await page.goto(category);
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp('/custom-solutions/#' + target + '$'));
      await expect(page.locator('#' + target)).toHaveCount(1);
      await expect(page.locator('#' + target)).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });
}
}
