import { upload } from '@vercel/blob/client';

const safeFilename = filename => String(filename || 'reference-image')
  .normalize('NFKD')
  .replace(/[^a-zA-Z0-9._-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(-100) || 'reference-image';

export async function uploadInquiryFiles(files, onProgress = () => {}) {
  const selected = Array.from(files || []).slice(0, 10);
  const uploaded = [];

  for (let index = 0; index < selected.length; index += 1) {
    const file = selected[index];
    const path = `inquiries/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${index + 1}-${safeFilename(file.name)}`;
    onProgress({
      current: index + 1,
      total: selected.length,
      percentage: null
    });
    const blob = await upload(path, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      contentType: file.type || undefined
    });
    uploaded.push({
      name: file.name || `reference-image-${index + 1}`,
      size: file.size,
      type: file.type,
      url: blob.url
    });
  }

  return uploaded;
}
