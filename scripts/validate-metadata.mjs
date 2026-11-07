import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const metadataRoot = path.join(projectRoot, 'metadata', 'journeys');
const schemaPath = path.join(projectRoot, 'schemas', 'journey.schema.json');

async function listYamlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listYamlFiles(entryPath);
    return entry.isFile() && /\.ya?ml$/i.test(entry.name) ? [entryPath] : [];
  }));
  return nested.flat();
}

const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
const validate = ajv.compile(schema);
const files = await listYamlFiles(metadataRoot);
let invalidCount = 0;

for (const filePath of files) {
  const relativePath = path.relative(projectRoot, filePath);
  try {
    const data = YAML.parse(await readFile(filePath, 'utf8'));
    if (!validate(data)) {
      invalidCount += 1;
      console.error(`\n${relativePath}`);
      for (const error of validate.errors ?? []) {
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
  console.log('Nenhum arquivo YAML de viagem encontrado.');
}

if (invalidCount > 0) {
  console.error(`\n${invalidCount} arquivo(s) precisam de correção.`);
  process.exitCode = 1;
} else {
  console.log(`\nValidação concluída: ${files.length} arquivo(s) válido(s).`);
}
