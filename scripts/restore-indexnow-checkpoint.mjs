import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { changedUrls } from '../lib/indexnow.js';

// Artifacts support workflow_run/deployment jobs even when cache tokens cannot write.
export async function restoreCheckpoint({ repository = process.env.GITHUB_REPOSITORY, currentRun = process.env.GITHUB_RUN_ID, root = '.release-candidate/indexnow', gh = args => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 4000000 }) } = {}) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || '')) throw new Error('Invalid repository for checkpoint restore.');
  const api = suffix => JSON.parse(gh(['api', `repos/${repository}/${suffix}`]));
  const runs = api('actions/workflows/indexnow-production.yml/runs?status=success&branch=main&per_page=100').workflow_runs;
  for (const run of runs) {
    if (String(run.id) === String(currentRun) || run.conclusion !== 'success' || run.head_branch !== 'main' || !['workflow_run', 'workflow_dispatch'].includes(run.event)) continue;
    const artifacts = api(`actions/runs/${run.id}/artifacts?per_page=100`).artifacts;
    const artifact = artifacts.filter(item => !item.expired && new RegExp(`^indexnow-checkpoint-${run.id}-[0-9]+$`).test(item.name)).sort((a, b) => b.id - a.id)[0];
    if (!artifact) continue;
    const destination = path.join(root, 'restore', String(run.id));
    await mkdir(destination, { recursive: true });
    gh(['run', 'download', String(run.id), '--repo', repository, '--name', artifact.name, '--dir', destination]);
    const state = JSON.parse(await readFile(path.join(destination, 'state.json'), 'utf8'));
    changedUrls({}, state); // Reject foreign URLs and invalid checkpoint versions/hashes.
    if (!Object.keys(state.pages).length) throw new Error('Refusing empty checkpoint artifact.');
    await writeFile(path.join(root, 'state.json'), JSON.stringify(state, null, 2) + '\n');
    console.log(`Restored accepted checkpoint from run ${run.id}: ${Object.keys(state.pages).length} URLs.`);
    return run.id;
  }
  console.log('No accepted checkpoint artifact found; use the verified immutable initial receipt baseline.');
  return null;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { await restoreCheckpoint(); } catch (error) { console.error(`Checkpoint restore failed: ${error.message}`); process.exitCode = 1; }
}
