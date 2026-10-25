// Release expectations come from the owner-source manifest, not generated HTML.
// Historical SKU tests keep checking identity while new batches expand the catalog.
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const taskRoot = new URL('../docs/tasks/', import.meta.url);
const releases = readdirSync(taskRoot).filter(name => name.endsWith('-manifest.json'))
  .map(name => JSON.parse(readFileSync(new URL(name, taskRoot), 'utf8')))
  .filter(item => /^haibu-products-\d{8}/.test(item.batchId || '') && Array.isArray(item.previousProducts))
  .sort((a, b) => a.batchId.localeCompare(b.batchId));
const release = releases.at(-1);
assert.ok(release, 'A source release manifest is required');
const sourceName = release.batchId.replace('haibu-products-', 'product-plan-') + '.json';
const plan = JSON.parse(readFileSync(new URL('../scripts/data/' + sourceName, import.meta.url), 'utf8'));
const expected = new Map(release.previousProducts.map(product => [product.sku, product.category]));
for (const product of plan.filter(product => product.haibu)) expected.set(product.sku, product.haibuCategory);
export const EXPECTED_TOTAL = expected.size;
export const EXPECTED_RESIN = [...expected.values()].filter(category => category === 'resin-charms').length;
export const EXPECTED_POLYMER = [...expected.values()].filter(category => category === 'polymer-clay-slices').length;
export const EXPECTED_SLIME = [...expected.values()].filter(category => category === 'slime-charms').length;
assert.equal(EXPECTED_TOTAL, release.catalogCountAfter, 'Manifest count must agree with source SKU identities');
