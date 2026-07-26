import path from 'node:path';
import { readFile } from 'node:fs/promises';

const ROOT = process.cwd();
const PARTS = [0, 1, 2, 3, 4];

export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    const chunks = await Promise.all(
      PARTS.map(index => readFile(path.join(ROOT, 'assets', 'data', `blog-sprite-${index}.txt`), 'utf8'))
    );
    const buffer = Buffer.from(chunks.join('').replace(/\s+/g, ''), 'base64');
    const riff = buffer.subarray(0, 4).toString('ascii');
    const webp = buffer.subarray(8, 12).toString('ascii');
    if (riff !== 'RIFF' || webp !== 'WEBP') {
      throw new Error(`Invalid blog sprite data: ${riff}/${webp}, ${buffer.length} bytes`);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.setHeader('X-Blog-Sprite-Bytes', String(buffer.length));
    if (req.method === 'HEAD') res.end();
    else res.end(buffer);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Blog artwork could not be generated.');
  }
}
