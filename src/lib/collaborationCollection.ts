import { getCollection } from 'astro:content';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildCollaborations } from './collaborations.mjs';

export async function loadCollaborations() {
  const projects = buildCollaborations(
    await getCollection('collaborationMetadata'),
    await getCollection('collaborationPages'),
    { includeDrafts: import.meta.env.DEV },
  );
  for (const project of projects) {
    const images = [project.cover, ...(project.photos ?? []), ...(project.partner?.logo ? [project.partner.logo] : [])];
    for (const image of images) {
      for (const path of [image.src, image.thumbnail].filter(Boolean)) {
        if (!existsSync(resolve('public', path))) {
          throw new Error(`Imagem da colaboração "${project.collaboration_id}" não encontrada em public: ${path}. Sincronize a mídia.`);
        }
      }
    }
  }
  return projects;
}
