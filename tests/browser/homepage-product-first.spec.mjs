import { expect, test } from '@playwright/test';

const noOverflow = async (page) => expect(await page.evaluate(() =>
  document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

const expectUnobstructedFirstScreenActions = async (page) => {
  await expect(page.locator('.analytics-consent')).toBeVisible();
  await expect.poll(() => page.locator('.hero .actions').evaluate((actions) => {
    const cta = actions.getBoundingClientRect();
    const banner = document.querySelector('.analytics-consent').getBoundingClientRect();
    return {
      separatedFromConsent: cta.right <= banner.left || cta.left >= banner.right
        || cta.bottom <= banner.top || cta.top >= banner.bottom,
      buttons: [...actions.querySelectorAll('a')].map((button) => {
        const rect = button.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return {
          fullyInViewport: rect.width > 0 && rect.height > 0 && rect.left >= 0 && rect.top >= 0
            && rect.right <= window.innerWidth && rect.bottom <= window.innerHeight,
          centerClickable: button.contains(hit)
        };
      })
    };
  }), { message: 'Both primary choices must fit the first screen and remain clear of consent and floating controls' }).toEqual({
    separatedFromConsent: true,
    buttons: [
      { fullyInViewport: true, centerClickable: true },
      { fullyInViewport: true, centerClickable: true }
    ]
  });
};

test('homepage first-screen choices, catalog links and cookie controls work on phones', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/inquiry', () => { throw new Error('Homepage QA must not submit an inquiry'); });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Wholesale charms & mix-ins for slime & craft brands.');
  await noOverflow(page);
  const consent = page.locator('.analytics-consent');
  await expect(consent).toBeVisible();
  await expectUnobstructedFirstScreenActions(page);
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

test('desktop homepage keeps actions unobstructed and reports one safe event per click', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone-390', 'One desktop run alongside the four phone widths');
  await page.setViewportSize({ width: 1180, height: 757 });
  await page.goto('/');
  await noOverflow(page);
  await expectUnobstructedFirstScreenActions(page);
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

test('buying steps stay compact and document and shortlist inquiries survive back navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone-390', 'One bounded mobile/desktop run for both homepage routes');
  const errors = [];
  const submissions = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/inquiry', async (route) => {
    submissions.push(route.request().method());
    await route.abort();
  });

  for (const homePath of ['/', '/v2-preview/']) {
    const quotePath = homePath === '/' ? '/request-quote/' : '/v2-preview/quote/';
    for (const width of [360, 1180]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(homePath);
      const decline = page.locator('[data-analytics-decline]');
      if (await decline.isVisible()) await decline.click();
      const buying = page.locator('#buying');
      const cards = buying.locator('.buying-path');
      await expect(cards).toHaveCount(3);
      for (const card of await cards.all()) await expect(card).not.toHaveText(/^\s*0[123]\s*[/.:–-]/);
      const steps = buying.locator('ol.procurement-steps');
      await expect(steps.locator('li')).toHaveCount(3);
      await expect(steps.locator('li strong')).toHaveText([
        'Choose products', 'Confirm order details', 'Discuss quote & samples'
      ]);
      await steps.scrollIntoViewIfNeeded();
      const geometry = await steps.evaluate((list) => ({
        list: list.getBoundingClientRect().toJSON(),
        cards: document.querySelector('#buying .buying-path-grid').getBoundingClientRect().toJSON(),
        items: [...list.children].map((item) => item.getBoundingClientRect().toJSON())
      }));
      expect(geometry.list.top).toBeGreaterThanOrEqual(geometry.cards.bottom);
      expect(geometry.list.height).toBeLessThan(width < 680 ? 260 : 140);
      for (const item of geometry.items) {
        expect(item.left).toBeGreaterThanOrEqual(0);
        expect(item.right).toBeLessThanOrEqual(width + 1);
      }
      if (width < 680) {
        expect(geometry.items[1].top).toBeGreaterThanOrEqual(geometry.items[0].bottom);
        expect(geometry.items[2].top).toBeGreaterThanOrEqual(geometry.items[1].bottom);
      } else {
        expect(Math.abs(geometry.items[2].top - geometry.items[0].top)).toBeLessThan(2);
      }
      await noOverflow(page);
      if (homePath === '/') await page.locator('.procurement-guide').screenshot({ path: testInfo.outputPath(`buying-steps-${width}.png`) });

      const final = page.locator('.home-final');
      if (homePath === '/') await final.screenshot({ path: testInfo.outputPath(`homepage-final-${width}.png`) });
      await expect(final.getByRole('link', { name: 'Keep Browsing' })).toHaveAttribute('href', `${homePath}products/`);
      await expect(final.locator('.home-contact-note a[href^="https://wa.me/"]')).toHaveAttribute('href', /^https:\/\/wa\.me\/8618632026595(?:\?|$)/);
      await expect(final.locator('.home-contact-note a[href^="mailto:"]')).toHaveAttribute('href', /^mailto:sales@haibucrafts\.com(?:\?|$)/);

      for (const { container, source, context, title } of [
        { container: '.document-evidence', source: 'homepage-documents', context: 'supplier', title: 'Product documentation' },
        { container: '.home-final', source: 'homepage-shortlist', context: 'category', title: 'Tailored product selection' }
      ]) {
        const link = page.locator(`${container} a[href*="source=${source}"]`);
        await expect(link).toHaveCount(1);
        if (source === 'homepage-shortlist') await expect(link).toHaveAccessibleName(/Request a Shortlist/);
        await link.click();
        await expect(page).toHaveURL((url) => url.pathname === quotePath
          && url.searchParams.get('source') === source
          && url.searchParams.get('landing_page') === homePath
          && url.searchParams.get('entry_context') === context
          && url.searchParams.get('entry_title') === title);
        await expect(page.locator('textarea[name="message"]')).toBeVisible();
        await expect(page.locator('input[name="entry_context"]')).toHaveValue(context);
        await expect(page.locator('input[name="entry_title"]')).toHaveValue(title);
        await noOverflow(page);
        await page.goBack();
        await expect(page).toHaveURL((url) => url.pathname === homePath && !url.search);
        await expect(link).toBeVisible();
        await expect(steps.locator('li')).toHaveCount(3);
        await noOverflow(page);
      }
    }
  }
  expect(errors).toEqual([]);
  expect(submissions).toEqual([]);
});
