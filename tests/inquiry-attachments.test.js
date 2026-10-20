import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/inquiry.js';

// Synthetic one-pixel images; no customer uploads or external services.
const images = {
  "jpeg": {
    "filename": "reference.jpg",
    "contentType": "image/jpeg",
    "content": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=="
  },
  "png": {
    "filename": "reference.png",
    "contentType": "image/png",
    "content": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC"
  },
  "gif": {
    "filename": "reference.gif",
    "contentType": "image/gif",
    "content": "R0lGODdhAQABAIEAAP///wAAAAAAAAAAACwAAAAAAQABAAAIBAABBAQAOw=="
  },
  "webp": {
    "filename": "reference.webp",
    "contentType": "image/webp",
    "content": "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAUAmJaQAA3AA/vz0AAA="
  }
};

async function submit(attachments, environment = 'production') {
  const names = ['RESEND_API_KEY', 'INQUIRY_TO_EMAIL', 'INQUIRY_BCC_EMAIL', 'VERCEL_ENV'];
  const previous = names.map(name => process.env[name]);
  const originalFetch = globalThis.fetch;
  const deliveries = [];
  process.env.RESEND_API_KEY = 'synthetic-test-key';
  process.env.INQUIRY_TO_EMAIL = 'test@example.com';
  process.env.INQUIRY_BCC_EMAIL = '';
  process.env.VERCEL_ENV = environment;
  globalThis.fetch = async (_url, options) => {
    deliveries.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ id: 'synthetic-message' }) };
  };
  const response = { setHeader() {}, end(body) { this.body = JSON.parse(body); } };
  try {
    await handler({ method: 'POST', headers: { origin: 'https://www.haibucrafts.com' },
      body: { fields: { name: 'Synthetic buyer', email: 'buyer@example.com', country: 'US' }, attachments } }, response);
    return { status: response.statusCode, body: response.body, deliveries };
  } finally {
    globalThis.fetch = originalFetch;
    names.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
}

function jpegWithComments(size) {
  const image = Buffer.from(images.jpeg.content, 'base64');
  const parts = [image.subarray(0, 2)];
  let remaining = size - image.length;
  while (remaining) {
    const length = Math.min(remaining, 65537);
    assert.ok(length >= 4);
    const comment = Buffer.alloc(length);
    comment[0] = 0xff; comment[1] = 0xfe;
    comment.writeUInt16BE(length - 2, 2);
    parts.push(comment);
    remaining -= length;
  }
  parts.push(image.subarray(2));
  return { ...images.jpeg, content: Buffer.concat(parts).toString('base64') };
}

test('rejects HTML and SVG disguised as PNG before provider delivery', async () => {
  for (const text of ['<!doctype html><script>test</script>', '<svg xmlns="http://www.w3.org/2000/svg"/>']) {
    const result = await submit([{ filename: 'reference.html', contentType: 'image/png', content: Buffer.from(text).toString('base64') }]);
    assert.equal(result.status, 400);
    assert.equal(result.deliveries.length, 0);
  }
});

test('rejects a declared image type that differs from its encoded file header', async () => {
  const result = await submit([{ ...images.png, contentType: 'image/jpeg' }]);
  assert.equal(result.status, 400);
  assert.equal(result.deliveries.length, 0);
});

test('GIF and WebP format signatures require exact byte values', async () => {
  for (const [image, indexes] of [[images.gif, [0, 1, 2, 3, 4, 5]], [images.webp, [0, 1, 2, 3, 8, 9, 10, 11]]]) {
    const bytes = Buffer.from(image.content, 'base64');
    indexes.forEach(index => { bytes[index] |= 0x80; });
    const result = await submit([{ ...image, content: bytes.toString('base64') }]);
    assert.equal(result.status, 400);
    assert.equal(result.deliveries.length, 0);
  }
});

test('genuine JPEG, PNG, GIF and WebP references preserve their bytes', async () => {
  const result = await submit(Object.values(images));
  assert.equal(result.status, 200);
  assert.equal(result.deliveries.length, 1);
  assert.deepEqual(result.deliveries[0].attachments, Object.values(images).map(({ filename, content }) => ({ filename, content })));
});

test('a genuine image cannot carry a client-supplied HTML attachment extension', async () => {
  const result = await submit([{ ...images.png, filename: 'reference.html' }]);
  assert.equal(result.status, 200);
  assert.equal(result.deliveries[0].attachments[0].filename, 'reference.png');
  assert.equal(result.deliveries[0].attachments[0].content, images.png.content);
});

test('invalid or noncanonical Base64 is rejected before provider delivery', async () => {
  for (const content of [images.png.content.slice(0, -1), images.png.content + '=', 'ab==', { content: images.png.content }]) {
    const result = await submit([{ ...images.png, content }]);
    assert.equal(result.status, 400);
    assert.equal(result.deliveries.length, 0);
  }
});

test('Base64 line wrapping does not invalidate a genuine image', async () => {
  const result = await submit([{ ...images.png, content: images.png.content.match(/.{1,16}/g).join('\n') }]);
  assert.equal(result.status, 200);
  assert.equal(result.deliveries[0].attachments[0].content, images.png.content);
});

test('the per-image byte limit uses decoded bytes including Base64 padding', async () => {
  const image = jpegWithComments(800000);
  const result = await submit([image]);
  assert.equal(result.status, 200);
  assert.equal(Buffer.from(result.deliveries[0].attachments[0].content, 'base64').length, 800000);
});

test('per-image, total-byte and image-count limits stop delivery', async () => {
  for (const [attachments, status] of [
    [[jpegWithComments(800001)], 413],
    [Array.from({ length: 4 }, () => jpegWithComments(700001)), 413],
    [Array.from({ length: 5 }, () => images.png), 400]
  ]) {
    const result = await submit(attachments);
    assert.equal(result.status, status);
    assert.equal(result.deliveries.length, 0);
  }
  const boundary = await submit(Array.from({ length: 4 }, () => jpegWithComments(700000)));
  assert.equal(boundary.status, 200);
});

test('valid images do not bypass preview mail-delivery isolation', async () => {
  const result = await submit([images.png], 'preview');
  assert.equal(result.status, 403);
  assert.equal(result.deliveries.length, 0);
});
