import path from 'node:path';
import sitePreview from './site-preview.js';

const BLOG_IMAGES = {
  'blog/tiny-worlds-big-ideas.html': '/assets/images/blog/tiny-worlds-big-ideas.webp',
  'blog/beyond-the-quote.html': '/assets/images/blog/beyond-the-quote.webp',
  'blog/global-craft-supply-blueprint.html': '/assets/images/blog/global-craft-supply-blueprint.webp',
  'blog/wholesale-slime-charms-sourcing-guide.html': '/assets/images/blog/wholesale-slime-charms-sourcing-guide.webp',
  'blog/from-sketch-to-shelf.html': '/assets/images/blog/from-sketch-to-shelf.webp'
};

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

function replaceShareImage(html, asset) {
  const absolute = `https://www.haibucrafts.com${asset}`;
  return html
    .replace(/<meta[^>]+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${absolute}">`)
    .replace(/<meta[^>]+name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${absolute}">`);
}

function applyBlogImages(html, currentFile) {
  if (currentFile === 'blog/index.html') {
    const replacements = [
      ['../assets/images/homecards/homecard-8-space-charms.webp', BLOG_IMAGES['blog/tiny-worlds-big-ideas.html']],
      ['../assets/images/products/hc001-school-theme-polymer-clay-mix.webp', BLOG_IMAGES['blog/beyond-the-quote.html']],
      ['../assets/images/hero/slime-charms-b2b-banner.webp', BLOG_IMAGES['blog/global-craft-supply-blueprint.html']],
      ['../assets/images/products/sc004-space-candy-adventure-charms.webp', BLOG_IMAGES['blog/wholesale-slime-charms-sourcing-guide.html']],
      ['../assets/images/homecards/homecard-1-mermaid-sequins.webp', BLOG_IMAGES['blog/from-sketch-to-shelf.html']]
    ];
    let output = html;
    for (const [from, to] of replacements) output = output.replaceAll(from, to);
    return replaceShareImage(output, BLOG_IMAGES['blog/tiny-worlds-big-ideas.html']);
  }

  const asset = BLOG_IMAGES[currentFile];
  if (!asset) return html;

  let output = html.replace(/<img\b[^>]*class=["'][^"']*\barticle-hero-image\b[^"']*["'][^>]*>/i, tag => {
    if (/\bsrc=["'][^"']*["']/i.test(tag)) return tag.replace(/\bsrc=["'][^"']*["']/i, `src="${asset}"`);
    return tag.replace(/<img\b/i, `<img src="${asset}"`);
  });
  output = replaceShareImage(output, asset);
  return output;
}

function sanitizeHtml(html, currentFile) {
  let output = String(html)
    .replace(/<input([^>]*?)\/\s+aria-label="([^"]+)">/gi, (_match, attrs, label) => `<input${attrs} aria-label="${label.trim()}"/>`)
    .replace(/aria-label="\s+([^"]+)"/gi, (_match, label) => `aria-label="${label.trim()}"`)
    .replace(/<a\b([^>]*?)href=(['"])(.*?)\2([^>]*)>/gi, (_match, before, quote, href, after) => {
      const nextHref = rewritePreviewHref(href, currentFile);
      return `<a${before}href=${quote}${nextHref}${quote}${after}>`;
    });

  output = applyBlogImages(output, currentFile);
  return output;
}

export default async function handler(req, res) {
  const capture = createCaptureResponse();
  await sitePreview(req, capture);
  const result = capture.snapshot();
  result.headers.forEach((value, name) => res.setHeader(name, value));
  res.setHeader('X-Preview-Markup-Sanitized', '1');
  res.setHeader('X-Preview-Link-Routing', 'preview-page');
  res.setHeader('X-Preview-Blog-Images', 'server-side');
  res.statusCode = result.statusCode;
  const contentType = String(result.headers.get('content-type') || '');
  if (/text\/html/i.test(contentType)) {
    res.end(sanitizeHtml(result.body, currentPreviewFile(req.query?.file)));
  } else {
    res.end(result.body);
  }
}
