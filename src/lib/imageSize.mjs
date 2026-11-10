import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

function readJpegSize(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = buffer.readUInt16BE(offset);
    if (sofMarkers.has(marker)) {
      return { width: buffer.readUInt16BE(offset + 5), height: buffer.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  return null;
}

function readPngSize(buffer) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (signature.some((byte, index) => buffer[index] !== byte) || buffer.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function readGifSize(buffer) {
  const header = buffer.toString('ascii', 0, 6);
  if (header !== 'GIF87a' && header !== 'GIF89a') return null;
  return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
}

function readWebpSize(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
  const format = buffer.toString('ascii', 12, 16);
  const data = buffer.subarray(20);
  if (format === 'VP8X' && data.length >= 10) {
    return {
      width: 1 + data[4] + (data[5] << 8) + (data[6] << 16),
      height: 1 + data[7] + (data[8] << 8) + (data[9] << 16),
    };
  }
  if (format === 'VP8 ' && data.length >= 9 && data[3] === 0x9d && data[4] === 0x01 && data[5] === 0x2a) {
    return { width: data.readUInt16LE(6) & 0x3fff, height: data.readUInt16LE(8) & 0x3fff };
  }
  if (format === 'VP8L' && data[0] === 0x2f && data.length >= 5) {
    const bits = data.readUInt32LE(1);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

export function readImageSize(buffer) {
  return readPngSize(buffer) || readGifSize(buffer) || readWebpSize(buffer) || readJpegSize(buffer);
}

export function readImageSizeFromSrc(src) {
  const relative = String(src).replace(/^\/+/, '');
  const file = [path.join(process.cwd(), relative), path.join(process.cwd(), 'public', relative)]
    .find((candidate) => existsSync(candidate));
  if (!file) return null;
  try {
    return readImageSize(readFileSync(file));
  } catch {
    return null;
  }
}
