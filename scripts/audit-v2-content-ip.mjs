import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const siteRoot = path.join(root, '.release-candidate', 'site-v2');
const forbidden = ['barbie','disney','frozen','hello kitty','marvel','minecraft','mickey mouse','minnie mouse','my little pony','paw patrol','pokemon','sanrio','sonic the hedgehog','spider-man','spongebob','star wars','super mario','transformers','winnie the pooh'];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const full = path.join(directory,entry.name);
    if (entry.isDirectory()) files.push(...await walk(full)); else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const errors = [];
const titles = new Map();
for (const file of await walk(siteRoot)) {
  const html = await readFile(file,'utf8');
  const lower = html.toLowerCase();
  for (const term of forbidden) if (lower.includes(term)) errors.push(`${path.relative(siteRoot,file)} contains blocked IP term: ${term}`);
  if (!/<meta name="robots" content="index,follow">/i.test(html)) continue;
  const h1Count = (html.match(/<h1\b/gi)||[]).length;
  if (h1Count !== 1) errors.push(`${path.relative(siteRoot,file)} has ${h1Count} H1 elements`);
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  if (!title) errors.push(`${path.relative(siteRoot,file)} has no title`);
  else if (titles.has(title)) errors.push(`${path.relative(siteRoot,file)} duplicates title from ${titles.get(title)}`);
  else titles.set(title,path.relative(siteRoot,file));
  if (!/<link rel="canonical" href="https:\/\/www\.haibucrafts\.com\//i.test(html)) errors.push(`${path.relative(siteRoot,file)} has no production canonical`);
}

if (errors.length) {
  console.error(`Content/IP audit failed:\n${errors.join('\n')}`);
  process.exitCode=1;
} else console.log(`Content/IP audit passed: ${titles.size} indexable pages, ${forbidden.length} blocked terms, unique titles and one H1 per page.`);
