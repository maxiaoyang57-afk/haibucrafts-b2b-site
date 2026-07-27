import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const ROOT = process.cwd();
const PARTS = [
  'blog-replica-00.txt',
  'blog-replica-01.txt',
  'blog-replica-02.txt',
  ...Array.from({ length: 16 }, (_, index) =>
    `blog-replica-tail-${String(index).padStart(2, '0')}.txt`
  )
];

let bundleCache;

async function loadBundle() {
  if (bundleCache) return bundleCache;
  const chunks = await Promise.all(
    PARTS.map(name => readFile(path.join(ROOT, 'assets', 'data', name), 'utf8'))
  );
  const encoded = chunks.join('').replace(/\s+/g, '');
  const compressed = Buffer.from(encoded, 'base64');
  const json = gunzipSync(compressed).toString('utf8');
  bundleCache = JSON.parse(json);
  return bundleCache;
}

function normalizeFile(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  let file = decodeURIComponent(String(raw || 'blog/index.html').split('?')[0].split('#')[0]);
  file = file.replace(/^\/+/, '');
  if (!file || file.endsWith('/')) file += 'index.html';
  file = path.posix.normalize(file);
  if (file.startsWith('../') || path.isAbsolute(file)) throw new Error('Invalid replica path.');
  return file;
}

function contentType(file) {
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js')) return 'application/javascript; charset=utf-8';
  return 'text/html; charset=utf-8';
}

export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    res.setHeader('Allow', 'GET, HEAD');
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  try {
    const file = normalizeFile(req.query?.file);
    const bundle = await loadBundle();
    const content = bundle[file];

    if (content === undefined) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Page not found.');
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType(file));
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-HAIBU-Blog-Replica', 'browser-export-v1');
    if (req.method === 'HEAD') res.end();
    else res.end(content);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Replica could not be loaded.');
  }
}
