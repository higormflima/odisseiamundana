import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGalleryCollections } from '../src/lib/galleryCollections.mjs';

const photo = { src: 'media/journeys/finland-2026/photos/finland-001.jpg', thumbnail: 'media/journeys/finland-2026/thumbnails/finland-001.jpg', alt: 'Fotografia da viagem' };
const published = (id) => ({ data: { journey_id: { id }, episode_id: 'journey-summary', status: 'published', title: id } });

test('inclui apenas coleções com resumo publicado e fotos, ordenadas por data', () => {
  const journeys = [
    { id: 'old', data: { title: 'Viagem antiga', dates: { year: 2020 }, gallery: { photos: [photo] } } },
    { id: 'new', data: { title: 'Viagem recente', dates: { year: 2025, month: 2 }, gallery: { photos: [{ ...photo, featured: true }] } } },
    { id: 'empty', data: { gallery: { photos: [] } } },
    { id: 'draft', data: { gallery: { photos: [photo] } } },
  ];
  const collections = buildGalleryCollections({ journeys, pages: [published('old'), published('new'), published('empty')], base: '/site/' });
  assert.deepEqual(collections.map((item) => item.id), ['new', 'old']);
  assert.equal(collections[0].cover.featured, true);
  assert.equal(collections[0].period, 'Fevereiro de 2025');
  assert.equal(collections[0].href, '/site/pt/galeria/new/');
  assert.equal(collections[1].cover, collections[1].photos[0]);
  assert.equal(collections[1].storyHref, '/site/pt/viagens/old/journey-summary/');
  assert.ok(collections[0].cover.src.startsWith('/site/'));
});
