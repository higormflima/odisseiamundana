import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTripScore, formatTripRating, TRIP_RATING_CRITERIA } from '../src/lib/tripScore.mjs';

test('não gera avaliação quando não há notas', () => {
  assert.equal(buildTripScore(undefined), undefined);
  assert.equal(buildTripScore({}), undefined);
  assert.equal(buildTripScore({ ratings: {} }), undefined);
});

test('exibe somente as categorias avaliadas, na ordem oficial', () => {
  const score = buildTripScore({ ratings: { safety: 9, nature: 8, food: 6 } });

  assert.deepEqual(score.ratings, [
    { id: 'nature', label: 'Natureza', value: 8 },
    { id: 'food', label: 'Gastronomia', value: 6 },
    { id: 'safety', label: 'Segurança', value: 9 },
  ]);
});

test('não calcula a nota geral a partir das categorias', () => {
  const withoutOverall = buildTripScore({ ratings: { nature: 9, culture: 7 } });
  assert.equal(withoutOverall.overall, undefined);

  const independent = buildTripScore({ overall_rating: 4, ratings: { nature: 10, culture: 10 } });
  assert.equal(independent.overall, 4);
});

test('aceita apenas a nota geral', () => {
  assert.deepEqual(buildTripScore({ overall_rating: 7 }), { overall: 7, ratings: [] });
});

test('cobre os oito critérios oficiais', () => {
  assert.deepEqual(
    TRIP_RATING_CRITERIA.map(({ id }) => id),
    ['nature', 'experiences', 'food', 'prices', 'infrastructure', 'accessibility', 'culture', 'safety'],
  );
});

test('formata a nota na escala de 1 a 10', () => {
  assert.equal(formatTripRating(7), '7/10');
});
