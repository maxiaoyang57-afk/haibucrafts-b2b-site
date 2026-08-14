import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const previewRoot = path.join(root, 'v2-preview');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function structuredData(html) {
  return [...html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap((match) => {
      const value = JSON.parse(match[1]);
      return value['@graph'] || [value];
    });
}

test('all visible breadcrumb trails have complete production BreadcrumbList data', async () => {
  const seoMap = JSON.parse(await readFile(path.join(previewRoot, 'seo-production-map.json'), 'utf8'));
  const routes = new Map(seoMap.routes.map((route) => [route.previewPath, route]));
  const htmlFiles = (await walk(previewRoot)).filter((file) => file.endsWith('.html'));
  let checked = 0;

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    if (!html.includes('class="breadcrumbs"')) continue;

    const relative = path.relative(previewRoot, file).replaceAll('\\', '/');
    const previewPath = relative === 'index.html'
      ? '/v2-preview/'
      : `/v2-preview/${relative.replace(/index\.html$/, '')}`;
    const route = routes.get(previewPath);
    assert.ok(route, `${previewPath} must have a production route`);

    const breadcrumbs = structuredData(html).find((entry) => entry['@type'] === 'BreadcrumbList');
    assert.ok(breadcrumbs, `${previewPath} must include BreadcrumbList JSON-LD`);
    assert.ok(breadcrumbs.itemListElement.length >= 2);
    breadcrumbs.itemListElement.forEach((item, index) => {
      assert.equal(item.position, index + 1);
      assert.ok(item.name);
      assert.match(item.item, /^https:\/\/www\.haibucrafts\.com\//);
    });
    assert.equal(
      breadcrumbs.itemListElement.at(-1).item,
      `https://www.haibucrafts.com${route.productionPath}`
    );
    checked += 1;
  }

  const expectedBreadcrumbRoutes = [...routes.keys()]
    .filter((previewPath) => !['/v2-preview/', '/v2-preview/quote/'].includes(previewPath));
  assert.equal(checked, expectedBreadcrumbRoutes.length);
});

test('all source images reserve space and have useful text alternatives', async () => {
  const htmlFiles = (await walk(previewRoot)).filter((file) => file.endsWith('.html'));
  let checked = 0;

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      const image = match[0];
      assert.match(image, /\balt=["'][^"']+["']/i, `${file} image must have non-empty alt text`);
      assert.match(image, /\bwidth=["']?\d+/i, `${file} image must have width`);
      assert.match(image, /\bheight=["']?\d+/i, `${file} image must have height`);
      checked += 1;
    }
  }

  assert.ok(checked > 0, 'expected at least one audited source image');
});

test('shared navigation exposes skip, focus and reduced-motion support', async () => {
  const components = await readFile(path.join(previewRoot, 'assets', 'components.js'), 'utf8');
  const runtime = await readFile(path.join(previewRoot, 'assets', 'site-v2.js'), 'utf8');
  const accessibility = await readFile(path.join(previewRoot, 'assets', 'accessibility.css'), 'utf8');
  const migrationMap = JSON.parse(await readFile(path.join(previewRoot, 'production-config', 'file-migration-map.json'), 'utf8'));

  assert.match(components, /class="skip-link" href="#main-content"/);
  assert.match(components, /aria-controls="primary-navigation"/);
  assert.match(components, /aria-controls="product-category-navigation"/);
  assert.match(runtime, /restoreFocus: true/);
  assert.match(runtime, /prefers-reduced-motion: reduce/);
  assert.match(accessibility, /:focus-visible/);
  assert.match(accessibility, /@media \(prefers-reduced-motion: reduce\)/);
  assert.ok(migrationMap.sharedAssets.some((asset) => asset.source === 'v2-preview/assets/accessibility.css'));
});
