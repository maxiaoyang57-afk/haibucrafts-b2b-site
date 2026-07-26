import sitePreviewSafe from './site-preview-safe.js';

const FILES = [
  'blog/index.html',
  'blog/tiny-worlds-big-ideas/index.html',
  'blog/beyond-the-quote/index.html',
  'blog/global-craft-supply-blueprint/index.html',
  'blog/wholesale-slime-charms-sourcing-guide/index.html',
  'blog/from-sketch-to-shelf/index.html'
];

function captureResponse() {
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

async function inspect(file) {
  const response = captureResponse();
  await sitePreviewSafe({ method: 'GET', query: { file } }, response);
  const result = response.snapshot();
  const html = result.body;
  const isIndex = file === 'blog/index.html';
  const cleanLinks = [
    '/blog/tiny-worlds-big-ideas/',
    '/blog/beyond-the-quote/',
    '/blog/global-craft-supply-blueprint/',
    '/blog/wholesale-slime-charms-sourcing-guide/',
    '/blog/from-sketch-to-shelf/'
  ];
  const checks = {
    status200: result.statusCode === 200,
    standaloneHeader: html.includes('class="journal-header"'),
    journalStylesheet: html.includes('/assets/css/haibu-journal.css'),
    journalScript: html.includes('/assets/js/haibu-journal.js'),
    spriteStyle: html.includes('id="blog-sprite-style"'),
    noGlobalTopbar: !html.includes('class="topbar"'),
    noEditorialIllustration: !/Editorial illustration/i.test(html),
    noHashArticleRoutes: !/#article\//i.test(html),
    noArrowSymbols: !/[→←↑↓]/.test(html),
    backToTop: html.includes('class="back-to-top"'),
    cleanLinks: isIndex ? cleanLinks.every(link => html.includes(`href="${link}"`)) : true,
    filterControls: isIndex ? html.includes('data-topic-filter="all"') : true,
    articleToc: isIndex ? true : html.includes('class="article-toc"'),
    articleFaq: isIndex ? true : html.includes('class="article-faq"'),
    blogPostingSchema: isIndex ? true : html.includes('"@type":"BlogPosting"')
  };
  return {
    file,
    renderer: result.headers.get('x-preview-blog-images') || null,
    linkRouting: result.headers.get('x-preview-link-routing') || null,
    checks,
    passed: Object.values(checks).every(Boolean)
  };
}

export default async function handler(_req, res) {
  const pages = [];
  for (const file of FILES) pages.push(await inspect(file));
  res.statusCode = pages.every(page => page.passed) ? 200 : 500;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ passed: pages.every(page => page.passed), pages }));
}
