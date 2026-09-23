import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

class Element {
  constructor() { this.children = []; this.events = {}; this.dataset = {}; this.value = ''; }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.append(child); }
  replaceChildren() { this.children = []; }
  setAttribute() {}
  removeAttribute() {}
  addEventListener(name, handler) { this.events[name] = handler; }
  focus() {}
}

function reference(name, size = 100, type = 'image/jpeg') {
  return new File([new Uint8Array(size)], name, { type, lastModified: 1 });
}

async function fixture({ webp = true, decode, response, track } = {}) {
  const upload = new Element();
  upload.files = [];
  const previews = new Element();
  const uploadStatus = new Element();
  const status = new Element();
  const button = new Element();
  const form = new Element();
  const submissions = [];
  const events = [];
  let resets = 0;
  form.elements = { namedItem: () => null };
  form.querySelector = (selector) => selector.includes('reference_images') ? upload : selector.includes('submit') ? button : null;
  form.reportValidity = () => true;
  form.reset = () => { resets++; upload.files = []; };
  const nodes = { referenceImagePreviews: previews, referenceImageStatus: uploadStatus, formStatus: status };
  const document = {
    querySelector: () => form,
    getElementById: (id) => nodes[id] || null,
    createElement(tag) {
      if (tag === 'canvas') return {
        getContext: () => ({ clearRect() {}, drawImage() {}, fillRect() {} }),
        toBlob(callback, type) { callback(new Blob([new Uint8Array(200)], { type: !webp && type === 'image/webp' ? 'image/png' : type })); }
      };
      return new Element();
    }
  };
  vm.runInNewContext(await readFile('assets/v2/quote-preview.js', 'utf8'), {
    document, URLSearchParams, HTMLInputElement: class {}, Uint8Array,
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    Image: class { async decode() { throw new Error('Invalid image'); } },
    createImageBitmap: async (file) => {
      await decode?.(file);
      return { width: 3000, height: 2000, close() {} };
    },
    btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
    window: {
      HAIBU_QUOTE_CONFIG: { mode: 'live', endpoint: '/api/inquiry', enableReferenceUploads: true },
      location: { search: '', pathname: '/request-quote/' },
      HAIBU_TRACK: track || ((...args) => events.push(args))
    },
    FormData: class {
      entries() { return [['name', 'QA'], ['email', 'qa@example.com'], ['country', 'US']]; }
      get() { return ''; }
    },
    fetch: async (_url, options) => {
      submissions.push(JSON.parse(options.body));
      return response ? response() : { ok: true, json: async () => ({ ok: true, requestId: '12345678-test' }) };
    }
  });
  return {
    form, previews, uploadStatus, status, button, submissions, events,
    get resets() { return resets; },
    async choose(files) { upload.files = files; await upload.events.change(); },
    async submit() { await form.events.submit({ preventDefault() {} }); },
    remove(index) { previews.children[index].children[2].events.click(); }
  };
}

test('reference images accumulate across selections; removal changes the actual attachments', async () => {
  const f = await fixture();
  await f.choose([reference('a.jpg'), reference('b.png', 100, 'image/png')]);
  await f.choose([reference('c.webp', 100, 'image/webp')]);
  assert.equal(f.previews.children.length, 3);
  f.remove(1);
  assert.equal(f.previews.children.length, 2);
  await f.submit();
  assert.deepEqual(f.submissions[0].attachments.map((item) => item.filename), ['a.jpg', 'c.webp']);
  assert.equal(f.previews.hidden, true);
  assert.equal(f.resets, 1);
  assert.equal(f.events[0][0], 'inquiry_submitted');
});

test('the four-image limit and unsupported types preserve the previous valid selection', async () => {
  const f = await fixture();
  await f.choose(['a', 'b', 'c', 'd'].map((name) => reference(`${name}.jpg`)));
  await f.choose([reference('e.jpg')]);
  assert.match(f.uploadStatus.textContent, /no more than 4/);
  assert.equal(f.previews.children.length, 4);
  f.remove(3);
  await f.choose([reference('bad.svg', 100, 'image/svg+xml')]);
  assert.match(f.uploadStatus.textContent, /JPG, PNG or WebP/);
  await f.submit();
  assert.equal(f.submissions[0].attachments.length, 3);
});

test('mobile WebP encoder fallback sends the actual JPEG type and extension', async () => {
  const f = await fixture({ webp: false });
  await f.choose([reference('camera.png', 900000, 'image/png')]);
  await f.submit();
  assert.equal(f.submissions[0].attachments[0].filename, 'camera.jpg');
  assert.equal(f.submissions[0].attachments[0].contentType, 'image/jpeg');
});

test('late compression cannot overwrite a newer selection or leave stale previews after success', async () => {
  let release;
  let calls = 0;
  const oldDecode = new Promise((resolve) => { release = resolve; });
  const f = await fixture({ decode: async () => { if (++calls === 1) await oldDecode; } });
  const oldSelection = f.choose([reference('a.jpg', 900000)]);
  await f.choose([reference('b.jpg', 900000)]);
  assert.equal(f.previews.children.length, 2);
  await f.submit();
  release();
  await oldSelection;
  assert.equal(f.submissions[0].attachments.length, 2);
  assert.equal(f.previews.children.length, 0);
  assert.equal(f.uploadStatus.textContent, '');
});

test('submission waits for compression and rejects duplicate submits', async () => {
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const f = await fixture({ decode: () => pending });
  const selection = f.choose([reference('camera.jpg', 900000)]);
  const first = f.submit();
  await f.submit();
  assert.equal(f.submissions.length, 0);
  release();
  await Promise.all([first, selection]);
  assert.equal(f.submissions.length, 1);
  assert.equal(f.submissions[0].attachments.length, 1);
});

test('rejected delivery retains images for retry and does not emit a conversion', async () => {
  let attempts = 0;
  const f = await fixture({ response: () => ({ ok: ++attempts > 1, json: async () => ({ ok: attempts > 1 }) }) });
  await f.choose([reference('a.jpg')]);
  await f.submit();
  assert.equal(f.resets, 0);
  assert.equal(f.events.length, 0);
  assert.equal(f.previews.children.length, 1);
  assert.equal(f.button.disabled, false);
  await f.submit();
  assert.equal(f.submissions[1].attachments.length, 1);
  assert.equal(f.events.length, 1);
});

test('an analytics error cannot turn an accepted inquiry into an apparent failure', async () => {
  const f = await fixture({ track: () => { throw new Error('Analytics unavailable'); } });
  await f.submit();
  assert.equal(f.resets, 1);
  assert.match(f.status.textContent, /sent successfully/);
});

test('invalid optional fields reopen their collapsed section for browser validation', async () => {
  const f = await fixture();
  const details = { open: false };
  f.form.events.invalid({ target: { closest: () => details } });
  assert.equal(details.open, true);
});
