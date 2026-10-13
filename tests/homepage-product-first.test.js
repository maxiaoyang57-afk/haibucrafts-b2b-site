import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';

const textContent = (html) => html.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const sectionWith = (html, pattern) => {
  const section = [...html.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)]
    .map(([section]) => section).find((section) => pattern.test(section));
  assert.ok(section, `Missing section: ${pattern}`);
  return section;
};
const inquiryLink = (html, source, routeKey) => {
  const matches = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/a>/g)]
    .map((match) => ({ html: match[0], url: new URL(match[1].replace(/&amp;/g, '&'), 'https://example.test') }))
    .filter(({ url }) => url.searchParams.get('source') === source);
  assert.equal(matches.length, 1, `One inquiry CTA for ${source}`);
  const { url } = matches[0];
  assert.equal(url.origin, 'https://example.test');
  assert.equal(url.pathname, routeKey === 'previewPath' ? '/v2-preview/quote/' : '/request-quote/');
  assert.equal(url.searchParams.get('landing_page'), routeKey === 'previewPath' ? '/v2-preview/' : '/');
  const entry = source === 'homepage-documents'
    ? { context: 'supplier', title: 'Product documentation' }
    : { context: 'category', title: 'Tailored product selection' };
  assert.equal(url.searchParams.get('entry_context'), entry.context);
  assert.equal(url.searchParams.get('entry_title'), entry.title);
  return textContent(matches[0].html);
};

const catalog = JSON.parse(await readFile('v2-preview/assets/product-catalog.json', 'utf8'));
for (const [file, routeKey] of [['v2-preview/index.html', 'previewPath'], ['index.html', 'productionPath']]) {
  test(`${file} keeps products and buying choices ahead of supply evidence`, async () => {
    const html = await readFile(file, 'utf8');
    assert.match(html, /Wholesale charms &amp; mix-ins for slime &amp; craft brands\./);
    assert.match(html, />Browse Products /);
    assert.match(html, />Ask About Samples</);
    assert.ok(html.indexOf('id="categories"') < html.indexOf('id="featured"'));
    assert.ok(html.indexOf('id="featured"') < html.indexOf('id="buying"'));
    assert.ok(html.indexOf('id="buying"') < html.indexOf('id="factory"'));
    const cards = [...html.matchAll(/<a class="home-product-card" href="([^"]+)" data-product-code="([^"]+)">([\s\S]*?)<\/a>/g)];
    assert.equal(cards.length, 8);
    assert.equal(new Set(cards.map((card) => card[2])).size, 8);
    const represented = new Set();
    for (const [, href, sku, content] of cards) {
      const product = catalog.products.find((item) => item.sku === sku);
      assert.ok(product, sku);
      assert.equal(href, product[routeKey]);
      assert.ok(content.includes(`src="${product.image}"`));
      assert.ok(content.includes(`>${sku}</span>`));
      await access(`.${href}index.html`);
      await access(`.${product.image}`);
      represented.add(product.category);
    }
    assert.equal(represented.size, 4);
    assert.match(html, /Availability, specifications, quantities and packing are confirmed by product code/);
    assert.match(html, /Ask about samples/);
    assert.match(html, /Reorder by product code/);
    assert.doesNotMatch(html, /Send a usable buying brief, not only a product photo/);
  });
  test(`${file} separates alternative buying paths from the ordered procurement steps`, async () => {
    const html = await readFile(file, 'utf8');
    const buying = sectionWith(html, /id="buying"/);
    const cards = [...buying.matchAll(/<article\b[^>]*class="[^"]*\bbuying-path\b[^"]*"[^>]*>([\s\S]*?)<\/article>/g)];
    assert.equal(cards.length, 3);
    assert.deepEqual(cards.map(([, card]) => textContent(card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)[1])), [
      'Shop by theme', 'Ask about samples', 'Reorder by product code'
    ]);
    for (const [, card] of cards) assert.doesNotMatch(textContent(card), /^0[123]\s*[/.:–-]/);
    const steps = buying.match(/<ol\b[^>]*class="[^"]*\bprocurement-steps\b[^"]*"[^>]*>([\s\S]*?)<\/ol>/);
    assert.ok(steps, 'Procurement steps use an ordered list');
    assert.ok(buying.indexOf(steps[0]) > buying.lastIndexOf('</article>'), 'Steps follow the alternative buying cards');
    const items = [...steps[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(([, item]) => textContent(item));
    assert.equal(items.length, 3);
    assert.match(items[0], /Choose products/i);
    assert.match(items[0], /SKU|product code/i);
    assert.match(items[0], /reference (?:photo|image)/i);
    assert.match(items[1], /Confirm order details/i);
    for (const detail of [/quantity/i, /pack(?:ing|aging)/i, /destination/i]) assert.match(items[1], detail);
    assert.match(items[2], /Discuss quote (?:&|and) samples/i);
  });

  test(`${file} asks for product-specific document scope without blanket certification claims`, async () => {
    const html = await readFile(file, 'utf8');
    const documentCard = html.match(/<article\b[^>]*class="[^"]*\bdocument-evidence\b[^"]*"[^>]*>([\s\S]*?)<\/article>/);
    assert.ok(documentCard);
    const copy = textContent(documentCard[1]);
    for (const detail of [/SKU|product code/i, /intended use/i, /sales market/i, /availab/i, /(?:per|each|by|that) (?:item|product)/i]) assert.match(copy, detail);
    assert.match(copy, /(?:reports|documents).*(?:samples|scope)/i);
    assert.doesNotMatch(copy, /all (?:our )?products? (?:are |is )?certified|universally certified|guaranteed complian/i);
    const prefix = routeKey === 'previewPath' ? '/v2-preview' : '';
    assert.ok(documentCard[1].includes(`href="${prefix}/certificates/"`));
    assert.ok(documentCard[1].includes(`href="${prefix}/quality-control/"`));
    inquiryLink(documentCard[1], 'homepage-documents', routeKey);
  });

  test(`${file} ends with a tailored shortlist inquiry and retains catalog browsing`, async () => {
    const html = await readFile(file, 'utf8');
    const final = sectionWith(html, /\bhome-final\b/);
    const copy = textContent(final.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)[1]);
    for (const detail of [/categor(?:y|ies)/i, /theme/i, /use/i, /short(?:list|[^.]*selection)/i]) assert.match(copy, detail);
    assert.match(inquiryLink(final, 'homepage-shortlist', routeKey), /^Request a Shortlist(?:\s|$)/);
    const browsing = final.match(/<a\b[^>]*href="([^"]+)"[^>]*>\s*Keep Browsing\s*<\/a>/);
    assert.ok(browsing, 'Keep Browsing remains available');
    assert.equal(browsing[1], routeKey === 'previewPath' ? '/v2-preview/products/' : '/products/');
    assert.doesNotMatch(final, /homepage-final-cta/);
    const contact = final.match(/<p\b[^>]*class="[^"]*\bhome-contact-note\b[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    assert.ok(contact, 'Optional direct contact hint remains secondary to the shortlist CTA');
    assert.match(textContent(contact[1]), /WhatsApp.*photo/i);
    const whatsapp = contact[1].match(/href="(https:\/\/wa\.me\/[^"]+)"/);
    assert.ok(whatsapp);
    const whatsappURL = new URL(whatsapp[1].replace(/&amp;/g, '&'));
    assert.equal(whatsappURL.origin + whatsappURL.pathname, 'https://wa.me/8618632026595');
    assert.ok(contact[1].includes('href="mailto:sales@haibucrafts.com"'));
    assert.doesNotMatch(contact[1], /upload.*(?:WhatsApp|automatically)|automatically.*send/i);
  });

}
