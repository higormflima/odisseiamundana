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

function validateTripCard(tripCardYaml) {
  return validateMetadataText(`journey_id: sample-trip\ntrip_card:\n${tripCardYaml}`);
}

test('aceita viagem sem trip_card', async () => {
  const result = await validateFixture('valid.yaml');

  assert.equal(result.valid, true);
  assert.equal(result.data.trip_card, undefined);
});

test('aceita trip_card completo com notas inteiras de 1 a 10', () => {
  const result = validateTripCard([
    '  overall_rating: 10',
    '  ratings:',
    '    nature: 1',
    '    experiences: 10',
    '    food: 5',
    '    prices: 3',
    '    infrastructure: 8',
    '    accessibility: 7',
    '    culture: 6',
    '    safety: 9',
  ].join('\n'));

  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test('aceita avaliações parciais', () => {
  assert.equal(validateTripCard('  overall_rating: 6').valid, true);
  assert.equal(validateTripCard('  ratings:\n    nature: 8\n    safety: 9').valid, true);
});

test('rejeita notas abaixo de 1', () => {
  const overall = validateTripCard('  overall_rating: 0');
  const category = validateTripCard('  ratings:\n    food: 0');

  assert.equal(overall.valid, false);
  assert.ok(overall.errors.some((error) => error.keyword === 'minimum' && error.instancePath === '/trip_card/overall_rating'));
  assert.equal(category.valid, false);
  assert.ok(category.errors.some((error) => error.keyword === 'minimum' && error.instancePath === '/trip_card/ratings/food'));
});

test('rejeita notas acima de 10', () => {
  const overall = validateTripCard('  overall_rating: 11');
  const category = validateTripCard('  ratings:\n    prices: 11');

  assert.equal(overall.valid, false);
  assert.ok(overall.errors.some((error) => error.keyword === 'maximum' && error.instancePath === '/trip_card/overall_rating'));
  assert.equal(category.valid, false);
  assert.ok(category.errors.some((error) => error.keyword === 'maximum' && error.instancePath === '/trip_card/ratings/prices'));
});

test('rejeita notas decimais', () => {
  const overall = validateTripCard('  overall_rating: 7.5');
  const category = validateTripCard('  ratings:\n    culture: 8.5');

  assert.equal(overall.valid, false);
  assert.ok(overall.errors.some((error) => error.keyword === 'type' && error.instancePath === '/trip_card/overall_rating'));
  assert.equal(category.valid, false);
  assert.ok(category.errors.some((error) => error.keyword === 'type' && error.instancePath === '/trip_card/ratings/culture'));
});

test('rejeita null em critérios não avaliados', () => {
  const result = validateTripCard('  ratings:\n    nature: 8\n    food: null');

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.keyword === 'type' && error.instancePath === '/trip_card/ratings/food'));
});

test('rejeita critérios e propriedades desconhecidas no trip_card', () => {
  const unknownCriterion = validateTripCard('  ratings:\n    weather: 8');
  const unknownProperty = validateTripCard('  overall_rating: 7\n  average: 7');

  assert.equal(unknownCriterion.valid, false);
  assert.ok(unknownCriterion.errors.some((error) => error.keyword === 'additionalProperties' && error.instancePath === '/trip_card/ratings'));
  assert.equal(unknownProperty.valid, false);
  assert.ok(unknownProperty.errors.some((error) => error.keyword === 'additionalProperties' && error.instancePath === '/trip_card'));
});

test('rejeita trip_card ou ratings vazios', () => {
  assert.equal(validateTripCard('  {}').valid, false);
  assert.equal(validateTripCard('  ratings: {}').valid, false);
});
