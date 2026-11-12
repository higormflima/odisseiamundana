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
  assert.ok(collections[0].cover.thumbnailSize.width > 0);
  assert.ok(collections[0].cover.thumbnailSize.width < collections[0].cover.width);
});

test('separa título e capa da coleção do destaque fotográfico', () => {
  const cover = { ...photo, cover: true };
  const featured = { ...photo, src: 'media/journeys/finland-2026/photos/finland-002.jpg', featured: true };
  const journeys = [{ id: 'trip', data: { title: 'Título da viagem', gallery: { collection_title: 'Título da coleção', photos: [cover, featured] } } }];
  const [collection] = buildGalleryCollections({ journeys, pages: [published('trip')], base: '/' });
  assert.equal(collection.title, 'Título da coleção');
  assert.equal(collection.cover.src, `/${cover.src}`);
  assert.equal(collection.photos.filter((item) => item.featured)[0].src, `/${featured.src}`);
  assert.equal(journeys[0].data.title, 'Título da viagem');
});
