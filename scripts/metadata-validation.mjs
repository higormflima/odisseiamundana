import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
const schemaFiles = {
  journey: 'journey.schema.json',
  video: 'video.schema.json',
};
const validators = new Map();

for (const [kind, filename] of Object.entries(schemaFiles)) {
  const schemaPath = path.join(projectRoot, 'schemas', filename);
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  validators.set(kind, ajv.compile(schema));
}

export function validateMetadataText(source, kind = 'journey') {
  const validate = validators.get(kind);
  if (!validate) throw new Error(`Tipo de metadado desconhecido: ${kind}`);
  const data = YAML.parse(source);
  const valid = validate(data);
  const errors = valid
    ? []
    : (validate.errors ?? []).map(({ instancePath, keyword, message }) => ({
        instancePath,
        keyword,
        message,
      }));

  return { data, valid, errors };
}
