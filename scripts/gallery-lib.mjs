import { createHash, randomUUID } from 'node:crypto';
import { readFile, readdir, realpath, mkdir, writeFile, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import sharp from 'sharp';
import YAML from 'yaml';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(await readFile(path.join(defaultRoot, 'schemas', 'gallery.schema.json'), 'utf8'));
const validateSchema = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const widths = [480, 1200, 2400];

function assertId(id, label) {
  if (!idPattern.test(id)) throw new Error(`${label} inválido: use letras minúsculas, números e hífens.`);
}

function within(parent, child) {
  const relative = path.relative(parent, child);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

function readExifDate(exif) {
  if (!exif) return undefined;
  const start = exif.subarray(0, 6).equals(Buffer.from('Exif\0\0')) ? 6 : 0;
  if (exif.length < start + 8) throw new Error('Bloco EXIF incompleto.');
  const order = exif.toString('ascii', start, start + 2);
  if (order !== 'II' && order !== 'MM') throw new Error('Formato EXIF não reconhecido.');
  const little = order === 'II';
  const u16 = (offset) => little ? exif.readUInt16LE(offset) : exif.readUInt16BE(offset);
  const u32 = (offset) => little ? exif.readUInt32LE(offset) : exif.readUInt32BE(offset);
  if (u16(start + 2) !== 42) throw new Error('Formato TIFF do EXIF não reconhecido.');
  const entries = (offset) => {
    const position = start + offset;
    const count = u16(position);
    if (position + 2 + count * 12 > exif.length) throw new Error('Diretório EXIF incompleto.');
    return Array.from({ length: count }, (_, index) => position + 2 + index * 12);
  };
  try {
    const primary = entries(u32(start + 4));
    const pointer = primary.find((entry) => u16(entry) === 0x8769);
    if (pointer === undefined) return undefined;
    const dateEntry = entries(u32(pointer + 8)).find((entry) => u16(entry) === 0x9003);
    if (dateEntry === undefined) return undefined;
    const length = u32(dateEntry + 4);
    if (u16(dateEntry + 2) !== 2 || length < 19 || length > 64) throw new Error('Data EXIF inválida.');
    const position = length <= 4 ? dateEntry + 8 : start + u32(dateEntry + 8);
    if (position + length > exif.length) throw new Error('Data EXIF incompleta.');
    const value = exif.toString('ascii', position, position + length).replace(/\0.*$/, '');
    const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
    if (!match) throw new Error('Data EXIF inválida.');
    const [, year, month, day, hour, minute, second] = match;
    const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 19) !== `${year}-${month}-${day}T${hour}:${minute}:${second}`) {
      throw new Error('Data EXIF inválida.');
    }
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  } catch (error) {
    if (error instanceof RangeError) throw new Error('Bloco EXIF incompleto.', { cause: error });
    throw error;
  }
}

export async function readRegistry(root, collectionId, allowMissing = false) {
  assertId(collectionId, 'ID da coleção');
  const registryPath = path.join(root, 'metadata', 'gallery', `${collectionId}.yaml`);
  let text;
  try {
    text = await readFile(registryPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT' && allowMissing) return { collection_id: collectionId, photos: [] };
    throw error;
  }
  const registry = YAML.parse(text);
  validateRegistry(registry, collectionId);
  return registry;
}

export function validateRegistry(registry, collectionId) {
  if (!validateSchema(registry)) throw new Error(`Registro inválido: ${JSON.stringify(validateSchema.errors)}`);
  if (registry.collection_id !== collectionId) throw new Error('ID da coleção não corresponde ao arquivo de registro.');
  const ids = new Set();
  const hashes = new Set();
  const paths = new Set();
  for (const photo of registry.photos) {
    if (!photo.id.startsWith(`${collectionId}-`)) throw new Error(`Foto ${photo.id} não pertence à coleção ${collectionId}.`);
    if (ids.has(photo.id)) throw new Error(`ID de foto duplicado: ${photo.id}.`);
    if (hashes.has(photo.source_hash)) throw new Error(`Imagem duplicada na coleção: ${photo.id}.`);
    ids.add(photo.id);
    hashes.add(photo.source_hash);
    for (const variant of photo.variants) {
      if (!variant.src.startsWith(`media/gallery/${collectionId}/${photo.id}/`)) throw new Error(`Caminho inválido para ${photo.id}.`);
      if (paths.has(variant.src)) throw new Error(`Variante duplicada: ${variant.src}.`);
      if (!variant.src.endsWith(variant.format === 'jpeg' ? '.jpg' : '.webp')) throw new Error(`Formato inconsistente: ${variant.src}.`);
      paths.add(variant.src);
    }
  }
}

export async function processPhoto({ root = defaultRoot, collectionId, file, newPhoto = false, photoId }) {
  assertId(collectionId, 'ID da coleção');
  if (photoId) assertId(photoId, 'ID da foto');
  if (newPhoto && photoId) throw new Error('Escolha --new ou --id, não ambos.');
  const inputRoot = await realpath(path.join(root, '.gallery-input', collectionId));
  const inputPath = await realpath(file);
  if (!within(inputRoot, inputPath)) throw new Error('A foto deve estar dentro da pasta de entrada da coleção.');
  if (!(await stat(inputPath)).isFile()) throw new Error('A entrada deve ser um arquivo.');
  const buffer = await readFile(inputPath);
  const sourceHash = createHash('sha256').update(buffer).digest('hex');
  const registry = await readRegistry(root, collectionId, true);
  const same = registry.photos.find((photo) => photo.source_hash === sourceHash);
  if (same) {
    if (photoId && photoId !== same.id) throw new Error(`Esta imagem já pertence a ${same.id}.`);
    return { id: same.id, unchanged: true };
  }
  if (!newPhoto && !photoId) throw new Error('Imagem ainda não registrada: use --new para criar um ID ou --id para atualizar uma foto existente.');
  const existing = photoId ? registry.photos.find((photo) => photo.id === photoId) : undefined;
  if (photoId && !existing) throw new Error(`ID de foto não encontrado: ${photoId}.`);
  const id = existing?.id ?? `${collectionId}-${randomUUID()}`;
  const metadata = await sharp(buffer, { failOn: 'error' }).metadata();
  if (!['jpeg', 'png', 'webp', 'tiff'].includes(metadata.format) || !metadata.width || !metadata.height || (metadata.pages ?? 1) !== 1) {
    throw new Error('Imagem inválida ou formato não suportado; use JPEG, PNG, WebP ou TIFF de uma página.');
  }
  const capturedAt = readExifDate(metadata.exif);
  const rotated = metadata.orientation && metadata.orientation >= 5 && metadata.orientation <= 8;
  const width = rotated ? metadata.height : metadata.width;
  const height = rotated ? metadata.width : metadata.height;
  const targetWidths = [...new Set(widths.map((target) => Math.min(target, width)))];
  const variants = [];
  for (const target of targetWidths) {
    for (const format of ['webp', 'jpeg']) {
      let image = sharp(buffer, { failOn: 'error' }).rotate().resize({ width: target, withoutEnlargement: true });
      if (metadata.icc) image = image.keepIccProfile();
      image = format === 'webp' ? image.webp({ quality: 85 }) : image.jpeg({ quality: 88 });
      const { data, info } = await image.toBuffer({ resolveWithObject: true });
      const generated = await sharp(data).metadata();
      if (generated.exif || generated.xmp || generated.iptc) throw new Error('Metadados privados detectados no arquivo gerado; processamento interrompido.');
      const extension = format === 'jpeg' ? 'jpg' : 'webp';
      const src = `media/gallery/${collectionId}/${id}/${sourceHash}-${target}.${extension}`;
      const destination = path.join(root, ...src.split('/'));
      await mkdir(path.dirname(destination), { recursive: true });
      try {
        await writeFile(destination, data, { flag: 'wx' });
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        if (!(await readFile(destination)).equals(data)) throw new Error(`Arquivo gerado já existe com conteúdo diferente: ${src}.`);
      }
      variants.push({ src, format, width: info.width, height: info.height, bytes: data.length });
    }
  }
  const photo = { id, source_hash: sourceHash, width, height, ...(capturedAt ? { captured_at: capturedAt } : {}), variants, ...(existing?.overrides ? { overrides: existing.overrides } : {}) };
  const updated = { ...registry, photos: existing ? registry.photos.map((item) => item.id === id ? photo : item) : [...registry.photos, photo] };
  validateRegistry(updated, collectionId);
  const registryPath = path.join(root, 'metadata', 'gallery', `${collectionId}.yaml`);
  await mkdir(path.dirname(registryPath), { recursive: true });
  const temp = `${registryPath}.${randomUUID()}.tmp`;
  await writeFile(temp, YAML.stringify(updated), { flag: 'wx' });
  await rename(temp, registryPath);
  return { id, unchanged: false, variants: variants.length, bytes: variants.reduce((sum, item) => sum + item.bytes, 0) };
}

export async function validateAllRegistries(root = defaultRoot) {
  const directory = path.join(root, 'metadata', 'gallery');
  let files;
  try {
    files = (await readdir(directory)).filter((file) => file.endsWith('.yaml')).sort();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const reports = [];
  const allIds = new Set();
  for (const file of files) {
    const collectionId = file.slice(0, -5);
    const registry = await readRegistry(root, collectionId);
    let bytes = 0;
    for (const photo of registry.photos) {
      if (allIds.has(photo.id)) throw new Error(`ID duplicado entre coleções: ${photo.id}.`);
      allIds.add(photo.id);
      for (const variant of photo.variants) {
        const asset = path.join(root, ...variant.src.split('/'));
        const info = await stat(asset);
        if (!info.isFile() || info.size !== variant.bytes) throw new Error(`Arquivo ausente ou tamanho incorreto: ${variant.src}.`);
        const image = await sharp(await readFile(asset), { failOn: 'error' }).metadata();
        if (image.format !== variant.format || image.width !== variant.width || image.height !== variant.height) throw new Error(`Dimensões ou formato incorretos: ${variant.src}.`);
        if (image.exif || image.xmp || image.iptc) throw new Error(`Metadados privados presentes: ${variant.src}.`);
        bytes += info.size;
      }
    }
    reports.push({ collectionId, count: registry.photos.length, bytes });
  }
  return reports;
}
