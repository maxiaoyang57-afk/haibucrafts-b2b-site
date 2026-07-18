import { handleUpload } from '@vercel/blob/client';

const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/svg+xml',
  'application/pdf',
  'application/postscript',
  'application/illustrator',
  'application/octet-stream'
];
const allowedExtensions = /\.(?:jpe?g|png|webp|gif|heic|heif|svg|pdf|ai|eps)$/i;

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const origin = request.headers.origin;
    const host = request.headers.host;
    if (origin && host && new URL(origin).host !== host) {
      return response.status(403).json({ error: 'Invalid origin' });
    }

    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async pathname => {
        if (!String(pathname || '').startsWith('inquiries/') || !allowedExtensions.test(String(pathname))) throw new Error('Invalid upload path');
        return {
          allowedContentTypes: allowedTypes,
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ createdAt: Date.now() })
        };
      },
      onUploadCompleted: async () => {}
    });
    return response.status(200).json(result);
  } catch (error) {
    console.error('Blob upload authorization failed', error instanceof Error ? error.message : error);
    return response.status(400).json({ error: 'Upload could not be authorized' });
  }
}
