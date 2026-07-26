import path from 'node:path';
import sitePreview from './site-preview.js';

const BLOG_SPRITES = {
  'blog/tiny-worlds-big-ideas.html': 1,
  'blog/beyond-the-quote.html': 2,
  'blog/global-craft-supply-blueprint.html': 3,
  'blog/wholesale-slime-charms-sourcing-guide.html': 4,
  'blog/from-sketch-to-shelf.html': 5
};

const BLOG_ALTS = {
  1: 'Story-led slime charm collection for creative product themes',
  2: 'Wholesale craft product planning, packaging and customer service',
  3: 'Global craft supply, export packaging and logistics planning',
  4: 'Slime charm assortment measurement and quality inspection',
  5: 'Custom craft product design, molds, samples and packaging development'
};

const BLOG_SPRITE_STYLE = `<style id="blog-sprite-style">
.blog-sprite{display:block;width:100%;background-image:url('/api/blog-sprite');background-repeat:no-repeat;background-size:100% 500%;background-color:#f3eef1}
.blog-sprite-1{background-position:center 0%}.blog-sprite-2{background-position:center 25%}.blog-sprite-3{background-position:center 50%}.blog-sprite-4{background-position:center 75%}.blog-sprite-5{background-position:center 100%}
.editorial-card .blog-card-image{height:260px}.editorial-card:first-child .blog-card-image{height:100%;min-height:390px}
.article-hero-image.blog-sprite{height:auto;aspect-ratio:3/2;max-height:520px;border-radius:28px;box-shadow:0 18px 50px rgba(75,45,68,.12)}
@media(max-width:800px){.editorial-card:first-child .blog-card-image{height:260px;min-height:0}}
</style>`;

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
  let resolved = isRootRelative ? pathname : path.posix.join(path.posix.dirname(currentFile), pathname);
  resolved = path.posix.normalize(resolved).replace(/^\.\//, '');
  if (!resolved || resolved === '.') resolved = 'index.html';
  if (resolved.endsWith('/')) resolved += 'index.html';
  if (!path.posix.extname(resolved)) resolved += '/index.html';
  if (resolved.startsWith('../') || !resolved.endsWith('.html')) return rawHref;
  const suffix = query ? `&amp;${query.slice(1)}` : '';
  return `/preview-page?file=${encodeURIComponent(resolved)}${suffix}${hash}`;
}

function spriteElement(index, extraClass) {
  return `<div class="${extraClass} blog-sprite blog-sprite-${index}" role="img" aria-label="${BLOG_ALTS[index]}"></div>`;
}

function injectSpriteStyle(html) {
  if (/id=["']blog-sprite-style["']/i.test(html)) return html;
  return html.replace(/<\/head>/i, `${BLOG_SPRITE_STYLE}</head>`);
}

function replaceImageBySource(html, source, index) {
  const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<img\\b[^>]*src=["']${escaped}["'][^>]*>`, 'i');
  return html.replace(pattern, spriteElement(index, 'blog-card-image'));
}

function applyBlogArtwork(html, currentFile) {
  if (!currentFile.startsWith('blog/')) return html;
  let output = injectSpriteStyle(html);

  if (currentFile === 'blog/index.html') {
    const sources = [
      '../assets/images/homecards/homecard-8-space-charms.webp',
      '../assets/images/products/hc001-school-theme-polymer-clay-mix.webp',
      '../assets/images/hero/slime-charms-b2b-banner.webp',
      '../assets/images/products/sc004-space-candy-adventure-charms.webp',
      '../assets/images/homecards/homecard-1-mermaid-sequins.webp'
    ];
    sources.forEach((source, offset) => { output = replaceImageBySource(output, source, offset + 1); });
    return output;
  }

  const index = BLOG_SPRITES[currentFile];
  if (!index) return output;
  return output.replace(/<img\b[^>]*class=["'][^"']*\barticle-hero-image\b[^"']*["'][^>]*>/i, spriteElement(index, 'article-hero-image'));
}

function sanitizeHtml(html, currentFile) {
  let output = String(html)
    .replace(/<input([^>]*?)\/\s+aria-label="([^"]+)">/gi, (_match, attrs, label) => `<input${attrs} aria-label="${label.trim()}"/>`)
    .replace(/aria-label="\s+([^"]+)"/gi, (_match, label) => `aria-label="${label.trim()}"`)
    .replace(/<a\b([^>]*?)href=(['"])(.*?)\2([^>]*)>/gi, (_match, before, quote, href, after) => {
      const nextHref = rewritePreviewHref(href, currentFile);
      return `<a${before}href=${quote}${nextHref}${quote}${after}>`;
    });
  return applyBlogArtwork(output, currentFile);
}

export default async function handler(req, res) {
  const capture = createCaptureResponse();
  await sitePreview(req, capture);
  const result = capture.snapshot();
  result.headers.forEach((value, name) => res.setHeader(name, value));
  res.setHeader('X-Preview-Markup-Sanitized', '1');
  res.setHeader('X-Preview-Link-Routing', 'preview-page');
  res.setHeader('X-Preview-Blog-Images', 'sprite-v1');
  res.statusCode = result.statusCode;
  const contentType = String(result.headers.get('content-type') || '');
  if (/text\/html/i.test(contentType)) res.end(sanitizeHtml(result.body, currentPreviewFile(req.query?.file)));
  else res.end(result.body);
}
