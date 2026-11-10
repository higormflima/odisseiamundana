import assert from 'node:assert/strict';
import test from 'node:test';
import { readImageSize, readImageSizeFromSrc } from '../src/lib/imageSize.mjs';

test('lê largura e altura de um JPEG', () => {
  const jpeg = Buffer.from([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0xc8, 0x01, 0x90, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xd9,
  ]);
  assert.deepEqual(readImageSize(jpeg), { width: 400, height: 200 });
});

test('lê largura e altura de um PNG', () => {
  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
  png.write('IHDR', 12, 'ascii');
  png.writeUInt32BE(640, 16);
  png.writeUInt32BE(480, 20);
  assert.deepEqual(readImageSize(png), { width: 640, height: 480 });
});

test('lê as fotos da Finlândia no disco', () => {
  assert.deepEqual(readImageSizeFromSrc('media/journeys/finland-2026/photos/finland-004.jpg'), { width: 2048, height: 1536 });
  assert.deepEqual(readImageSizeFromSrc('media/journeys/finland-2026/photos/finland-003.jpg'), { width: 1330, height: 2364 });
});
