import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('production CSP permits the configured GA4 loader and collection without unsafe scripts', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const policies = config.headers.flatMap(rule => rule.headers).filter(header => header.key.toLowerCase() === 'content-security-policy');
  assert.equal(policies.length, 1);
  const directives = Object.fromEntries(policies[0].value.split(';').map(value => value.trim().split(/\s+/)).map(([key, ...values]) => [key, values]));
  assert.deepEqual(directives['script-src'], ["'self'", 'https://www.googletagmanager.com']);
  for (const host of ['https://*.google-analytics.com', 'https://*.analytics.google.com']) assert.ok(directives['connect-src'].includes(host));
  assert.deepEqual(directives['default-src'], ["'self'"]);
  assert.deepEqual(directives['object-src'], ["'none'"]);
  assert.deepEqual(directives['frame-ancestors'], ["'none'"]);
  assert.deepEqual(directives['form-action'], ["'self'"]);
});
