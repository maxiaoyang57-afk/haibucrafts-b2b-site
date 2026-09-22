import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const pagePaths = ['index.html', 'v2-preview/index.html'];
const assetPaths = [
  'assets/video/haibu-warehouse-ready-stock-desktop.mp4',
  'assets/video/haibu-warehouse-ready-stock-mobile.mp4',
  'assets/video/haibu-warehouse-ready-stock-poster.webp'
];

test('warehouse video section is synchronized across source and production pages', async () => {
  for (const pagePath of pagePaths) {
    const html = await readFile(pagePath, 'utf8');
    assert.match(html, /class="section warehouse-video-section"/);
    assert.match(html, /preload="metadata"/);
    assert.match(html, /haibu-warehouse-ready-stock-mobile\.mp4/);
    assert.match(html, /haibu-warehouse-ready-stock-desktop\.mp4/);
    assert.match(html, /source=homepage-warehouse-video/);
    if (pagePath.startsWith('v2-preview/')) {
      assert.match(html, /href="\/v2-preview\/products\/"/);
      assert.match(html, /href="\/v2-preview\/quote\//);
    } else {
      assert.match(html, /href="\/products\/"/);
      assert.match(html, /href="\/request-quote\//);
    }
  }
});

test('warehouse video assets exist and stay within repository-safe sizes', async () => {
  for (const assetPath of assetPaths) {
    await access(assetPath);
    const asset = await stat(assetPath);
    assert.ok(asset.size > 0, `${assetPath} must not be empty`);
    assert.ok(asset.size < 25 * 1024 * 1024, `${assetPath} should remain below 25 MB`);
  }
});
