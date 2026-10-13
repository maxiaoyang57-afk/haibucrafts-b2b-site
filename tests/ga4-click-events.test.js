import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const runtime = readFileSync(new URL('../v2-preview/assets/components.js', import.meta.url), 'utf8');
const catalog = JSON.parse(readFileSync(new URL('../v2-preview/assets/product-catalog.json', import.meta.url), 'utf8'));

// Execute the complete browser runtime against a small DOM fixture, including
// event bubbling from descendants, rather than testing a copied helper function.
class Element {
  constructor(tagName, attributes = {}, parent = null) {
    this.tagName = tagName;
    this.attributes = attributes;
    this.dataset = {};
    this.children = [];
    this.listeners = new Map();
    this.parentElement = parent;
    this.innerHTML = '';
  }
  getAttribute(name) { return this.attributes[name] ?? null; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  addEventListener(name, handler) {
    this.listeners.set(name, [...(this.listeners.get(name) || []), handler]);
  }
  matches(selector) {
    if (selector.includes(',')) return selector.split(',').some(part => this.matches(part.trim()));
    if (selector === 'a[href]') return this.tagName === 'a' && this.getAttribute('href') !== null;
    if (/^\[[a-z-]+\]$/.test(selector)) return this.getAttribute(selector.slice(1, -1)) !== null;
    return this.tagName === selector;
  }
  closest(selector) {
    return this.matches(selector) ? this : this.parentElement?.closest(selector) || null;
  }
  querySelector(selector) {
    if (/^\[data-analytics-(accept|decline)\]$/.test(selector) && this.innerHTML.includes(selector.slice(1, -1))) {
      const existing = this.children.find(child => child.matches(selector));
      return existing || this.appendChild(new Element('button', { [selector.slice(1, -1)]: '' }));
    }
    for (const child of this.children) {
      if (child.matches(selector)) return child;
      const result = child.querySelector(selector);
      if (result) return result;
    }
    return null;
  }
}

function fixture({ hostname = 'www.haibucrafts.com', pathname = '/', consent = null, storageBlocked = false } = {}) {
  const events = [];
  const storage = new Map(consent === null ? [] : [['haibu_ga4_consent_v1', consent]]);
  const body = new Element('body');
  body.dataset.page = 'site-v2-home';
  const head = new Element('head');
  const main = body.appendChild(new Element('main'));
  const document = {
    head, body, title: 'HAIBUCRAFT',
    listeners: new Map(),
    createElement: (tag) => new Element(tag),
    querySelector: (selector) => body.querySelector(selector),
    querySelectorAll: () => [],
    addEventListener(name, handler) {
      this.listeners.set(name, [...(this.listeners.get(name) || []), handler]);
    }
  };
  const window = {
    location: new URL(`https://${hostname}${pathname}?visitor=private@example.com#private-fragment`),
    va: (...args) => events.push(args),
    localStorage: {
      getItem(key) { if (storageBlocked) throw new Error('Storage unavailable'); return storage.get(key) ?? null; },
      setItem(key, value) { if (storageBlocked) throw new Error('Storage unavailable'); storage.set(key, value); }
    }
  };
  vm.runInNewContext(runtime, { document, window, URL });
  return {
    window, document, head, body, main, events,
    create(tag, attributes = {}, parent = main) { return parent.appendChild(new Element(tag, attributes)); },
    click(target) {
      for (const handler of document.listeners.get('click') || []) handler({ target });
    },
    consent(value) {
      const button = body.querySelector(`[data-analytics-${value === 'granted' ? 'accept' : 'decline'}]`);
      for (const handler of button.listeners.get('click') || []) handler();
    },
    records() { return events.map(([, event]) => JSON.parse(JSON.stringify(event))); },
    gaEvents() { return Array.from(window.dataLayer || []).filter(args => args[0] === 'event'); }
  };
}

function onlyRecord(f) {
  assert.equal(f.events.length, 1, 'one click must produce one analytics record');
  assert.equal(f.gaEvents().length, 1, 'one click must produce one GA4 event');
  return f.records()[0];
}

test('nested homepage product click sends one event with safe URL, explicit SKU and closest controlled location', () => {
  const f = fixture();
  const outer = f.create('section', { 'data-analytics-location': 'homepage_categories' });
  const inner = f.create('section', { 'data-analytics-location': 'homepage_featured' }, outer);
  const link = f.create('a', {
    href: '/products/slime-charms-wholesale/slm10130-charm-mix/?email=buyer@example.com#private-note',
    'data-product-code': 'slm10130'
  }, inner);
  const image = f.create('img', {}, link);
  Object.defineProperty(link, 'textContent', { get() { throw new Error('Do not read user-facing text'); } });
  f.click(image);
  assert.deepEqual(onlyRecord(f), {
    name: 'product_link_click',
    data: {
      page: '/',
      destination: 'https://www.haibucrafts.com/products/slime-charms-wholesale/slm10130-charm-mix/',
      target_url: 'https://www.haibucrafts.com/products/slime-charms-wholesale/slm10130-charm-mix/',
      link_location: 'homepage_featured', product_code: 'SLM10130'
    }
  });
  assert.doesNotMatch(JSON.stringify(f.records()), /buyer|visitor|private|@|\?|#/);
});

test('quote clicks extract one valid query SKU without sending any other query or form content', () => {
  for (const [key, sku] of [['product_code', 'YX048'], ['sku', 'RW2304-C'], ['sku', 'RW1672/RW2072/RW3492/RW20104']]) {
    const f = fixture();
    const form = f.create('form');
    Object.defineProperty(form, 'elements', { get() { throw new Error('Do not read form fields'); } });
    const link = f.create('a', {
      href: `/request-quote/?${key}=${encodeURIComponent(sku)}&name=Private+Buyer&email=buyer@example.com&message=private-message#note`
    }, form);
    f.click(link);
    assert.deepEqual(onlyRecord(f).data, {
      page: '/', destination: 'https://www.haibucrafts.com/request-quote/',
      target_url: 'https://www.haibucrafts.com/request-quote/', link_location: 'main', product_code: sku
    });
  }
});

test('every published product code is recovered accurately from its preview and production slug', () => {
  for (const product of catalog.products) {
    for (const path of [product.previewPath, product.productionPath]) {
      const f = fixture();
      f.click(f.create('a', { href: `${path}?tracking=private#image` }));
      const record = onlyRecord(f);
      assert.equal(record.name, 'product_link_click');
      assert.equal(record.data.product_code, product.sku, path);
      assert.equal(record.data.target_url, `https://www.haibucrafts.com${path}`);
    }
  }
});

test('category clicks retain the existing event name without inventing a product SKU', () => {
  const f = fixture();
  f.click(f.create('a', { href: '/products/slime-charms-wholesale/?email=private@example.com#contact' }));
  const event = onlyRecord(f);
  assert.equal(event.name, 'product_link_click');
  assert.equal(event.data.link_location, 'main');
  assert.equal(Object.hasOwn(event.data, 'product_code'), false);
});

test('Browse Products directory CTAs use product_link_click without inventing a SKU', () => {
  for (const path of ['/products/', '/v2-preview/products/']) {
    const f = fixture();
    const section = f.create('section', { 'data-analytics-location': 'homepage_hero' });
    f.click(f.create('a', { href: `${path}?source=homepage&email=private@example.com#browse` }, section));
    assert.deepEqual(onlyRecord(f), {
      name: 'product_link_click',
      data: {
        page: '/', destination: `https://www.haibucrafts.com${path}`,
        target_url: `https://www.haibucrafts.com${path}`, link_location: 'homepage_hero'
      }
    });
  }
});

test('explicit product metadata wins over valid query values while invalid metadata safely falls back', () => {
  for (const [declared, expected] of [['SLM10130', 'SLM10130'], ['buyer@example.com', 'YX720']]) {
    const f = fixture();
    f.click(f.create('a', { href: '/request-quote/?product_code=YX720', 'data-product-code': declared }));
    assert.equal(onlyRecord(f).data.product_code, expected);
  }
});

test('unknown, malformed, long and personal SKU values never enter click analytics', () => {
  for (const sku of ['buyer@example.com', '+8618632026595', 'Private Buyer', 'SLM10130,SLM712', 'SLM10130\nprivate', 'SLM1234567890', 'YX123456', 'UNKNOWN123', 'RW2304-PRIVATE', 'A'.repeat(300)]) {
    const f = fixture();
    f.click(f.create('a', {
      href: `/request-quote/?product_code=${encodeURIComponent(sku)}`,
      'data-product-code': sku
    }));
    const record = onlyRecord(f);
    assert.equal(Object.hasOwn(record.data, 'product_code'), false, sku);
    assert.doesNotMatch(JSON.stringify(record), /buyer@|Private|PRIVATE|8618632026595/);
  }
});

test('ambiguous duplicate SKU query parameters are omitted', () => {
  const f = fixture();
  f.click(f.create('a', { href: '/request-quote/?sku=YX720&sku=SLM10130' }));
  assert.equal(Object.hasOwn(onlyRecord(f).data, 'product_code'), false);
});

test('all declared homepage locations are accepted and unsafe labels use fixed region fallbacks', () => {
  for (const location of ['homepage_hero', 'homepage_categories', 'homepage_featured', 'homepage_buying_paths', 'homepage_supply', 'homepage_evidence', 'homepage_final']) {
    const f = fixture();
    f.click(f.create('a', { href: '/request-quote/', 'data-analytics-location': location }));
    assert.equal(onlyRecord(f).data.link_location, location);
  }
  for (const [tag, attributes, expected] of [
    ['header', {}, 'header'], ['div', { 'data-site-header': '' }, 'header'],
    ['footer', {}, 'footer'], ['div', { 'data-site-footer': '' }, 'footer'],
    ['main', {}, 'main'], ['aside', {}, 'site']
  ]) {
    const f = fixture();
    const region = f.create(tag, attributes, f.body);
    const link = f.create('a', {
      href: '/request-quote/', 'data-analytics-location': 'buyer@example.com'
    }, region);
    f.click(link);
    assert.equal(onlyRecord(f).data.link_location, expected);
  }
});

test('one delegated listener supports text descendants and counts separate intentional clicks once each', () => {
  const f = fixture();
  const link = f.create('a', { href: '/v2-preview/quote/?sku=SLM10130' });
  assert.equal(f.document.listeners.get('click').length, 1);
  f.click({ parentElement: link });
  f.click(link);
  assert.equal(f.events.length, 2);
  assert.equal(f.gaEvents().length, 2);
  assert.ok(f.records().every(event => event.name === 'quote_cta_click'));
});

test('irrelevant, invalid and off-site links cannot masquerade as product or quote events', () => {
  for (const href of [
    '/about/?next=/quote/', '/about/#/products/slm10130/',
    'https://example.com/request-quote/?sku=SLM10130',
    'https://haibucrafts.com.evil.example/products/slm10130/',
    'https://buyer:private@www.haibucrafts.com/request-quote/',
    '/products/buyer@example.com/', '/products/private%40example.com/',
    'javascript:alert("/quote/")', 'data:text/html,/products/slm10130/', 'http://['
  ]) {
    const f = fixture();
    f.click(f.create('a', { href }));
    assert.equal(f.events.length, 0, href);
    assert.equal(f.gaEvents().length, 0, href);
  }
  const f = fixture();
  for (const target of [null, f.main, {}, { parentElement: f.main }]) assert.doesNotThrow(() => f.click(target));
  assert.equal(f.events.length, 0);
});

test('same-page anchors and query-only controls do not become duplicate navigation events', () => {
  for (const pathname of ['/request-quote/', '/products/slime-charms-wholesale/slm10130-charm-mix/']) {
    for (const href of ['', '  ', '#main-content', '#product-images', '?sort=latest']) {
      const f = fixture({ pathname });
      f.click(f.create('a', { href }));
      assert.equal(f.events.length, 0, `${pathname} ${href}`);
      assert.equal(f.gaEvents().length, 0);
    }
  }
});

test('other established link event names remain single-fired with query and fragment removed', () => {
  for (const [href, name, destination] of [
    ['https://wa.me/8618632026595?text=private-message#private', 'whatsapp_click', 'https://wa.me/8618632026595'],
    ['mailto:sales@haibucrafts.com?body=private-message#private', 'email_click', 'mailto:'],
    ['/themes/holiday/?email=private@example.com#private', 'theme_link_click', 'https://www.haibucrafts.com/themes/holiday/']
  ]) {
    const f = fixture();
    f.click(f.create('a', { href }));
    assert.deepEqual(onlyRecord(f), { name, data: { page: '/', destination } });
  }
});

test('existing consent defaults and updates remain unchanged, including denied cookieless events', () => {
  for (const consent of [null, 'denied', 'granted']) {
    const f = fixture({ consent });
    const commands = Array.from(f.window.dataLayer);
    const defaults = commands.find(args => args[0] === 'consent' && args[1] === 'default');
    assert.equal(defaults[2].analytics_storage, 'denied');
    assert.equal(defaults[2].ad_storage, 'denied');
    assert.equal(defaults[2].ad_user_data, 'denied');
    assert.equal(defaults[2].ad_personalization, 'denied');
    const updates = commands.filter(args => args[0] === 'consent' && args[1] === 'update');
    assert.equal(updates.length, consent === 'granted' ? 1 : 0);
    f.click(f.create('a', { href: '/request-quote/?sku=SLM10130' }));
    onlyRecord(f);
  }
  const f = fixture();
  f.consent('granted');
  f.consent('granted');
  assert.equal(f.gaEvents().filter(args => args[1] === 'page_view').length, 1);
  f.consent('denied');
  const lastUpdate = Array.from(f.window.dataLayer).filter(args => args[0] === 'consent').at(-1);
  assert.equal(lastUpdate[2].analytics_storage, 'denied');
});

test('preview and localhost still do not load GA4, and blocked storage cannot break clicks', () => {
  for (const hostname of ['preview.vercel.app', 'localhost', '127.0.0.1', 'www.haibucrafts.com.evil.example']) {
    const f = fixture({ hostname });
    f.click(f.create('a', { href: '/request-quote/?sku=SLM10130' }));
    assert.equal(f.gaEvents().length, 0);
    assert.equal(f.head.children.some(node => node.dataset.sdk === 'ga4'), false);
    assert.equal(f.records().length, 1);
    assert.equal(f.records()[0].data.product_code, 'SLM10130');
  }
  const f = fixture({ storageBlocked: true });
  f.click(f.create('a', { href: '/request-quote/?sku=SLM10130' }));
  onlyRecord(f);
});
