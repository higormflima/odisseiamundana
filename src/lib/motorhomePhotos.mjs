/**
 * @typedef {{
 *   photo_id: string, src: string, thumbnail?: string, alt: string, caption?: string
 * }} MotorhomePhoto
 * @typedef {{
 *   photo_gallery?: { status: 'draft' | 'published', pages: Record<string, string[]> },
 *   photos?: MotorhomePhoto[]
 * }} MotorhomePhotoProject
 */

/**
 * @param {MotorhomePhotoProject} project
 * @param {string} pageId
 * @param {boolean} [includeDrafts]
 */
export function selectMotorhomePhotos(project, pageId, includeDrafts = false) {
  const gallery = project.photo_gallery;
  if (!gallery) return [];
  if (!['draft', 'published'].includes(gallery.status)) {
    throw new Error('Status da galeria do motorhome inválido.');
  }
  const byId = new Map((project.photos ?? []).map((photo) => [photo.photo_id, photo]));
  if (byId.size !== (project.photos ?? []).length) {
    throw new Error('Identificador de foto do motorhome repetido.');
  }
  for (const [page, ids] of Object.entries(gallery.pages)) {
    if (new Set(ids).size !== ids.length) throw new Error(`Fotos repetidas na seleção: ${page}`);
    for (const id of ids) {
      if (!byId.has(id)) throw new Error(`Foto inexistente na seleção ${page}: ${id}`);
    }
  }
  if (gallery.status !== 'published' && !includeDrafts) return [];
  return (gallery.pages[pageId] ?? []).map((id) => {
    const photo = byId.get(id);
    if (!photo) throw new Error(`Foto inexistente: ${id}`);
    return photo;
  });
}
