import { expect, test } from '@playwright/test';

test('direct WhatsApp and email drafts preserve current requirements and quote quantities', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone-390', 'Bounded verification at 360 and 1180 px');
  const errors = [], sends = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) {
      sends.push(request.method() + ' ' + url.pathname);
      return route.abort();
    }
    if (url.origin !== 'http://127.0.0.1:4173') return route.abort();
    return route.continue();
  });
  await context.addInitScript(() => {
    localStorage.setItem('haibu_quote_list_v1', JSON.stringify([
      { sku: 'RW26051', quantity: '500 pieces' }, { sku: 'RW26858', quantity: '1000 pieces' }
    ]));
    // Exercise the real click listener without opening a messaging app or draft.
    document.addEventListener('click', event => {
      if (event.target.closest?.('[data-inquiry-direct]')) event.preventDefault();
    });
  });
  const drafts = async () => page.locator('a[href]').evaluateAll(links => links.flatMap(link => {
    const url = new URL(link.href);
    if (url.protocol === 'mailto:' && url.pathname === 'sales@haibucrafts.com') return [url.searchParams.get('body') || ''];
    if (url.hostname === 'wa.me' && url.pathname === '/8618632026595') return [url.searchParams.get('text') || ''];
    return [];
  }));
  for (const width of [360, 1180]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/request-quote/?product_code=SLM26529&product=QA%20sample%20assortment');
    const decline = page.locator('[data-analytics-decline]');
    if (await decline.isVisible()) await decline.click();
    const form = page.locator('[data-quote-form]');
    await expect(page.locator('#selectedProduct')).toHaveText('SLM26529 — QA sample assortment');
    expect((await drafts()).length).toBeGreaterThanOrEqual(7);
    await form.locator('details').evaluateAll(nodes => nodes.forEach(node => { node.open = true; }));
    await form.locator('[name="product"]').fill('QA only: chosen resin assortment');
    await form.locator('[name="sku"]').fill('RW26051');
    await expect(page.locator('#selectedProduct')).toHaveText('RW26051 — QA only: chosen resin assortment');
    await form.locator('[name="quantity"]').fill('500 pieces');
    await form.locator('[name="packaging"]').fill('Separate bags');
    await form.locator('[name="country"]').fill('United States');
    await form.locator('[name="target_delivery_date"]').fill('2026-12-01');
    const message = 'QA only: colors & sizes? + samples #1\nPlease quote shipping too. ✨';
    await form.locator('[name="message"]').fill(message);
    for (const value of ['QA only: chosen resin assortment', 'RW26051', '500 pieces', 'Separate bags',
      'United States', '2026-12-01', message]) {
      await expect.poll(async () => (await drafts()).every(text => text.includes(value))).toBe(true);
    }
    await form.locator('[name="quantity"]').fill('750 pieces');
    await form.locator('[name="message"]').fill('My updated question');
    await expect.poll(async () => (await drafts()).every(text => text.includes('750 pieces')
      && text.includes('My updated question') && !text.includes(message))).toBe(true);
    await form.locator('[name="quantity"]').fill('');
    await form.locator('[name="message"]').fill('');
    await expect.poll(async () => (await drafts()).every(text => !text.includes('750 pieces')
      && !text.includes('My updated question'))).toBe(true);
    await form.locator('[name="product"]').fill('');
    await form.locator('[name="sku"]').fill('');
    await expect(page.locator('#quoteContext')).toBeHidden();
    await form.locator('[name="sku"]').fill('RW26858');
    await expect(page.locator('#selectedProduct')).toHaveText('RW26858');
    await form.locator('[name="product"]').fill('QA only: changed selection');
    await expect(page.locator('#selectedProduct')).toHaveText('RW26858 — QA only: changed selection');
    // Programmatic/history restoration does not necessarily dispatch input/change.
    await form.locator('[name="message"]').evaluate(input => { input.value = 'Restored after Back'; });
    await form.locator('[data-inquiry-whatsapp]').click();
    await form.locator('[data-inquiry-email]').click();
    expect((await drafts()).every(text => text.includes('Restored after Back'))).toBe(true);
    await form.locator('[name="message"]').evaluate(input => { input.value = 'Restored for page-wide contact'; });
    await page.locator('.footer-whatsapp').click();
    await page.locator('.footer-email').click();
    expect((await drafts()).every(text => text.includes('Restored for page-wide contact'))).toBe(true);

    await page.goto('/request-quote/?quote_list=1&source=quote-list');
    await expect(page.locator('#quoteContext')).toBeHidden();
    if (await decline.isVisible()) await decline.click();
    const rows = form.locator('[data-quote-quantity]');
    await expect(rows).toHaveCount(2);
    await form.locator('[data-quote-quantity="RW26858"]').fill('750 pieces');
    await form.locator('[name="message"]').fill('QA only: please review both selected products');
    for (const text of await drafts()) {
      expect(text).toMatch(/RW26051[^\n]*500 pieces/);
      expect(text).toMatch(/RW26858[^\n]*750 pieces/);
    }
    await form.getByRole('button', { name: 'Remove RW26858 from quote list', exact: true }).click();
    await expect(rows).toHaveCount(1);
    await form.locator('[data-inquiry-whatsapp]').click();
    await form.locator('[data-inquiry-email]').click();
    for (const text of await drafts()) {
      expect(text).toMatch(/RW26051[^\n]*500 pieces/);
      expect(text).not.toContain('RW26858');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(sends).toEqual([]);
  expect(errors).toEqual([]);
});
