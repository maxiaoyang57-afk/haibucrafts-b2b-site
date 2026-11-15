import assert from 'node:assert/strict';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const repo = process.env.GITHUB_REPOSITORY?.toLowerCase();
const configs = {
  'maxiaoyang57-afk/haibucrafts-b2b-site': {
    projectId: 'prj_j38PdlTR7a2ttO8C65McjnSlIcq9',
    project: 'haibucrafts-b2b-site',
    catalog: '/assets/v2/product-catalog.json',
    productFile: /^products\/[a-z0-9-]+\/[a-z0-9-]+\/index\.html$/,
    kind: 'haibu',
  },
  'maxiaoyang57-afk/qula-craft-website': {
    projectId: 'prj_TquN2xczQTju0lCD5Hu4WuTkPA22',
    project: 'qula-craft',
    catalog: '/assets/data/product-catalog.json',
    productFile: /^p-[a-z0-9-]+\.html$/,
    kind: 'qula',
  },
};
const teamId = 'team_oHAx8aiSgoTCj9qaFpP3AytT';
const teamSlug = 'maxiaoyang57-9776s-projects';
const site = configs[repo];
assert(site, 'Unexpected GitHub repository');
const artifact = join(process.env.RUNNER_TEMP, 'catalog-preview-target.json');

async function api(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  assert(res.ok, new URL(url).hostname + ' API returned HTTP ' + res.status);
  return res.json();
}

async function resolve() {
  const number = process.env.PR_NUMBER;
  assert(/^[1-9]\d*$/.test(number ?? ''), 'Invalid PR number');
  const ghToken = process.env.GH_TOKEN;
  assert(ghToken, 'GitHub token is missing');
  const prApi = 'https://api.github.com/repos/' + repo + '/pulls/' + number;
  const pr = await api(prApi, ghToken);
  assert(pr.state === 'open' || (!process.env.EXPECTED_HEAD && pr.merged),
    'Expected an open product PR or a manual replay of a merged product PR');
  assert(pr.base.ref === 'main' && pr.head.repo?.full_name.toLowerCase() === repo &&
    /^products\/monica-batch[0-9]+-[0-9]{8}$/.test(pr.head.ref), 'Unexpected product PR source');
  const head = pr.head.sha;
  assert(/^[0-9a-f]{40}$/.test(head), 'Invalid PR head');
  assert(!process.env.EXPECTED_HEAD || process.env.EXPECTED_HEAD === head, 'PR head changed');
  await appendFile(process.env.GITHUB_OUTPUT, 'head=' + head + '\n');

  const productPaths = [];
  for (let page = 1; page <= Math.ceil(pr.changed_files / 100); page++) {
    const files = await api(prApi + '/files?per_page=100&page=' + page, ghToken);
    for (const file of files) {
      if (file.status === 'added' && site.productFile.test(file.filename)) {
        productPaths.push('/' + file.filename.replace(/\/index\.html$/, '/'));
      }
    }
  }
  assert(productPaths.length > 0, 'No new product detail pages in this PR');
  const token = process.env.VERCEL_TOKEN;
  assert(token, 'Configure VERCEL_TOKEN in the catalog-preview environment');
  const query = new URLSearchParams({ projectId: site.projectId, teamId, sha: head, limit: '20' });
  const [owner, name] = repo.split('/');
  const hostPattern = new RegExp('^' + site.project + '-[a-z0-9]+-' + teamSlug + '\\.vercel\\.app$');
  const until = Date.now() + 5 * 60_000;
  while (Date.now() < until) {
    const { deployments } = await api('https://api.vercel.com/v7/deployments?' + query, token);
    const preview = deployments.find(d => d.state === 'READY' &&
      (!d.projectId || d.projectId === site.projectId) &&
      (d.target === null || d.target === 'preview') && d.name === site.project &&
      d.meta?.githubCommitSha === head && d.meta?.githubCommitRef === pr.head.ref &&
      d.meta?.githubOrg?.toLowerCase() === owner && d.meta?.githubRepo?.toLowerCase() === name &&
      /^dpl_[A-Za-z0-9]+$/.test(d.uid ?? d.id ?? '') && hostPattern.test(d.url ?? ''));
    if (preview) {
      const deploymentId = preview.uid ?? preview.id;
      await writeFile(artifact, JSON.stringify({
        origin: 'https://' + preview.url, deploymentId, head, productPaths,
      }));
      return;
    }
    await delay(10_000);
  }
  throw new Error('No matching ready Vercel Preview within five minutes');
}

async function previewProducts(context, target) {
  const response = await context.request.get(target.origin + site.catalog, { maxRedirects: 0 });
  assert(response.ok(), 'Preview catalog could not be opened');
  const catalog = await response.json();
  const entries = site.kind === 'haibu' ? catalog.products : catalog.categories.flatMap(c => c.products);
  const paths = new Set(target.productPaths);
  const products = entries.flatMap(item => {
    const path = site.kind === 'haibu' ? item.productionPath : '/' + item.pdp?.replace(/^\//, '');
    return paths.has(path) ? [{ path, sku: item.sku }] : [];
  });
  assert(products.length === paths.size && new Set(products.map(p => p.path)).size === paths.size,
    'New product pages and Preview catalog differ');
  return products;
}

async function checkProduct(page, target, product, width) {
  const { origin } = target;
  const { path, sku } = product;
  const isHaibu = site.kind === 'haibu';
  assert(/^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/.test(sku), 'Invalid SKU in Preview catalog');
  const searchPath = isHaibu ? path.slice(0, path.slice(0, -1).lastIndexOf('/') + 1) : '/products.html';
  await page.goto(origin + searchPath, { waitUntil: 'domcontentloaded' });
  assert.equal(new URL(page.url()).origin, origin, 'Search left the verified Preview');
  const banner = page.getByRole('button', { name: /^Decline analytics/ });
  await banner.waitFor({ state: 'visible', timeout: 1_500 }).catch(() => {});
  if (await banner.isVisible()) await banner.click();
  const search = isHaibu ? page.getByPlaceholder('Search name or product code…') :
    page.getByRole('searchbox', { name: 'Search product catalog' });
  await search.fill(sku);
  const result = page.getByRole('link').filter({ hasText: sku }).and(page.locator(
    'a[href$="' + (isHaibu ? path : path.slice(1)) + '"]',
  )).first();
  await result.waitFor({ state: 'visible' });
  await result.click();
  await page.waitForURL(origin + path);
  assert.equal(await page.evaluate(() => innerWidth), width);
  const title = (await page.locator('h1').innerText()).trim();
  assert(title.includes(sku), 'Product identity does not match the search result');

  const quote = isHaibu ? page.getByRole('link', { name: 'Request Quote for ' + sku, exact: true }) :
    page.getByRole('link', { name: new RegExp('^Request Quote for ' + sku + '(?: |$)') });
  const quoteUrl = new URL(await quote.getAttribute('href'), page.url());
  assert.equal(quoteUrl.origin, origin);
  const params = isHaibu ? quoteUrl.searchParams : new URLSearchParams(quoteUrl.hash.replace(/^#rfq:/, ''));
  assert.equal(params.get(isHaibu ? 'product_code' : 'sku'), sku);
  const image = params.get('image');
  assert(image, 'Quote image is missing');
  const expectedImage = new URL(image, origin + '/');
  assert.equal(expectedImage.origin, origin);
  const imageStem = expectedImage.pathname.replace(/-0?1\.jpg$/, '');
  assert.notEqual(imageStem, expectedImage.pathname, 'Unexpected gallery filename');
  for (let i = 1; i <= 3; i++) {
    const file = imageStem + (isHaibu ? '-0' : '-') + i + '.jpg';
    if (isHaibu) {
      await page.getByRole('button', { name: 'Show image ' + i + ' of 3' }).click();
      await page.waitForFunction(f => {
        const main = document.querySelector('.product-detail-media img');
        return main?.naturalWidth > 0 && new URL(main.src).pathname === f;
      }, file, { timeout: 8_000 });
    } else {
      await page.locator('.gallery-main img, .gallery-row img').nth(i - 1).click();
      await page.getByRole('button', { name: 'Close image', exact: true }).waitFor();
      await page.waitForFunction(f => [...document.images].some(img =>
        img.getAttribute('src') === location.origin + f && img.naturalWidth > 0), file, { timeout: 8_000 });
      await page.getByRole('button', { name: 'Close image', exact: true }).click();
    }
  }

  if (isHaibu) {
    await page.getByRole('button', { name: 'Add to quote: ' + sku, exact: true }).click();
    await page.getByRole('link', { name: /^Review quote list, [1-9]/ }).click();
    await page.waitForURL(url => url.origin === origin && url.pathname === '/request-quote/');
    await page.waitForFunction(({ s, t }) => document.querySelector('#productField')?.value === s &&
      document.querySelector('#productNameField')?.value === t, { s: sku, t: title });
    await page.getByRole('button', { name: 'Remove ' + sku + ' from quote list', exact: true }).waitFor();
  } else {
    await quote.click();
    await page.waitForURL(quoteUrl.href);
    await page.waitForFunction(({ s, t }) => {
      const message = document.querySelector('#message')?.value ?? '';
      return message.includes(s) && message.includes(t);
    }, { s: sku, t: title });
  }
  await page.waitForFunction(expected => [...document.images].some(img =>
    new URL(img.src).pathname === expected && img.naturalWidth > 0), expectedImage.pathname);
  if (isHaibu) await page.getByRole('button', { name: 'Remove ' + sku + ' from quote list', exact: true }).click();
}

async function runBrowser() {
  const target = JSON.parse(await readFile(artifact, 'utf8'));
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  assert(secret, 'Configure VERCEL_AUTOMATION_BYPASS_SECRET in the catalog-preview environment');
  const engine = pathToFileURL(join(process.env.RUNNER_TEMP,
    'catalog-preview-engine/node_modules/playwright/index.mjs'));
  const { chromium } = await import(engine.href);
  const browser = await chromium.launch();
  try {
    for (const width of [375, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 },
        hasTouch: width === 375, isMobile: width === 375, serviceWorkers: 'block' });
      try {
        const auth = await context.request.get(target.origin + '/', {
          headers: { 'x-vercel-protection-bypass': secret, 'x-vercel-set-bypass-cookie': 'true' },
          maxRedirects: 0,
        });
        assert(auth.ok() || [301, 302, 303, 307, 308].includes(auth.status()),
          'Preview access was rejected');
        // Only same-origin read requests are allowed. There is no path to submit a real inquiry.
        await context.route('**/*', route => {
          const req = route.request();
          return new URL(req.url()).origin === target.origin && ['GET', 'HEAD'].includes(req.method())
            ? route.continue() : route.abort();
        });
        const products = await previewProducts(context, target);
        const page = await context.newPage();
        page.setDefaultTimeout(10_000);
        for (const product of products) {
          await checkProduct(page, target, product, width);
          console.log(width + 'px: ' + product.sku + ' search, gallery and quote passed');
        }
      } finally {
        await context.close();
      }
    }
    await appendFile(process.env.GITHUB_STEP_SUMMARY,
      'Verified both widths on Preview ' + target.deploymentId + ' at commit `' + target.head + '`.\n');
  } finally {
    await browser.close();
  }
}

try {
  assert(['resolve', 'browser'].includes(process.argv[2]), 'Expected resolve or browser');
  await (process.argv[2] === 'resolve' ? resolve() : runBrowser());
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
