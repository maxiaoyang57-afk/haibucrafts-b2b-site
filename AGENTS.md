# HaibuCrafts Agent Instructions

## Repository architecture

- Treat this repository as a static B2B website: HTML, CSS, JavaScript, Vercel serverless API files, and Node.js build/audit scripts.
- Do not migrate pages to React, Next.js, or another framework unless the task explicitly requests a migration.
- Preserve existing URL structure, SEO-critical metadata, schema markup, canonical URLs, sitemap/robots behavior, and inquiry functionality unless the task explicitly requires a change.

## Installed project skills

Use the project-scoped Codex skills in `.agents/skills/` when relevant:

- `web-design-guidelines`: use for UI reviews, mobile/responsive checks, accessibility, forms, navigation, interaction, layout, and general UX audits.
- `writing-guidelines`: use for public-facing English copy, product/category text, blog content, documentation, voice/tone, and prose reviews.

For review tasks, apply the relevant skill before proposing or committing fixes.

## Change workflow

1. Inspect the affected files and current behavior before editing.
2. Keep changes narrowly scoped to the requested task.
3. Do not delete, move, rename, or recode product content unless the task explicitly requires it.
4. Run `npm test` after code or script changes when applicable.
5. Run the relevant existing audit/build scripts when the task touches generated SEO/content/release output.
6. Report changed files, checks run, and any unresolved risks.

## Release safety

- Preview first. Do not merge to `main` or intentionally trigger a production release without explicit approval.
- Prefer a dedicated branch and pull request for changes.
- Treat production deployment, DNS changes, analytics configuration changes, and inquiry-delivery changes as release-sensitive operations.
