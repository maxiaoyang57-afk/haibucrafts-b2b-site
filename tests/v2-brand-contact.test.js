import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const brandRoot = path.join(root, 'brand');

const requiredBrandAssets = [
  'haibu-logo-header.png',
  'haibu-logo-mobile.png',
  'haibu-logo-footer.png',
  'haibu-logo-black.png',
  'haibu-og.png'
];

test('approved HAIBUCRAFT brand assets are present and web-sized', async () => {
  for (const asset of requiredBrandAssets) {
    const info = await stat(path.join(brandRoot, asset));
    assert.ok(info.isFile(), `${asset} must be a file`);
    assert.ok(info.size > 500, `${asset} must not be an empty placeholder`);
  }

  const uiLimits = new Map([
    ['haibu-logo-header.png', { width: 624, height: 214, bytes: 350_000 }],
    ['haibu-logo-mobile.png', { width: 160, height: 160, bytes: 250_000 }],
    ['haibu-logo-footer.png', { width: 810, height: 278, bytes: 450_000 }]
  ]);
  for (const [asset, limit] of uiLimits) {
    const file = await readFile(path.join(brandRoot, asset));
    assert.equal(file.readUInt32BE(16), limit.width, `${asset} width must match its high-DPI export`);
    assert.equal(file.readUInt32BE(20), limit.height, `${asset} height must match its high-DPI export`);
    assert.ok(file.byteLength <= limit.bytes, `${asset} must stay within its UI transfer budget`);
  }
});

test('shared components use responsive logo assets and centralized WhatsApp configuration', async () => {
  const components = await readFile(path.join(root, 'v2-preview', 'assets', 'components.js'), 'utf8');

  assert.match(components, /<picture>/);
  assert.match(components, /\/brand\/haibu-logo-header\.png/);
  assert.match(components, /\/brand\/haibu-logo-mobile\.png/);
  assert.match(components, /\/brand\/haibu-logo-footer\.png/);
  assert.match(components, /Creative craft components supplier/);
  assert.doesNotMatch(components, /HAIBU CRAFT/);
  assert.match(components, /whatsappNumber: '8618632026595'/);
  assert.match(components, /https:\/\/wa\.me\/\$\{CONTACT_CONFIG\.whatsappNumber\}/);
  assert.match(components, /Chat with HAIBUCRAFT on WhatsApp/);
  assert.match(components, /target="_blank" rel="noopener noreferrer"/);
  assert.match(components, /whatsapp-float/);
  assert.match(components, /IntersectionObserver/);
  assert.match(components, /avoid-form/);
  assert.match(components, /landing_page=\$\{landing\}/, 'Request Quote attribution must remain present');
});

test('brand stylesheet protects responsive logo sizing and fixed-control separation', async () => {
  const stylesheet = await readFile(path.join(root, 'v2-preview', 'assets', 'brand-v2.css'), 'utf8');

  assert.match(stylesheet, /height: 52px/);
  assert.match(stylesheet, /@media \(max-width: 1080px\)/);
  assert.match(stylesheet, /width: 40px/);
  assert.match(stylesheet, /min-height: 52px/);
  assert.match(stylesheet, /\.back-top[\s\S]*bottom: calc\(84px/);
});

test('release metadata points to the approved social and organization brand assets', async () => {
  const seoMap = JSON.parse(await readFile(path.join(root, 'v2-preview', 'seo-production-map.json'), 'utf8'));
  const releaseBuilder = await readFile(path.join(root, 'scripts', 'build-v2-release-candidate.mjs'), 'utf8');
  const trustBuilder = await readFile(path.join(root, 'scripts', 'build-v2-seo-trust.mjs'), 'utf8');

  assert.equal(seoMap.site.defaultOgImage, '/brand/haibu-og.png');
  assert.match(releaseBuilder, /twitter:card/);
  assert.match(releaseBuilder, /og:image:width/);
  assert.match(releaseBuilder, /og:image:alt/);
  assert.match(releaseBuilder, /twitter:image:alt/);
  assert.match(trustBuilder, /\/brand\/haibu-logo-header\.png/);
});

test('Privacy explains optional WhatsApp processing without changing preview route metadata', async () => {
  const privacy = await readFile(path.join(root, 'v2-preview', 'privacy', 'index.html'), 'utf8');
  assert.match(privacy, /WhatsApp communications/);
  assert.match(privacy, /phone number or account details, message content and related communication metadata/);
  assert.match(privacy, /processed by WhatsApp and Meta under their own terms and privacy practices/);
  assert.match(privacy, /website inquiry form or email instead/);
  assert.match(privacy, /<meta name="robots" content="noindex,nofollow">/);
  const seoMap = JSON.parse(await readFile(path.join(root, 'v2-preview', 'seo-production-map.json'), 'utf8'));
  const privacyRoute = seoMap.routes.find((route) => route.productionPath === '/privacy/');
  assert.equal(privacyRoute?.previewPath, '/v2-preview/privacy/');
  assert.equal(privacyRoute?.index, true);
});

test('Request Quote keeps the form primary and offers a safe non-sensitive WhatsApp alternative', async () => {
  const components = await readFile(path.join(root, 'v2-preview', 'assets', 'components.js'), 'utf8');
  const quote = await readFile(path.join(root, 'v2-preview', 'quote', 'index.html'), 'utf8');
  assert.match(components, /Prefer WhatsApp\? <a href="\$\{whatsappHref\}"/);
  assert.match(components, />Chat with sales<\/a>/);
  assert.match(components, /target="_blank" rel="noopener noreferrer"/);
  assert.match(quote, />Validate Quote Request<\/button>/);
  assert.doesNotMatch(components, /whatsappHref[^\n]*(?:name|email|phone)=/, 'WhatsApp URL must not include form field values');
});
