# B2B Inquiry Website — GitHub + Vercel

This project serves the catalog as static HTML, CSS and JavaScript. Two Vercel Functions provide direct inquiry delivery and reference-file uploads:

- `POST /api/inquiry` sends the structured inquiry through Resend.
- `POST /api/upload` authorizes direct browser uploads to Vercel Blob.

## Local build

```bash
npm install
npm run build
```

The build prepares SEO metadata and bundles the small Vercel Blob browser client. Static HTML files remain in the project root.

## Required Vercel environment variables

Copy the keys from `.env.example` into Vercel Project Settings. Never commit actual secret values.

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Sends the inquiry email through Resend. |
| `INQUIRY_TO_EMAIL` | Recipient; production value is `sale008@sola-craft.com`. |
| `INQUIRY_FROM_EMAIL` | Verified sender, recommended: `Website Inquiry <inquiry@send.haibucrafts.com>`. |
| `BLOB_READ_WRITE_TOKEN` | Added automatically when a Vercel Blob store is connected. |

Add the variables to both Preview and Production environments.

## Vercel project setup

1. Push this directory to the intended GitHub repository.
2. In Vercel, import the GitHub repository and select **Other** as the framework preset.
3. Keep the root directory as `./` and use `npm run build` as the build command.
4. Do not set a separate output directory; the static files are served from the repository root.
5. Add a Vercel Blob store to the project.
6. Add the Resend integration, verify `send.haibucrafts.com`, and set the environment variables above.
7. Deploy a Preview and submit a real test inquiry with and without a reference file.
8. After acceptance, assign `www.haibucrafts.com` as the primary production domain and redirect `haibucrafts.com` to it.

For Namecheap DNS, use the exact A/CNAME targets shown by the Vercel domain screen. DNS values should not be guessed or copied from an unrelated project.

## Deployment acceptance checks

- Home, product directory, category, product detail, quote, privacy and 404 pages return correctly.
- Internal links and local assets have no missing targets.
- A quote request arrives at `sale008@sola-craft.com` and Reply replies to the buyer.
- Reference JPG/PNG/WebP/PDF/AI/EPS/SVG files upload and appear as links in the email.
- `robots.txt`, `sitemap.xml`, canonical URLs and social sharing metadata use `www.haibucrafts.com`.
- No API keys, Blob tokens or `.env` files are committed to GitHub.

## Rollback

Every GitHub push creates a Vercel deployment. If a production release fails acceptance, use Vercel's rollback or promote the previously verified deployment.
