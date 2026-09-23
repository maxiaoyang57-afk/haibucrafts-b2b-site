# IndexNow integration — 2026-09-23

## Release boundary

Originally delivered for Preview review, then explicitly approved for Production by the owner on 2026-09-23. The verification key is a purpose-specific public domain-ownership token, not a Vercel, GitHub, mailbox or Resend credential. No provider account secret is required.

## What is included

- Root verification text file, copied into every release candidate by the existing builder.
- Fixed canonical Production origin and official IndexNow endpoint.
- Offline `npm run indexnow` dry run by default; `--verify` performs only live GET checks; `--submit` explicitly sends one batch after all checks pass.
- Exact key-file, sitemap and selected HTML checks prevent notification before the content is live. Preview domains, external hosts, tracking URLs and inquiry/API routes are rejected.
- Page HTML plus shared JS/CSS/catalog fingerprints select added/changed URLs and previously submitted removed URLs. Initial enrollment selects all sitemap content pages. Pure documentation changes do not trigger URL notifications.
- Notifications run after the main-branch Production HTTP Redirect Audit succeeds, using a cache-compatible `workflow_run` event. Runs are serialized without cancelling an in-flight submission. Non-current-main runs and Preview audits are skipped.
- Last accepted fingerprints restored from GitHub Actions cache; only successful 200/202 receipts advance the checkpoint. Missing cache falls back to the immutable first accepted snapshot. There is no scheduled repeated full submission.
- JSON receipt/failure report retained as a 90-day Actions artifact. HTTP 202 explicitly means key validation pending; neither 200 nor 202 means indexed.

## Owner-approved activation

1. Merge PR after Preview checks pass.
2. Wait for Vercel Production Ready and the IndexNow Production Notifications workflow.
3. Check the workflow artifact for `submitted: true`, URL count, and `httpStatus: 200` or `202`.
4. If the initial deployment event is missed, manually run this workflow on **main** with `submit=true`. Default manual execution only verifies.
5. If production checks fail, investigate the public key file, sitemap, or changed URL before rerunning; do not bypass checks or repeatedly resubmit on 429.
6. Check Bing URL Inspection separately for actual crawl/index state. IndexNow does not replace Google Search Console checks.

## Operational limitations

- At-least-once delivery: a crash after the API accepted the request but before cache save may cause one repeat; unchanged repeated workflow events normally do not POST.
- Checkpoint retention follows GitHub cache policies, not the receipt artifact's 90-day retention.
- Shared runtime changes conservatively notify all sitemap pages. Binary-only image/video replacement with unchanged HTML/runtime is not fingerprinted in this version; update the referencing page or runtime catalog as part of that release.
- For intentional rollback to an older commit, the current-main guard skips automatic submission; align main with the intended released content before manually verifying/submitting.

## Production activation and checkpoint repair

- PR #78 merged as `efe41d2612b88be88f25f8daae9a72aa7d1b6799`; Production is Ready.
- Run `35863404611` verified live content and submitted 183 URLs at 2026-09-23T12:53:54Z; real API receipt was **202 / key validation pending**, not indexed.
- The run exposed an Actions limitation: the SHA-only `deployment_status` event cannot restore/save cache. Submission itself succeeded, but checkpoint persistence was skipped with warnings.
- Follow-up changes the trigger to completion of the existing successful Production audit (`workflow_run` has a branch ref), preserving current-main and live-content checks.
- `docs/indexnow-initial-checkpoint.json` reproduces the accepted initial content fingerprints against the exact unchanged Production files and links to that receipt. It avoids a duplicate batch during migration or cache eviction. Subsequent accepted state remains in Actions cache.

## Pre-merge verification

- Offline dry run: 183 canonical URLs; no network requests or submissions.
- Unit/integration suite: 147 tests including 12 IndexNow cases; HTTP 200/202, rejected/redirected key files, sitemap mismatch, stale HTML, changed/deleted pages, no-op repeat, and checkpoint preservation on failure.
- Full SEO build and release audit passed; 255 materialized files match, 183 sitemap URLs, 139 products, 94 one-hop redirects; catalog and HTTP 404 audits passed.
- At the pre-merge stage, real POST and Production activation were deferred; the subsequent owner-approved activation and real receipt are recorded above.

## Official references

- https://www.indexnow.org/documentation
- https://www.indexnow.org/faq
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#deployment_status
