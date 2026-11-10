import assert from 'node:assert/strict';
import test from 'node:test';
import { readColorSignatureFromSrc } from '../src/lib/imageSignature.mjs';
import { orderPhotosByVariety } from '../src/lib/photoVariety.mjs';

test('mantém a foto de destaque primeiro e afasta as cenas parecidas', () => {
  const photos = [
    { id: 'neve', signature: [0.9, 0.9, 0.95] },
    { id: 'aurora', signature: [0.1, 0.8, 0.2], featured: true },
    { id: 'neve-parecida', signature: [0.88, 0.9, 0.93] },
    { id: 'cabana', signature: [0.45, 0.25, 0.12] },
  ];

  assert.deepEqual(orderPhotosByVariety(photos).map((photo) => photo.id), [
    'aurora',
    'neve',
    'cabana',
    'neve-parecida',
  ]);
});

test('sem assinatura, conserva a ordem e só antecipa o destaque', () => {
  const photos = [{ id: 'a' }, { id: 'b', featured: true }, { id: 'c' }];
  assert.deepEqual(orderPhotosByVariety(photos).map((photo) => photo.id), ['b', 'a', 'c']);
});

test('a assinatura de cor separa fotos de ambientes diferentes', async (t) => {
  const aurora = await readColorSignatureFromSrc('media/journeys/finland-2026/thumbnails/finland-004.jpg');
  const forest = await readColorSignatureFromSrc('media/journeys/finland-2026/thumbnails/finland-001.jpg');
  if (!aurora || !forest) return t.skip('leitura de cor indisponível neste ambiente');
  assert.equal(aurora.length, 48);
  const difference = aurora.reduce((sum, value, index) => sum + Math.abs(value - forest[index]), 0);
  assert.ok(difference > 1);
});
