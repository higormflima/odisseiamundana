import { cp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const publicMediaDirectories = [
  'journeys/about-us/photos',
  'journeys/about-us/thumbnails',
  'journeys/amazonia-brasil/thumbnails',
  'journeys/amazonia-brasil/optimized',
  'journeys/china-stopover/photos',
  'journeys/china-stopover/thumbnails',
  'journeys/finland-2026/photos',
  'journeys/finland-2026/thumbnails',
  'journeys/kenya/thumbnails',
  'journeys/kenya/optimized',
  'journeys/oman/thumbnails',
  'journeys/oman/optimized',
  'journeys/philippines-palawan/photos',
  'journeys/philippines-palawan/thumbnails',
  'journeys/tour-du-mont-blanc/thumbnails',
  'journeys/tour-du-mont-blanc/optimized',
  'collaborations',
];

for (const relativeDirectory of publicMediaDirectories) {
  const source = path.join(projectRoot, 'media', relativeDirectory);
  const destination = path.join(projectRoot, 'public', 'media', relativeDirectory);

  if (!(await stat(source).catch(() => null))?.isDirectory()) {
    throw new Error(`Diretório de mídia de origem não encontrado: ${source}`);
  }

  // Apenas fotos e miniaturas são espelhadas; transcrições e materiais editoriais não são publicados.
  await rm(destination, { recursive: true, force: true });
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, filter: (entry) => path.basename(entry) !== '.gitkeep' });
}

console.log(`Mídia pública sincronizada: ${publicMediaDirectories.length} diretórios.`);
