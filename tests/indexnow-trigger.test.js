import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { eligibleTrigger } from '../scripts/check-indexnow-trigger.mjs';

const repository = 'maxiaoyang57-afk/haibucrafts-b2b-site';
const sha = '0b1d4201a1618fcf04ef10da4c0e69e56b2eadb9';
function fixture() {
  return { eventName: 'workflow_run', repository, ref: 'refs/heads/main', sha,
    checkoutSha: sha, mainSha: sha,
    event: { action: 'completed', repository: { full_name: repository }, workflow_run: {
      name: 'Production HTTP Redirect Audit', path: '.github/workflows/production-http-redirect-audit.yml',
      event: 'deployment_status', conclusion: 'success', head_branch: null, head_sha: sha,
      repository: { full_name: repository }, head_repository: { full_name: repository },
    } },
  };
}

test('Successful production deployment audit with null branch is eligible at current main', () => {
  assert.equal(eligibleTrigger(fixture()), true);
});

test('Existing main-branch deployment, scheduled and manual audits remain eligible', () => {
  for (const event of ['deployment_status', 'schedule', 'workflow_dispatch']) {
    const f = fixture(); Object.assign(f.event.workflow_run, { event, head_branch: 'main' });
    assert.equal(eligibleTrigger(f), true, event);
  }
});

test('Failed, incomplete, unrelated and malformed audit events never authorize notification', () => {
  for (const change of [
    { conclusion: 'failure' }, { conclusion: 'cancelled' }, { head_branch: 'feature' },
    { head_branch: '' }, { head_branch: undefined }, { event: 'pull_request' },
    { event: 'workflow_dispatch' }, { event: 'schedule' }, { name: 'Another workflow' },
    { path: '.github/workflows/other.yml' }, { head_sha: 'a'.repeat(40) },
  ]) {
    const f = fixture(); Object.assign(f.event.workflow_run, change);
    assert.equal(eligibleTrigger(f), false, JSON.stringify(change));
  }
  for (const action of ['requested', 'in_progress', undefined]) {
    const f = fixture(); f.event.action = action; assert.equal(eligibleTrigger(f), false);
  }
  for (const event of [null, {}, { action: 'completed' }]) {
    assert.equal(eligibleTrigger({ ...fixture(), event }), false);
  }
});

test('Fork or mismatched repository events are rejected even if SHA and workflow name match', () => {
  for (const field of ['repository', 'head_repository']) {
    const f = fixture(); f.event.workflow_run[field] = { full_name: 'someone/fork' };
    assert.equal(eligibleTrigger(f), false);
  }
  const f = fixture(); f.event.repository.full_name = 'someone/fork';
  assert.equal(eligibleTrigger(f), false);
  assert.equal(eligibleTrigger({ ...fixture(), repository: undefined }), false);
});

test('Both checked-out and audited commit must still equal freshly fetched main', () => {
  for (const change of [{ mainSha: 'a'.repeat(40) }, { checkoutSha: 'a'.repeat(40) }, { mainSha: '' }, { mainSha: 'main' }]) {
    assert.equal(eligibleTrigger({ ...fixture(), ...change }), false);
  }
});

test('Direct dispatch is limited to the current main SHA and branch', () => {
  const f = { ...fixture(), eventName: 'workflow_dispatch' };
  assert.equal(eligibleTrigger(f), true);
  for (const change of [{ ref: 'refs/heads/feature' }, { sha: 'a'.repeat(40) }, { eventName: 'push' }]) {
    assert.equal(eligibleTrigger({ ...f, ...change }), false);
  }
});

test('CLI writes ready true or false for the workflow without making network requests', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'indexnow-trigger-'));
  try {
    const eventPath = path.join(directory, 'event.json');
    const output = path.join(directory, 'output');
    for (const [branch, expected] of [[null, true], ['feature', false]]) {
      const f = fixture(); f.event.workflow_run.head_branch = branch;
      writeFileSync(eventPath, JSON.stringify(f.event)); writeFileSync(output, '');
      const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/check-indexnow-trigger.mjs', import.meta.url)), sha, sha], {
        env: { ...process.env, GITHUB_EVENT_NAME: f.eventName, GITHUB_EVENT_PATH: eventPath,
          GITHUB_REPOSITORY: repository, GITHUB_REF: f.ref, GITHUB_SHA: sha, GITHUB_OUTPUT: output }, encoding: 'utf8',
      });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(readFileSync(output, 'utf8'), `ready=${expected}\n`);
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
