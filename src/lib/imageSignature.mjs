import { existsSync } from 'node:fs';
import path from 'node:path';

function resolveProjectFile(src) {
  const relative = String(src).replace(/^\/+/, '');
  return [path.join(process.cwd(), relative), path.join(process.cwd(), 'public', relative)]
    .find((candidate) => existsSync(candidate));
}

export async function readColorSignatureFromSrc(src) {
  const file = resolveProjectFile(src);
  if (!file) return null;
  try {
    const sharp = (await import('sharp')).default;
    const { data } = await sharp(file)
      .resize(4, 4, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return [...data].map((value) => Math.round((value / 255) * 1000) / 1000);
  } catch {
    return null;
  }
}
