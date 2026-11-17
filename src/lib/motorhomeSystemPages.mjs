/**
 * @typedef {{
 *   system_id: string, title: string, video_ids?: string[],
 *   equipment?: string[], materials?: string[], tools?: string[], technologies?: string[]
 * }} MotorhomeSystem
 */

/**
 * @param {{ systems?: MotorhomeSystem[] }} project
 * @param {string[]} systemIds
 * @param {{ videoId: string, title: string, url: string, position: number }[]} playlist
 * @param {string} [featuredVideoId]
 */
export function buildMotorhomeSystemPage(project, systemIds, playlist, featuredVideoId) {
  if (!systemIds.length || new Set(systemIds).size !== systemIds.length) {
    throw new Error('A página deve referenciar etapas distintas e não vazias.');
  }
  const systems = systemIds.map((id) => {
    const system = project.systems?.find((item) => item.system_id === id);
    if (!system) throw new Error(`Etapa inexistente no projeto: ${id}`);
    return system;
  });
  const videoIds = new Set(systems.flatMap((system) => system.video_ids ?? []));
  const playlistIds = new Set(playlist.map((video) => video.videoId));
  for (const id of videoIds) {
    if (!playlistIds.has(id)) throw new Error(`Vídeo da página ausente da playlist: ${id}`);
  }
  if (featuredVideoId !== undefined && !videoIds.has(featuredVideoId)) {
    throw new Error(`Vídeo principal não pertence às etapas da página: ${featuredVideoId}`);
  }
  const videos = playlist.filter((video) => videoIds.has(video.videoId));
  if (featuredVideoId !== undefined) {
    const index = videos.findIndex((video) => video.videoId === featuredVideoId);
    videos.unshift(...videos.splice(index, 1));
  }
  /** @param {'equipment' | 'materials' | 'tools' | 'technologies'} field */
  const merge = (field) => [...new Set(systems.flatMap((system) => system[field] ?? []))];
  return {
    systems,
    equipment: merge('equipment'),
    materials: merge('materials'),
    tools: merge('tools'),
    technologies: merge('technologies'),
    videos,
  };
}
