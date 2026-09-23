import { createHash } from 'node:crypto';

export const ORIGIN = 'https://www.haibucrafts.com';
export const ENDPOINT = 'https://api.indexnow.org/indexnow';
export const normalizeText = text => text.replace(/\r\n/g, '\n').trim();
export const digest = text => createHash('sha256').update(text).digest('hex');

export function validateConfig(config) {
  if (config.origin !== ORIGIN || config.endpoint !== ENDPOINT) throw new Error('IndexNow requires the fixed Production origin and official endpoint.');
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(config.key)) throw new Error('Invalid IndexNow key.');
  return { ...config, keyLocation: `${ORIGIN}/${config.key}.txt` };
}

export function validateUrl(value) {
  const url = new URL(value);
  if (url.origin !== ORIGIN || url.username || url.password || url.search || url.hash || url.href !== value || !url.pathname.endsWith('/') || /%(?:2e|2f|5c)/i.test(value) || /^\/(api|v2-preview|request-quote)(\/|$)/.test(url.pathname)) {
    throw new Error(`Not a canonical Production content URL: ${value}`);
  }
  return value;
}

export function sitemapUrls(xml) {
  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(match => validateUrl(match[1]));
  if (!urls.length || urls.length > 10000 || new Set(urls).size !== urls.length) throw new Error('Sitemap must contain 1-10000 unique canonical URLs.');
  return urls.sort();
}

export function changedUrls(current, previous = null) {
  if (previous && (previous.version !== 1 || previous.origin !== ORIGIN || !previous.pages || typeof previous.pages !== 'object' || Array.isArray(previous.pages))) throw new Error('Invalid IndexNow checkpoint.');
  const oldPages = previous?.pages || {};
  return [...new Set([...Object.keys(current), ...Object.keys(oldPages)])].sort().filter(url => {
    validateUrl(url);
    if (oldPages[url] && !/^[a-f0-9]{64}$/.test(oldPages[url])) throw new Error('Invalid checkpoint fingerprint.');
    return current[url] !== oldPages[url];
  });
}

export async function verifyProduction(config, xml, request = fetch) {
  const get = url => request(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
  const keyResponse = await get(config.keyLocation);
  if (keyResponse.status !== 200 || normalizeText(await keyResponse.text()) !== config.key) throw new Error('Production IndexNow key file is missing or mismatched. No URLs sent.');
  const sitemapResponse = await get(`${ORIGIN}/sitemap.xml`);
  if (sitemapResponse.status !== 200 || normalizeText(await sitemapResponse.text()) !== normalizeText(xml)) throw new Error('Production sitemap differs from this checkout. No URLs sent.');
}

export async function submitUrls(config, urls, request = fetch) {
  if (!urls.length || urls.length > 10000 || new Set(urls).size !== urls.length) throw new Error('Invalid submission size or duplicate URLs.');
  urls.forEach(validateUrl);
  const response = await request(ENDPOINT, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(ORIGIN).host, key: config.key, keyLocation: config.keyLocation, urlList: urls })
  });
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow HTTP ${response.status}; checkpoint not advanced. Check configuration or rate limits before retrying.`);
  return { httpStatus: response.status, result: response.status === 202 ? 'received-key-validation-pending' : 'received', indexed: false };
}
