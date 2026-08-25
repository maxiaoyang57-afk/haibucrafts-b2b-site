import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const releaseRoot = path.join(root, '.release-candidate', 'site-v2');
const origin = (process.env.PRODUCTION_ORIGIN || 'https://www.haibucrafts.com').replace(/\/+$/, '');
const maxAttempts = Number.parseInt(process.env.SYNC_ATTEMPTS || '24', 10);
const delayMs = Number.parseInt(process.env.SYNC_DELAY_MS || '15000', 10);
const requestTimeoutMs = Number.parseInt(process.env.SYNC_REQUEST_TIMEOUT_MS || '20000', 10);
const reportPath = path.join(root, '.sync-audit.json');
const excludedReleaseFiles = new Set(['acceptance-report.md', 'release-manifest.json', 'vercel.json', '404.html']);
const textExtensions = new Set(['.html', '.css', '.js', '.xml', '.txt', '.json']);
const assetPattern = /\/(?:assets|brand)\/[A-Za-z0-9._~!$&'()*+,;=:@%/\-]+\.(?:avif|webp|png|jpe?g|gif|svg|ico|mp4|webm|css|js)(?:\?[^"'()\s<>]*)?/gi;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function relativeToUrl(relative) {
  const normalized = relative.split(path.sep).join('/');
  if (normalized === 'index.html') return '/';
  if (normalized.endsWith('/index.html')) return `/${normalized.slice(0, -'index.html'.length)}`;
  return `/${normalized}`;
}

function withCacheBuster(urlPath, token) {
  const url = new URL(urlPath, origin);
  url.searchParams.set('__haibu_sync', token);
  return url;
}

async function fetchBytes(urlPath, token) {
  const url = withCacheBuster(urlPath, token);
  const response = await fetch(url, {
    redirect: 'manual',
    headers: {
      'cache-control': 'no-cache, no-store, max-age=0',
      pragma: 'no-cache',
      'user-agent': 'HAIBUCRAFT-Production-Sync-Audit/1.0'
    },
    signal: AbortSignal.timeout(requestTimeoutMs)
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    status: response.status,
    bytes,
    headers: {
      age: response.headers.get('age'),
      cache: response.headers.get('x-vercel-cache'),
      etag: response.headers.get('etag'),
      server: response.headers.get('server'),
      vercelId: response.headers.get('x-vercel-id')
    }
  };
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function buildTargets() {
  if (!await exists(releaseRoot)) {
    throw new Error('Release Candidate is missing. Run npm run build:v2-release before the live sync audit.');
  }

  const releaseFiles = (await walk(releaseRoot))
    .filter((filePath) => !excludedReleaseFiles.has(path.basename(filePath)))
    .sort();

  const targetsByUrl = new Map();
  for (const filePath of releaseFiles) {
    const relative = path.relative(releaseRoot, filePath);
    const urlPath = relativeToUrl(relative);
    targetsByUrl.set(urlPath, { urlPath, localPath: filePath, source: 'release-candidate' });
  }

  const referencedAssets = new Set();
  for (const filePath of releaseFiles) {
    if (!textExtensions.has(path.extname(filePath).toLowerCase())) continue;
    const content = await readFile(filePath, 'utf8');
    for (const match of content.matchAll(assetPattern)) {
      const rawPath = match[0].split(/[?#]/, 1)[0];
      referencedAssets.add(rawPath);
    }
  }

  const missingLocalAssets = [];
  for (const urlPath of [...referencedAssets].sort()) {
    if (targetsByUrl.has(urlPath)) continue;
    const relative = decodeURIComponent(urlPath.replace(/^\//, ''));
    const localPath = path.join(root, relative);
    if (!localPath.startsWith(root + path.sep)) {
      missingLocalAssets.push({ urlPath, reason: 'unsafe-local-path' });
      continue;
    }
    if (!await exists(localPath)) {
      missingLocalAssets.push({ urlPath, reason: 'missing-local-asset' });
      continue;
    }
    targetsByUrl.set(urlPath, { urlPath, localPath, source: 'referenced-root-asset' });
  }

  return {
    targets: [...targetsByUrl.values()].sort((a, b) => a.urlPath.localeCompare(b.urlPath)),
    missingLocalAssets
  };
}

async function compareTarget(target, token) {
  const localBytes = await readFile(target.localPath);
  const expectedHash = sha256(localBytes);
  try {
    const remote = await fetchBytes(target.urlPath, token);
    if (remote.status !== 200) {
      return {
        ok: false,
        urlPath: target.urlPath,
        source: target.source,
        reason: `HTTP ${remote.status}`,
        expectedHash,
        actualHash: sha256(remote.bytes),
        headers: remote.headers
      };
    }

    const actualHash = sha256(remote.bytes);
    if (!localBytes.equals(remote.bytes)) {
      return {
        ok: false,
        urlPath: target.urlPath,
        source: target.source,
        reason: 'content-hash-mismatch',
        expectedHash,
        actualHash,
        expectedBytes: localBytes.length,
        actualBytes: remote.bytes.length,
        headers: remote.headers
      };
    }

    return { ok: true, urlPath: target.urlPath, source: target.source, hash: actualHash, headers: remote.headers };
  } catch (error) {
    return {
      ok: false,
      urlPath: target.urlPath,
      source: target.source,
      reason: `request-error: ${error instanceof Error ? error.message : String(error)}`,
      expectedHash
    };
  }
}

function selectSentinels(targets) {
  const wanted = new Set([
    '/',
    '/products/',
    '/products/slime-charms-wholesale/',
    '/products/polymer-clay-slices-wholesale/',
    '/products/resin-charms-for-slime/',
    '/products/sequins-glitter-confetti/',
    '/sitemap.xml',
    '/robots.txt'
  ]);
  return targets.filter((target) => wanted.has(target.urlPath));
}

async function writeReport(report) {
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

const startedAt = new Date().toISOString();
const gitSha = process.env.GITHUB_SHA || null;
const { targets, missingLocalAssets } = await buildTargets();
const sentinels = selectSentinels(targets);

if (sentinels.length < 8) {
  throw new Error(`Live sync audit configuration error: expected 8 sentinels, found ${sentinels.length}.`);
}

if (missingLocalAssets.length) {
  const report = {
    status: 'failed',
    origin,
    gitSha,
    startedAt,
    finishedAt: new Date().toISOString(),
    targetCount: targets.length,
    reason: 'referenced assets are missing locally',
    mismatches: missingLocalAssets
  };
  await writeReport(report);
  console.error(`Production sync audit failed before network checks: ${missingLocalAssets.length} referenced local asset(s) are missing.`);
  process.exit(1);
}

let sentinelResults = [];
let sentinelAttempt = 0;
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  sentinelAttempt = attempt;
  const token = `${Date.now()}-${attempt}-${gitSha || 'local'}`;
  sentinelResults = await mapLimit(sentinels, 4, (target) => compareTarget(target, token));
  const mismatches = sentinelResults.filter((result) => !result.ok);
  if (!mismatches.length) break;

  console.log(`Production has not converged to this repository state yet (attempt ${attempt}/${maxAttempts}; ${mismatches.length} sentinel mismatch(es)).`);
  for (const mismatch of mismatches.slice(0, 8)) {
    console.log(`- ${mismatch.urlPath}: ${mismatch.reason}`);
  }
  if (attempt < maxAttempts) await sleep(delayMs);
}

const sentinelMismatches = sentinelResults.filter((result) => !result.ok);
if (sentinelMismatches.length) {
  const report = {
    status: 'failed',
    origin,
    gitSha,
    startedAt,
    finishedAt: new Date().toISOString(),
    phase: 'sentinel-convergence',
    attempts: sentinelAttempt,
    targetCount: targets.length,
    mismatches: sentinelMismatches
  };
  await writeReport(report);
  console.error(`Production sync audit failed: live Production did not converge after ${sentinelAttempt} attempt(s).`);
  process.exit(1);
}

const fullToken = `${Date.now()}-full-${gitSha || 'local'}`;
const fullResults = await mapLimit(targets, 8, (target) => compareTarget(target, fullToken));
const fullMismatches = fullResults.filter((result) => !result.ok);

const report = {
  status: fullMismatches.length ? 'failed' : 'passed',
  origin,
  gitSha,
  startedAt,
  finishedAt: new Date().toISOString(),
  sentinelAttempts: sentinelAttempt,
  targetCount: targets.length,
  releaseCandidateTargets: targets.filter((target) => target.source === 'release-candidate').length,
  referencedRootAssets: targets.filter((target) => target.source === 'referenced-root-asset').length,
  mismatches: fullMismatches
};
await writeReport(report);

if (fullMismatches.length) {
  console.error(`Production sync audit failed: ${fullMismatches.length}/${targets.length} live file(s) differ from the exact repository release candidate.`);
  for (const mismatch of fullMismatches.slice(0, 25)) {
    console.error(`- ${mismatch.urlPath}: ${mismatch.reason}`);
  }
  process.exit(1);
}

console.log(`Production sync audit passed: ${targets.length} live files match the exact release candidate/reference assets byte-for-byte after ${sentinelAttempt} convergence attempt(s).`);
