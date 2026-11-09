export const JOURNEY_SUMMARY_EPISODE_ID = 'journey-summary';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * @param {{ year?: number, month?: number } | undefined} dates
 */
export function formatJourneyPeriod(dates) {
  if (!dates?.year) return undefined;
  return dates.month ? `${MONTHS_PT[dates.month - 1]} de ${dates.year}` : String(dates.year);
}

/**
 * @param {number | undefined} days
 */
export function formatJourneyDuration(days) {
  if (!days) return undefined;
  return days === 1 ? '1 dia' : `${days} dias`;
}

/**
 * Monta os marcadores do mapa a partir dos metadados e das páginas publicadas.
 * Viagens sem `geography.representative_point` ou sem página de resumo publicada ficam de fora.
 *
 * @param {object} input
 * @param {Array<{ id: string, data: any }>} input.journeys
 * @param {Array<{ data: { journey_id: { id: string }, episode_id: string, status: string, youtube_video_id?: { id: string } } }>} input.pages
 * @param {Array<{ id: string, data: any }>} [input.videos]
 * @param {string} input.base URL base do site, terminada em `/`.
 */
export function buildJourneyMapEntries({ journeys, pages, videos = [], base }) {
  const videosById = new Map(videos.map((video) => [video.id, video.data]));

  return journeys.flatMap(({ id, data }) => {
    const point = data.geography?.representative_point;
    const page = pages.find((entry) =>
      entry.data.journey_id.id === id
      && entry.data.episode_id === JOURNEY_SUMMARY_EPISODE_ID
      && entry.data.status === 'published');
    if (!point || !page) return [];

    const video = page.data.youtube_video_id ? videosById.get(page.data.youtube_video_id.id) : undefined;
    const regions = data.geography?.regions ?? [];
    const countries = data.geography?.countries ?? [];

    return [{
      journeyId: id,
      title: data.title ?? id,
      pointName: point.name,
      lat: point.coordinates.lat,
      lng: point.coordinates.lng,
      location: [...regions, ...countries].join(', ') || undefined,
      period: formatJourneyPeriod(data.dates),
      duration: formatJourneyDuration(data.duration_days),
      summary: data.summary?.trim(),
      image: video?.thumbnail_url
        ? { src: video.thumbnail_url, alt: `Miniatura do vídeo ${video.title ?? data.title ?? id}` }
        : undefined,
      href: `${base}pt/viagens/${id}/${JOURNEY_SUMMARY_EPISODE_ID}/`,
    }];
  });
}
