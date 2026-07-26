const TARGET = 'https://haibucraft-blog-preview.mxy526125914.chatgpt.site/';

function extractMatches(html, regex) {
  return [...html.matchAll(regex)].map(match => match[1]).filter(Boolean);
}

export default async function handler(req, res) {
  try {
    const response = await fetch(TARGET, {
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; HAIBU-Craft-Preview-Audit/1.0)',
        accept: 'text/html,application/xhtml+xml'
      }
    });
    const html = await response.text();
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
    const scripts = extractMatches(html, /<script[^>]+src=["']([^"']+)["'][^>]*>/gi);
    const styles = extractMatches(html, /<link[^>]+href=["']([^"']+)["'][^>]*>/gi);
    const links = extractMatches(html, /<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({
      target: TARGET,
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get('content-type'),
      htmlLength: html.length,
      title,
      scripts,
      styles,
      links,
      visibleText: text,
      html
    }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error.message, stack: error.stack }));
  }
}
