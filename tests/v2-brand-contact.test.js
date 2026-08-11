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

test('approved HAIBU CRAFT brand assets are present and non-empty', async () => {
  for (const asset of requiredBrandAssets) {
    const info = await stat(path.join(brandRoot, asset));
    assert.ok(info.isFile(), `${asset} must be a file`);
    assert.ok(info.size > 500, `${asset} must not be an empty placeholder`);
  }
});

test('shared components use responsive logo assets and centralized WhatsApp configuration', async () => {
  const components = await readFile(path.join(root, 'v2-preview', 'assets', 'components.js'), 'utf8');

  assert.match(components, /<picture>/);
  assert.match(components, /\/brand\/haibu-logo-header\.png/);
  assert.match(components, /\/brand\/haibu-logo-mobile\.png/);
  assert.match(components, /\/brand\/haibu-logo-footer\.png/);
  assert.match(components, /Creative craft components supplier/);
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
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const releaseBuilder = await readFile(path.join(root, 'scripts', 'build-v2-release-candidate.mjs'), 'utf8');
  const trustBuilder = await readFile(path.join(root, 'scripts', 'build-v2-seo-trust.mjs'), 'utf8');

  assert.equal(seoMap.site.defaultOgImage, '/brand/haibu-og.png');
  assert.equal(packageJson.scripts.build, 'npm run build:v2-seo && npm run build:v2-release');
  assert.match(releaseBuilder, /twitter:card/);
  assert.match(releaseBuilder, /og:image:width/);
  assert.match(trustBuilder, /\/brand\/haibu-logo-header\.png/);
});
