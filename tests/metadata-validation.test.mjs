import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateMetadataText } from '../scripts/metadata-validation.mjs';

const fixtureRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'metadata');

async function validateFixture(name) {
  return validateMetadataText(await readFile(path.join(fixtureRoot, name), 'utf8'));
}

test('aceita um YAML válido conforme o JSON Schema', async () => {
  const result = await validateFixture('valid.yaml');

  assert.equal(result.valid, true);
  assert.equal(result.data.journey_id, 'sample-trip');
});

test('rejeita YAML sem journey_id', async () => {
  const result = await validateFixture('missing-journey-id.yaml');

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.keyword === 'required'));
});

test('rejeita propriedade não permitida', async () => {
  const result = await validateFixture('unexpected-property.yaml');

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.keyword === 'additionalProperties'));
});

test('rejeita ponto representativo sem coordenadas', async () => {
  const result = await validateFixture('invalid-representative-point.yaml');

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.keyword === 'required' && error.instancePath === '/geography/representative_point'));
});

test('rejeita tipo de dado incorreto', async () => {
  const result = await validateFixture('wrong-type.yaml');

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.keyword === 'type'));
});
