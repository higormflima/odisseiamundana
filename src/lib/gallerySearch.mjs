export function normalizeGalleryText(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}

export function availableCountries(photos, continent) {
  return [...new Set(photos
    .filter((photo) => !continent || photo.geography.continents.includes(continent))
    .flatMap((photo) => photo.geography.countries))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function selectGalleryPhotos(photos, { query = '', continent = '', country = '', order = 'recent', randomRanks = [] } = {}) {
  const terms = normalizeGalleryText(query).split(/\s+/).filter(Boolean);
  const selected = photos.map((photo, index) => ({ photo, index })).filter(({ photo }) => {
    const geography = photo.geography;
    const searchable = normalizeGalleryText([
      photo.collectionTitle, photo.alt, ...geography.continents, ...geography.countries,
      ...geography.regions, ...geography.destinations,
    ].join(' '));
    return (!continent || geography.continents.includes(continent))
      && (!country || geography.countries.includes(country))
      && terms.every((term) => searchable.includes(term));
  });
  if (!['recent', 'oldest', 'random'].includes(order)) throw new RangeError('Ordenação de galeria inválida.');
  selected.sort((a, b) => {
    if (order === 'random') return (randomRanks[a.index] ?? 0) - (randomRanks[b.index] ?? 0) || a.index - b.index;
    const left = a.photo.journeyDate;
    const right = b.photo.journeyDate;
    if (!left || !right) return Number(!left) - Number(!right) || a.index - b.index;
    return (order === 'recent' ? right.localeCompare(left) : left.localeCompare(right)) || a.index - b.index;
  });
  return selected.map(({ index }) => index);
}
