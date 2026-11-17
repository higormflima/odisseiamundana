import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMotorhomeSystemPage } from '../src/lib/motorhomeSystemPages.mjs';
import { buildSystemCostRows } from '../src/lib/motorhomeCosts.mjs';

const playlist = ['first', 'shared', 'last', 'unrelated'].map((videoId, index) => ({
  videoId, title: videoId, url: `https://example.com/${videoId}`, position: index + 1,
}));
const project = {
  systems: [
    { system_id: 'furniture', title: 'Móveis', video_ids: ['last', 'shared'], materials: ['MDF'], tools: ['Serra'] },
    { system_id: 'bed', title: 'Cama', video_ids: ['shared', 'first'], materials: ['MDF', 'Espuma'], technologies: ['Modelo 3D'] },
  ],
};

test('agrupa atributos e vídeos sem repetição e preserva a sequência da playlist', () => {
  const topic = buildMotorhomeSystemPage(project, ['furniture', 'bed'], playlist);
  assert.deepEqual(topic.systems.map((system) => system.system_id), ['furniture', 'bed']);
  assert.deepEqual(topic.materials, ['MDF', 'Espuma']);
  assert.deepEqual(topic.tools, ['Serra']);
  assert.deepEqual(topic.technologies, ['Modelo 3D']);
  assert.deepEqual(topic.equipment, []);
  assert.deepEqual(topic.videos, playlist.slice(0, 3));
});

test('mantém o resultado para uma etapa e interrompe referências ausentes ou seleção inválida', () => {
  const topic = buildMotorhomeSystemPage(project, ['furniture'], playlist);
  assert.deepEqual(topic.videos, [playlist[1], playlist[2]]);
  assert.deepEqual(topic.materials, ['MDF']);
  for (const ids of [[], ['missing'], ['bed', 'bed']]) {
    assert.throws(() => buildMotorhomeSystemPage(project, ids, playlist));
  }
  assert.throws(() => buildMotorhomeSystemPage(project, ['bed'], playlist.slice(1)), /ausente da playlist: first/);
});

test('destaca o vídeo principal uma única vez sem mudar os demais nem a playlist original', () => {
  const original = structuredClone(playlist);
  const topic = buildMotorhomeSystemPage(project, ['furniture', 'bed'], playlist, 'shared');
  assert.deepEqual(topic.videos, [playlist[1], playlist[0], playlist[2]]);
  assert.deepEqual(playlist, original);
  assert.deepEqual(
    buildMotorhomeSystemPage(project, ['furniture', 'bed'], playlist, 'first').videos,
    playlist.slice(0, 3),
  );
  for (const id of ['unrelated', 'missing', '']) {
    assert.throws(
      () => buildMotorhomeSystemPage(project, ['furniture', 'bed'], playlist, id),
      /Vídeo principal não pertence/,
    );
  }
});

test('compra compartilhada aparece uma vez no grupo, mas compras distintas iguais não são descartadas', () => {
  const base = { description: 'MDF', quantity: 1, unit: 'und', unit_price: 10, amount: 10, currency: 'BRL' };
  const items = [
    { ...base, source_row: 4, system_ids: ['bed', 'furniture'] },
    { ...base, source_row: 5, system_ids: ['furniture'] },
    { ...base, source_row: 6, system_ids: ['kitchen'] },
    { ...base, source_row: 7 },
  ];
  assert.equal(buildSystemCostRows(items, ['bed', 'furniture']).length, 2);
  assert.deepEqual(buildSystemCostRows(items, ['furniture']), buildSystemCostRows(items, 'furniture'));
  assert.deepEqual(buildSystemCostRows(items, []), []);
});
