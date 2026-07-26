import sitePreview from './site-preview.js';

function createCaptureResponse() {
  const headers = new Map();
  let body = '';
  return {
    statusCode: 200,
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
    getHeader(name) {
      return headers.get(String(name).toLowerCase());
    },
    end(chunk = '') {
      if (chunk !== undefined && chunk !== null) body += String(chunk);
    },
    snapshot() {
      return { statusCode: this.statusCode, headers, body };
    }
  };
}

function sanitizeHtml(html) {
  return String(html)
    .replace(/<input([^>]*?)\/\s+aria-label="([^"]+)">/gi, (_match, attrs, label) => `<input${attrs} aria-label="${label.trim()}"/>`)
    .replace(/aria-label="\s+([^"]+)"/gi, (_match, label) => `aria-label="${label.trim()}"`);
}

export default async function handler(req, res) {
  const capture = createCaptureResponse();
  await sitePreview(req, capture);
  const result = capture.snapshot();
  result.headers.forEach((value, name) => res.setHeader(name, value));
  res.setHeader('X-Preview-Markup-Sanitized', '1');
  res.statusCode = result.statusCode;
  const contentType = String(result.headers.get('content-type') || '');
  if (/text\/html/i.test(contentType)) res.end(sanitizeHtml(result.body));
  else res.end(result.body);
}
