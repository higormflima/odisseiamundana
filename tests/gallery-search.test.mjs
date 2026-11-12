import assert from 'node:assert/strict';
import test from 'node:test';
import { availableCountries, selectGalleryPhotos } from '../src/lib/gallerySearch.mjs';

const photos = [
  { collectionTitle: 'Finlândia', alt: 'Aurora', journeyDate: '2026-02', geography: { continents: ['Europa'], countries: ['Finlândia'], regions: ['Lapônia'], destinations: ['Rovaniemi'] } },
  { collectionTitle: 'Palawan', alt: 'Praia', journeyDate: '2025-12-01', geography: { continents: ['Ásia'], countries: ['Filipinas'], regions: ['Palawan'], destinations: ['El Nido'] } },
  { collectionTitle: 'Pequim', alt: 'Muralha', journeyDate: '2025-11-30', geography: { continents: ['Ásia'], countries: ['China'], regions: [], destinations: ['Pequim'] } },
  { collectionTitle: 'Sem data', alt: 'Montanha', journeyDate: '', geography: { continents: [], countries: [], regions: [], destinations: [] } },
];

test('combina busca sem acentos e filtros geográficos com AND', () => {
  assert.deepEqual(selectGalleryPhotos(photos, { query: 'lapOnia aurora', continent: 'Europa', country: 'Finlândia' }), [0]);
  assert.deepEqual(selectGalleryPhotos(photos, { query: 'palawan', continent: 'Europa' }), []);
  assert.deepEqual(selectGalleryPhotos(photos, { query: 'pequim' }), [2]);
  assert.deepEqual(availableCountries(photos, 'Ásia'), ['China', 'Filipinas']);
  assert.deepEqual(availableCountries(photos, 'Europa'), ['Finlândia']);
});

test('ordena por data da viagem e mantém dados sem data por último', () => {
  assert.deepEqual(selectGalleryPhotos(photos), [0, 1, 2, 3]);
  assert.deepEqual(selectGalleryPhotos(photos, { order: 'oldest' }), [2, 1, 0, 3]);
  assert.deepEqual(selectGalleryPhotos(photos, { order: 'random', randomRanks: [0.7, 0.3, 0.2, 0.1] }), [3, 2, 1, 0]);
  assert.deepEqual(selectGalleryPhotos(photos, { order: 'random', randomRanks: [0.7, 0.3, 0.2, 0.1], continent: 'Ásia' }), [2, 1]);
  assert.throws(() => selectGalleryPhotos(photos, { order: 'invalid' }), RangeError);
});
