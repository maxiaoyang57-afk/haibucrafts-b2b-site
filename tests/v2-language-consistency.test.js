import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = new URL('../v2-preview/', import.meta.url);
const checkedExtensions = new Set(['.html', '.js', '.css', '.json', '.xml']);
const cjkPattern = /[\u3400-\u9fff]/u;
const mojibakePattern = /(?:Ã.|Â.|â€|鈫|脳|锟斤拷)/u;

async function collectUiFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const target = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
    if (entry.isDirectory()) {
      files.push(...await collectUiFiles(target));
    } else if (checkedExtensions.has(path.extname(entry.name))) {
      files.push(target);
    }
  }

  return files;
}

test('V2 buyer-facing source stays English and free of mojibake', async () => {
  const files = await collectUiFiles(root);
  const failures = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    if (cjkPattern.test(source) || mojibakePattern.test(source)) {
      failures.push(file.pathname);
    }
  }

  assert.deepEqual(failures, []);
});
