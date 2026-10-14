import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile('assets/v2/quote-runtime-config.js', 'utf8');

function configFor(hostname) {
  const context = { window: { location: { hostname } } };
  vm.runInNewContext(source, context);
  return context.window.HAIBU_QUOTE_CONFIG;
}

test('HAIBU quote delivery is live only on canonical production hosts', () => {
  for (const hostname of ['www.haibucrafts.com', 'haibucrafts.com']) {
    const config = configFor(hostname);
    assert.equal(config.mode, 'live', hostname);
    assert.equal(config.endpoint, '/api/inquiry', hostname);
  }

  for (const hostname of [
    'haibucrafts-b2b-site-git-fix-example.vercel.app',
    'preview.haibucrafts.example',
    'localhost',
  ]) {
    const config = configFor(hostname);
    assert.equal(config.mode, 'validation-only', hostname);
    assert.equal(config.endpoint, '/api/inquiry', hostname);
  }
});
