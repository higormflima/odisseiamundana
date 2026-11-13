import assert from 'node:assert/strict';
import test from 'node:test';
import { selectJourneyPhotos } from '../src/lib/journeyPhotoSelection.mjs';

const photos = [{ src: 'media/fotos/a.jpg' }, { src: 'media/fotos/b.jpg' }];

test('mantém a galeria completa quando não há seleção', () => {
  assert.deepEqual(selectJourneyPhotos(photos), photos);
});

test('seleciona fotos existentes preservando a ordem da galeria', () => {
  assert.deepEqual(selectJourneyPhotos(photos, ['b.jpg']), [photos[1]]);
  assert.deepEqual(selectJourneyPhotos(photos, ['b.jpg', 'a.jpg']), photos);
});

test('rejeita referências ausentes ou duplicadas', () => {
  assert.throws(() => selectJourneyPhotos(photos, ['ausente.jpg']), /não encontradas/);
  assert.throws(() => selectJourneyPhotos(photos, ['a.jpg', 'a.jpg']), /duplicados/);
});
