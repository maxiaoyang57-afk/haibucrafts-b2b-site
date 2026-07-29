import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const previewRoot = path.join(root, 'v2-preview');
const errors = [];

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

function resolvePreviewRoute(route) {
  const clean = route.split('?')[0].split('#')[0];
  if (!clean.startsWith('/v2-preview/')) return null;
  const relative = clean.slice('/v2-preview/'.length);
  return path.join(previewRoot, relative, clean.endsWith('/') ? 'index.html' : '');
}

const components = await readFile(path.join(previewRoot, 'assets', 'components.js'), 'utf8');
const categoryRuntime = await readFile(path.join(previewRoot, 'assets', 'product-category.js'), 'utf8');
const quoteRuntime = await readFile(path.join(previewRoot, 'assets', 'quote-preview.js'), 'utf8');
const quoteConfig = await readFile(path.join(previewRoot, 'assets', 'quote-runtime-config.js'), 'utf8');
const inquiryApi = await readFile(path.join(root, 'api', 'inquiry.js'), 'utf8');

for (const obsolete of ['/blog/wholesale-product-brief/', '/blog/custom-sample-approval/']) {
  if (components.includes(obsolete) || categoryRuntime.includes(obsolete)) errors.push(`obsolete runtime route remains: ${obsolete}`);
}

for (const required of [
  'blog/how-to-prepare-a-wholesale-product-brief/',
  'blog/sample-approval-checklist/',
  'blog/packaging-quality-checkpoints/'
]) {
  if (!components.includes(required) && !categoryRuntime.includes(required)) errors.push(`required buyer-resource route missing from runtime navigation: ${required}`);
}

const literalRoutes = [...categoryRuntime.matchAll(/["'](\/v2-preview\/(?:products|custom-solutions|manufacturing|quality-control|about|blog|quote)\/[^"']*)["']/g)]
  .map((match) => match[1]);
for (const route of literalRoutes) {
  const target = resolvePreviewRoute(route);
  if (target && !await exists(target)) errors.push(`broken runtime route ${route} -> ${path.relative(root, target)}`);
}

for (const marker of [
  "'Content-Type': 'application/json'",
  'JSON.stringify({',
  'fields,',
  'attachments,',
  "payload.message || 'Inquiry could not be sent.'"
]) {
  if (!quoteRuntime.includes(marker)) errors.push(`quote runtime missing API contract marker: ${marker}`);
}

if (!quoteConfig.includes("mode: 'validation-only'")) errors.push('quote runtime must remain validation-only');
if (!quoteConfig.includes('enableReferenceUploads: false')) errors.push('reference uploads must remain disabled');
if (!inquiryApi.includes("article: 'Source Article'")) errors.push('inquiry API is not preserving article attribution');
if (!inquiryApi.includes("product_image: 'Product Image'")) errors.push('inquiry API is not preserving product image attribution');

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`V2 runtime audit passed: ${literalRoutes.length} dynamic routes, corrected buyer-resource links and guarded JSON inquiry contract.`);
}
