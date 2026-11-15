import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMotorhomeMapEntries } from '../src/lib/motorhomeMapData.mjs';

const point = { name: 'Cidade de referência', coordinates: { lat: -23.1, lng: -45.8 } };
const project = (id, data = {}) => ({ id, data });
const page = (id, status = 'published') => ({ data: { project_id: { id }, title: `Projeto ${id}`, status } });

test('adiciona ao mapa somente projetos com ponto e página publicada', () => {
  const entries = buildMotorhomeMapEntries({
    projects: [
      project('approved', { representative_point: point }),
      project('draft', { representative_point: point }),
      project('reviewed', { representative_point: point }),
      project('without-page', { representative_point: point }),
      project('without-point'),
    ],
    pages: [page('approved'), page('draft', 'draft'), page('reviewed', 'reviewed'), page('without-point')],
    base: '/',
  });
  assert.deepEqual(entries.map((entry) => entry.journeyId), ['motorhome-approved']);
  assert.equal(entries[0].lat, point.coordinates.lat);
  assert.equal(entries[0].lng, point.coordinates.lng);
});

test('monta card de projeto independente de viagens e respeita a base do site', () => {
  const [entry] = buildMotorhomeMapEntries({
    projects: [project('sample', { representative_point: point, build_location: 'Cidade, Estado', summary: 'Nosso projeto.\n' })],
    pages: [page('sample')],
    base: '/revista/',
  });
  assert.equal(entry.title, 'Projeto sample');
  assert.equal(entry.pointName, point.name);
  assert.equal(entry.location, 'Cidade, Estado');
  assert.equal(entry.summary, 'Nosso projeto.');
  assert.equal(entry.href, '/revista/pt/motorhomes/sample/');
  assert.equal(entry.linkLabel, 'Conhecer o motorhome');
  assert.equal(entry.period, undefined);
  assert.equal(entry.duration, undefined);
});
