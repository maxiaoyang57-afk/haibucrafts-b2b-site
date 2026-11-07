import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderBuyerCardSpecs } from '../lib/buyer-card-specs.js';

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const selection = JSON.parse(read('scripts/data/buyer-card-selection-20261107.json'));

test('unconfirmed packing cannot inherit requested weights, MOQ or a different SKU', () => {
  const card = renderBuyerCardSpecs({ sku: 'UNKNOWN', material: 'Pending confirmation', packingOptions: ['500 g/bag'], purchasing: { moq: '100 bags', quotePackWeightsGrams: [5, 10] } }, escape);
  assert.match(card, /Confirm pack quantity or net weight by inquiry/);
  assert.match(card, /Confirm dimensions by inquiry/);
  assert.doesNotMatch(card, /500 g|100 bags|10 g/);
  assert.match(renderBuyerCardSpecs({ sku: 'EXACT', sourcePacking: '100 pieces/bag', dimensions: 'Approx. 25 mm' }, escape), /Approx\. 25 mm/);
  assert.match(renderBuyerCardSpecs({ sku: 'A', material: '<img>' }, escape), /&lt;img&gt;/);
});

test('the 20 comparison cards preserve unique catalog identities and explicit material evidence', () => {
  assert.equal(selection.products.length, 20);
  assert.equal(new Set(selection.products.map(p => p.sku)).size, 20);
  const catalog = JSON.parse(read('v2-preview/assets/product-catalog.json'));
  let total = 0;
  for (const category of new Set(selection.products.map(p => p.category))) {
    const html = read(`v2-preview/products/${category}/index.html`);
    const cards = [...html.matchAll(/<article class="product-card-v2"[^>]*>[\s\S]*?<\/article>|<article data-buyer-comparison="[^"]+" class="product-card-v2"[^>]*>[\s\S]*?<\/article>/g)].map(m => m[0]);
    const selected = selection.products.filter(p => p.category === category);
    assert.equal((html.match(/data-buyer-specs=/g) || []).length, selected.length);
    assert.equal((html.match(/data-product-filter="buyer-comparison"/g) || []).length, 1);
    for (const record of selected) {
      const product = catalog.products.find(p => p.sku === record.sku);
      assert.equal(product.category, category);
      const card = cards.find(c => c.includes(`data-buyer-comparison="${record.sku}"`));
      assert.ok(card, record.sku);
      assert.ok(card.includes(product.previewPath), `${record.sku}: detail link`);
      assert.match(card, new RegExp(`product_code=${encodeURIComponent(record.sku)}`));
      const material = card.match(/<dt>Material<\/dt><dd>([^<]+)<\/dd>/)[1];
      const evidence = record.sourceRefs.map(ref => {
        const data = JSON.parse(read(ref));
        const source = Array.isArray(data.products) ? data.products.find(p => p.sku === record.sku) : data.products[record.sku];
        assert.ok(source, `${record.sku}: missing source record`);
        return source.material || data.material;
      }).filter(Boolean);
      assert.ok(evidence.map(escape).includes(material), `${record.sku}: material must have explicit evidence`);
      total++;
    }
  }
  assert.equal(total, 20);
  assert.doesNotMatch(read('v2-preview/products/sequins-glitter-confetti/index.html'), /data-buyer-specs=/);
});
