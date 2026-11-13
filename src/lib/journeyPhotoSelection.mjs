export function selectJourneyPhotos(photos, photoNames) {
  if (!photoNames) return photos;
  const selected = new Set(photoNames);
  if (selected.size !== photoNames.length) throw new Error('Seleção de fotos contém nomes duplicados.');
  const available = new Set(photos.map((photo) => photo.src.split('/').at(-1)));
  const missing = photoNames.filter((name) => !available.has(name));
  if (missing.length) throw new Error(`Fotos não encontradas na galeria: ${missing.join(', ')}.`);
  return photos.filter((photo) => selected.has(photo.src.split('/').at(-1)));
}
