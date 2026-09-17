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
        message: 'Please quote 500 packs.',
        attribution_channel: 'AI Referral',
        attribution_source: 'chatgpt',
        attribution_medium: 'referral',
        first_landing_page: '/products/slime-charms-wholesale.html',
        first_referrer: 'https://chatgpt.com/',
        inquiry_page: '/quote/index.html'
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

test('only HAIBU domains and the current deployment origins pass the origin check', async () => {
  const keys = ['VERCEL_URL', 'VERCEL_BRANCH_URL'];
  const previous = keys.map((key) => process.env[key]);
  process.env.VERCEL_URL = 'haibu-verified-deployment.vercel.app';
  process.env.VERCEL_BRANCH_URL = 'haibu-git-preview.vercel.app';
  try {
    const allowed = ['https://www.haibucrafts.com', 'https://haibucrafts.com',
      'https://haibu-verified-deployment.vercel.app', 'https://haibu-git-preview.vercel.app'];
    const denied = ['https://unrelated-project.vercel.app', 'https://haibu-git-preview.vercel.app.evil.example',
      'http://haibu-git-preview.vercel.app', 'https://haibucrafts.com.evil.example', 'null'];
    for (const origin of [...allowed, ...denied]) {
      const res = responseHarness();
      // Invalid contact fields stop before email delivery for every accepted origin.
      await handler(request({ headers: { origin }, body: { fields: {} } }), res);
      assert.equal(res.statusCode, allowed.includes(origin) ? 400 : 403, origin);
    }
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_BRANCH_URL;
    const res = responseHarness();
    await handler(request({ headers: { origin: 'https://haibu-verified-deployment.vercel.app' }, body: { fields: {} } }), res);
    assert.equal(res.statusCode, 403);
  } finally {
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
  }
});

test('requires server-side Resend configuration', async () => {
  const previousKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  const res = responseHarness();
  await handler(request(), res);
  assert.equal(res.statusCode, 503);
  if (previousKey) process.env.RESEND_API_KEY = previousKey;
});

test('sends the primary inquiry and a direct backup copy through Resend', async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.RESEND_API_KEY;
  const previousBcc = process.env.INQUIRY_BCC_EMAIL;
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.INQUIRY_BCC_EMAIL = 'backup@example.com';
  const submitted = [];
  const submittedHeaders = [];
  globalThis.fetch = async (_url, options) => {
    submitted.push(JSON.parse(options.body));
    submittedHeaders.push(options.headers);
    return { ok: true, status: 200, json: async () => ({ id: `email_test_${submitted.length}` }) };
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
    const response = JSON.parse(res.body);
    assert.equal(res.statusCode, 200);
    assert.equal(response.id, 'email_test_1');
    assert.match(response.requestId, /^[0-9a-f-]{36}$/);
    assert.equal(response.backupAccepted, true);
    assert.equal(submitted.length, 2);
    assert.equal(submitted[0].to[0], 'inquiry@haibucrafts.com');
    assert.equal(Object.hasOwn(submitted[0], 'bcc'), false);
    assert.equal(submitted[1].to[0], 'backup@example.com');
    assert.match(submitted[1].subject, /^\[Backup Copy\]/);
    assert.equal(submitted[0].reply_to, 'buyer@example.com');
    assert.equal(submitted[0].attachments.length, 1);
    assert.match(submitted[0].subject, /SLM712/);
    assert.match(submitted[0].text, /Lead Source Channel: AI Referral/);
    assert.match(submitted[0].text, /Lead Source: chatgpt/);
    assert.match(submitted[0].html, /First Landing Page/);
    assert.match(submittedHeaders[0]['Idempotency-Key'], /^inquiry-/);
    assert.match(submittedHeaders[1]['Idempotency-Key'], /^inquiry-backup-/);
    assert.equal(
      submittedHeaders[1]['Idempotency-Key'],
      submittedHeaders[0]['Idempotency-Key'].replace('inquiry-', 'inquiry-backup-')
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey) process.env.RESEND_API_KEY = previousKey;
    else delete process.env.RESEND_API_KEY;
    if (previousBcc) process.env.INQUIRY_BCC_EMAIL = previousBcc;
    else delete process.env.INQUIRY_BCC_EMAIL;
  }
});

test('keeps the primary inquiry successful when the direct backup copy is rejected', async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.RESEND_API_KEY;
  const previousBcc = process.env.INQUIRY_BCC_EMAIL;
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.INQUIRY_BCC_EMAIL = 'backup@example.com';
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls += 1;
    const payload = JSON.parse(options.body);
    if (calls === 1) {
      assert.equal(payload.to[0], 'inquiry@haibucrafts.com');
      return { ok: true, status: 200, json: async () => ({ id: 'email_test_456' }) };
    }
    assert.equal(payload.to[0], 'backup@example.com');
    return { ok: false, status: 422, json: async () => ({ message: 'backup rejected' }) };
  };
  try {
    const res = responseHarness();
    await handler(request(), res);
    const response = JSON.parse(res.body);
    assert.equal(res.statusCode, 200);
    assert.equal(response.id, 'email_test_456');
    assert.equal(response.backupAccepted, false);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey) process.env.RESEND_API_KEY = previousKey;
    else delete process.env.RESEND_API_KEY;
    if (previousBcc) process.env.INQUIRY_BCC_EMAIL = previousBcc;
    else delete process.env.INQUIRY_BCC_EMAIL;
  }
});

test('omits an invalid or duplicate backup recipient without blocking the primary delivery', async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.RESEND_API_KEY;
  const previousBcc = process.env.INQUIRY_BCC_EMAIL;
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.INQUIRY_BCC_EMAIL = 'inquiry@haibucrafts.com';
  const submitted = [];
  globalThis.fetch = async (_url, options) => {
    submitted.push(JSON.parse(options.body));
    return { ok: true, status: 200, json: async () => ({ id: 'email_test_789' }) };
  };
  try {
    const res = responseHarness();
    await handler(request(), res);
    assert.equal(res.statusCode, 200);
    assert.equal(submitted.length, 1);
    assert.equal(submitted[0].to[0], 'inquiry@haibucrafts.com');
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey) process.env.RESEND_API_KEY = previousKey;
    else delete process.env.RESEND_API_KEY;
    if (previousBcc) process.env.INQUIRY_BCC_EMAIL = previousBcc;
    else delete process.env.INQUIRY_BCC_EMAIL;
  }
});
