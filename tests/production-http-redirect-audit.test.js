import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { auditRedirect } from '../scripts/audit-production-http-redirects.mjs';

async function withServer(handler, callback) {
  const server = createServer(handler);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('production redirect audit accepts one-hop permanent redirects with self-canonical destinations', async () => {
  await withServer((request, response) => {
    if (request.url === '/legacy.html') {
      response.writeHead(308, { location: '/target/' });
      response.end();
      return;
    }
    if (request.url === '/target/') {
      const origin = `http://${request.headers.host}`;
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(`<link rel="canonical" href="${origin}/target/">`);
      return;
    }
    response.writeHead(404);
    response.end();
  }, async (origin) => {
    const result = await auditRedirect({
      origin,
      redirect: { source: '/legacy.html', destination: '/target/', permanent: true }
    });
    assert.deepEqual(result.errors, []);
  });
});

test('production redirect audit rejects chains and non-200 destinations', async () => {
  await withServer((request, response) => {
    if (request.url === '/legacy.html') {
      response.writeHead(308, { location: '/intermediate/' });
      response.end();
      return;
    }
    if (request.url === '/intermediate/') {
      response.writeHead(308, { location: '/target/' });
      response.end();
      return;
    }
    response.writeHead(404);
    response.end();
  }, async (origin) => {
    const result = await auditRedirect({
      origin,
      redirect: { source: '/legacy.html', destination: '/intermediate/', permanent: true }
    });
    assert.ok(result.errors.some((error) => error.includes('redirect chain continues')));
  });
});
