import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const measurementId = 'G-HJ0EL0PQWR';

for (const relative of [
  path.join('assets', 'v2', 'components.js'),
  path.join('v2-preview', 'assets', 'components.js')
]) {
  test(`${relative} initializes GA4 with Consent Mode v2`, async () => {
    const source = await readFile(path.join(root, relative), 'utf8');
    assert.match(source, new RegExp(measurementId));
    assert.match(source, /gtag\('consent', 'default'/);
    assert.match(source, /gtag\('consent', 'update'/);
    assert.match(source, /ad_storage: 'denied'/);
    assert.match(source, /ad_user_data: 'denied'/);
    assert.match(source, /ad_personalization: 'denied'/);
    assert.match(source, /analytics_storage: analyticsStorage/);
    assert.match(source, /IS_CANONICAL_ANALYTICS_HOST/);
    assert.match(source, /haibucrafts\\.com/);
    assert.match(source, /!IS_CANONICAL_ANALYTICS_HOST/);
    assert.match(source, /loadGoogleAnalytics\(\);/);
    assert.match(source, /data-sdk="ga4"/);
    assert.match(source, /data-analytics-accept/);
    assert.match(source, /data-analytics-decline/);
    assert.match(source, /Decline analytics cookies/);
    assert.match(source, /allow_google_signals: false/);
    assert.match(source, /allow_ad_personalization_signals: false/);
    assert.match(source, /window\.gtag\('event', name, properties\)/);
  });
}

test('the live inquiry success event is forwarded through the shared analytics adapter', async () => {
  const quote = await readFile(path.join(root, 'assets', 'v2', 'quote-preview.js'), 'utf8');
  assert.match(quote, /HAIBU_TRACK\('inquiry_submitted'/);
  const eventPayload = quote.match(/HAIBU_TRACK\('inquiry_submitted',[\s\S]*?\n\s*}\);/)?.[0] || '';
  assert.ok(eventPayload);
  for (const personalField of ['fields.name', 'fields.email', 'fields.phone', 'fields.message']) {
    assert.ok(!eventPayload.includes(personalField), `${personalField} must not be sent to analytics`);
  }
});

test('the privacy policy discloses Consent Mode v2 and gives visitors a reversible choice', async () => {
  for (const relative of [
    path.join('privacy', 'index.html'),
    path.join('v2-preview', 'privacy', 'index.html')
  ]) {
    const privacy = await readFile(path.join(root, relative), 'utf8');
    assert.match(privacy, /Consent Mode v2/);
    assert.match(privacy, /analytics storage denied by default/);
    assert.match(privacy, /limited cookieless consent and measurement pings/);
    assert.match(privacy, /Advertising storage, ad user data and ad personalization remain denied/);
    assert.match(privacy, /We do not intentionally send names, email addresses, phone numbers/);
    assert.match(privacy, /Cookie choices/);
    assert.match(privacy, /policies\.google\.com\/technologies\/partner-sites/);
  }
});
