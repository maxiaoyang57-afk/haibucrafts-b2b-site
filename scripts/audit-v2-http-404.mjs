import { access, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';

const releaseRoot = path.join(process.cwd(), '.release-candidate', 'site-v2');
const notFoundFile = path.join(releaseRoot, '404.html');
const notFoundHtml = await readFile(notFoundFile, 'utf8');

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

function candidateFile(pathname) {
  if (pathname === '/') return path.join(releaseRoot, 'index.html');
  const relative = pathname.replace(/^\/+/, '');
  if (path.extname(relative)) return path.join(releaseRoot, relative);
  return path.join(releaseRoot, relative, 'index.html');
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
  const file = candidateFile(pathname);
  if (await exists(file)) {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(await readFile(file));
    return;
  }
  response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
  response.end(notFoundHtml);
});

await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

try {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/seo-audit-missing-${Date.now()}/`);
  const body = await response.text();
  if (response.status !== 404) throw new Error(`Expected HTTP 404, received ${response.status}`);
  if (!body.includes('The requested page could not be found.')) throw new Error('Custom HAIBUCRAFT 404 content was not returned');
  if (!/<meta\s+name="robots"\s+content="noindex,follow">/i.test(body)) throw new Error('404 response is missing noindex,follow');
  if (/<link\s+rel="canonical"/i.test(body)) throw new Error('404 response must not declare a canonical');
  console.log('HTTP 404 audit passed: unknown route returned status 404 with custom HAIBUCRAFT noindex,follow page and no canonical.');
} finally {
  await new Promise((resolve) => server.close(resolve));
}
