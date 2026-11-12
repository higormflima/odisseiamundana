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
  collaboration: 'collaboration.schema.json',
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
  const schemaValid = validate(data);
  const errors = schemaValid
    ? []
    : (validate.errors ?? []).map(({ instancePath, keyword, message }) => ({
        instancePath,
        keyword,
        message,
      }));

  if (schemaValid && kind === 'collaboration' && data.date?.day) {
    const { year, month, day } = data.date;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      errors.push({ instancePath: '/date/day', keyword: 'calendarDate', message: 'deve ser uma data existente' });
    }
  }

  return { data, valid: errors.length === 0, errors };
}
