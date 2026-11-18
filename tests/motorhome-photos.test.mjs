import assert from 'node:assert/strict';
import test from 'node:test';
import { selectMotorhomePhotos } from '../src/lib/motorhomePhotos.mjs';

const photos = [
  { photo_id: 'first', src: 'first.webp', thumbnail: 'first-thumb.webp', alt: 'Montagem' },
  { photo_id: 'shared', src: 'shared.webp', thumbnail: 'shared-thumb.webp', alt: 'Instalação' },
];
const project = {
  photos,
  photo_gallery: { status: 'draft', pages: { overview: ['shared', 'first'], plumbing: ['shared'], gas: ['shared'] } },
};

test('mantém fotos em rascunho fora da produção e libera apenas na prévia ou após publicação', () => {
  assert.deepEqual(selectMotorhomePhotos(project, 'overview'), []);
  assert.deepEqual(selectMotorhomePhotos(project, 'overview', true), [photos[1], photos[0]]);
  assert.deepEqual(selectMotorhomePhotos({ ...project, photo_gallery: { ...project.photo_gallery, status: 'published' } }, 'overview'), [photos[1], photos[0]]);
  assert.deepEqual(selectMotorhomePhotos({}, 'overview'), []);
});

test('reutiliza a mesma foto sem duplicar arquivos e preserva a ordem da seleção sem mutação', () => {
  const before = structuredClone(project);
  assert.equal(selectMotorhomePhotos(project, 'plumbing', true)[0], photos[1]);
  assert.equal(selectMotorhomePhotos(project, 'gas', true)[0], photos[1]);
  assert.deepEqual(selectMotorhomePhotos(project, 'missing', true), []);
  assert.deepEqual(project, before);
});

test('rejeita referências ausentes, IDs repetidos e status inválido inclusive em rascunho', () => {
  assert.throws(() => selectMotorhomePhotos({ ...project, photos: [photos[0]] }, 'overview'), /Foto inexistente/);
  assert.throws(() => selectMotorhomePhotos({ ...project, photos: [...photos, photos[0]] }, 'overview'), /repetido/);
  assert.throws(() => selectMotorhomePhotos({ ...project, photo_gallery: { status: 'draft', pages: { overview: ['first', 'first'] } } }, 'overview'), /Fotos repetidas/);
  assert.throws(() => selectMotorhomePhotos({ ...project, photo_gallery: { ...project.photo_gallery, status: 'invalid' } }, 'overview'), /Status/);
});
