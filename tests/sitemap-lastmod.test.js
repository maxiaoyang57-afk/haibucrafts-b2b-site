import test from 'node:test';
import assert from 'node:assert/strict';
import { updateCategoryLastModified } from '../lib/sitemap-lastmod.js';

function fixture() {
  return {
    map: { routes: [
      { previewPath: '/v2-preview/products/polymer-clay-slices/', productionPath: '/products/polymer-clay-slices-wholesale/', index: true, lastModified: '2026-10-02' },
      { productionPath: '/products/polymer-clay-slices-wholesale/new-sku/', index: true, lastModified: '2026-11-02' },
      { previewPath: '/v2-preview/products/resin-charms/', productionPath: '/products/resin-charms-for-slime/', index: true, lastModified: '2026-10-30' },
      { productionPath: '/products/resin-charms-for-slime/old-sku/', index: true, lastModified: '2026-10-20' },
      { productionPath: '/blog/guide/', index: true, lastModified: '2026-09-01' }
    ] },
    catalog: { generatedAt: '2026-10-22', products: [
      { sku: 'NEW', category: 'polymer-clay-slices', productionPath: '/products/polymer-clay-slices-wholesale/new-sku/' },
      { sku: 'OLD', category: 'resin-charms', productionPath: '/products/resin-charms-for-slime/old-sku/' }
    ], archivedProducts: [{ sku: 'ARCHIVE', category: 'polymer-clay-slices', productionPath: '/archive/' }] }
  };
}

test('a dated public SKU update advances only its catalog hub and survives repeat builds', () => {
  const { map, catalog } = fixture();
  const before = structuredClone(map);
  const changes = updateCategoryLastModified(map, catalog);
  assert.deepEqual(changes, [{ category: 'polymer-clay-slices', productionPath: '/products/polymer-clay-slices-wholesale/', before: '2026-10-02', after: '2026-11-02' }]);
  assert.equal(map.routes[0].lastModified, '2026-11-02');
  assert.deepEqual(map.routes.slice(1), before.routes.slice(1));
  assert.deepEqual(updateCategoryLastModified(map, catalog), []);
});

test('a later editorial hub date is preserved', () => {
  const { map, catalog } = fixture();
  map.routes[0].lastModified = '2026-11-03';
  assert.deepEqual(updateCategoryLastModified(map, catalog), []);
});

test('archived, noindex and absent routes do not advance public hubs', () => {
  const { map, catalog } = fixture();
  map.routes[1].index = false;
  catalog.products.push({ sku: 'MISSING', category: 'polymer-clay-slices', productionPath: '/missing/' });
  map.routes.push({ productionPath: '/archive/', index: false, lastModified: '2099-01-01' });
  const before = structuredClone(map);
  assert.deepEqual(updateCategoryLastModified(map, catalog), []);
  assert.deepEqual(map, before);
});

test('a missing product date uses the recorded catalog date without a build timestamp', () => {
  const { map, catalog } = fixture();
  delete map.routes[1].lastModified;
  updateCategoryLastModified(map, catalog);
  assert.equal(map.routes[0].lastModified, '2026-10-22');
});

test('invalid calendar dates stop generation rather than publishing false freshness', () => {
  const { map, catalog } = fixture();
  map.routes[1].lastModified = '2026-02-30';
  assert.throws(() => updateCategoryLastModified(map, catalog), /Invalid sitemap source date/);
});

