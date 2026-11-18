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
  'motorhome-project': 'motorhome-project.schema.json',
};
const validators = new Map();

for (const [kind, filename] of Object.entries(schemaFiles)) {
  const schemaPath = path.join(projectRoot, 'schemas', filename);
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  validators.set(kind, ajv.compile(schema));
}

function validateMotorhomeProject(data, errors) {
  const addError = (instancePath, keyword, message) => errors.push({ instancePath, keyword, message });
  const knownIds = {};
  for (const [collection, idField] of [
    ['videos', 'video_id'],
    ['systems', 'system_id'],
    ['photos', 'photo_id'],
    ['cost_items', 'source_row'],
  ]) {
    const ids = new Set();
    for (const [index, item] of (data[collection] ?? []).entries()) {
      if (ids.has(item[idField])) {
        addError(`/${collection}/${index}/${idField}`, 'uniqueId', 'deve ser único no projeto');
      }
      ids.add(item[idField]);
    }
    knownIds[collection] = ids;
  }

  const checkReferences = (ids, known, instancePath) => {
    for (const [index, id] of (ids ?? []).entries()) {
      if (!known.has(id)) {
        addError(`${instancePath}/${index}`, 'reference', `referência inexistente no projeto: ${id}`);
      }
    }
  };
  for (const [pageId, photoIds] of Object.entries(data.photo_gallery?.pages ?? {})) {
    checkReferences(photoIds, knownIds.photos, `/photo_gallery/pages/${pageId}`);
  }
  for (const [index, video] of (data.videos ?? []).entries()) {
    if (new URL(video.youtube_url).searchParams.get('v') !== video.video_id) {
      addError(`/videos/${index}/youtube_url`, 'videoUrl', 'deve corresponder ao video_id');
    }
  }
  checkReferences(data.playlist_order, knownIds.videos, '/playlist_order');
  if (data.playlist_order?.length && !data.playlist_id) {
    addError('/playlist_id', 'required', 'é obrigatório quando playlist_order contém vídeos');
  }
  for (const [index, item] of (data.cost_items ?? []).entries()) {
    checkReferences(item.system_ids, knownIds.systems, `/cost_items/${index}/system_ids`);
    if (item.unit_price !== undefined) {
      const expected = Math.round((item.quantity * item.unit_price + (item.shipping ?? 0)) * 100);
      if (expected !== Math.round(item.amount * 100)) {
        addError(`/cost_items/${index}/amount`, 'costAmount', 'deve conferir com quantidade × preço unitário + frete discriminado');
      }
    }
  }

  for (const collection of ['systems', 'photos', 'main_costs', 'decisions', 'tips', 'duration', 'before_after']) {
    for (const [index, item] of (data[collection] ?? []).entries()) {
      const instancePath = `/${collection}/${index}`;
      if (collection !== 'systems' && item.system_id && !knownIds.systems.has(item.system_id)) {
        addError(`${instancePath}/system_id`, 'reference', `sistema inexistente: ${item.system_id}`);
      }
      checkReferences(item.video_ids, knownIds.videos, `${instancePath}/video_ids`);
      if (collection === 'before_after') {
        for (const state of ['before', 'after']) {
          checkReferences(item[state].photo_ids, knownIds.photos, `${instancePath}/${state}/photo_ids`);
        }
      }
    }
  }
  for (const boundary of ['start', 'end']) {
    const value = data.build_period?.[boundary];
    if (value?.length === 10) {
      const date = new Date(`${value}T00:00:00Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        addError(`/build_period/${boundary}`, 'calendarDate', 'deve ser uma data existente');
      }
    }
  }
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

  if (schemaValid && kind === 'motorhome-project') {
    validateMotorhomeProject(data, errors);
  }

  return { data, valid: errors.length === 0, errors };
}
