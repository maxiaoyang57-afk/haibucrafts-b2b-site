import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const intents = [
  ['homepage-samples', 'Ask about samples', /product codes or styles/, /sample/i],
  ['homepage-shortlist', 'Request a tailored shortlist', /category, theme or intended use/, /category, theme, intended use/],
  ['homepage-documents', 'Ask about product documentation', /product code, intended use and sales market/, /product code, intended use and sales market/]
];

for (const assetRoot of ['v2-preview/assets', 'assets/v2']) {
  test(`${assetRoot} uses only allowlisted constant inquiry guidance without prefilling the message`, async () => {
    const script = await readFile(`${assetRoot}/inquiry-experience.js`, 'utf8');
    const literal = script.match(/const homepageIntents = (\{[\s\S]*?\n  \});/);
    assert.ok(literal, 'Homepage guidance is a bounded constant map');
    const mapping = vm.runInNewContext(`(${literal[1]})`, {}, { timeout: 100 });
    assert.deepEqual(Object.keys(mapping).sort(), intents.map(([source]) => source).sort());
    for (const [source, title, prompt, placeholder] of intents) {
      assert.equal(mapping[source].title, title);
      assert.match(mapping[source].prompt, prompt);
      assert.match(mapping[source].placeholder, placeholder);
      for (const text of Object.values(mapping[source])) assert.doesNotMatch(text, /[<>]/);
    }
    assert.match(script, /Object\.hasOwn\(homepageIntents, params\.get\('source'\)\)/);
    assert.match(script, /title\.textContent = homepageIntent\.title/);
    assert.match(script, /prompt\.textContent = homepageIntent\.prompt/);
    assert.match(script, /form\.prepend\(guidance\)/);
    assert.match(script, /message\.placeholder = homepageIntent\?\.placeholder/);
    assert.doesNotMatch(script, /(?:message\.value\s*=|\.innerHTML\s*=)/);
  });
}

for (const [file, privacyPath] of [
  ['v2-preview/quote/index.html', '/v2-preview/privacy/'],
  ['request-quote/index.html', '/privacy/']
]) {
  test(`${file} places a working Privacy Policy link beside submission`, async () => {
    const html = await readFile(file, 'utf8');
    const submit = html.match(/<div class="quote-submit full">([\s\S]*?)<\/div>/)?.[1];
    assert.ok(submit);
    const privacy = submit.match(/<p class="quote-privacy">([\s\S]*?)<\/p>/)?.[1];
    assert.ok(privacy);
    assert.ok(privacy.includes(`href="${privacyPath}"`));
    assert.match(privacy, />Privacy Policy<\/a>/);
    await access(`.${privacyPath}index.html`);
  });
}
