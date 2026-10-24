import { readFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const AUDIT_NAME = 'Production HTTP Redirect Audit';
const AUDIT_PATH = '.github/workflows/production-http-redirect-audit.yml';
const SHA = /^[a-f0-9]{40}$/;

// deployment_status audits can have head_branch=null. Accept that case only
// for this repository's production-audit workflow at the current main SHA.
export function eligibleTrigger({ eventName, event, repository, ref, sha, checkoutSha, mainSha }) {
  if (!SHA.test(mainSha || '') || checkoutSha !== mainSha) return false;
  if (eventName === 'workflow_dispatch') return ref === 'refs/heads/main' && sha === mainSha;
  if (eventName !== 'workflow_run' || event?.action !== 'completed') return false;
  const run = event.workflow_run;
  if (!repository || event.repository?.full_name !== repository ||
      run?.repository?.full_name !== repository || run?.head_repository?.full_name !== repository ||
      run?.name !== AUDIT_NAME || run?.path !== AUDIT_PATH ||
      run?.conclusion !== 'success' || run?.head_sha !== mainSha) return false;
  if (!['deployment_status', 'workflow_dispatch', 'schedule'].includes(run.event)) return false;
  return run.head_branch === 'main' || (run.head_branch === null && run.event === 'deployment_status');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [checkoutSha, mainSha] = process.argv.slice(2);
  const ready = eligibleTrigger({
    eventName: process.env.GITHUB_EVENT_NAME,
    event: JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')),
    repository: process.env.GITHUB_REPOSITORY,
    ref: process.env.GITHUB_REF,
    sha: process.env.GITHUB_SHA,
    checkoutSha, mainSha,
  });
  appendFileSync(process.env.GITHUB_OUTPUT, `ready=${ready}\n`);
  console.log(ready ? 'Verified successful audit/manual trigger at current main.' : 'Skipping untrusted, superseded or non-main trigger.');
}
