import { expect, test } from '@playwright/test';

const productFamilies = [
  { path: '/products/slime-charms-wholesale/', name: /slime charms/i },
  { path: '/products/polymer-clay-slices-wholesale/', name: /polymer clay/i },
  { path: '/products/resin-charms-for-slime/', name: /resin charms/i },
  { path: '/products/sequins-glitter-confetti/', name: /sequins/i }
];

const nav = (page) => page.locator('#primary-navigation');
const submenu = (page) => page.locator('#product-category-navigation');
const menuButton = (page) => page.locator('.site-header .menu-btn');
const productsButton = (page) => nav(page).locator('.products-toggle');

async function visitHome(page) {
  await page.goto('/');
  await expect(nav(page)).toBeAttached();
  await page.locator('[data-analytics-decline]').click();
  await expect(page.locator('.analytics-consent')).toBeHidden();
}

async function openMenu(page) {
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  await menuButton(page).tap();
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(menuButton(page)).toHaveAccessibleName('Close menu');
  await expect(nav(page)).toBeVisible();
}

async function openProducts(page) {
  await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'false');
  await productsButton(page).tap();
  await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(submenu(page)).toBeVisible();
}

async function expectNoHorizontalOverflow(page) {
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  for (const region of [nav(page), submenu(page)]) {
    if (await region.isVisible()) {
      expect(await region.evaluate((element) =>
        element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      const box = await region.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(-1);
      expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
    }
  }
}

async function expectTouchTarget(locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
}

async function expectProductCards(page) {
  const cards = submenu(page).locator('a.nav-category-card');
  await expect(cards).toHaveCount(4);
  expect((await cards.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).sort())
    .toEqual(productFamilies.map((family) => family.path).sort());

  for (const family of productFamilies) {
    const card = submenu(page).locator(`a.nav-category-card[href="${family.path}"]`);
    await expect(card).toHaveAccessibleName(family.name);
    await card.scrollIntoViewIfNeeded();
    const thumbnail = card.locator('img');
    await expect(thumbnail).toHaveCount(1);
    await expect(thumbnail).toBeVisible();
    await expect.poll(() => thumbnail.evaluate((image) =>
      image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)).toBe(true);
    expect(await thumbnail.evaluate((image) => new URL(image.currentSrc).origin))
      .toBe(new URL(page.url()).origin);
    await expectTouchTarget(card);
  }
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/inquiry', () => {
    throw new Error('Navigation QA must not submit an inquiry');
  });
});

test('visual mobile menu has four real product thumbnails and comfortable targets', async ({ page }, testInfo) => {
  await visitHome(page);
  await expect(menuButton(page)).toHaveAttribute('aria-controls', 'primary-navigation');
  await expect(menuButton(page)).toHaveAccessibleName('Open menu');
  await expectTouchTarget(menuButton(page));
  await expect(nav(page)).toBeHidden();
  await openMenu(page);
  await expect(productsButton(page)).toHaveAttribute('aria-controls', 'product-category-navigation');
  await expect(submenu(page)).toBeHidden();
  await expectTouchTarget(productsButton(page));
  await expect(nav(page).locator('.nav-home-link')).toHaveAttribute('href', '/');
  await expect(nav(page).locator('.nav-product-row > a')).toHaveAttribute('href', '/products/');
  expect(await nav(page).locator('.nav-secondary-links > a').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')))).toEqual([
    '/custom-solutions/', '/themes/', '/manufacturing/', '/quality-control/',
    '/certificates/', '/about/', '/blog/'
  ]);

  for (const link of await nav(page).locator('.nav-home-link, .nav-product-row > a, .nav-secondary-links > a').all()) {
    await expectTouchTarget(link);
    await expect(link.locator('.nav-icon')).toHaveCount(1);
    await expect(link.locator('.nav-icon')).toHaveAttribute('aria-hidden', 'true');
  }

  await openProducts(page);
  await expect(submenu(page).locator('.nav-catalog-intro')).toBeVisible();
  await expect(submenu(page).locator('.nav-catalog-intro')).toHaveText(/\S/);
  await expectProductCards(page);
  for (const target of await nav(page).locator('a, button').all()) {
    await expectTouchTarget(target);
  }
  await expectNoHorizontalOverflow(page);
  await nav(page).evaluate((element) => { element.scrollTop = 0; });
  await page.screenshot({ path: testInfo.outputPath('visual-navigation-mobile-expanded.png') });
});

test('mobile menu closes in layers, restores focus and survives repeated toggles', async ({ page }) => {
  await visitHome(page);
  await openMenu(page);
  await openProducts(page);
  await submenu(page).locator('.nav-category-card').last().focus();
  await page.keyboard.press('Escape');
  await expect(submenu(page)).toBeHidden();
  await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(productsButton(page)).toBeFocused();
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(nav(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(nav(page)).toBeHidden();
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(menuButton(page)).toBeFocused();

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await openMenu(page);
    await expect(submenu(page)).toBeHidden();
    await openProducts(page);
    await productsButton(page).tap();
    await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(submenu(page)).toBeHidden();
    await openProducts(page);
    await menuButton(page).tap();
    await expect(nav(page)).toBeHidden();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expectNoHorizontalOverflow(page);
  }

  await openMenu(page);
  await expect(submenu(page)).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(menuButton(page)).toBeFocused();
});

test('mobile product category links, Back and submenu catalog CTA keep their routes', async ({ page }) => {
  await visitHome(page);
  for (const family of productFamilies) {
    await openMenu(page);
    await openProducts(page);
    await submenu(page).locator(`.nav-category-card[href="${family.path}"]`).tap();
    await expect(page).toHaveURL((url) => url.pathname === family.path);
    await expect(page.locator('h1')).toBeVisible();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(nav(page)).toBeHidden();
    await expectNoHorizontalOverflow(page);
    await page.goBack();
    await expect(page).toHaveURL((url) => url.pathname === '/');
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(nav(page)).toBeHidden();
  }

  await openMenu(page);
  await openProducts(page);
  const catalogCta = submenu(page).locator('a.nav-catalog-all');
  await expect(catalogCta).toHaveCount(1);
  await expect(catalogCta).toHaveAttribute('href', '/products/');
  await expectTouchTarget(catalogCta);
  await catalogCta.tap();
  await expect(page).toHaveURL((url) => url.pathname === '/products/');
  await expect(page.locator('h1')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.goBack();
  await expect(page).toHaveURL((url) => url.pathname === '/');
  await expect(nav(page)).toBeHidden();
  await openMenu(page);
  await expect(submenu(page)).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(menuButton(page)).toBeFocused();
});

test('desktop product dropdown fits and Escape dismisses it while focused', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone-390', 'One desktop run alongside the four phone widths');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visitHome(page);
  await expect(menuButton(page)).toBeHidden();
  await expect(nav(page)).toBeVisible();
  await expect(submenu(page)).toBeHidden();
  await productsButton(page).click();
  await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(submenu(page)).toBeVisible();
  await expectProductCards(page);
  await expectNoHorizontalOverflow(page);

  for (const link of await nav(page).locator('a').all()) {
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(1441);
  }
  await page.screenshot({ path: testInfo.outputPath('visual-navigation-desktop-dropdown.png') });

  // Keep the pointer over the trigger as well as keyboard focus inside the menu.
  // Neither :hover nor :focus-within should reopen an Escape-dismissed dropdown.
  await productsButton(page).hover();
  await submenu(page).locator('.nav-category-card').last().focus();
  await page.keyboard.press('Escape');
  await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(productsButton(page)).toBeFocused();
  await expect(submenu(page)).toBeHidden();
  await expect(nav(page)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await productsButton(page).press('Enter');
  await expect(submenu(page)).toBeVisible();
  await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(submenu(page)).toBeHidden();
  await expect(productsButton(page)).toBeFocused();
});
