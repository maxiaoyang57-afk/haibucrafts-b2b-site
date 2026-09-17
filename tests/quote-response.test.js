import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

async function submitFixture(response) {
  let submit;
  let resets = 0;
  const status = { textContent: '' };
  const button = { textContent: '', disabled: false };
  const form = {
    elements: { namedItem: () => null },
    appendChild() {}, setAttribute() {}, removeAttribute() {},
    querySelector: (selector) => selector === 'button[type="submit"]' ? button : null,
    addEventListener: (_event, callback) => { submit = callback; },
    checkValidity: () => true,
    reportValidity: () => true,
    reset: () => { resets += 1; }
  };
  const document = {
    querySelector: (selector) => selector === '[data-quote-form]' ? form : null,
    getElementById: (id) => id === 'formStatus' ? status : null,
    createElement: () => ({}), referrer: ''
  };
  const context = {
    document, URLSearchParams, HTMLInputElement: class {},
    window: { HAIBU_QUOTE_CONFIG: { mode: 'live', endpoint: '/api/inquiry' }, location: { search: '', pathname: '/request-quote/' } },
    FormData: class { entries() { return [['name', 'Test'], ['email', 'test@example.com'], ['country', 'US']]; } get() { return ''; } },
    fetch: async () => response
  };
  vm.runInNewContext(await readFile('assets/v2/quote-preview.js', 'utf8'), context);
  await submit({ preventDefault() {} });
  return { resets, message: status.textContent, disabled: button.disabled };
}

test('a 200 response without explicit inquiry acceptance does not clear buyer input', async () => {
  for (const json of [async () => ({}), async () => { throw new Error('not JSON'); }, async () => ({ ok: false })]) {
    const result = await submitFixture({ ok: true, json });
    assert.equal(result.resets, 0);
    assert.equal(result.message, 'Inquiry could not be sent.');
    assert.equal(result.disabled, false);
  }
});

test('accepted inquiry clears input and shows the server request reference', async () => {
  const result = await submitFixture({ ok: true, json: async () => ({ ok: true, requestId: '12345678-abcd' }) });
  assert.equal(result.resets, 1);
  assert.match(result.message, /sent successfully.*Reference: 12345678/);
  assert.equal(result.disabled, false);
});
