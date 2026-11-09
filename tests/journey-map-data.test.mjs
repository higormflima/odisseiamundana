import assert from 'node:assert/strict';
import test from 'node:test';
import { buildJourneyMapEntries, formatJourneyDuration, formatJourneyPeriod } from '../src/lib/journeyMapData.mjs';

const point = { name: 'Base da viagem', coordinates: { lat: 60.1, lng: 24.9 } };

function journey(id, data = {}) {
  return { id, data: { journey_id: id, title: `Viagem ${id}`, ...data } };
}

function summaryPage(journeyId, status = 'published', videoId) {
  return {
    data: {
      journey_id: { id: journeyId },
      episode_id: 'journey-summary',
      status,
      ...(videoId ? { youtube_video_id: { id: videoId } } : {}),
    },
  };
}

test('cria marcador apenas para viagem com ponto representativo e resumo publicado', () => {
  const entries = buildJourneyMapEntries({
    journeys: [
      journey('with-point', { geography: { representative_point: point } }),
      journey('without-point'),
      journey('draft-page', { geography: { representative_point: point } }),
    ],
    pages: [summaryPage('with-point'), summaryPage('without-point'), summaryPage('draft-page', 'draft')],
    base: '/',
  });

  assert.deepEqual(entries.map((entry) => entry.journeyId), ['with-point']);
  assert.equal(entries[0].lat, 60.1);
  assert.equal(entries[0].lng, 24.9);
});

test('ignora páginas de episódio que não são o resumo da viagem', () => {
  const page = summaryPage('trip');
  page.data.episode_id = 'husky-sledding';

  const entries = buildJourneyMapEntries({
    journeys: [journey('trip', { geography: { representative_point: point } })],
    pages: [page],
    base: '/',
  });

  assert.equal(entries.length, 0);
});

test('monta o link respeitando a base do GitHub Pages', () => {
  const [entry] = buildJourneyMapEntries({
    journeys: [journey('trip', { geography: { representative_point: point } })],
    pages: [summaryPage('trip')],
    base: '/odisseiamundana/',
  });

  assert.equal(entry.href, '/odisseiamundana/pt/viagens/trip/journey-summary/');
});

test('usa somente dados disponíveis no card', () => {
  const [entry] = buildJourneyMapEntries({
    journeys: [journey('trip', {
      geography: { countries: ['Finlândia'], regions: ['Lapônia'], representative_point: point },
      dates: { year: 2026, month: 2 },
      duration_days: 5,
      summary: 'Resumo aprovado.\n',
    })],
    pages: [summaryPage('trip', 'published', 'video1')],
    videos: [{ id: 'video1', data: { title: 'Guia', thumbnail_url: 'https://example.com/thumb.jpg' } }],
    base: '/',
  });

  assert.equal(entry.location, 'Lapônia, Finlândia');
  assert.equal(entry.period, 'Fevereiro de 2026');
  assert.equal(entry.duration, '5 dias');
  assert.equal(entry.summary, 'Resumo aprovado.');
  assert.deepEqual(entry.image, { src: 'https://example.com/thumb.jpg', alt: 'Miniatura do vídeo Guia' });

  const [bare] = buildJourneyMapEntries({
    journeys: [journey('bare', { geography: { representative_point: point } })],
    pages: [summaryPage('bare')],
    base: '/',
  });
  assert.equal(bare.location, undefined);
  assert.equal(bare.period, undefined);
  assert.equal(bare.duration, undefined);
  assert.equal(bare.summary, undefined);
  assert.equal(bare.image, undefined);
});

test('formata período e duração em português', () => {
  assert.equal(formatJourneyPeriod({ year: 2019 }), '2019');
  assert.equal(formatJourneyPeriod(undefined), undefined);
  assert.equal(formatJourneyDuration(1), '1 dia');
});
