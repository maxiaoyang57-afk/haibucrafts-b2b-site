import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

const DEFAULT_ORIGIN = 'https://www.haibucrafts.com';
const PERMANENT_STATUSES = new Set([301, 308]);
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function normalizedOrigin(value) {
  const url = new URL(value || DEFAULT_ORIGIN);
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url.href.replace(/\/$/, '');
}

async function requestManual(url, { fetchImpl = fetch, timeoutMs = 15_000 } = {}) {
  return fetchImpl(url, {
    redirect: 'manual',
    cache: 'no-store',
    headers: {
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'user-agent': 'HAIBUCRAFT-Production-Redirect-Audit/1.0'
    },
    signal: AbortSignal.timeout(timeoutMs)
  });
}

function canonicalFrom(html) {
  return html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]?.trim() || '';
}

export async function auditRedirect({ origin, redirect, fetchImpl = fetch, timeoutMs = 15_000 }) {
  const sourceUrl = new URL(redirect.source, `${origin}/`).href;
  const expectedUrl = new URL(redirect.destination, `${origin}/`).href;
  const errors = [];
  const sourceResponse = await requestManual(sourceUrl, { fetchImpl, timeoutMs });
  const location = sourceResponse.headers.get('location');
  const actualUrl = location ? new URL(location, sourceUrl).href : '';

  if (!PERMANENT_STATUSES.has(sourceResponse.status)) {
    errors.push(`${redirect.source}: expected 301/308, received ${sourceResponse.status}`);
  }
  if (actualUrl !== expectedUrl) {
    errors.push(`${redirect.source}: expected Location ${expectedUrl}, received ${actualUrl || '(missing)'}`);
  }

  if (actualUrl) {
    const destinationResponse = await requestManual(actualUrl, { fetchImpl, timeoutMs });
    const destinationLocation = destinationResponse.headers.get('location');
    if (REDIRECT_STATUSES.has(destinationResponse.status) || destinationLocation) {
      errors.push(`${redirect.source}: redirect chain continues from ${actualUrl}`);
    } else if (destinationResponse.status !== 200) {
      errors.push(`${redirect.source}: final destination returned ${destinationResponse.status}`);
    } else if ((destinationResponse.headers.get('content-type') || '').includes('text/html')) {
      const canonical = canonicalFrom(await destinationResponse.text());
      if (canonical !== expectedUrl) {
        errors.push(`${redirect.source}: final canonical expected ${expectedUrl}, received ${canonical || '(missing)'}`);
      }
    }
  }

  return { source: redirect.source, destination: redirect.destination, errors };
}

async function runOnce({ origin, redirects, timeoutMs }) {
  const results = await Promise.all(
    redirects.map((redirect) => auditRedirect({ origin, redirect, timeoutMs }))
  );
  const errors = results.flatMap((result) => result.errors);

  const missingPath = `/production-redirect-audit-missing-${Date.now()}/`;
  const missingResponse = await requestManual(new URL(missingPath, `${origin}/`).href, { timeoutMs });
  const missingHtml = await missingResponse.text();
  if (missingResponse.status !== 404) errors.push(`${missingPath}: expected 404, received ${missingResponse.status}`);
  if (!/<meta\s+name=["']robots["']\s+content=["']noindex,follow["']/i.test(missingHtml)) {
    errors.push(`${missingPath}: custom 404 is missing noindex,follow`);
  }
  if (/<link\s+rel=["']canonical["']/i.test(missingHtml)) {
    errors.push(`${missingPath}: custom 404 must not declare a canonical`);
  }

  return errors;
}

export async function runProductionRedirectAudit({
  origin = normalizedOrigin(process.env.SEO_AUDIT_ORIGIN),
  attempts = Number(process.env.SEO_AUDIT_ATTEMPTS || 1),
  retryDelayMs = Number(process.env.SEO_AUDIT_RETRY_DELAY_MS || 10_000),
  timeoutMs = Number(process.env.SEO_AUDIT_TIMEOUT_MS || 15_000)
} = {}) {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const redirects = config.redirects || [];
  let errors = [];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    errors = await runOnce({ origin, redirects, timeoutMs });
    if (!errors.length) {
      console.log(`Production redirect audit passed: ${redirects.length}/${redirects.length} routes are one-hop permanent redirects to HTTP 200 self-canonical destinations; custom 404 passed.`);
      return;
    }
    if (attempt < attempts) {
      console.warn(`Production redirect audit attempt ${attempt}/${attempts} found ${errors.length} issue(s); retrying after deployment propagation.`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw new Error(`Production redirect audit failed for ${origin}:\n- ${errors.join('\n- ')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runProductionRedirectAudit();
}
