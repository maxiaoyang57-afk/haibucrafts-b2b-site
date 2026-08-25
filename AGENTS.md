# HaibuCrafts Agent Instructions

## Repository architecture

- Treat this repository as a static B2B website: HTML, CSS, JavaScript, Vercel serverless API files, and Node.js build/audit scripts.
- Do not migrate pages to React, Next.js, or another framework unless the task explicitly requests a migration.
- Preserve existing URL structure, SEO-critical metadata, schema markup, canonical URLs, sitemap/robots behavior, and inquiry functionality unless the task explicitly requires a change.

## Installed project skills

Use the project-scoped Codex skills in `.agents/skills/` when relevant:

- `web-design-guidelines`: use for UI reviews, mobile/responsive checks, accessibility, forms, navigation, interaction, layout, and general UX audits.
- `writing-guidelines`: use primarily for blog posts, buyer guides, documentation, editorial content, and prose-quality review.

For commercial landing pages, category pages, product pages, and inquiry pages, do not apply documentation-only rules from `writing-guidelines` mechanically. Use only broadly applicable prose rules such as active voice, concise sentences, concrete claims, removal of filler, and clear next actions. Do not add Vercel documentation metadata, documentation content types, tutorial structure, or documentation-specific heading conventions to marketing pages.

If `web-design-guidelines` and `writing-guidelines` conflict on a website UI convention, follow `web-design-guidelines` for interface labels, buttons, navigation, and visual hierarchy.

For review tasks, apply the relevant skill before proposing or committing fixes.

## Catalog source of truth

- The current approved published catalog contains 81 products total.
- Approved category counts: 33 Slime Charms, 9 Polymer Clay Slices, 20 Resin Charms, and 19 Sequins & Confetti.
- Do not reduce these counts or remove products unless a task explicitly instructs it.
- Do not move a product between categories solely because its title could fit another category. Preserve the approved SKU/category mapping unless the task explicitly requests a category change.
- For SLM10123, preserve its current approved category assignment. Only correct it if an explicit owner instruction requests a category change.

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
