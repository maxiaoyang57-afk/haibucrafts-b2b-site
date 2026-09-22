# HAIBU CRAFT V48.2 Production Package

Deploy the contents of this folder as the Vercel project root.

## Required Vercel environment variables

- `RESEND_API_KEY`
- `INQUIRY_TO_EMAIL=inquiry@haibucrafts.com`
- `INQUIRY_BCC_EMAIL=64224336@qq.com` (optional hidden backup recipient)
- `INQUIRY_FROM_EMAIL=HAIBU CRAFT <inquiry@send.haibucrafts.com>`

Apply the variables to Production, Preview and Development as needed, then redeploy.

## Production behavior

- The public catalog contains 126 unique coded products in four core categories. The generated catalog is the source for the current count.
- The homepage presents the product families, facility photographs, production workflow, document scope and quotation links.
- Public contact and Organization metadata use `sales@haibucrafts.com`; server-side inquiry delivery uses the environment configuration above.
- Inquiry forms POST to `/api/inquiry` and use Resend server-side.
- Reference-image uploads accept up to four JPG, PNG or WebP files. Large images are optimized in the browser before being attached to the inquiry email.
- The optional backup recipient receives a separate direct copy; it is not exposed in the public form.
- The apex domain should continue redirecting to `https://www.haibucrafts.com/` in Vercel Domains.

## Build and verify changes

The editable page sources and shared browser scripts are in `v2-preview/`.
Keep changes there before regenerating the root files; changes only to the root output can be lost on the next build.

```sh
npm run build:v2-seo
npm run build:v2-release
npm run release:v2-materialize
npm test
npm run audit:v2-materialized
npm run audit:catalog-consistency
npm run audit:product-catalog
```

Materialization writes local files; it does not publish a deployment. Use a task branch and a reviewed Preview before merging to `main`. Historical V2 approval metadata does not approve a new task.
The inquiry origin check accepts the public domains and the exact `VERCEL_URL` / `VERCEL_BRANCH_URL` system values, rather than every `*.vercel.app` site. Vercel system environment variables must remain available for Preview inquiry checks.
