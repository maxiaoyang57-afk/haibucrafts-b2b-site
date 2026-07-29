import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const releaseRoot = path.join(root, '.release-candidate', 'site-v2');
const errors = [];
const warnings = [];
const titles = new Map();
const descriptions = new Map();

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

function collectAttributes(html, attribute) {
  const regex = new RegExp(`${attribute}=["']([^"']+)["']`, 'gi');
  return [...html.matchAll(regex)].map((match) => match[1]);
}

function isExternal(value) {
  return /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(value);
}

function resolveTarget(sourceFile, rawValue) {
  const value = rawValue.split('#')[0].split('?')[0];
  if (!value || value === '/') return path.join(releaseRoot, 'index.html');
  if (value.startsWith('/assets/images/')) return path.join(root, value.slice(1));
  if (value.startsWith('/')) {
    const relative = value.slice(1);
    if (path.extname(relative)) return path.join(releaseRoot, relative);
    return path.join(releaseRoot, relative, 'index.html');
  }
  const resolved = path.resolve(path.dirname(sourceFile), value);
  return value.endsWith('/') ? path.join(resolved, 'index.html') : resolved;
}

if (!await exists(releaseRoot)) {
  console.error('ERROR: release candidate directory does not exist. Run build-v2-release-candidate.mjs first.');
  process.exit(1);
}

const files = await walk(releaseRoot);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const relative = path.relative(releaseRoot, file);
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.trim();
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]?.trim();
  const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1]?.trim();

  if (html.includes('/v2-preview/')) errors.push(`${relative}: contains preview path`);
  if (/Site V2 Preview|Preview branch only|V2 preview/i.test(html)) errors.push(`${relative}: contains preview-only copy`);
  if (!title) errors.push(`${relative}: missing title`);
  if (!description) errors.push(`${relative}: missing description`);
  if (!canonical?.startsWith('https://www.haibucrafts.com/')) errors.push(`${relative}: missing or invalid canonical`);
  if (!robots) errors.push(`${relative}: missing robots directive`);
  if (relative === 'request-quote/index.html') {
    if (robots !== 'noindex,follow') errors.push(`${relative}: quote page must remain noindex,follow`);
  } else if (robots !== 'index,follow') {
    errors.push(`${relative}: approved production page must be index,follow`);
  }

  if (title) {
    if (titles.has(title)) errors.push(`${relative}: duplicate title also used by ${titles.get(title)}`);
    else titles.set(title, relative);
  }
  if (description) {
    if (descriptions.has(description)) errors.push(`${relative}: duplicate description also used by ${descriptions.get(description)}`);
    else descriptions.set(description, relative);
  }

  for (const href of collectAttributes(html, 'href')) {
    if (isExternal(href) || href.startsWith('#')) continue;
    const target = resolveTarget(file, href);
    if (!await exists(target)) errors.push(`${relative}: broken href ${href}`);
  }
  for (const src of collectAttributes(html, 'src')) {
    if (isExternal(src)) continue;
    const target = resolveTarget(file, src);
    if (!await exists(target)) errors.push(`${relative}: broken src ${src}`);
  }
}

const quoteConfig = path.join(releaseRoot, 'assets', 'v2', 'quote-runtime-config.js');
if (!await exists(quoteConfig)) errors.push('missing quote runtime configuration');
else {
  const config = await readFile(quoteConfig, 'utf8');
  if (!config.includes("mode: 'validation-only'")) errors.push('release candidate quote mode must remain validation-only');
  if (!config.includes("endpoint: '/api/inquiry'")) errors.push('quote endpoint contract is missing');
  if (!config.includes('enableReferenceUploads: false')) errors.push('reference uploads must remain disabled in release candidate');
}

const sitemap = await readFile(path.join(releaseRoot, 'sitemap.xml'), 'utf8');
if (sitemap.includes('/request-quote/') || sitemap.includes('/v2-preview/')) errors.push('sitemap includes excluded inquiry or preview URL');
const robotsText = await readFile(path.join(releaseRoot, 'robots.txt'), 'utf8');
for (const required of ['Disallow: /request-quote/', 'Disallow: /api/', 'Disallow: /v2-preview/']) {
  if (!robotsText.includes(required)) errors.push(`robots.txt missing ${required}`);
}

for (const warning of warnings) console.warn(`WARNING: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Release candidate audit passed: ${htmlFiles.length} HTML pages, unique metadata, valid local links, guarded quote mode and SEO exclusions.`);
}
