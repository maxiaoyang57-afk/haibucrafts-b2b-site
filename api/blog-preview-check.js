import sitePreviewSafe from './site-preview-safe.js';

function createCaptureResponse() {
  const headers = new Map();
  let body = '';
  return {
    statusCode: 200,
    setHeader(name, value) { headers.set(String(name).toLowerCase(), value); },
    getHeader(name) { return headers.get(String(name).toLowerCase()); },
    end(chunk = '') { if (chunk !== undefined && chunk !== null) body += String(chunk); },
    snapshot() { return { statusCode: this.statusCode, headers, body }; }
  };
}

export default async function handler(req, res) {
  const capture = createCaptureResponse();
  await sitePreviewSafe({ method: 'GET', query: { file: 'blog/index.html' } }, capture);
  const result = capture.snapshot();
  const html = result.body;
  const classes = [...html.matchAll(/blog-sprite-[1-5]/g)].map(match => match[0]);
  const uniqueClasses = [...new Set(classes)].sort();
  const oldSources = [
    'homecard-8-space-charms.webp',
    'hc001-school-theme-polymer-clay-mix.webp',
    'slime-charms-b2b-banner.webp',
    'sc004-space-candy-adventure-charms.webp',
    'homecard-1-mermaid-sequins.webp'
  ].filter(source => html.includes(source));

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({
    generatedStatus: result.statusCode,
    rendererMode: result.headers.get('x-preview-blog-images') || null,
    hasSpriteStyle: html.includes('id="blog-sprite-style"'),
    spriteEndpointReferenced: html.includes("url('/api/blog-sprite')"),
    uniqueSpriteClasses: uniqueClasses,
    oldImageSourcesRemaining: oldSources,
    passed: result.statusCode === 200 && html.includes('id="blog-sprite-style"') && uniqueClasses.length === 5 && oldSources.length === 0
  }));
}
