import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import YAML from 'yaml';
import { validateMetadataText } from '../scripts/metadata-validation.mjs';

function validate(data) {
  return validateMetadataText(YAML.stringify(data), 'motorhome-project');
}

function project() {
  return {
    project_id: 'sample-project',
    build_period: { start: '2000', end: '2001-02' },
    videos: [
      { video_id: 'BBBBBBBBBBB', youtube_url: 'https://www.youtube.com/watch?v=BBBBBBBBBBB' },
      { video_id: 'AAAAAAAAAAA', youtube_url: 'https://www.youtube.com/watch?v=AAAAAAAAAAA' },
    ],
    playlist_id: 'PL_SAMPLE',
    playlist_order: ['BBBBBBBBBBB', 'AAAAAAAAAAA'],
    systems: [
      { system_id: 'sample-system', title: 'Sistema de exemplo', video_ids: ['AAAAAAAAAAA'] },
      { system_id: 'other-system', title: 'Outro sistema', video_ids: ['AAAAAAAAAAA'] },
    ],
    main_costs: [{
      description: 'Custo fictício',
      amount: 10,
      currency: 'BRL',
      unit: 'total de uma unidade, sem frete',
      system_id: 'sample-system',
      video_ids: ['AAAAAAAAAAA'],
    }],
    photos: [{
      photo_id: 'sample-before',
      src: 'media/motorhome-projects/sample-project/before.webp',
      alt: 'Fotografia demonstrativa',
      system_id: 'sample-system',
    }],
    before_after: [{
      title: 'Comparação demonstrativa',
      before: { photo_ids: ['sample-before'] },
      after: { description: 'Estado posterior demonstrativo' },
      system_id: 'sample-system',
      video_ids: ['AAAAAAAAAAA'],
    }],
    duration: [{ description: 'Etapa demonstrativa', value: 2, unit: 'hours' }],
  };
}

test('aceita projeto mínimo e registro da Iveco sem exigir dados desconhecidos ou journey_id', async () => {
  assert.equal(validate({ project_id: 'improvements-project' }).valid, true);
  const source = await readFile(new URL('../metadata/motorhome-projects/iveco-daily-3510.yaml', import.meta.url), 'utf8');
  const result = validateMetadataText(source, 'motorhome-project');
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test('aceita relações compartilhadas sem duplicar vídeos e preserva a sequência recebida', () => {
  const data = project();
  const result = validate(data);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
  assert.deepEqual(result.data.playlist_order, ['BBBBBBBBBBB', 'AAAAAAAAAAA']);
  data.playlist_order = ['BBBBBBBBBBB'];
  assert.equal(validate(data).valid, true, 'permite vídeo complementar fora da playlist');
});

test('valida status e referências das seleções de fotos por página sem duplicação', () => {
  const data = project();
  data.photo_gallery = { status: 'draft', pages: { overview: ['sample-before'], planning: ['sample-before'] } };
  assert.equal(validate(data).valid, true);
  data.photo_gallery.status = 'published';
  assert.equal(validate(data).valid, true);
  data.photo_gallery.status = 'invalid';
  assert.equal(validate(data).valid, false);
  data.photo_gallery.status = 'draft';
  data.photo_gallery.pages.overview = ['missing'];
  assert.equal(validate(data).valid, false);
  data.photo_gallery.pages.overview = ['sample-before', 'sample-before'];
  assert.equal(validate(data).valid, false);
});

test('valida ponto representativo completo e limites geográficos sem exigir localização no projeto mínimo', () => {
  const data = { project_id: 'sample', representative_point: { name: 'Cidade de referência', coordinates: { lat: -23.1, lng: -45.8 } } };
  assert.equal(validate(data).valid, true);
  for (const point of [
    { name: 'Sem coordenadas' },
    { name: 'Sem longitude', coordinates: { lat: -23.1 } },
    { name: 'Fora dos limites', coordinates: { lat: -91, lng: -45.8 } },
    { name: 'Fora dos limites', coordinates: { lat: -23.1, lng: 181 } },
    { name: 'Tipo inválido', coordinates: { lat: '-23.1', lng: -45.8 } },
  ]) {
    assert.equal(validate({ ...data, representative_point: point }).valid, false);
  }
});

test('rejeita referências ausentes em sistemas, vídeos e comparações', () => {
  const cases = [
    ['photos', 'system_id', 'missing-system', '/photos/0/system_id'],
    ['main_costs', 'video_ids', ['CCCCCCCCCCC'], '/main_costs/0/video_ids/0'],
    ['systems', 'video_ids', ['CCCCCCCCCCC'], '/systems/0/video_ids/0'],
    ['before_after', 'before', { photo_ids: ['missing-photo'] }, '/before_after/0/before/photo_ids/0'],
    ['before_after', 'after', { photo_ids: ['missing-photo'] }, '/before_after/0/after/photo_ids/0'],
  ];
  for (const [collection, field, value, instancePath] of cases) {
    const data = project();
    data[collection][0][field] = value;
    const result = validate(data);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.keyword === 'reference' && error.instancePath === instancePath));
  }
});

test('rejeita IDs duplicados, URL divergente e ordem inconsistente', () => {
  for (const collection of ['videos', 'systems', 'photos']) {
    const data = project();
    data[collection].push({ ...data[collection][0] });
    assert.ok(validate(data).errors.some((error) => error.keyword === 'uniqueId'));
  }
  const data = project();
  data.videos[0].youtube_url = data.videos[1].youtube_url;
  assert.ok(validate(data).errors.some((error) => error.keyword === 'videoUrl'));
  for (const order of [['CCCCCCCCCCC'], ['AAAAAAAAAAA', 'AAAAAAAAAAA']]) {
    const invalid = project();
    invalid.playlist_order = order;
    assert.equal(validate(invalid).valid, false);
  }
  const noPlaylist = project();
  delete noPlaylist.playlist_id;
  assert.ok(validate(noPlaylist).errors.some((error) => error.instancePath === '/playlist_id'));
});

test('aceita datas parciais e limites independentes, mas rejeita datas impossíveis', () => {
  for (const period of [{ start: '2000' }, { end: '2001-02' }, { start: '2000-02-29' }]) {
    assert.equal(validate({ project_id: 'sample', build_period: period }).valid, true);
  }
  for (const value of ['2001-02-29', '2000-04-31', '2000-13', '2000-00-01']) {
    assert.equal(validate({ project_id: 'sample', build_period: { end: value } }).valid, false, value);
  }
});

test('rejeita custos sem contexto monetário, duração inválida e estados vazios', () => {
  for (const field of ['currency', 'unit']) {
    const data = project();
    delete data.main_costs[0][field];
    assert.equal(validate(data).valid, false, field);
  }
  const negative = project();
  negative.main_costs[0].amount = -1;
  assert.equal(validate(negative).valid, false);
  const duration = project();
  duration.duration[0].value = 0;
  assert.equal(validate(duration).valid, false);
  const comparison = project();
  comparison.before_after[0].after = {};
  assert.equal(validate(comparison).valid, false);
});

test('valida custos compartilhados por linha e rejeita referências, duplicação e valores inconsistentes', () => {
  const data = project();
  data.cost_items = [{
    source_row: 10, description: 'Material demonstrativo', quantity: 2, unit: 'm',
    unit_price: 3.91, shipping: 1.50, amount: 9.32, currency: 'BRL',
    system_ids: ['sample-system', 'other-system'],
  }];
  assert.equal(validate(data).valid, true);
  for (const [field, value, keyword] of [
    ['system_ids', ['missing-system'], 'reference'],
    ['quantity', 0, 'exclusiveMinimum'],
    ['shipping', -1, 'costAmount'],
    ['amount', 9.33, 'costAmount'],
  ]) {
    const invalid = structuredClone(data);
    invalid.cost_items[0][field] = value;
    assert.ok(validate(invalid).errors.some((error) => error.keyword === keyword), field);
  }
  const duplicate = structuredClone(data);
  duplicate.cost_items.push({ ...duplicate.cost_items[0] });
  assert.ok(validate(duplicate).errors.some((error) => error.keyword === 'uniqueId'));
  delete data.cost_items[0].currency;
  assert.equal(validate(data).valid, false);
});

test('preserva lançamentos negativos e campos desconhecidos sem inventar unidades, preços ou associações', () => {
  const data = project();
  data.cost_items = [
    { source_row: 10, description: 'Valor registrado', quantity: 2, unit: 'und', unit_price: 30, shipping: -261, amount: -201, currency: 'BRL' },
    { source_row: 11, description: 'Unidade não informada', quantity: 1, unit_price: 27, amount: 27, currency: 'BRL' },
    { source_row: 12, description: 'Unitário não informado', quantity: 1, amount: 0, currency: 'BRL' },
  ];
  assert.equal(validate(data).valid, true);
  data.cost_items[0].amount = -200;
  assert.ok(validate(data).errors.some((error) => error.keyword === 'costAmount'));
});

test('aceita classificação temática incerta somente com etapas identificadas e indicador booleano', () => {
  const data = project();
  data.cost_items = [{
    source_row: 10, description: 'Material sem uso individualizado', quantity: 1,
    amount: 10, currency: 'BRL', system_ids: ['sample-system'], allocation_uncertain: true,
  }];
  assert.equal(validate(data).valid, true);
  data.cost_items[0].allocation_uncertain = 'sim';
  assert.equal(validate(data).valid, false);
  data.cost_items[0].allocation_uncertain = true;
  delete data.cost_items[0].system_ids;
  assert.equal(validate(data).valid, false);
});

test('valida o exemplo YAML demonstrativo da documentação', async () => {
  const doc = await readFile(new URL('../docs/motorhome-projects.md', import.meta.url), 'utf8');
  const source = doc.match(/```yaml\r?\n([\s\S]*?)```/)[1];
  const result = validateMetadataText(source, 'motorhome-project');
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test('aceita download local de planilha e rejeita caminhos externos, incompletos ou fora do diretório', () => {
  const download = {
    title: 'Baixar planilha original',
    path: 'downloads/motorhome-projects/sample-project/costs.xlsx',
  };
  assert.equal(validate({ project_id: 'sample-project', downloads: [download] }).valid, true);
  for (const invalid of [
    { path: download.path },
    { title: download.title },
    { ...download, path: 'https://example.com/costs.xlsx' },
    { ...download, path: '/downloads/motorhome-projects/sample-project/costs.xlsx' },
    { ...download, path: 'downloads/motorhome-projects/../costs.xlsx' },
    { ...download, path: 'downloads/motorhome-projects/sample-project/costs.exe' },
    { ...download, path: 'media/sample-project/costs.xlsx' },
  ]) {
    assert.equal(validate({ project_id: 'sample-project', downloads: [invalid] }).valid, false);
  }
});

test('rejeita campos desconhecidos, null e valores vazios sem relaxar contratos existentes', () => {
  for (const data of [
    { title: 'Sem identificador' },
    { project_id: 'sample', journey_id: 'fake-journey' },
    { project_id: 'sample', build_location: null },
    { project_id: 'sample', summary: ' ' },
    { project_id: 'sample', provenance: [{ source_type: 'manual', verification_status: 'confirmed' }] },
  ]) {
    assert.equal(validate(data).valid, false);
  }
  assert.equal(validateMetadataText('project_id: sample').valid, false);
  assert.equal(validateMetadataText('video_id: AAAAAAAAAAA\nyoutube_url: https://www.youtube.com/watch?v=AAAAAAAAAAA\n', 'video').valid, false);
});
