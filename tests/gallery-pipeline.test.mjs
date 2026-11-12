import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import YAML from 'yaml';
import { processPhoto, readRegistry, validateAllRegistries, validateRegistry } from '../scripts/gallery-lib.mjs';

async function setup(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'odisseia-gallery-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = path.join(root, '.gallery-input', 'sample-trip');
  await mkdir(input, { recursive: true });
  return { root, input };
}

async function image(file, color = '#abcdef') {
  await sharp({ create: { width: 120, height: 80, channels: 3, background: color } })
    .withExif({
      IFD2: { DateTimeOriginal: '2025:11:30 12:34:56' },
      IFD3: { GPSLatitude: '51/1 30/1 0/1', GPSLatitudeRef: 'N', GPSLongitude: '0/1 8/1 0/1', GPSLongitudeRef: 'W' },
    })
    .withMetadata({ orientation: 6 })
    .jpeg().toFile(file);
}

test('processa cópias com orientação e data, preserva entrada e remove EXIF', async (t) => {
  const { root, input } = await setup(t);
  const file = path.join(input, 'entrada.jpg');
  await image(file);
  const original = await readFile(file);
  const inputMetadata = await sharp(original).metadata();
  assert.ok(inputMetadata.exif);
  assert.ok(inputMetadata.exif.includes(Buffer.from([0x25, 0x88])));
  assert.ok(inputMetadata.icc);
  const result = await processPhoto({ root, collectionId: 'sample-trip', file, newPhoto: true });
  const registry = await readRegistry(root, 'sample-trip');
  const photo = registry.photos[0];
  assert.equal(result.id, photo.id);
  assert.deepEqual(await readFile(file), original);
  assert.equal(photo.source_hash, createHash('sha256').update(original).digest('hex'));
  assert.equal(photo.width, 80);
  assert.equal(photo.height, 120);
  assert.equal(photo.captured_at, '2025-11-30T12:34:56');
  assert.equal(photo.variants.length, 2);
  for (const variant of photo.variants) {
    const meta = await sharp(await readFile(path.join(root, ...variant.src.split('/')))).metadata();
    assert.equal(meta.exif, undefined);
    assert.equal(meta.xmp, undefined);
    assert.equal(meta.iptc, undefined);
    assert.ok(meta.icc);
    assert.equal(meta.width, 80);
    assert.equal(meta.height, 120);
  }
  assert.deepEqual((await validateAllRegistries(root)).map((r) => r.count), [1]);
});

test('processa uma foto já otimizada do projeto sem alterar o arquivo existente', async (t) => {
  const { root, input } = await setup(t);
  const existing = path.resolve('media', 'journeys', 'finland-2026', 'photos', 'finland-001.jpg');
  const original = await readFile(existing);
  const file = path.join(input, 'amostra.jpg');
  await writeFile(file, original);
  const result = await processPhoto({ root, collectionId: 'sample-trip', file, newPhoto: true });
  assert.equal(result.variants, 6);
  assert.deepEqual(await readFile(existing), original);
  assert.equal((await validateAllRegistries(root))[0].count, 1);
});

test('reconhece renomeação e exige decisão explícita para imagem alterada', async (t) => {
  const { root, input } = await setup(t);
  const file = path.join(input, 'original.jpg');
  await image(file);
  const first = await processPhoto({ root, collectionId: 'sample-trip', file, newPhoto: true });
  const renamed = path.join(input, 'renomeada.jpg');
  await rename(file, renamed);
  assert.deepEqual(await processPhoto({ root, collectionId: 'sample-trip', file: renamed }), { id: first.id, unchanged: true });
  await image(renamed, '#234567');
  await assert.rejects(processPhoto({ root, collectionId: 'sample-trip', file: renamed }), /use --new/);
  const updated = await processPhoto({ root, collectionId: 'sample-trip', file: renamed, photoId: first.id });
  assert.equal(updated.id, first.id);
  assert.equal((await readRegistry(root, 'sample-trip')).photos.length, 1);
});

test('conserva correções manuais ao atualizar uma foto', async (t) => {
  const { root, input } = await setup(t);
  const file = path.join(input, 'original.jpg');
  await image(file);
  const first = await processPhoto({ root, collectionId: 'sample-trip', file, newPhoto: true });
  const registry = await readRegistry(root, 'sample-trip');
  registry.photos[0].overrides = { city: 'Pequim', featured: true };
  await writeFile(path.join(root, 'metadata', 'gallery', 'sample-trip.yaml'), YAML.stringify(registry));
  await image(file, '#234567');
  await processPhoto({ root, collectionId: 'sample-trip', file, photoId: first.id });
  assert.deepEqual((await readRegistry(root, 'sample-trip')).photos[0].overrides, { city: 'Pequim', featured: true });
});

test('rejeita entrada fora da pasta e registros com IDs e hashes duplicados', async (t) => {
  const { root, input } = await setup(t);
  const outside = path.join(root, 'fora.jpg');
  await image(outside);
  await assert.rejects(processPhoto({ root, collectionId: 'sample-trip', file: outside, newPhoto: true }), /pasta de entrada/);
  const file = path.join(input, 'entrada.jpg');
  await image(file);
  await processPhoto({ root, collectionId: 'sample-trip', file, newPhoto: true });
  const registry = await readRegistry(root, 'sample-trip');
  registry.photos.push({ ...registry.photos[0] });
  assert.throws(() => validateRegistry(registry, 'sample-trip'), /ID de foto duplicado/);
  registry.photos[1] = { ...registry.photos[1], id: 'sample-trip-other' };
  assert.throws(() => validateRegistry(registry, 'sample-trip'), /Imagem duplicada/);
});

test('detecta variantes ausentes e imagens inválidas', async (t) => {
  const { root, input } = await setup(t);
  const bad = path.join(input, 'invalida.jpg');
  await writeFile(bad, 'não é uma imagem');
  await assert.rejects(processPhoto({ root, collectionId: 'sample-trip', file: bad, newPhoto: true }));
  const file = path.join(input, 'entrada.jpg');
  await image(file);
  await processPhoto({ root, collectionId: 'sample-trip', file, newPhoto: true });
  const registry = await readRegistry(root, 'sample-trip');
  await rm(path.join(root, ...registry.photos[0].variants[0].src.split('/')));
  await assert.rejects(validateAllRegistries(root), /ENOENT/);
});
