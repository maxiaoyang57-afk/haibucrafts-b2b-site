# HAIBUCRAFT Site V2 — Integrated Preview Plan

Branch: `site-v2-integrated-preview`
Production branch: `main` (must remain unchanged until final approval)

## Project goals

1. Unify the global header, footer, mobile navigation and URL structure.
2. Add Manufacturing and Quality Control capability pages using authentic facility imagery and conservative, supportable claims.
3. Integrate the Blog into the main site rather than maintaining it as an isolated export.
4. Upgrade the four core product category pages for B2B purchasing intent.
5. Preserve `/api/inquiry` and add privacy-friendly lead-source fields.
6. Improve technical SEO, structured data, image delivery, accessibility and Core Web Vitals.

## Target navigation

- Home
- Products
  - Slime Charms Wholesale
  - Polymer Clay Slices Wholesale
  - Resin Charms for Slime
  - Sequins & Glitter Confetti
- Custom Solutions
- Manufacturing
- Quality Control
- About
- Blog
- Request Quote

## Target routes

- `/`
- `/products/`
- `/products/slime-charms/`
- `/products/polymer-clay-slices/`
- `/products/resin-charms/`
- `/products/sequins-glitter-confetti/`
- `/custom-solutions/`
- `/manufacturing/`
- `/quality-control/`
- `/about/`
- `/blog/`
- `/quote/`
- `/privacy-policy/`
- `/terms/`

## Phase 1 — Global structure and routing

- Audit existing routes and link formats.
- Remove mixed `index.html`, hash-route and directory-route behavior.
- Standardize canonical host to `https://haibucrafts.com`.
- Build shared navigation rules and consistent mobile menu behavior.
- Create a redirect map before changing public URLs.
- Keep the existing product codes and image mapping unchanged.

## Phase 2 — Manufacturing

Use authentic warehouse, packing and facility images. Do not claim that every product is made in a wholly owned factory unless confirmed.

Recommended claim style:

> Our Yiwu-based team coordinates product development, sourcing, inventory, packing and export preparation through a managed production and supply network.

## Phase 3 — Quality Control

Core workflow:

1. Requirement confirmation
2. Sample review
3. Material and color check
4. In-process follow-up
5. Appearance inspection
6. Quantity verification
7. Packaging check
8. Pre-shipment review
9. Testing documentation when applicable

## Phase 4 — Blog V6 integration

- Shared header and footer
- Breadcrumbs
- Table of contents
- Related products
- Related capabilities
- Quote CTA with source parameters
- `BlogPosting` and `BreadcrumbList` JSON-LD
- Reusable article template

## Phase 5 — Product category upgrades

Each category page should include:

- Category overview
- Product grid
- Available styles
- Materials and sizing
- Custom options
- Packaging options
- Ordering process
- FAQ
- Related buying guides
- Request Quote CTA

## Phase 6 — Inquiry attribution

Keep `/api/inquiry` and add:

- `source`
- `landing_page`
- `article`
- `product_category`
- `product_code`
- `referrer`
- `utm_source`
- `utm_medium`
- `utm_campaign`

## Phase 7 — Technical SEO and performance

- Unique titles and descriptions
- One H1 per page
- Canonical URLs
- Open Graph metadata
- Organization, BlogPosting and BreadcrumbList JSON-LD
- Sitemap and robots.txt
- Redirects
- WebP/AVIF images
- Responsive `srcset`
- Lazy loading below the fold
- Explicit image dimensions
- CSS/JS cleanup
- Mobile overflow and accessibility checks

## Acceptance criteria

- Broken internal links: 0
- Missing images: 0
- Severe console errors: 0
- Duplicate canonical URLs: 0
- Invalid structured data: 0
- Major mobile overflow: 0
- Inquiry submission test: successful
- Production branch changed only after explicit approval
