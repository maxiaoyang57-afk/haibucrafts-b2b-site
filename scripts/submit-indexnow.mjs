import { readFile } from 'node:fs/promises';
import process from 'node:process';

const key = process.env.INDEXNOW_KEY;
const origin = 'https://www.haibucrafts.com';
const sitemap = await readFile('sitemap.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const requested = process.argv.slice(2).filter((value) => value.startsWith(origin));
const urlList = requested.length ? requested : urls;

if (!key) {
  console.log(`IndexNow dry run: ${urlList.length} URLs ready. Set INDEXNOW_KEY only after the matching key file is publicly available at ${origin}/<key>.txt.`);
  process.exit(0);
}
if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) throw new Error('INDEXNOW_KEY has an invalid format.');

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'www.haibucrafts.com', key, keyLocation: `${origin}/${key}.txt`, urlList })
});
if (!response.ok) throw new Error(`IndexNow returned HTTP ${response.status}: ${await response.text()}`);
console.log(`IndexNow accepted ${urlList.length} URLs with HTTP ${response.status}.`);
