import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();

function makeSessionStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); }
  };
}

async function runSiteRuntime({ referrer, pathname, search = '', hostname = 'www.haibucrafts.com', sessionStorage }) {
  const runtime = await readFile(path.join(root, 'assets', 'v2', 'site-v2.js'), 'utf8');
  const document = {
    referrer,
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {}
  };
  const window = {
    location: {
      pathname,
      search,
      hostname,
      origin: 'https://www.haibucrafts.com'
    },
    matchMedia: () => ({ matches: false }),
    addEventListener: () => {},
    scrollTo: () => {},
    scrollY: 0
  };
  const context = vm.createContext({
    window,
    document,
    sessionStorage,
    URL,
    URLSearchParams,
    Date,
    JSON,
    console
  });
  vm.runInContext(runtime, context);
  return { window, document };
}

test('v2 runtime preserves Google as the first external source across internal navigation', async () => {
  const sessionStorage = makeSessionStorage();
  const first = await runSiteRuntime({
    referrer: 'https://www.google.com/search?q=polymer+clay+slices+wholesale',
    pathname: '/products/polymer-clay-slices-wholesale/yx3531-crystal-accent-fantasy-candy-slices/',
    sessionStorage
  });

  assert.equal(first.window.HAIBU_ATTRIBUTION.attribution_channel, 'Organic Search');
  assert.equal(first.window.HAIBU_ATTRIBUTION.attribution_source, 'google');
  assert.equal(first.window.HAIBU_ATTRIBUTION.attribution_medium, 'organic');
  assert.equal(
    first.window.HAIBU_ATTRIBUTION.first_landing_page,
    '/products/polymer-clay-slices-wholesale/yx3531-crystal-accent-fantasy-candy-slices/'
  );
  assert.match(first.window.HAIBU_ATTRIBUTION.first_referrer, /google\.com/);

  const second = await runSiteRuntime({
    referrer: 'https://www.haibucrafts.com/products/polymer-clay-slices-wholesale/yx3531-crystal-accent-fantasy-candy-slices/',
    pathname: '/request-quote/',
    search: '?source=product-detail&product_code=YX3531',
    sessionStorage
  });

  assert.equal(second.window.HAIBU_ATTRIBUTION.attribution_source, 'google');
  assert.equal(second.window.HAIBU_ATTRIBUTION.attribution_channel, 'Organic Search');
  assert.equal(second.window.HAIBU_ATTRIBUTION.first_landing_page, first.window.HAIBU_ATTRIBUTION.first_landing_page);
  assert.equal(second.window.HAIBU_ATTRIBUTION.first_referrer, first.window.HAIBU_ATTRIBUTION.first_referrer);
});

test('v2 runtime identifies ChatGPT as an AI referral', async () => {
  const sessionStorage = makeSessionStorage();
  const page = await runSiteRuntime({
    referrer: 'https://chatgpt.com/',
    pathname: '/products/slime-charms-wholesale/slm10014-halloween-slime-charm-mix/',
    sessionStorage
  });
  assert.equal(page.window.HAIBU_ATTRIBUTION.attribution_source, 'chatgpt');
  assert.equal(page.window.HAIBU_ATTRIBUTION.attribution_channel, 'AI Referral');
  assert.equal(page.window.HAIBU_ATTRIBUTION.attribution_medium, 'referral');
});

test('quote runtime keeps acquisition source separate from the on-site inquiry context', async () => {
  const runtime = await readFile(path.join(root, 'assets', 'v2', 'quote-preview.js'), 'utf8');

  class HTMLInputElement {}
  const fields = new Map();
  const ids = new Map();
  const addField = (name, id = '', initial = '') => {
    const field = { name, id, type: 'hidden', value: initial, defaultValue: initial };
    fields.set(name, field);
    if (id) ids.set(id, field);
    return field;
  };

  addField('attribution_source', 'sourceField');
  addField('first_landing_page', 'landingField');
  addField('article', 'articleField');
  addField('product_image', 'imageField');
  addField('first_referrer', 'referrerField');
  addField('inquiry_page', 'inquiryPageField');
  addField('sku', 'productField');
  addField('product', 'productNameField');
  addField('target_delivery_date', 'targetDeliveryDateField');

  const form = {
    dataset: {},
    elements: { namedItem: (name) => fields.get(name) || null },
    appendChild(field) {
      fields.set(field.name, field);
      if (field.id) ids.set(field.id, field);
      return field;
    },
    querySelector: () => null,
    addEventListener: () => {},
    reportValidity: () => true,
    setAttribute: () => {},
    removeAttribute: () => {}
  };

  const document = {
    referrer: 'https://www.haibucrafts.com/products/polymer-clay-slices-wholesale/yx3531-crystal-accent-fantasy-candy-slices/',
    querySelector: (selector) => selector === '[data-quote-form]' ? form : null,
    getElementById: (id) => ids.get(id) || null,
    createElement: () => ({ type: '', name: '', id: '', value: '', defaultValue: '' })
  };

  const listeners = new Map();
  const timeouts = [];
  const window = {
    HAIBU_QUOTE_CONFIG: {},
    HAIBU_ATTRIBUTION: {
      attribution_channel: 'Organic Search',
      attribution_source: 'google',
      attribution_medium: 'organic',
      attribution_campaign: '',
      attribution_content: '',
      attribution_term: '',
      first_landing_page: '/products/polymer-clay-slices-wholesale/yx3531-crystal-accent-fantasy-candy-slices/',
      first_referrer: 'https://www.google.com/search?q=polymer+clay+slices+wholesale',
      first_visit_at: '2026-09-21T07:00:00.000Z'
    },
    location: {
      pathname: '/request-quote/',
      search: '?source=product-detail&category=polymer-clay-slices&product_code=YX3531&product=Crystal%20Accent%20Fantasy%20Candy%20Slices&landing_page=%2Fproducts%2Fpolymer-clay-slices-wholesale%2Fyx3531-crystal-accent-fantasy-candy-slices%2F'
    },
    addEventListener: (name, handler) => listeners.set(name, handler),
    setTimeout: (handler, delay) => timeouts.push({ handler, delay })
  };

  vm.runInNewContext(runtime, {
    window,
    document,
    URLSearchParams,
    Date,
    JSON,
    HTMLInputElement,
    FormData: class {},
    fetch: async () => ({}),
    btoa: () => '',
    Uint8Array
  });

  assert.equal(fields.get('attribution_source').value, 'google');
  assert.equal(fields.get('attribution_channel').value, 'Organic Search');
  assert.equal(fields.get('attribution_medium').value, 'organic');
  assert.equal(fields.get('lead_context').value, 'product-detail');
  assert.equal(
    fields.get('first_landing_page').value,
    '/products/polymer-clay-slices-wholesale/yx3531-crystal-accent-fantasy-candy-slices/'
  );
  assert.match(fields.get('first_referrer').value, /google\.com/);
  assert.equal(
    fields.get('source_page').value,
    '/products/polymer-clay-slices-wholesale/yx3531-crystal-accent-fantasy-candy-slices/'
  );
  assert.equal(
    fields.get('product_page').value,
    '/products/polymer-clay-slices-wholesale/yx3531-crystal-accent-fantasy-candy-slices/'
  );
  assert.equal(fields.get('sku').value, 'YX3531');
  assert.equal(fields.get('product').value, 'Crystal Accent Fantasy Candy Slices');
  assert.equal(fields.get('inquiry_page').value, '/request-quote/');
  assert.equal(form.dataset.attributionReady, 'true');
  assert.equal(timeouts[0].delay, 250);
});
