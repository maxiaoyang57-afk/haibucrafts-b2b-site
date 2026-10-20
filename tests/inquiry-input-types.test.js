import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/inquiry.js';

test('malformed JSON field types return 400 without attempting email delivery', async () => {
  const originalFetch = globalThis.fetch;
  let deliveries = 0;
  globalThis.fetch = async () => { deliveries += 1; throw new Error('Unexpected delivery attempt'); };
  const contact = { name: 'Audit buyer', email: 'audit@example.invalid', country: 'Test' };
  const invalidBodies = [
    'null', '[]', '"text"',
    { fields: [] }, { fields: 'text' },
    ...[{}, [], { toString: null }].map(value => ({ fields: { ...contact, name: value } })),
    { fields: contact, _company_fax: { toString: null } },
    { fields: contact, _company_fax: [] }
  ];
  try {
    for (const body of invalidBodies) {
      const res = {
        statusCode: 0, headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        end(value) { this.body = JSON.parse(value); }
      };
      await handler({
        method: 'POST', headers: { origin: 'https://www.haibucrafts.com' },
        body: typeof body === 'string' ? body : JSON.stringify(body)
      }, res);
      assert.equal(res.statusCode, 400, JSON.stringify(body));
      assert.deepEqual(res.body, { ok: false, message: 'Invalid request body' });
      assert.equal(res.headers['Cache-Control'], 'no-store');
    }
    assert.equal(deliveries, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
