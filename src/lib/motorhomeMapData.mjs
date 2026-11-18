/**
 * Adapta projetos publicados ao mapa existente sem criar registros de viagem.
 *
 * @param {object} input
 * @param {Array<{ id: string, data: {
 *   build_location?: string,
 *   summary?: string,
 *   map_image?: { src: string, alt: string },
 *   representative_point?: { name: string, coordinates: { lat: number, lng: number } }
 * } }>} input.projects
 * @param {Array<{ data: { project_id: { id: string }, title: string, status: string } }>} input.pages
 * @param {string} input.base URL base do site, terminada em `/`.
 */
export function buildMotorhomeMapEntries({ projects, pages, base }) {
  return projects.flatMap(({ id, data }) => {
    const point = data.representative_point;
    const page = pages.find((entry) => entry.data.project_id.id === id && entry.data.status === 'published');
    if (!point || !page) return [];

    return [{
      journeyId: `motorhome-${id}`,
      title: page.data.title,
      pointName: point.name,
      lat: point.coordinates.lat,
      lng: point.coordinates.lng,
      location: data.build_location,
      summary: data.summary?.trim(),
      image: data.map_image
        ? { src: `${base}${data.map_image.src}`, alt: data.map_image.alt }
        : undefined,
      href: `${base}pt/motorhomes/${id}/`,
      linkLabel: 'Conhecer o motorhome',
    }];
  });
}
