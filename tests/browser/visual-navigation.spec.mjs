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
  await expectHeaderBrand(page);
}

async function openMenu(page) {
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  await menuButton(page).tap();
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(menuButton(page)).toHaveAccessibleName('Close menu');
  await expect(nav(page)).toBeVisible();
  await expect(productsButton(page)).toBeHidden();
  await expect(submenu(page)).toBeVisible();
  await expect.poll(() => nav(page).evaluate((element) => element.scrollTop)).toBe(0);
  const cards = submenu(page).locator('a.nav-category-card');
  await expect(cards).toHaveCount(4);
  for (const card of await cards.all()) {
    await expect(card).toBeVisible();
    await expect(card).toBeInViewport();
  }
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

async function expectHeaderBrand(page) {
  const header = page.locator('.site-header .navbar');
  const logo = header.getByRole('link', { name: 'HAIBU home', exact: true });
  await expect(logo).toHaveCount(1);
  await expect(logo).toHaveClass('logo');
  await expect(logo).toHaveAttribute('href', '/');
  await expectTouchTarget(logo);

  const icon = logo.locator('img');
  const wordmark = logo.locator('.logo-wordmark');
  await expect(icon).toHaveCount(1);
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute('src', '/brand/haibu-logo-mobile.png');
  await expect(icon).toHaveAttribute('alt', '');
  await expect.poll(() => icon.evaluate((image) =>
    image.complete && image.naturalWidth === 160 && image.naturalHeight === 160)).toBe(true);
  expect(await icon.evaluate((image) => new URL(image.currentSrc).pathname))
    .toBe('/brand/haibu-logo-mobile.png');
  await expect(wordmark).toHaveText('HAIBU');
  await expect(wordmark).toBeVisible();
  await expect(wordmark).toHaveCSS('white-space', 'nowrap');
  const mobile = page.viewportSize().width <= 1180;
  await expect(icon).toHaveCSS('width', mobile ? '40px' : '48px');
  await expect(icon).toHaveCSS('height', mobile ? '40px' : '48px');
  await expect(wordmark).toHaveCSS('font-size', mobile ? '22px' : '24px');

  const [logoBox, iconBox, wordmarkBox] = await Promise.all([
    logo.boundingBox(), icon.boundingBox(), wordmark.boundingBox()
  ]);
  expect(iconBox.x + iconBox.width).toBeLessThan(wordmarkBox.x);
  expect(Math.abs(iconBox.y + iconBox.height / 2 - wordmarkBox.y - wordmarkBox.height / 2))
    .toBeLessThanOrEqual(1);
  expect(wordmarkBox.x + wordmarkBox.width).toBeLessThanOrEqual(logoBox.x + logoBox.width + 1);
  expect(logoBox.x).toBeGreaterThanOrEqual(0);
  expect(logoBox.x + logoBox.width).toBeLessThanOrEqual(page.viewportSize().width);

  await expect(header.locator('.quote-list-link')).toBeVisible();
  const controls = header.locator(':scope > .nav, :scope > .quote-list-link, :scope > .menu-btn');
  const boxes = [logoBox];
  for (const control of await controls.all()) {
    if (await control.isVisible()) boxes.push(await control.boundingBox());
  }
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i];
      const b = boxes[j];
      const separated = a.x + a.width <= b.x + 1 || b.x + b.width <= a.x + 1 ||
        a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1;
      expect(separated, 'Header brand, navigation, quote list and menu must not overlap').toBe(true);
    }
  }
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

test('HAIBU header wordmark fits narrow phones and both sides of the desktop breakpoint', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone-390', 'One responsive brand run alongside the four phone widths');
  await page.setViewportSize({ width: 320, height: 844 });
  await visitHome(page);

  for (const width of [320, 360, 1180, 1181, 1440]) {
    await page.setViewportSize({ width, height: width <= 1180 ? 844 : 1000 });
    await expectHeaderBrand(page);
    await expectNoHorizontalOverflow(page);
    if (width <= 1180) {
      await expect(menuButton(page)).toBeVisible();
      await expect(nav(page)).toBeHidden();
    } else {
      await expect(menuButton(page)).toBeHidden();
      await expect(nav(page)).toBeVisible();
    }

    if (width === 320) {
      // All four categories must be in view immediately, without scrolling or
      // opening a second disclosure, including after closing and reopening.
      for (let cycle = 0; cycle < 2; cycle += 1) {
        await openMenu(page);
        await expectHeaderBrand(page);
        await expectNoHorizontalOverflow(page);
        if (cycle === 0) {
          await page.screenshot({ path: testInfo.outputPath('haibu-header-320-menu-expanded.png') });
        }
        await menuButton(page).tap();
        await expect(nav(page)).toBeHidden();
        await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
        await expectHeaderBrand(page);
        await expectNoHorizontalOverflow(page);
      }
    }
    if (width === 1440) {
      await page.screenshot({ path: testInfo.outputPath('haibu-header-desktop.png') });
    }
  }
});

test('visual mobile menu has four real product thumbnails and comfortable targets', async ({ page }, testInfo) => {
  await visitHome(page);
  await expect(menuButton(page)).toHaveAttribute('aria-controls', 'primary-navigation');
  await expect(menuButton(page)).toHaveAccessibleName('Open menu');
  await expectTouchTarget(menuButton(page));
  await expect(nav(page)).toBeHidden();
  await openMenu(page);
  await expect(productsButton(page)).toHaveAttribute('aria-controls', 'product-category-navigation');
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

  await expect(submenu(page).locator('.nav-catalog-intro')).toBeVisible();
  await expect(submenu(page).locator('.nav-catalog-intro')).toHaveText(/\S/);
  await expectProductCards(page);
  for (const target of await nav(page).locator('a:visible, button:visible').all()) {
    await expectTouchTarget(target);
  }
  await expectNoHorizontalOverflow(page);
  await expect(nav(page)).toHaveCSS('overflow-y', 'auto');
  await nav(page).evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect.poll(() => nav(page).evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(nav(page).locator(':scope > .quote-btn')).toBeInViewport();
  await nav(page).evaluate((element) => { element.scrollTop = 0; });
  await expect(nav(page).locator('.nav-home-link')).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('visual-navigation-mobile-expanded.png') });
});

test('mobile menu closes with one Escape and reopens with all four categories', async ({ page }) => {
  await visitHome(page);
  await openMenu(page);
  await submenu(page).locator('.nav-category-card').last().focus();
  await page.keyboard.press('Escape');
  await expect(submenu(page)).toBeHidden();
  await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(nav(page)).toBeHidden();
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(menuButton(page)).toHaveAccessibleName('Open menu');
  await expect(menuButton(page)).toBeFocused();

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await openMenu(page);
    await nav(page).evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expect.poll(() => nav(page).evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await menuButton(page).tap();
    await expect(nav(page)).toBeHidden();
    await expect(submenu(page)).toBeHidden();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expectNoHorizontalOverflow(page);
  }

  await openMenu(page);
  await page.keyboard.press('Escape');
  await expect(nav(page)).toBeHidden();
  await expect(menuButton(page)).toBeFocused();
});

test('mobile product category links, Back and submenu catalog CTA keep their routes', async ({ page }) => {
  await visitHome(page);
  for (const family of productFamilies) {
    await openMenu(page);
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
  await page.keyboard.press('Escape');
  await expect(nav(page)).toBeHidden();
  await expect(menuButton(page)).toBeFocused();
});

test('desktop dropdown preserves dismissal and breakpoint changes keep focus visible', async ({ page }, testInfo) => {
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

  // At the exact mobile boundary an open desktop disclosure is reset, and its
  // focused card hands focus to the now-visible hamburger.
  await productsButton(page).press('Enter');
  await submenu(page).locator('.nav-category-card').last().focus();
  await page.setViewportSize({ width: 1180, height: 1000 });
  await expect(nav(page)).toBeHidden();
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(menuButton(page)).toBeVisible();
  await expect(menuButton(page)).toBeFocused();
  await openMenu(page);

  // Mobile cards disappear when returning to the closed desktop dropdown.
  await submenu(page).locator('.nav-category-card').first().focus();
  await page.setViewportSize({ width: 1181, height: 1000 });
  await expect(menuButton(page)).toBeHidden();
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(nav(page)).toBeVisible();
  await expect(submenu(page)).toBeHidden();
  await expect(productsButton(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(productsButton(page)).toBeFocused();

  // The desktop trigger also becomes hidden on phones; the closed mobile
  // hamburger hands focus to Home when switching back to desktop.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(nav(page)).toBeHidden();
  await expect(menuButton(page)).toBeFocused();
  await openMenu(page);
  await page.keyboard.press('Escape');
  await expect(nav(page)).toBeHidden();
  await expect(menuButton(page)).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(menuButton(page)).toBeHidden();
  await expect(nav(page)).toBeVisible();
  await expect(submenu(page)).toBeHidden();
  await expect(nav(page).locator('.nav-home-link')).toBeFocused();
  await expectNoHorizontalOverflow(page);
});
