import path from 'node:path';
import { readdir, readFile, stat } from 'node:fs/promises';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['.git', '.vercel', 'node_modules']);

async function walk(dir = ROOT) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, '/');
}

function textMatch(html, regex) {
  const match = html.match(regex);
  return match ? match[1].replace(/\s+/g, ' ').trim() : '';
}

function allMatches(html, regex) {
  return [...html.matchAll(regex)].map(match => match[1]);
}

function stripQueryHash(value) {
  return value.split('#')[0].split('?')[0];
}

function resolveLocal(fromFile, raw) {
  const value = stripQueryHash(raw.trim());
  if (!value || value.startsWith('#') || /^(https?:|mailto:|tel:|javascript:|data:|blob:)/i.test(value)) return null;
  if (value.startsWith('/api/') || value.startsWith('/_vercel/')) return null;
  let candidate;
  if (value.startsWith('/')) candidate = value.slice(1);
  else candidate = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), value));
  if (!candidate || candidate === '.') candidate = 'index.html';
  if (candidate.endsWith('/')) candidate += 'index.html';
  return candidate.replace(/^\.\//, '');
}

function targetExists(target, fileSet) {
  if (!target) return true;
  if (fileSet.has(target)) return true;
  if (!path.posix.extname(target) && fileSet.has(`${target}.html`)) return true;
  if (!path.posix.extname(target) && fileSet.has(`${target}/index.html`)) return true;
  return false;
}

function publicUrlForFile(file) {
  if (file === 'index.html') return 'https://www.haibucrafts.com/';
  if (file.endsWith('/index.html')) return `https://www.haibucrafts.com/${file.slice(0, -10)}`;
  return `https://www.haibucrafts.com/${file}`;
}

export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    const files = await walk();
    const relativeFiles = files.map(rel);
    const fileSet = new Set(relativeFiles);
    const htmlFiles = relativeFiles.filter(file => file.endsWith('.html'));
    const pages = [];
    const brokenReferences = [];

    for (const file of htmlFiles) {
      const html = await readFile(path.join(ROOT, file), 'utf8');
      const title = textMatch(html, /<title>([\s\S]*?)<\/title>/i);
      const description = textMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)
        || textMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
      const canonical = textMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
        || textMatch(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
      const h1Count = (html.match(/<h1\b/gi) || []).length;
      const imgTags = html.match(/<img\b[^>]*>/gi) || [];
      const imagesMissingAlt = imgTags.filter(tag => !/\balt=["'][^"']*["']/i.test(tag)).length;
      const oldCustomServicesCount = (html.match(/>Custom Services</g) || []).length;
      const hasManufacturingNav = /href=["'][^"']*manufacturing\.html["'][^>]*>Manufacturing</i.test(html);
      const hasQualityNav = /href=["'][^"']*quality-control\.html["'][^>]*>Quality Control</i.test(html);
      const hasOgDescription = /property=["']og:description["']/i.test(html);
      const hasTwitterDescription = /name=["']twitter:description["']/i.test(html);
      const hasMainScript = /assets\/js\/main\.js/i.test(html);
      const formControls = html.match(/<(input|select|textarea)\b[^>]*>/gi) || [];
      const unlabeledControls = formControls.filter(tag => {
        if (/type=["']hidden["']/i.test(tag)) return false;
        if (/aria-label=|aria-labelledby=|id=["'][^"']+["']/i.test(tag)) return false;
        return true;
      }).length;

      const refs = [
        ...allMatches(html, /\bhref=["']([^"']+)["']/gi),
        ...allMatches(html, /\bsrc=["']([^"']+)["']/gi)
      ];
      for (const raw of refs) {
        const target = resolveLocal(file, raw);
        if (target && !targetExists(target, fileSet)) {
          brokenReferences.push({ from: file, raw, resolved: target });
        }
      }

      const expectedCanonical = publicUrlForFile(file);
      const issues = [];
      if (!title) issues.push('missing-title');
      if (!description) issues.push('missing-description');
      if (!canonical) issues.push('missing-canonical');
      if (canonical && canonical !== expectedCanonical) issues.push('canonical-mismatch');
      if (h1Count !== 1) issues.push(`h1-count-${h1Count}`);
      if (imagesMissingAlt) issues.push(`images-missing-alt-${imagesMissingAlt}`);
      if (oldCustomServicesCount) issues.push(`old-custom-services-${oldCustomServicesCount}`);
      if (!hasManufacturingNav) issues.push('missing-manufacturing-nav');
      if (!hasQualityNav) issues.push('missing-quality-nav');
      if (!hasOgDescription) issues.push('missing-og-description');
      if (!hasTwitterDescription) issues.push('missing-twitter-description');
      if (!hasMainScript) issues.push('missing-main-script');
      if (unlabeledControls) issues.push(`unlabeled-form-controls-${unlabeledControls}`);
      if (title.length > 65) issues.push('title-too-long');
      if (description.length > 165) issues.push('description-too-long');

      pages.push({
        file,
        title,
        descriptionLength: description.length,
        canonical,
        expectedCanonical,
        h1Count,
        imagesMissingAlt,
        oldCustomServicesCount,
        hasManufacturingNav,
        hasQualityNav,
        hasOgDescription,
        hasTwitterDescription,
        unlabeledControls,
        issues
      });
    }

    let sitemapUrls = [];
    if (fileSet.has('sitemap.xml')) {
      const sitemap = await readFile(path.join(ROOT, 'sitemap.xml'), 'utf8');
      sitemapUrls = allMatches(sitemap, /<loc>([^<]+)<\/loc>/gi);
    }
    const expectedUrls = htmlFiles
      .filter(file => !file.startsWith('google') && file !== '404.html')
      .map(publicUrlForFile);
    const sitemapSet = new Set(sitemapUrls);
    const missingFromSitemap = expectedUrls.filter(url => !sitemapSet.has(url));
    const staleSitemapUrls = sitemapUrls.filter(url => !expectedUrls.includes(url));

    const summary = {
      htmlFiles: htmlFiles.length,
      pagesWithIssues: pages.filter(page => page.issues.length).length,
      brokenReferences: brokenReferences.length,
      missingFromSitemap: missingFromSitemap.length,
      staleSitemapUrls: staleSitemapUrls.length,
      oldCustomServicesPages: pages.filter(page => page.oldCustomServicesCount).length,
      pagesMissingManufacturingNav: pages.filter(page => !page.hasManufacturingNav).length,
      pagesMissingQualityNav: pages.filter(page => !page.hasQualityNav).length,
      pagesMissingOgDescription: pages.filter(page => !page.hasOgDescription).length,
      pagesMissingTwitterDescription: pages.filter(page => !page.hasTwitterDescription).length,
      unlabeledFormControls: pages.reduce((sum, page) => sum + page.unlabeledControls, 0)
    };

    const payload = { summary, brokenReferences, missingFromSitemap, staleSitemapUrls, pages };
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    if (req.method === 'HEAD') res.end();
    else res.end(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error.message || 'Audit failed' }));
  }
}
