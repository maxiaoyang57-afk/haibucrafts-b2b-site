import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { restoreCheckpoint } from '../scripts/restore-indexnow-checkpoint.mjs';
import { ORIGIN, digest } from '../lib/indexnow.js';

const run = { id: 123, head_branch: 'main', conclusion: 'success', event: 'workflow_run' };
const artifact = { id: 456, name: 'indexnow-checkpoint-123-1', expired: false };
const state = { version: 1, origin: ORIGIN, pages: { [`${ORIGIN}/`]: digest('page') } };
function fixture({ runs = [run], artifacts = [artifact], content = state } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'haibu-checkpoint-'));
  const calls = [];
  const gh = args => {
    calls.push(args);
    if (args[0] === 'run') {
      const dest = args[args.indexOf('--dir') + 1];
      writeFileSync(path.join(dest, 'state.json'), JSON.stringify(content));
      return '';
    }
    return JSON.stringify(args[1].includes('/artifacts?') ? { artifacts } : { workflow_runs: runs });
  };
  return { root, calls, options: { repository: 'owner/site', currentRun: '999', root, gh } };
}

test('Artifact checkpoint restore downloads a prior accepted main run and preserves hashes', async () => {
  const f = fixture();
  assert.equal(await restoreCheckpoint(f.options), 123);
  assert.deepEqual(JSON.parse(readFileSync(path.join(f.root, 'state.json'), 'utf8')), state);
});

test('Checkpoint restore excludes Preview, failed, current, and unexpected event runs', async () => {
  const f = fixture({ runs: [{ ...run, head_branch: 'feature' }, { ...run, conclusion: 'failure' }, { ...run, id: 999 }, { ...run, event: 'pull_request' }] });
  assert.equal(await restoreCheckpoint(f.options), null);
  assert.equal(f.calls.length, 1);
  assert.equal(existsSync(path.join(f.root, 'state.json')), false);
});

test('Missing or expired checkpoints fall back without inventing accepted state', async () => {
  for (const artifacts of [[], [{ ...artifact, expired: true }], [{ ...artifact, name: 'indexnow-report-123-1' }]]) {
    const f = fixture({ artifacts });
    assert.equal(await restoreCheckpoint(f.options), null);
    assert.equal(existsSync(path.join(f.root, 'state.json')), false);
  }
});

test('Corrupt or foreign checkpoint state and API failures fail closed', async () => {
  for (const content of [{ version: 2 }, { ...state, pages: { 'https://example.com/': digest('bad') } }, { ...state, pages: {} }]) {
    const f = fixture({ content });
    await assert.rejects(restoreCheckpoint(f.options));
    assert.equal(existsSync(path.join(f.root, 'state.json')), false);
  }
  await assert.rejects(restoreCheckpoint({ repository: 'owner/site', gh: () => { throw Error('API unavailable'); } }));
});
