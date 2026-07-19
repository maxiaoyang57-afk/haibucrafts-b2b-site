import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'public');
const directories = [
  'about',
  'applications',
  'assets',
  'blog',
  'custom-services',
  'products',
  'quote'
];
const files = [
  '404.html',
  'index.html',
  'privacy.html',
  'robots.txt',
  'sitemap.xml'
];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const directory of directories) {
  fs.cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
}

for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}

console.log(`Copied ${directories.length} directories and ${files.length} root files to public/.`);
