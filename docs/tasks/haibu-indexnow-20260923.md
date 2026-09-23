# IndexNow integration — 2026-09-23

## Release boundary

This change is for Preview review first. Do not merge or submit Production URLs until the owner approves Production deployment. The verification key is a purpose-specific public domain-ownership token, not a Vercel, GitHub, mailbox or Resend credential. No provider account secret is required.

## What is included

- Root verification text file, copied into every release candidate by the existing builder.
- Fixed canonical Production origin and official IndexNow endpoint.
- Offline `npm run indexnow` dry run by default; `--verify` performs only live GET checks; `--submit` explicitly sends one batch after all checks pass.
- Exact key-file, sitemap and selected HTML checks prevent notification before the content is live. Preview domains, external hosts, tracking URLs and inquiry/API routes are rejected.
- Page HTML plus shared JS/CSS/catalog fingerprints select added/changed URLs and previously submitted removed URLs. Initial enrollment selects all sitemap content pages. Pure documentation changes do not trigger URL notifications.
- Production deployment status workflow, serialized without cancelling an in-flight submission. Non-current-main deployments and Preview events are skipped.
- Last accepted fingerprints restored from GitHub Actions cache; only successful 200/202 receipts advance the checkpoint. A missing/evicted cache causes a safe full re-enrollment, not lost updates. There is no scheduled repeated full submission.
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

## Pre-merge verification

- Offline dry run: 183 canonical URLs; no network requests or submissions.
- Unit/integration suite: 147 tests including 12 IndexNow cases; HTTP 200/202, rejected/redirected key files, sitemap mismatch, stale HTML, changed/deleted pages, no-op repeat, and checkpoint preservation on failure.
- Full SEO build and release audit passed; 255 materialized files match, 183 sitemap URLs, 139 products, 94 one-hop redirects; catalog and HTTP 404 audits passed.
- Real IndexNow POST and Production workflow activation intentionally remain pending owner approval to merge/deploy.

## Official references

- https://www.indexnow.org/documentation
- https://www.indexnow.org/faq
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#deployment_status
