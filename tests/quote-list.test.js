import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { prepareQuoteItems } from '../lib/quote-items.js';
import handler from '../api/inquiry.js';
import catalog from '../assets/v2/product-catalog.json' with { type: 'json' };

test('quote list resolves product identity from the server catalog, not submitted titles or images', () => {
  const [item] = prepareQuoteItems([{ sku: 'SLM680', quantity: '5,000 pieces', title: 'Fake', image: 'https://evil.example/image' }]);
  const product = catalog.products.find(product => product.sku === 'SLM680');
  assert.equal(item.title, product.title);
  assert.equal(item.image, `https://www.haibucrafts.com${product.image}`);
  assert.equal(item.url, `https://www.haibucrafts.com${product.productionPath}`);
  assert.equal(item.quantity, '5,000 pieces');
});

test('quote list bounds and unknown / duplicate items are rejected rather than silently dropped', () => {
  assert.deepEqual(prepareQuoteItems(undefined), []);
  assert.throws(() => prepareQuoteItems({}), /20/);
  assert.throws(() => prepareQuoteItems([{ sku: 'UNKNOWN' }]), /unknown/);
  assert.throws(() => prepareQuoteItems([{ sku: 'SLM680' }, { sku: 'SLM680' }]), /duplicate/);
  assert.throws(() => prepareQuoteItems(catalog.products.slice(0, 21)), /20/);
  assert.throws(() => prepareQuoteItems([{ sku: 'SLM680', quantity: 12 }]), /80/);
  assert.throws(() => prepareQuoteItems([{ sku: 'SLM680', quantity: '1'.repeat(81) }]), /80/);
  assert.equal(prepareQuoteItems(catalog.products.slice(0, 20)).length, 20);
});

test('primary and backup inquiry emails include the same full list, quantities and canonical images', async () => {
  const oldFetch = global.fetch;
  const keys = ['RESEND_API_KEY', 'INQUIRY_TO_EMAIL', 'INQUIRY_BCC_EMAIL'];
  const previous = keys.map(key => process.env[key]);
  const sent = [];
  process.env.RESEND_API_KEY = 'mock-only';
  process.env.INQUIRY_TO_EMAIL = 'primary@example.com';
  process.env.INQUIRY_BCC_EMAIL = 'backup@example.com';
  global.fetch = async (_url, options) => { sent.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ id: 'mock' }) }; };
  const res = { statusCode: 0, setHeader() {}, end(body) { this.body = JSON.parse(body); } };
  try {
    await handler({ method: 'POST', headers: { origin: 'https://www.haibucrafts.com' }, body: {
      fields: { name: 'QA', email: 'qa@example.com', country: 'US' },
      quoteItems: [{ sku: 'SLM680', quantity: '<script>500 packs</script>' }, { sku: 'YX043', quantity: '200 kg' }]
    } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.backupAccepted, true);
    assert.equal(sent.length, 2);
    assert.equal(sent[0].html, sent[1].html);
    assert.match(sent[0].text, /SLM680.*Space Candy/);
    assert.match(sent[0].text, /YX043.*Colorful Candy/);
    assert.match(sent[0].html, /200 kg/);
    assert.match(sent[0].html, /&lt;script&gt;/);
    assert.doesNotMatch(sent[0].html, /<script>/);
    assert.match(sent[0].html, /https:\/\/www.haibucrafts.com\/assets\/images\/products\//);
    assert.deepEqual(sent[0].attachments, []);
  } finally {
    global.fetch = oldFetch;
    keys.forEach((key, index) => { if (previous[index] === undefined) delete process.env[key]; else process.env[key] = previous[index]; });
  }
});

test('invalid list fails validation before attempting mail delivery', async () => {
  const res = { setHeader() {}, end(body) { this.body = JSON.parse(body); } };
  await handler({ method: 'POST', headers: {}, body: {
    fields: { name: 'QA', email: 'qa@example.com', country: 'US' }, quoteItems: [{ sku: 'unknown' }]
  } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.ok, false);
});

const source = readFileSync(new URL('../v2-preview/assets/quote-list.js', import.meta.url), 'utf8');
async function client(initial = [], { brokenStorage = false, brokenCatalog = false } = {}) {
  let saved = JSON.stringify(initial);
  let writesBlocked = brokenStorage;
  const storage = {
    getItem: () => saved,
    setItem(key, value) { if (writesBlocked) throw new Error('blocked'); if (key === 'haibu_quote_list_v1') saved = value; },
    removeItem() {}
  };
  const node = () => ({ dataset: {}, append() {}, appendChild() {}, setAttribute() {}, insertAdjacentElement() {} });
  const window = { localStorage: storage, sessionStorage: storage, addEventListener() {} };
  vm.runInNewContext(source, {
    window, URL, URLSearchParams, Map, Set,
    location: { search: '', pathname: '/' },
    document: { querySelector: () => null, querySelectorAll: () => [], createElement: node, head: node() },
    fetch: async () => ({ ok: !brokenCatalog, json: async () => catalog })
  });
  await window.HAIBU_QUOTE_LIST.ready;
  return { api: window.HAIBU_QUOTE_LIST, read: () => JSON.parse(saved), write: value => { saved = JSON.stringify(value); }, blockWrites: () => { writesBlocked = true; } };
}

test('stored list sanitizes corruption, unknown items, duplicate SKUs and overlong quantities', async () => {
  const instance = await client([{ sku: 'SLM680', quantity: '1'.repeat(90) }, { sku: 'SLM680' }, { sku: 'bad' }, null]);
  assert.equal(instance.api.getItems().length, 1);
  assert.equal(instance.api.getItems()[0].quantity.length, 80);
  instance.write({ invalid: true });
  assert.equal(instance.api.getItems().length, 0);
});

test('accepted list removes only the submitted snapshot, preserving another tab edits and additions', async () => {
  const instance = await client([{ sku: 'SLM680', quantity: '10 packs' }, { sku: 'YX043', quantity: '' }]);
  const sent = instance.api.getItems();
  instance.write([{ sku: 'SLM680', quantity: '20 packs' }, { sku: 'YX043', quantity: '' }, { sku: 'YX048', quantity: '30 kg' }]);
  instance.api.complete(sent);
  assert.deepEqual(instance.read(), [{ sku: 'SLM680', quantity: '20 packs' }, { sku: 'YX048', quantity: '30 kg' }]);
});

test('catalog or storage failures cannot silently send an empty list', async () => {
  for (const options of [{ brokenStorage: true }, { brokenCatalog: true }]) {
    const instance = await client([{ sku: 'SLM680' }], options);
    assert.throws(() => instance.api.getItems(), /unavailable/);
  }
});

test('failed storage writes block a later submission of stale quantities', async () => {
  const instance = await client([{ sku: 'SLM680', quantity: '10 packs' }]);
  const sent = instance.api.getItems();
  instance.blockWrites();
  instance.api.complete(sent);
  assert.throws(() => instance.api.getItems(), /not saved/);
  assert.equal(instance.read().length, 1);
});

test('submission snapshot is separate from the persisted quote list', async () => {
  const instance = await client([{ sku: 'SLM680', quantity: '10 packs' }]);
  const sent = instance.api.getItems();
  sent[0].quantity = 'overwritten';
  assert.equal(instance.api.getItems()[0].quantity, '10 packs');
});
