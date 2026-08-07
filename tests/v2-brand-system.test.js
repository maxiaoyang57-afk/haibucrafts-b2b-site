import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const brandRoot = path.join(root, 'public', 'brand');

const requiredAssets = [
  'haibu-logo-header.png',
  'haibu-logo-mobile.png',
  'haibu-logo-footer.png',
  'haibu-logo-black.png',
  'favicon.ico',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'haibu-og.png'
];

test('final brand kit contains every required non-empty asset', async () => {
  for (const asset of requiredAssets) {
    const info = await stat(path.join(brandRoot, asset));
    assert.ok(info.isFile(), `${asset} must be a file`);
    assert.ok(info.size > 500, `${asset} must not be an empty placeholder`);
  }
});

test('shared components use responsive header and footer brand assets', async () => {
  const components = await readFile(path.join(root, 'v2-preview', 'assets', 'components.js'), 'utf8');

  assert.match(components, /<picture>/);
  assert.match(components, /\/brand\/haibu-logo-header\.png/);
  assert.match(components, /\/brand\/haibu-logo-mobile\.png/);
  assert.match(components, /\/brand\/haibu-logo-footer\.png/);
  assert.match(components, /Creative craft components supplier/);
  assert.match(components, /ASSET_ROOT/);
  assert.match(components, /brand-v2\.css/);
});

test('release metadata uses the new Open Graph image and build entrypoint', async () => {
  const seoMap = JSON.parse(await readFile(path.join(root, 'v2-preview', 'seo-production-map.json'), 'utf8'));
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const releaseBuilder = await readFile(path.join(root, 'scripts', 'build-v2-release-candidate.mjs'), 'utf8');

  assert.equal(seoMap.site.defaultOgImage, '/brand/haibu-og.png');
  assert.equal(packageJson.scripts.build, 'npm run build:v2-seo && npm run build:v2-release');
  assert.match(releaseBuilder, /\/brand\/favicon\.ico/);
  assert.match(releaseBuilder, /twitter:card/);
  assert.match(releaseBuilder, /public', 'brand'/);
});
