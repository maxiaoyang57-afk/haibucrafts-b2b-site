# HAIBU CRAFT V48.2 Production Package

Deploy the contents of this folder as the Vercel project root.

## Required Vercel environment variables

- `RESEND_API_KEY`
- `INQUIRY_TO_EMAIL=sale008@sola-craft.com`
- `INQUIRY_FROM_EMAIL=HAIBU CRAFT <inquiry@send.haibucrafts.com>`

Apply the variables to Production, Preview and Development as needed, then redeploy.

## Production behavior

- The public catalog contains 64 unique coded products in four core categories.
- The homepage uses the full-width craft-studio scene with the sales copy and business cards overlaid on the left.
- Inquiry forms POST to `/api/inquiry` and use Resend server-side.
- Reference images are compressed in the browser and attached to the inquiry email.
- The apex domain should continue redirecting to `https://www.haibucrafts.com/` in Vercel Domains.
