import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// Run the real enhancement script with an inert form. No mail, navigation,
// storage or network adapters are available in this fixture.
function contactForm(source, { values = {}, items = [] } = {}) {
  const fields = new Map();
  const listeners = new Map();
  const node = () => ({
    dataset: {}, children: [], attributes: {}, value: '',
    appendChild(child) { this.children.push(child); return child; },
    append(...children) { this.children.push(...children); },
    setAttribute(name, value) { this.attributes[name] = value; },
    getAttribute(name) { return this.attributes[name] || null; },
    addEventListener(name, fn) { (this.listeners ||= {})[name] = fn; },
    querySelector() { return null; },
    querySelectorAll() { return this.children.filter(child => child.dataset.replyMethod); },
    closest() { return null; }
  });
  for (const [name, value] of Object.entries({
    product: '', sku: '', category: '', quantity: '', packaging: '', country: '',
    target_delivery_date: '', message: '', inquiry_goal: '', preferred_contact: 'Email',
    phone: '', email: '', name: '', ...values
  })) {
    const field = node(); field.name = name; field.value = value;
    field.setCustomValidity = () => {};
    fields.set(name, field);
  }
  const channelLabel = { before() {}, hidden: false };
  fields.get('preferred_contact').closest = () => channelLabel;
  const panel = node();
  const wa = node(), email = node();
  const pageContacts = ['mailto:sales@haibucrafts.com', 'https://wa.me/8618632026595',
    'https://wa.me/8618632026595'].map(href => Object.assign(node(), { href, protocol: new URL(href).protocol }));
  const rows = items.map(({ sku, quantity }) => ({ dataset: { quoteQuantity: sku }, value: quantity }));
  const form = {
    elements: { namedItem: name => fields.get(name) || null },
    querySelector(selector) {
      return { '[data-inquiry-preferences]': panel, '[data-inquiry-whatsapp]': wa,
        '[data-inquiry-email]': email }[selector] || null;
    },
    querySelectorAll: selector => selector === '[data-quote-quantity]' ? rows : [],
    addEventListener(name, fn) { listeners.set(name, fn); },
    appendChild(field) { fields.set(field.name, field); }
  };
  const location = { search: '', pathname: '/request-quote/', origin: 'https://www.haibucrafts.com', href: 'https://www.haibucrafts.com/request-quote/' };
  const context = {
    location, URL, URLSearchParams, Set, Map,
    document: {
      currentScript: null, readyState: 'complete', body: { dataset: {} },
      querySelector: () => null,
      querySelectorAll: selector => selector === '[data-quote-form]' ? [form] : selector === 'a[href]' ? pageContacts : [],
      createElement: node, addEventListener() {}
    },
    MutationObserver: class { observe() {} },
    setTimeout: fn => fn()
  };
  vm.runInNewContext(source, context, { timeout: 500 });
  return {
    fields, rows, wa, email, pageContacts,
    change(name, value, event = 'input') { fields.get(name).value = value; listeners.get(event)?.(); },
    message(kind = 'whatsapp') {
      const link = kind === 'email' ? email : wa;
      const url = new URL(link.href);
      return url.searchParams.get(kind === 'email' ? 'body' : 'text');
    }
  };
}

for (const root of ['assets/v2', 'v2-preview/assets']) {
  const source = readFileSync(`${root}/inquiry-experience.js`, 'utf8');

  test(`${root} direct messages carry the buyer's entered requirements and paragraphs`, () => {
    const form = contactForm(source, { values: {
      sku: 'RW26051', product: 'Resin charms', quantity: '500 pieces',
      packaging: 'Separate bags', country: 'United States', target_delivery_date: '2026-12-01',
      message: 'Can these colors be mixed?\nPlease quote shipping too.'
    } });
    for (const kind of ['whatsapp', 'email']) {
      const text = form.message(kind);
      for (const value of ['RW26051', 'Resin charms', '500 pieces', 'Separate bags', 'United States', '2026-12-01',
        'Can these colors be mixed?\nPlease quote shipping too.']) assert.ok(text.includes(value), `${kind} includes ${value}`);
    }
  });

  test(`${root} direct drafts update while the buyer edits and clears requirements`, () => {
    const form = contactForm(source, { values: { sku: 'RW26051', quantity: '500 pieces', message: 'Old question' } });
    form.change('quantity', '1000 pieces');
    form.change('message', 'My latest question & colors + samples?');
    for (const kind of ['whatsapp', 'email']) {
      assert.match(form.message(kind), /1000 pieces/);
      assert.match(form.message(kind), /My latest question & colors \+ samples\?/);
      assert.doesNotMatch(form.message(kind), /Old question|500 pieces/);
    }
    form.change('quantity', ''); form.change('message', '');
    assert.doesNotMatch(form.message(), /1000 pieces|My latest question/);
  });

  test(`${root} both direct links refresh delayed prefills at click time`, () => {
    const form = contactForm(source);
    form.fields.get('sku').value = 'YX043';
    form.fields.get('message').value = 'Restored question after Back';
    form.wa.listeners?.click();
    form.email.listeners?.click();
    for (const kind of ['whatsapp', 'email']) {
      assert.match(form.message(kind), /YX043/);
      assert.match(form.message(kind), /Restored question after Back/);
    }
  });

  test(`${root} page-wide contact links preserve edits, cleared fields and restored drafts`, () => {
    const form = contactForm(source, { values: { sku: 'YX3301', quantity: '100 grams', message: 'Shipping quote?' } });
    const bodies = () => form.pageContacts.map(link => {
      const url = new URL(link.href);
      return url.searchParams.get(url.protocol === 'mailto:' ? 'body' : 'text');
    });
    assert.ok(bodies().every(text => text.includes('YX3301') && text.includes('100 grams') && text.includes('Shipping quote?')));
    form.change('quantity', '');
    form.change('message', 'Latest question');
    assert.ok(bodies().every(text => !text.includes('100 grams') && !text.includes('Shipping quote?') && text.includes('Latest question')));
    form.fields.get('message').value = 'Restored draft';
    for (const link of form.pageContacts) link.listeners.click();
    assert.ok(bodies().every(text => text.includes('Restored draft')));
  });

  test(`${root} each selected SKU retains its own latest target quantity`, () => {
    const form = contactForm(source, { values: { sku: 'RW26051, RW26858' }, items: [
      { sku: 'RW26051', quantity: '500 pieces' }, { sku: 'RW26858', quantity: '1000 pieces' }
    ] });
    form.rows[1].value = '750 pieces';
    form.wa.listeners?.click(); form.email.listeners?.click();
    for (const kind of ['whatsapp', 'email']) {
      assert.match(form.message(kind), /RW26051[^\n]*500 pieces/);
      assert.match(form.message(kind), /RW26858[^\n]*750 pieces/);
      assert.doesNotMatch(form.message(kind), /1000 pieces/);
    }
  });

  test(`${root} a full 20-product list keeps the final SKU and quantity`, () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ sku: `TEST${10000 + i}`, quantity: `${i + 1} packs` }));
    const form = contactForm(source, { values: { sku: items.map(item => item.sku).join(', ') }, items });
    for (const kind of ['whatsapp', 'email']) {
      for (const item of items) assert.ok(form.message(kind).includes(`${item.sku}: ${item.quantity}`));
    }
  });

  test(`${root} draft text stays URL-encoded and excludes contact fields`, () => {
    const question = 'Colors & sizes? + samples #1\n<script>plain question</script> ✨';
    const form = contactForm(source, { values: { message: question, email: 'private-buyer@example.com',
      phone: '+1 202 555 0100', name: 'Private contact name' } });
    for (const kind of ['whatsapp', 'email']) {
      const url = new URL(kind === 'email' ? form.email.href : form.wa.href);
      assert.equal(url.protocol, kind === 'email' ? 'mailto:' : 'https:');
      if (kind === 'whatsapp') assert.equal(url.hostname, 'wa.me');
      const text = form.message(kind);
      assert.ok(text.includes(question));
      assert.doesNotMatch(text, /private-buyer|202 555|Private contact name/);
    }
  });
}
