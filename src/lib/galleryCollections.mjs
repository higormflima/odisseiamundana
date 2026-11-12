import { compareJourneysByRecency, formatJourneyPeriod, JOURNEY_SUMMARY_EPISODE_ID } from './journeyMapData.mjs';
import { readImageSizeFromSrc } from './imageSize.mjs';

/**
 * Adapta as galerias editoriais existentes para a galeria.
 * @param {{journeys: Array<{id: string, data: any}>, pages: Array<{data: any}>, base: string}} input
 */
export function buildGalleryCollections({ journeys, pages, base }) {
  const path = (src) => `${base}${src.replace(/^\/+/, '')}`;
  return journeys.flatMap(({ id, data }) => {
    const page = pages.find(({ data: entry }) =>
      entry.journey_id.id === id && entry.episode_id === JOURNEY_SUMMARY_EPISODE_ID && entry.status === 'published');
    const sourcePhotos = data.gallery?.photos ?? [];
    if (!page || !sourcePhotos.length) return [];
    const photos = sourcePhotos.map((photo) => ({
      src: path(photo.src),
      thumbnail: path(photo.thumbnail),
      alt: photo.alt,
      featured: photo.featured === true,
      ...readImageSizeFromSrc(photo.src),
    }));
    return [{
      id,
      title: data.title ?? page.data.title,
      summary: data.summary?.trim(),
      dates: data.dates,
      period: formatJourneyPeriod(data.dates),
      photos,
      cover: photos.find((photo) => photo.featured) ?? photos[0],
      href: `${base}pt/galeria/${id}/`,
      storyHref: `${base}pt/viagens/${id}/${JOURNEY_SUMMARY_EPISODE_ID}/`,
    }];
  }).sort((left, right) => compareJourneysByRecency(left.dates, right.dates) || left.id.localeCompare(right.id));
}
