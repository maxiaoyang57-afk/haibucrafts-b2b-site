import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const origin = (process.env.SEO_AUDIT_ORIGIN || 'https://www.haibucrafts.com').replace(/\/$/, '');
const attempts = Number(process.env.SEO_AUDIT_ATTEMPTS || 3);
const retryDelayMs = Number(process.env.SEO_AUDIT_RETRY_DELAY_MS || 1000);
const root = process.cwd();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(pathname, options = {}) {
  const url = pathname.startsWith('http') ? pathname : `${origin}${pathname}`;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'manual',
        headers: { 'user-agent': 'haibucraft-production-seo-audit/1.0' },
        ...options
      });
      return { response, url };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(retryDelayMs);
    }
  }
  throw lastError;
}

function sitemapLocations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

function meta(html, name, attribute = 'name') {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<meta[^>]+${attribute}=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'))?.[1]
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attribute}=["']${escaped}["']`, 'i'))?.[1]
    || '';
}

function canonical(html) {
  return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1]
    || '';
}

const errors = [];
const localSitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const expectedUrls = sitemapLocations(localSitemap);

const robotsResult = await request('/robots.txt');
const robotsText = await robotsResult.response.text();
if (robotsResult.response.status !== 200) errors.push(`/robots.txt returned HTTP ${robotsResult.response.status}`);
if (!robotsText.includes(`Sitemap: ${origin}/sitemap.xml`)) errors.push('robots.txt is missing the canonical sitemap directive');
if (!/Disallow:\s*\/v2-preview\//i.test(robotsText)) errors.push('robots.txt must disallow /v2-preview/');

const sitemapResult = await request('/sitemap.xml');
const remoteSitemap = await sitemapResult.response.text();
if (sitemapResult.response.status !== 200) errors.push(`/sitemap.xml returned HTTP ${sitemapResult.response.status}`);
const remoteUrls = sitemapLocations(remoteSitemap);
const expectedSet = new Set(expectedUrls);
const remoteSet = new Set(remoteUrls);
for (const url of expectedSet) if (!remoteSet.has(url)) errors.push(`Production sitemap is missing ${url}`);
for (const url of remoteSet) if (!expectedSet.has(url)) errors.push(`Production sitemap contains unexpected URL ${url}`);
for (const url of remoteUrls) {
  if (!url.startsWith(`${origin}/`)) errors.push(`Production sitemap URL is outside ${origin}: ${url}`);
  if (url.includes('/v2-preview/') || /\.html(?:$|\?)/i.test(url)) errors.push(`Production sitemap contains a legacy/preview URL: ${url}`);
}

const urlsToCheck = [...remoteSet];
const concurrency = 8;
for (let index = 0; index < urlsToCheck.length; index += concurrency) {
  const batch = urlsToCheck.slice(index, index + concurrency);
  await Promise.all(batch.map(async (url) => {
    try {
      const result = await request(url);
      const html = await result.response.text();
      if (result.response.status !== 200) {
        errors.push(`${url} returned HTTP ${result.response.status}`);
        return;
      }
      const expectedCanonical = url;
      if (canonical(html) !== expectedCanonical) errors.push(`${url} canonical mismatch: ${canonical(html) || '(missing)'}`);
      if (!/^index\s*,\s*follow$/i.test(meta(html, 'robots'))) errors.push(`${url} must be index,follow`);
    } catch (error) {
      errors.push(`${url} request failed: ${error.message}`);
    }
  }));
}

const previewResult = await request('/v2-preview/');
const previewHtml = await previewResult.response.text();
if (previewResult.response.status !== 200) errors.push(`/v2-preview/ returned HTTP ${previewResult.response.status}`);
if (!/^noindex\s*,\s*nofollow$/i.test(meta(previewHtml, 'robots'))) errors.push('/v2-preview/ must be noindex,nofollow');
if (canonical(previewHtml)) errors.push('/v2-preview/ must not declare a canonical URL');

const missingPath = `/p0-indexability-audit-missing-${Date.now()}/`;
const missingResult = await request(missingPath);
const missingHtml = await missingResult.response.text();
if (missingResult.response.status !== 404) errors.push(`${missingPath} returned HTTP ${missingResult.response.status}, expected 404`);
if (!/^noindex\s*,\s*follow$/i.test(meta(missingHtml, 'robots'))) errors.push('custom 404 must be noindex,follow');
if (canonical(missingHtml)) errors.push('custom 404 must not declare a canonical URL');

if (errors.length) {
  console.error(`Production indexability audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Production indexability audit passed: ${remoteUrls.length} sitemap URLs are HTTP 200 self-canonical indexable pages; robots, /v2-preview/ and custom 404 checks passed.`);
}
