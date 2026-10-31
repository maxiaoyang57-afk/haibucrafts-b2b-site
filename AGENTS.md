# HAIBU catalog maintenance

- Start from the latest remote `origin/main`; preserve concurrent product imports and use a branch, reviewed PR, Vercel Preview, required checks, then production verification.
- User-confirmed scope (2026-10-31): only Polymer Clay Slices (`polymer-clay-slices`), Slime Charms (`slime-charms`), Resin Charms (`resin-charms`), and Sequins & Confetti (`sequins-glitter-confetti`). Do not add categories.
- Do not add further products to the legacy `keychain` or `decorative-craft-accessories` categories. Preserve their source records; existing out-of-scope product disposition and old URL handling require a separate factual review. Never relabel metal or plastic items as resin to fit the taxonomy.
- Product facts, confirmed pack quantities, MOQ, lead time and actual images are SKU-specific. Do not infer a fixed piece count from weight or one SKU's pack options from another.
- The buyer content source is `v2-preview/` and its build scripts. Regenerate and materialize production after editing, and satisfy the existing tests and audits.
