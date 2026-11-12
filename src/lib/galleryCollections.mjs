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
    const geography = {
      continents: data.geography?.continents ?? [],
      countries: data.geography?.countries ?? [],
      regions: data.geography?.regions ?? [],
      destinations: data.geography?.destinations ?? [],
    };
    const title = data.title ?? page.data.title;
    const dates = data.dates;
    const photos = sourcePhotos.map((photo) => ({
      src: path(photo.src),
      thumbnail: path(photo.thumbnail),
      alt: photo.alt,
      featured: photo.featured === true,
      collectionId: id,
      collectionTitle: title,
      geography,
      journeyDate: dates?.start_date ?? (dates?.year ? `${dates.year}${dates.month ? `-${String(dates.month).padStart(2, '0')}` : ''}` : ''),
      ...readImageSizeFromSrc(photo.src),
      thumbnailSize: readImageSizeFromSrc(photo.thumbnail),
    }));
    return [{
      id,
      title,
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
