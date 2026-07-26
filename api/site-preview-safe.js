import path from 'node:path';
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

function currentPreviewFile(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  let file = String(raw || 'index.html').split('?')[0].split('#')[0];
  file = decodeURIComponent(file).replace(/^\/+/, '');
  if (!file || file.endsWith('/')) file += 'index.html';
  return path.posix.normalize(file);
}

function rewritePreviewHref(rawHref, currentFile) {
  const href = String(rawHref || '').trim();
  if (!href || href.startsWith('#') || /^(?:https?:|mailto:|tel:|javascript:|data:|\/\/)/i.test(href)) return rawHref;
  if (/^\/(?:preview-current|preview-page)(?:[/?#]|$)/i.test(href)) return rawHref;

  const match = href.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  if (!match) return rawHref;

  let [, pathname, query = '', hash = ''] = match;
  if (!pathname || /^(?:\/)?(?:assets|api)\//i.test(pathname)) return rawHref;

  const isRootRelative = pathname.startsWith('/');
  pathname = pathname.replace(/^\/+/, '');
  let resolved = isRootRelative
    ? pathname
    : path.posix.join(path.posix.dirname(currentFile), pathname);

  resolved = path.posix.normalize(resolved).replace(/^\.\//, '');
  if (!resolved || resolved === '.') resolved = 'index.html';
  if (resolved.endsWith('/')) resolved += 'index.html';
  if (!path.posix.extname(resolved)) resolved += '/index.html';
  if (resolved.startsWith('../') || !resolved.endsWith('.html')) return rawHref;

  const suffix = query ? `&amp;${query.slice(1)}` : '';
  return `/preview-page?file=${encodeURIComponent(resolved)}${suffix}${hash}`;
}

function sanitizeHtml(html, currentFile) {
  return String(html)
    .replace(/<input([^>]*?)\/\s+aria-label="([^"]+)">/gi, (_match, attrs, label) => `<input${attrs} aria-label="${label.trim()}"/>`)
    .replace(/aria-label="\s+([^"]+)"/gi, (_match, label) => `aria-label="${label.trim()}"`)
    .replace(/<a\b([^>]*?)href=(['"])(.*?)\2([^>]*)>/gi, (_match, before, quote, href, after) => {
      const nextHref = rewritePreviewHref(href, currentFile);
      return `<a${before}href=${quote}${nextHref}${quote}${after}>`;
    });
}

export default async function handler(req, res) {
  const capture = createCaptureResponse();
  await sitePreview(req, capture);
  const result = capture.snapshot();
  result.headers.forEach((value, name) => res.setHeader(name, value));
  res.setHeader('X-Preview-Markup-Sanitized', '1');
  res.setHeader('X-Preview-Link-Routing', 'preview-page');
  res.statusCode = result.statusCode;
  const contentType = String(result.headers.get('content-type') || '');
  if (/text\/html/i.test(contentType)) {
    res.end(sanitizeHtml(result.body, currentPreviewFile(req.query?.file)));
  } else {
    res.end(result.body);
  }
}
