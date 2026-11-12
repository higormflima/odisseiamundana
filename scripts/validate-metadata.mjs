import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMetadataText } from './metadata-validation.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const metadataCollections = [
  { kind: 'journey', directory: path.join(projectRoot, 'metadata', 'journeys') },
  { kind: 'video', directory: path.join(projectRoot, 'metadata', 'videos') },
  { kind: 'collaboration', directory: path.join(projectRoot, 'metadata', 'collaborations') },
];

async function listYamlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listYamlFiles(entryPath);
    return entry.isFile() && /\.ya?ml$/i.test(entry.name) ? [entryPath] : [];
  }));
  return nested.flat();
}

const files = (await Promise.all(metadataCollections.map(async ({ kind, directory }) =>
  (await listYamlFiles(directory)).map((filePath) => ({ kind, filePath })),
))).flat();
let invalidCount = 0;

for (const { kind, filePath } of files) {
  const relativePath = path.relative(projectRoot, filePath);
  try {
    const result = validateMetadataText(await readFile(filePath, 'utf8'), kind);
    if (!result.valid) {
      invalidCount += 1;
      console.error(`\n${relativePath}`);
      for (const error of result.errors) {
        console.error(`  ${error.instancePath || '/'} ${error.message}`);
      }
    } else {
      console.log(`Válido: ${relativePath}`);
    }
  } catch (error) {
    invalidCount += 1;
    console.error(`\nErro ao processar ${relativePath}: ${error.message}`);
  }
}

if (files.length === 0) {
  console.log('Nenhum arquivo YAML de metadados encontrado.');
}

if (invalidCount > 0) {
  console.error(`\n${invalidCount} arquivo(s) precisam de correção.`);
  process.exitCode = 1;
} else {
  console.log(`\nValidação concluída: ${files.length} arquivo(s) válido(s).`);
}
