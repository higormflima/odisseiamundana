import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * @param {{ playlist_order?: string[], videos?: { video_id: string, youtube_url: string }[] }} project
 * @param {string} sourceDirectory
 */
export async function loadMotorhomePlaylist(project, sourceDirectory) {
  const references = new Map((project.videos ?? []).map((video) => [video.video_id, video]));
  const filenames = await readdir(sourceDirectory);
  return Promise.all((project.playlist_order ?? []).map(async (videoId, index) => {
    const video = references.get(videoId);
    if (!video) throw new Error(`Vídeo da playlist sem referência no projeto: ${videoId}`);
    const filename = filenames.find((name) => name.endsWith(`[${videoId}].info.json`));
    if (!filename) throw new Error(`Metadados originais do vídeo não encontrados: ${videoId}`);
    const source = JSON.parse(await readFile(path.join(sourceDirectory, filename), 'utf8'));
    if (source.id !== videoId || typeof source.title !== 'string' || !source.title.trim()) {
      throw new Error(`Identificador ou título inválido nos metadados originais: ${filename}`);
    }
    return { videoId, title: source.title, url: video.youtube_url, position: index + 1 };
  }));
}
