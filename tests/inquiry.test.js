import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/inquiry.js';

function responseHarness() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(value = '') { this.body = value; }
  };
}

function request(overrides = {}) {
  return {
    method: 'POST',
    headers: { origin: 'https://www.haibucrafts.com' },
    body: {
      fields: {
        name: 'Test Buyer',
        email: 'buyer@example.com',
        country: 'United States',
        product: 'Space Candy Adventure Charms',
        sku: 'SLM712',
        message: 'Please quote 500 packs.'
      },
      attachments: []
    },
    ...overrides
  };
}

test('rejects non-POST requests', async () => {
  const res = responseHarness();
  await handler(request({ method: 'GET' }), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'POST');
});

test('validates required contact fields', async () => {
  const res = responseHarness();
  await handler(request({ body: { fields: { email: 'not-an-email' } } }), res);
  assert.equal(res.statusCode, 400);
});

test('requires server-side Resend configuration', async () => {
  const previousKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  const res = responseHarness();
  await handler(request(), res);
  assert.equal(res.statusCode, 503);
  if (previousKey) process.env.RESEND_API_KEY = previousKey;
});

test('sends validated fields and compressed attachments through Resend', async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = 're_test_key';
  let submitted;
  let submittedHeaders;
  globalThis.fetch = async (_url, options) => {
    submitted = JSON.parse(options.body);
    submittedHeaders = options.headers;
    return { ok: true, status: 200, json: async () => ({ id: 'email_test_123' }) };
  };
  try {
    const res = responseHarness();
    const req = request();
    req.body.attachments = [{
      filename: 'reference.jpg',
      contentType: 'image/jpeg',
      content: Buffer.from('small image').toString('base64')
    }];
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).id, 'email_test_123');
    assert.equal(submitted.to[0], 'sale008@sola-craft.com');
    assert.equal(submitted.reply_to, 'buyer@example.com');
    assert.equal(submitted.attachments.length, 1);
    assert.match(submitted.subject, /SLM712/);
    assert.match(submittedHeaders['Idempotency-Key'], /^inquiry-/);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey) process.env.RESEND_API_KEY = previousKey;
    else delete process.env.RESEND_API_KEY;
  }
});
