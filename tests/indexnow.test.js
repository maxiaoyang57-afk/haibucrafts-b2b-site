import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ORIGIN, ENDPOINT, validateConfig, validateUrl, sitemapUrls, digest, changedUrls, verifyProduction, submitUrls } from '../lib/indexnow.js';

const config = validateConfig(JSON.parse(readFileSync(new URL('../indexnow.config.json', import.meta.url), 'utf8')));
const urls = [`${ORIGIN}/`, `${ORIGIN}/products/`];
const xml = `<urlset>${urls.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>`;
const checkpoint = pages => ({ version: 1, origin: ORIGIN, pages });

test('IndexNow key file and configuration match; alternate endpoints and malformed keys are rejected', () => {
  assert.equal(readFileSync(new URL(`../${config.key}.txt`, import.meta.url), 'utf8').trim(), config.key);
  assert.throws(() => validateConfig({ ...config, endpoint: 'https://example.com/' }));
  assert.throws(() => validateConfig({ ...config, origin: 'https://preview.vercel.app' }));
  for (const key of ['', '../escape', 'a'.repeat(129)]) assert.throws(() => validateConfig({ ...config, key }));
});

test('Only exact canonical production URLs are accepted, never preview, prefix lookalikes or tracking URLs', () => {
  for (const url of urls) assert.equal(validateUrl(url), url);
  for (const url of [
    'https://www.haibucrafts.com.evil.example/', 'https://haibucrafts.com/',
    'https://preview.vercel.app/', `${ORIGIN}/v2-preview/`, `${ORIGIN}/api/inquiry/`,
    `${ORIGIN}/request-quote/`, `${ORIGIN}/?utm_source=test`, `${ORIGIN}/#section`,
    `${ORIGIN}/a/../`, `${ORIGIN}/%2e%2e/`, `${ORIGIN}/products`
  ]) assert.throws(() => validateUrl(url), url);
});

test('Sitemap parsing rejects empty, duplicate and foreign URLs', () => {
  assert.deepEqual(sitemapUrls(xml), urls);
  for (const value of ['', '<loc>https://example.com/</loc>', `<loc>${ORIGIN}/</loc><loc>${ORIGIN}/</loc>`]) assert.throws(() => sitemapUrls(value));
});

test('Checkpoint selects initial, changed, added and deleted pages, but not unchanged pages', () => {
  const a = digest('a'); const b = digest('b');
  assert.deepEqual(changedUrls({ [urls[0]]: a }), [urls[0]]);
  assert.deepEqual(changedUrls({ [urls[0]]: a }, checkpoint({ [urls[0]]: a })), []);
  assert.deepEqual(changedUrls({ [urls[0]]: b, [urls[1]]: a }, checkpoint({ [urls[0]]: a })), urls);
  assert.deepEqual(changedUrls({ [urls[0]]: a }, checkpoint({ [urls[0]]: a, [urls[1]]: b })), [urls[1]]);
  assert.throws(() => changedUrls({}, { version: 2 }));
  assert.throws(() => changedUrls({}, checkpoint({ 'https://example.com/': a })));
});

test('Production preflight requires an exact key response and the deployed sitemap; rejects redirects', async () => {
  const request = async url => new Response(url.endsWith('.txt') ? config.key : xml);
  await verifyProduction(config, xml, request);
  for (const status of [301, 308, 404]) await assert.rejects(verifyProduction(config, xml, async () => new Response('', { status })));
  await assert.rejects(verifyProduction(config, xml, async () => new Response('wrong')));
  await assert.rejects(verifyProduction(config, xml, async url => new Response(url.endsWith('.txt') ? config.key : '<urlset/>')));
});

test('200 and 202 receipts are distinct and never claim indexing', async () => {
  for (const status of [200, 202]) {
    const result = await submitUrls(config, urls, async (url, options) => {
      assert.equal(url, ENDPOINT);
      assert.equal(options.method, 'POST');
      assert.equal(options.redirect, 'error');
      assert.deepEqual(JSON.parse(options.body), { host: 'www.haibucrafts.com', key: config.key, keyLocation: config.keyLocation, urlList: urls });
      return new Response('', { status });
    });
    assert.equal(result.httpStatus, status);
    assert.equal(result.indexed, false);
    assert.equal(result.result, status === 202 ? 'received-key-validation-pending' : 'received');
  }
});

test('Errors and unsupported success codes fail without retry loops', async () => {
  for (const status of [201, 204, 400, 403, 422, 429, 500]) {
    let calls = 0;
    await assert.rejects(submitUrls(config, urls, async () => { calls++; return new Response(null, { status }); }));
    assert.equal(calls, 1);
  }
  await assert.rejects(submitUrls(config, []));
  await assert.rejects(submitUrls(config, [urls[0], urls[0]]));
});

function fixture() {
  const directory = mkdtempSync(path.join(tmpdir(), 'haibu-indexnow-test-'));
  const put = (name, text) => { const file = path.join(directory, name); mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, text); };
  put('indexnow.config.json', JSON.stringify(config));
  put(`${config.key}.txt`, config.key);
  put('sitemap.xml', xml);
  put('assets/v2/app.js', '// shared runtime');
  for (const url of urls) put(`${new URL(url).pathname.slice(1)}index.html`, `<html><head><link rel="canonical" href="${url}"><meta name="robots" content="index,follow"></head><body>Test</body></html>`);
  put('mock.mjs', `
    import { readFileSync, appendFileSync } from 'node:fs';
    import path from 'node:path';
    globalThis.fetch = async (url, options = {}) => {
      appendFileSync('requests.jsonl', JSON.stringify({ url, method: options.method || 'GET' }) + '\\n');
      if (options.method === 'POST') return new Response(null, { status: Number(process.env.TEST_INDEXNOW_STATUS || 200) });
      if (process.env.TEST_INDEXNOW_BAD_KEY && url.endsWith('.txt')) return new Response('bad key');
      if (process.env.TEST_INDEXNOW_BAD_HTML && !url.endsWith('.txt') && !url.endsWith('.xml')) return new Response('stale HTML');
      if (process.env.TEST_INDEXNOW_REMOVED && url.endsWith('/products/')) return new Response('', { status: 410 });
      const pathname = new URL(url).pathname.slice(1);
      return new Response(readFileSync(path.join('.', pathname.endsWith('/') || !pathname ? pathname + 'index.html' : pathname), 'utf8'));
    };
  `);
  const script = fileURLToPath(new URL('../scripts/submit-indexnow.mjs', import.meta.url));
  const run = (args = [], env = {}) => spawnSync(process.execPath, ['--import', pathToFileURL(path.join(directory, 'mock.mjs')).href, script, ...args], { cwd: directory, env: { ...process.env, ...env }, encoding: 'utf8' });
  const report = () => JSON.parse(readFileSync(path.join(directory, '.release-candidate/indexnow/report.json'), 'utf8'));
  return { directory, put, run, report, state: path.join(directory, '.release-candidate/indexnow/state.json') };
}

test('CLI dry run is offline and never advances checkpoint; unknown arguments fail', () => {
  const f = fixture();
  assert.equal(f.run().status, 0);
  assert.equal(f.report().count, 2);
  assert.equal(f.report().submitted, false);
  assert.equal(existsSync(path.join(f.directory, 'requests.jsonl')), false);
  assert.equal(existsSync(f.state), false);
  assert.notEqual(f.run(['--typo']).status, 0);
});

test('CLI accepted submission saves checkpoint; repeat is no-op; runtime change selects all pages', () => {
  const f = fixture();
  assert.equal(f.run(['--submit']).status, 0);
  assert.equal(f.report().submitted, true);
  assert.equal(existsSync(f.state), true);
  assert.equal(f.run(['--submit']).status, 0);
  assert.equal(f.report().count, 0);
  f.put('assets/v2/app.js', '// changed shared runtime');
  assert.equal(f.run().status, 0);
  assert.equal(f.report().count, 2);
});

test('CLI verification sends no POST and saves no state; failures retain last accepted checkpoint', () => {
  const f = fixture();
  assert.equal(f.run(['--verify']).status, 0);
  assert.equal(f.report().productionVerified, true);
  assert.equal(existsSync(f.state), false);
  for (const env of [{ TEST_INDEXNOW_BAD_KEY: '1' }, { TEST_INDEXNOW_BAD_HTML: '1' }, { TEST_INDEXNOW_STATUS: '429' }]) {
    assert.notEqual(f.run(['--submit'], env).status, 0);
    assert.equal(existsSync(f.state), false);
  }
  assert.equal(f.run(['--submit'], { TEST_INDEXNOW_STATUS: '202' }).status, 0);
  const saved = readFileSync(f.state, 'utf8');
  f.put('assets/v2/app.js', '// next release');
  assert.notEqual(f.run(['--submit'], { TEST_INDEXNOW_STATUS: '500' }).status, 0);
  assert.equal(readFileSync(f.state, 'utf8'), saved);
});

test('Workflow waits for successful main Production audit and uploads state only after success', () => {
  const workflow = readFileSync(new URL('../.github/workflows/indexnow-production.yml', import.meta.url), 'utf8');
  assert.match(workflow, /workflows: \[Production HTTP Redirect Audit\]/);
  assert.match(workflow, /workflow_run.conclusion == 'success'/);
  assert.match(workflow, /workflow_run.head_branch == 'main'/);
  assert.doesNotMatch(workflow, /deployment_status/);
  assert.match(workflow, /github.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /Save accepted checkpoint[\s\S]*?if: success\(\)/);
  assert.match(workflow, /run: node scripts\/restore-indexnow-checkpoint.mjs/);
  assert.match(workflow, /name: indexnow-checkpoint-/);
  assert.match(workflow, /if-no-files-found: error/);
  assert.doesNotMatch(workflow, /actions\/cache/);
  assert.doesNotMatch(workflow, /pull_request_target|schedule:|contents: write/);
});

test('Immutable accepted baseline restores a missing cache without resubmitting unchanged pages', () => {
  const f = fixture();
  assert.equal(f.run(['--submit']).status, 0);
  const accepted = readFileSync(f.state, 'utf8');
  const fresh = fixture();
  fresh.put('docs/indexnow-initial-checkpoint.json', accepted);
  assert.equal(fresh.run(['--submit']).status, 0);
  assert.equal(fresh.report().count, 0);
  assert.equal(fresh.report().submitted, false);
  assert.equal(fresh.report().restoredFromInitialReceipt, true);
  assert.doesNotMatch(readFileSync(path.join(fresh.directory, 'requests.jsonl'), 'utf8'), /POST/);
});

test('Committed initial baseline is tied to the verified first receipt and covers all initial URLs', () => {
  const baseline = JSON.parse(readFileSync(new URL('../docs/indexnow-initial-checkpoint.json', import.meta.url), 'utf8'));
  assert.equal(baseline.sourceReceipt.runId, 35863404611);
  assert.equal(baseline.sourceReceipt.httpStatus, 202);
  assert.equal(Object.keys(baseline.pages).length, 183);
  assert.deepEqual(changedUrls(baseline.pages, baseline), []);
});

test('CLI notifies removed sitemap pages only after their live removal is confirmed', () => {
  const f = fixture();
  assert.equal(f.run(['--submit']).status, 0);
  f.put('sitemap.xml', `<urlset><url><loc>${urls[0]}</loc></url></urlset>`);
  assert.notEqual(f.run(['--submit']).status, 0);
  assert.match(f.report().error, /Removed page is still indexable/);
  assert.equal(f.run(['--submit'], { TEST_INDEXNOW_REMOVED: '1' }).status, 0);
  assert.deepEqual(f.report().urls, [urls[1]]);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(f.state, 'utf8')).pages), [urls[0]]);
});
