import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync('v2-preview/assets/product-catalog.json', 'utf8'));
const product = catalog.products.find((item) => item.sku === 'SLM26529');
const intents = [
  {
    source: 'homepage-samples', container: '.hero', title: 'Ask about samples',
    prompt: 'Tell us which product codes or styles you would like to try, what you want to check, and the destination country. Sample availability, fees and shipping are confirmed for your request.',
    placeholder: 'Which products would you like to sample? Share product codes or styles, what you want to check, and your destination if known.'
  },
  {
    source: 'homepage-shortlist', container: '.home-final', title: 'Request a tailored shortlist',
    prompt: 'Share your category, theme or intended use so we can narrow the options to a short product selection. Colors, reference photos and an approximate quantity are helpful if you have them.',
    placeholder: 'What do you make or sell? Tell us your category, theme, intended use and any preferred styles for a short product selection.'
  },
  {
    source: 'homepage-documents', container: '.document-evidence', title: 'Ask about product documentation',
    prompt: 'Share the product code, intended use and sales market. We will check document availability for that item; reports apply only to their listed samples and scope.',
    placeholder: 'Which product code, intended use and sales market do you need documents for? Mention any standard or report you need to review.'
  }
];

const noOverflow = async (page) => expect(await page.evaluate(() =>
  document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

async function expectIntent(form, intent) {
  const banner = form.locator('[data-inquiry-intent]');
  await expect(banner).toBeVisible();
  await expect(form.locator(':scope > :first-child')).toHaveAttribute('data-inquiry-intent', '');
  await expect(banner.locator('strong')).toHaveText(intent.title);
  await expect(banner.locator('p')).toHaveText(intent.prompt);
  await expect(form.locator('[name="message"]')).toHaveAttribute('placeholder', intent.placeholder);
  await expect(form.locator('[name="message"]')).toHaveAttribute('aria-describedby', /\binquiry-intent-prompt\b/);
}

async function toggleReplyMethods(form, message) {
  for (const method of ['WhatsApp', 'Email']) {
    const button = form.getByRole('button', { name: method, exact: true });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(form.locator('[name="message"]')).toHaveValue(message);
  }
}

async function visitPolicyAndBack(page, form, privacyPath) {
  const before = page.url();
  const privacy = form.locator('.quote-submit .quote-privacy').getByRole('link', { name: 'Privacy Policy', exact: true });
  await expect(privacy).toHaveAttribute('href', privacyPath);
  await privacy.click();
  await expect(page).toHaveURL((url) => url.pathname === privacyPath);
  await expect(page.locator('h1')).toHaveText('Privacy Policy');
  await page.goBack();
  await expect(page).toHaveURL(before);
  await expect(form).toBeVisible();
  // Quote attribution retries at 250 ms. Check restored values after that retry,
  // not just before a delayed regression could overwrite them.
  await page.waitForTimeout(300);
}

test('homepage inquiry intent, privacy Back and existing product prefills stay safe on mobile and desktop', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone-390', 'One bounded run across 360 and 1180 px');
  const errors = [];
  const sends = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/inquiry' || !['GET', 'HEAD'].includes(request.method())) {
      sends.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    // This QA may read only the local site, never send analytics or open a
    // third-party messaging destination. No submit/direct-contact CTA is used.
    if (url.origin !== 'http://127.0.0.1:4173') return route.abort();
    return route.continue();
  });

  for (const width of [360, 1180]) {
    await page.setViewportSize({ width, height: 844 });
    const quotePath = '/request-quote/';
    const privacyPath = '/privacy/';
    for (const intent of intents) {
      await page.goto('/');
      const decline = page.locator('[data-analytics-decline]');
      if (await decline.isVisible()) await decline.click();
      await page.locator(`${intent.container} a[href*="source=${intent.source}"]`).click();
      await expect(page).toHaveURL((url) => url.pathname === quotePath && url.searchParams.get('source') === intent.source);
      const form = page.locator('[data-quote-form]');
      await expectIntent(form, intent);
      await expect(form.locator('[name="message"]')).toHaveValue('');
      await noOverflow(page);
      if (intent.source === 'homepage-documents') {
        await form.locator('[data-inquiry-intent]').scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath(`inquiry-intent-${width}.png`) });
      }
      const message = `QA only: ${intent.title}; keep my wording at ${width}px.`;
      await form.locator('[name="message"]').fill(message);
      await form.locator('[name="product"]').fill('My chosen styles');
      await form.locator('[name="sku"]').fill('SLM26529, YX043');
      await form.locator('[name="packaging"]').fill('Retail pouches, details to discuss');
      await toggleReplyMethods(form, message);
      await expectIntent(form, intent);
      await visitPolicyAndBack(page, form, privacyPath);
      await expectIntent(form, intent);
      await expect(form.locator('[name="message"]')).toHaveValue(message);
      await expect(form.locator('[name="product"]')).toHaveValue('My chosen styles');
      await expect(form.locator('[name="sku"]')).toHaveValue('SLM26529, YX043');
      await expect(form.locator('[name="packaging"]')).toHaveValue('Retail pouches, details to discuss');
      await noOverflow(page);
    }

    // Use an existing catalog product's real packing CTA, not a synthetic URL.
    await page.goto(product.productionPath);
    await page.locator('[data-purchasing-sku="SLM26529"]').getByRole('link', { name: 'Ask about 20 g/bag', exact: true }).click();
    const form = page.locator('[data-quote-form]');
    await expect(form.locator('[data-inquiry-intent]')).toHaveCount(0);
    await expect(form.locator('[name="sku"]')).toHaveValue(product.sku);
    await expect(form.locator('[name="product"]')).toHaveValue(product.title);
    await expect(form.locator('[name="category"]')).toHaveValue(product.category);
    await expect(form.locator('[name="product_image"]')).toHaveValue(product.image);
    await expect(form.locator('[name="packaging"]')).toHaveValue('20 g/bag');
    await expect(form.locator('[name="message"]')).toHaveValue('');
    await form.locator('[name="message"]').fill('QA only: keep my packing question.');
    await form.locator('[name="sku"]').fill('SLM26529, YX043');
    await form.locator('[name="product"]').fill('My mixed assortment');
    await form.locator('[name="packaging"]').fill('');
    await toggleReplyMethods(form, 'QA only: keep my packing question.');
    await visitPolicyAndBack(page, form, privacyPath);
    await expect(form.locator('[name="sku"]')).toHaveValue('SLM26529, YX043');
    await expect(form.locator('[name="product"]')).toHaveValue('My mixed assortment');
    await expect(form.locator('[name="packaging"]')).toHaveValue('');
    await expect(form.locator('[name="message"]')).toHaveValue('QA only: keep my packing question.');
    await noOverflow(page);
  }

  const untrusted = '<img id="untrusted-inquiry" src="/bad-image" onerror="window.__inquiryInjected=true">';
  for (const source of ['__proto__', untrusted, 'homepage-documents']) {
    await page.goto(`/request-quote/?${new URLSearchParams({ source, entry_context: 'supplier', entry_title: untrusted })}`);
    const form = page.locator('[data-quote-form]');
    if (source === 'homepage-documents') await expectIntent(form, intents[2]);
    else await expect(form.locator('[data-inquiry-intent]')).toHaveCount(0);
    await expect(form.locator('[name="message"]')).toHaveValue('');
    await expect(page.locator('#untrusted-inquiry')).toHaveCount(0);
    expect(await page.evaluate(() => Boolean(window.__inquiryInjected))).toBe(false);
  }
  expect(sends).toEqual([]);
  expect(errors).toEqual([]);
});
