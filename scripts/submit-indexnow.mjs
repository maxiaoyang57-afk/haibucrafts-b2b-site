import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ORIGIN, validateConfig, sitemapUrls, normalizeText, digest, changedUrls, verifyProduction, submitUrls } from '../lib/indexnow.js';

const args = process.argv.slice(2);
if (args.some(arg => !['--submit', '--verify'].includes(arg)) || args.length > 1) throw new Error('Usage: npm run indexnow -- [--verify | --submit]. Default: offline dry run.');
const submit = args.includes('--submit');
const verify = submit || args.includes('--verify');
const directory = '.release-candidate/indexnow';
const statePath = `${directory}/state.json`;
const report = { at: new Date().toISOString(), mode: submit ? 'submit' : verify ? 'verify' : 'dry-run', submitted: false };

async function runtimeFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await runtimeFiles(file));
    else if (/\.(js|css|json)$/.test(file)) files.push(file);
  }
  return files.sort();
}

try {
  const config = validateConfig(JSON.parse(await readFile('indexnow.config.json', 'utf8')));
  if (normalizeText(await readFile(`${config.key}.txt`, 'utf8')) !== config.key) throw new Error('Local IndexNow key file does not match configuration.');
  const xml = await readFile('sitemap.xml', 'utf8');
  const urls = sitemapUrls(xml);
  // Shared runtime changes can alter any page. Documentation-only changes do not.
  const runtime = await Promise.all((await runtimeFiles('assets/v2')).map(async file => `${file}:${digest(normalizeText(await readFile(file, 'utf8')))}`));
  const sharedHash = digest(`${config.key}\n${runtime.join('\n')}`);
  const htmlByUrl = new Map();
  const pages = {};
  for (const url of urls) {
    const filename = path.join('.', new URL(url).pathname, 'index.html');
    const html = normalizeText(await readFile(filename, 'utf8'));
    if (!html.includes(`rel="canonical" href="${url}"`) || /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) throw new Error(`Not an indexable self-canonical page: ${url}`);
    htmlByUrl.set(url, html);
    pages[url] = digest(`${sharedHash}\n${html}`);
  }
  let previous = null;
  try { previous = JSON.parse(await readFile(statePath, 'utf8')); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    // One-time accepted Production receipt predates usable Actions cache storage.
    // Retain this immutable baseline so repair/cache eviction cannot re-enroll unchanged pages.
    try {
      previous = JSON.parse(await readFile('docs/indexnow-initial-checkpoint.json', 'utf8'));
      report.restoredFromInitialReceipt = true;
    } catch (baselineError) { if (baselineError.code !== 'ENOENT') throw baselineError; }
  }
  const selected = changedUrls(pages, previous);
  report.urls = selected;
  report.count = selected.length;
  report.initial = previous === null;
  if (verify) {
    await verifyProduction(config, xml);
    // Prevent a delayed/out-of-order deployment event from submitting unpublished HTML.
    for (let offset = 0; offset < selected.length; offset += 6) {
      await Promise.all(selected.slice(offset, offset + 6).map(async url => {
        const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
        if (htmlByUrl.has(url)) {
          if (response.status !== 200 || normalizeText(await response.text()) !== htmlByUrl.get(url)) throw new Error(`Live page differs from checkout: ${url}. No URLs sent.`);
        } else {
          // Removed sitemap pages may be deleted, redirected, or explicitly noindex.
          const html = response.status === 200 ? await response.text() : '';
          if (![301, 302, 307, 308, 404, 410].includes(response.status) && !(response.status === 200 && /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html))) throw new Error(`Removed page is still indexable or unavailable: ${url}. No URLs sent.`);
        }
      }));
    }
    report.productionVerified = true;
  }
  if (submit && selected.length) {
    Object.assign(report, await submitUrls(config, selected));
    report.submitted = true;
  }
  await mkdir(directory, { recursive: true });
  if (submit) await writeFile(statePath, JSON.stringify({ version: 1, origin: ORIGIN, at: report.at, pages }, null, 2) + '\n');
  console.log(`IndexNow ${report.mode}: ${selected.length} URLs; ${report.result || (submit ? 'unchanged, no POST' : 'no URLs sent')}. Receipt is not proof of indexing.`);
} catch (error) {
  report.error = error.message;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2) + '\n');
}
