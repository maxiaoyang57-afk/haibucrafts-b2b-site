import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();

test('quote runtime preserves collection and product attribution after page load', async () => {
  const runtime = await readFile(path.join(root, 'assets', 'v2', 'quote-preview.js'), 'utf8');
  const fieldNames = [
    'attribution_source', 'first_landing_page', 'source_page', 'product_page', 'collection',
    'article', 'sku', 'product', 'product_image', 'first_referrer', 'inquiry_page',
    'target_delivery_date'
  ];
  const fields = new Map(fieldNames.map((name) => [name, { name, type: 'hidden', value: '', defaultValue: '' }]));
  fields.get('target_delivery_date').type = 'date';
  const ids = new Map([
    ['sourceField', 'attribution_source'],
    ['landingField', 'first_landing_page'],
    ['sourcePageField', 'source_page'],
    ['productPageField', 'product_page'],
    ['collectionField', 'collection'],
    ['articleField', 'article'],
    ['productField', 'sku'],
    ['productNameField', 'product'],
    ['imageField', 'product_image'],
    ['referrerField', 'first_referrer'],
    ['inquiryPageField', 'inquiry_page']
  ]);
  const listeners = new Map();
  const timeouts = [];
  const form = {
    elements: { namedItem: (name) => fields.get(name) || null },
    dataset: {},
    querySelector: () => null,
    addEventListener: () => {},
    setAttribute: () => {},
    removeAttribute: () => {}
  };
  const document = {
    referrer: 'https://www.google.com/',
    querySelector: (selector) => selector === '[data-quote-form]' ? form : null,
    getElementById: (id) => fields.get(ids.get(id)) || null,
    createElement: () => ({})
  };
  const window = {
    HAIBU_QUOTE_CONFIG: {},
    location: {
      search: '?source=christmas-collection&collection=christmas&landing_page=%2Fproducts%2Fslime-charms-wholesale%2Fchristmas-slime-charms%2F&source_page=%2Fproducts%2Fslime-charms-wholesale%2Fchristmas-slime-charms%2F&product_page=%2Fproducts%2Fslime-charms-wholesale%2Fslm26529%2F&product_code=SLM26529&product=Christmas%20QA',
      pathname: '/request-quote/'
    },
    addEventListener: (name, handler) => listeners.set(name, handler),
    setTimeout: (handler, delay) => timeouts.push({ handler, delay })
  };

  vm.runInNewContext(runtime, { URLSearchParams, document, window });

  assert.equal(fields.get('attribution_source').value, 'christmas-collection');
  assert.equal(fields.get('collection').value, 'christmas');
  assert.equal(fields.get('source_page').value, '/products/slime-charms-wholesale/christmas-slime-charms/');
  assert.equal(fields.get('product_page').value, '/products/slime-charms-wholesale/slm26529/');
  assert.equal(fields.get('sku').value, 'SLM26529');
  assert.equal(fields.get('product').value, 'Christmas QA');
  assert.equal(fields.get('attribution_source').defaultValue, 'christmas-collection');
  assert.deepEqual(JSON.parse(form.dataset.attributionPayload), {
    attribution_source: 'christmas-collection',
    first_landing_page: '/products/slime-charms-wholesale/christmas-slime-charms/',
    source_page: '/products/slime-charms-wholesale/christmas-slime-charms/',
    product_page: '/products/slime-charms-wholesale/slm26529/',
    collection: 'christmas',
    article: '',
    product_image: '',
    first_referrer: 'https://www.google.com/',
    inquiry_page: '/request-quote/'
  });

  fields.get('attribution_source').value = '';
  listeners.get('load')();
  assert.equal(fields.get('attribution_source').value, 'christmas-collection');
  fields.get('attribution_source').value = '';
  assert.equal(timeouts[0].delay, 250);
  timeouts[0].handler();
  assert.equal(fields.get('attribution_source').value, 'christmas-collection');
  assert.equal(form.dataset.attributionReady, 'true');
});
