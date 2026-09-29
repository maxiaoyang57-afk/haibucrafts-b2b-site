import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/inquiry.js';

test('simple inquiries accept either reply address without name or country; reject unreachable or empty requests', async () => {
  const previousFetch = global.fetch;
  const previousKey = process.env.RESEND_API_KEY;
  const sent = [];
  process.env.RESEND_API_KEY = 'mock-only';
  global.fetch = async (_url, options) => { sent.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ id: 'mock-simple' }) }; };
  const invoke = async fields => {
    const res = { statusCode: 0, setHeader() {}, end(body) { this.body = JSON.parse(body); } };
    await handler({ method: 'POST', headers: { origin: 'https://www.haibucrafts.com' }, body: { fields: { inquiry_mode: 'simple', message: 'Can I see samples?', ...fields } } }, res);
    return res;
  };
  try {
    assert.equal((await invoke({ preferred_contact: 'WhatsApp', phone: '+1 202 555 0199' })).statusCode, 200);
    assert.equal(Object.hasOwn(sent[0], 'reply_to'), false);
    assert.match(sent[0].text, /WhatsApp/);
    assert.match(sent[0].text, /202 555 0199/);
    sent.length = 0;
    assert.equal((await invoke({ preferred_contact: 'Email', email: 'buyer@example.com' })).statusCode, 200);
    assert.equal(sent[0].reply_to, 'buyer@example.com');
    sent.length = 0;
    for (const fields of [
      { preferred_contact: 'Email', email: '' },
      { preferred_contact: 'WhatsApp', phone: '123' },
      { preferred_contact: 'WhatsApp', phone: '+1 202 555 0199', message: ' ' },
      { preferred_contact: 'Unknown', email: 'buyer@example.com' }
    ]) assert.equal((await invoke(fields)).statusCode, 400);
    assert.equal(sent.length, 0);
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
  }
});
