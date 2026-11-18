import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const publicMediaDirectories = [
  'journeys/20240208-mexico/optimized',
  'journeys/20240208-mexico/thumbnails',
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

async function syncDirectory(relativeDirectory) {
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

for (const relativeDirectory of publicMediaDirectories) await syncDirectory(relativeDirectory);

const motorhome = YAML.parse(await readFile(path.join(projectRoot, 'metadata', 'motorhome-projects', 'iveco-daily-3510.yaml'), 'utf8'));
const includeDraftPhotos = process.argv.includes('--include-draft-photos');
const publishPhotos = motorhome.photo_gallery?.status === 'published';
let photoDirectories = 0;
for (const folder of ['optimized', 'thumbnails']) {
  const relativeDirectory = `journeys/2018-construction-motorhome-iveco/${folder}`;
  if (publishPhotos || includeDraftPhotos) {
    await syncDirectory(relativeDirectory);
    photoDirectories += 1;
  } else {
    await rm(path.join(projectRoot, 'public', 'media', relativeDirectory), { recursive: true, force: true });
  }
}

if (motorhome.map_image) {
  const destination = path.join(projectRoot, 'public', motorhome.map_image.src);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(projectRoot, motorhome.map_image.src), destination);
}

console.log(`Mídia pública sincronizada: ${publicMediaDirectories.length + photoDirectories} diretórios; ${motorhome.map_image ? 1 : 0} imagem de card.`);
