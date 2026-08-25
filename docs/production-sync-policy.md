# HAIBUCRAFT Production Synchronization Policy

## Purpose

Prevent GitHub, Vercel and the public custom domain from silently serving different versions of the HAIBUCRAFT website.

The only valid release state is:

`approved repository source -> generated Release Candidate -> checked-in Production -> GitHub main -> Vercel Production -> www.haibucrafts.com`

Every arrow must be verifiable. A merge is not considered fully released until the live-production integrity job passes.

## Source of truth

1. `main` is the only Production source-of-truth branch.
2. Feature branches and pull requests are Preview-only.
3. `v2-preview/` is source material, not the public deployment root.
4. `.release-candidate/site-v2` is deterministic generated output used for auditing.
5. The checked-in root Production files must match the Release Candidate byte-for-byte for all materialized files.
6. The public custom domain must match the exact merged `main` release content before a release is considered complete.

## Required release sequence

1. Create a dedicated feature/fix branch from current `main`.
2. Make changes only on that branch.
3. Rebuild deterministic V2 source and materialized Production output.
4. Open a pull request to `main`.
5. Require all repository integrity/SEO checks and Vercel Preview to pass.
6. Perform desktop/mobile Preview review when the change affects rendered output.
7. Merge only after explicit approval.
8. Allow Vercel Git integration to create the Production deployment from `main`.
9. The `Production Sync Integrity` workflow waits for deployment convergence and compares the live site to the exact merged Release Candidate/reference assets.
10. Treat the release as complete only when the live-production integrity job is green.

## Prohibited release paths

- Do not edit `main` directly for normal work.
- Do not treat a successful Preview as proof that Production is updated.
- Do not manually alias an arbitrary Preview deployment to the production custom domain.
- Do not use an old Vercel deployment as the long-term Production state while GitHub `main` points to different code.
- Do not change product data to compensate for a stale deployment, CDN, alias or branch problem.
- Do not report a release as complete based only on GitHub merge status or only on Vercel `Ready` status.

## Rollback rule

The preferred rollback keeps GitHub and Vercel synchronized:

1. Revert the faulty commit or merge commit on `main`.
2. Let Vercel deploy the reverted `main` state.
3. Require the live-production integrity gate to pass again.

If an emergency Vercel-side rollback is ever used before the Git revert is complete, record it as a temporary incident state. GitHub `main` must then be reverted to the same content immediately so Production does not remain intentionally divergent.

## Integrity gates

### PR / repository gate

The workflow must verify:

- tests pass;
- deterministic V2 source rebuild succeeds;
- Release Candidate generation succeeds;
- checked-in Production matches the Release Candidate byte-for-byte;
- SEO/canonical audit passes;
- HTTP 404 audit passes;
- build scripts leave no uncommitted tracked-file drift.

### Post-merge / live gate

After a push to `main`, the workflow must:

- rebuild the Release Candidate from the exact merged SHA;
- poll the custom domain while Vercel converges;
- compare sentinel pages first to avoid false alarms during deployment propagation;
- compare the full generated site and referenced static product assets byte-for-byte with cache-busting requests;
- write `.sync-audit.json` as a machine-readable audit artifact;
- fail if Production does not converge within the allowed window;
- automatically open a GitHub incident Issue for a failed Production synchronization check.

## Required GitHub repository settings

Repository administrators should enforce `main` with branch protection or a ruleset so normal merges cannot bypass release checks.

Minimum requirements:

- require a pull request before merging;
- block force pushes and branch deletion;
- require the SEO release gate;
- require `Production Sync Integrity / Verify source, release candidate and checked-in Production`;
- require the Vercel Preview/Deployment check used by this project;
- require branches to be up to date before merge when concurrent release work exists;
- do not allow direct pushes that bypass required checks.

The live-production integrity job is a post-merge verification, so it cannot be a pre-merge required check for the same commit. A release is operationally complete only after this post-merge job is green.

## Required Vercel project settings

- The HAIBUCRAFT Git repository must be connected to the intended Vercel project.
- Production Branch must be `main`.
- Feature branches must create Preview deployments only.
- `www.haibucrafts.com` and the intended apex-domain behavior must remain assigned to the Production environment of this same project.
- Avoid separate/manual deployment paths that bypass the Git commit history.
- Do not use different project roots or duplicated Vercel projects for the same custom domain.

## Incident diagnosis order

When GitHub, Vercel and the public site appear different, diagnose in this order:

1. Record exact GitHub `main` SHA.
2. Confirm repository materialized parity locally/CI.
3. Confirm Vercel project and Production Branch are the intended repository + `main`.
4. Confirm the custom domain is attached to that same Vercel project and Production deployment.
5. Run/re-run `Production Sync Integrity` from `main`.
6. Inspect `.sync-audit.json` and the automatically opened incident Issue.
7. Fix deployment/alias/configuration drift first; never rewrite product/catalog data to make it resemble stale Production.

## Definition of done

A HAIBUCRAFT release is fully synchronized only when all of the following are true:

- PR checks passed;
- approved change merged into `main`;
- Vercel Production deployment succeeded from that `main` release path;
- `Production Sync Integrity` passed against `https://www.haibucrafts.com`;
- no unresolved synchronization incident exists for that merged SHA.
