export const TRIP_RATING_SCALE_MAX = 10;

/** Critérios oficiais do Trip Card, na ordem de exibição. */
export const TRIP_RATING_CRITERIA = [
  { id: 'nature', label: 'Natureza' },
  { id: 'experiences', label: 'Experiências' },
  { id: 'food', label: 'Gastronomia' },
  { id: 'prices', label: 'Preços' },
  { id: 'infrastructure', label: 'Infraestrutura' },
  { id: 'accessibility', label: 'Acessibilidade' },
  { id: 'culture', label: 'Cultura' },
  { id: 'safety', label: 'Segurança' },
];

/**
 * @param {number} value
 */
export function formatTripRating(value) {
  return `${value}/${TRIP_RATING_SCALE_MAX}`;
}

/**
 * Prepara a avaliação para exibição. A nota geral vem apenas de `overall_rating`:
 * nunca é derivada das categorias. Retorna `undefined` quando não há nenhuma nota.
 *
 * @param {{ overall_rating?: number, ratings?: Record<string, number> } | undefined} tripCard
 */
export function buildTripScore(tripCard) {
  const overall = tripCard?.overall_rating;
  const ratings = TRIP_RATING_CRITERIA.flatMap(({ id, label }) => {
    const value = tripCard?.ratings?.[id];
    return value === undefined ? [] : [{ id, label, value }];
  });

  if (overall === undefined && ratings.length === 0) return undefined;
  return { overall, ratings };
}
