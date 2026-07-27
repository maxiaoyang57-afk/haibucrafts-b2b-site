import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const EXPECTED = {
  'blog-replica-00.txt': '95701f73e5db44aed77a028bd66b762a76166a3e',
  'blog-replica-01.txt': 'cfe4bb7939b6160691d9cd2718ecc0edfca73a9b',
  'blog-replica-02.txt': '798868b05afd7ba1f6e5748af0c3ee3b74044891',
  'blog-replica-tail-00.txt': '64f3d16c0103c2fb6471e19322527e99b282bf4a',
  'blog-replica-tail-01.txt': '9364954121474f63c5a3110e6f06b7a89e7922b5',
  'blog-replica-tail-02.txt': '27c712a9284de7506ff475e0f73e36b12dafed59',
  'blog-replica-tail-03.txt': '87799851143f2b6ddbea2dda4a012a92ec2efa9b',
  'blog-replica-tail-04.txt': 'df5e210e416d142975130a329332d224db2cd3ab',
  'blog-replica-tail-05.txt': '3d33c9052f422093a0e3bc3d4bdf7870951b92fe',
  'blog-replica-tail-06.txt': '822267392f455292b10696066708e7bf67019917',
  'blog-replica-tail-07.txt': '22c74c58e0063913dcc9ba535cfecf2a141c6d84',
  'blog-replica-tail-08.txt': '3e958684198cccf92c4c6998289042ce0a33b80e',
  'blog-replica-tail-09.txt': 'af9b82bc5a75b4846fb98ab7bd1dbca6481b2758',
  'blog-replica-tail-10.txt': '32a756e9ad21d3adbe90331b7b4e1c3f2055a798',
  'blog-replica-tail-11.txt': '811f1f2fa5f78ff27634cffceaf6a2c1d80640e1',
  'blog-replica-tail-12.txt': '94587958066207042d6c03e93806727ce59d4891',
  'blog-replica-tail-13.txt': '948629a48ee1ea7ca8b8deb00d8da642750641a2',
  'blog-replica-tail-14.txt': 'fdb39618b58df11374a1d533a95cbddf67048a5e',
  'blog-replica-tail-15.txt': '047a3c50eb01ee940e5c562313a0cb010d9a1d10'
};

function gitBlobSha(content) {
  const buffer = Buffer.from(content, 'utf8');
  return createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');
}

export default async function handler(_req, res) {
  const files = [];
  for (const [name, expected] of Object.entries(EXPECTED)) {
    try {
      const content = await readFile(path.join(ROOT, 'assets', 'data', name), 'utf8');
      const actual = gitBlobSha(content);
      files.push({ name, expected, actual, length: content.length, passed: actual === expected });
    } catch (error) {
      files.push({ name, expected, error: error.message, passed: false });
    }
  }
  const passed = files.every(file => file.passed);
  res.statusCode = passed ? 200 : 500;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ passed, files }));
}
