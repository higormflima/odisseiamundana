import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMetadataText } from '../scripts/metadata-validation.mjs';
import { buildCollaborations } from '../src/lib/collaborations.mjs';
import { buildCollaborationEmail, MAX_MAILTO_LENGTH } from '../src/lib/collaborationEmail.mjs';

const metadata = (id, kind, status, date) => ({ id, data: { collaboration_id: id, kind, status, date } });
const page = (id) => ({ id, data: { collaboration_id: { id } } });

test('exibe exemplo somente enquanto não houver projeto real publicado', () => {
  const entries = [metadata('exemplo', 'example', 'published'), metadata('rascunho', 'project', 'draft')];
  const pages = entries.map((entry) => page(entry.id));
  assert.deepEqual(buildCollaborations(entries, pages).map((entry) => entry.collaboration_id), ['exemplo']);
  assert.deepEqual(buildCollaborations(entries, pages, { includeDrafts: true }).map((entry) => entry.collaboration_id), ['exemplo', 'rascunho']);
  entries[1].data.status = 'published';
  entries[1].data.date = { year: 2026, month: 4 };
  assert.deepEqual(buildCollaborations(entries, pages).map((entry) => entry.collaboration_id), ['rascunho']);
});

test('ordena projetos publicados por ano, mês e dia decrescentes', () => {
  const entries = [
    metadata('antigo', 'project', 'published', { year: 2025, month: 12 }),
    metadata('mes', 'project', 'published', { year: 2026, month: 4 }),
    metadata('dia', 'project', 'published', { year: 2026, month: 4, day: 2 }),
    metadata('recente', 'project', 'published', { year: 2026, month: 5 }),
  ];
  assert.deepEqual(buildCollaborations(entries, entries.map((entry) => page(entry.id))).map((entry) => entry.collaboration_id), ['recente', 'dia', 'mes', 'antigo']);
});

test('rejeita referências ausentes, duplicadas e identificadores divergentes', () => {
  const entries = [metadata('projeto', 'project', 'draft')];
  assert.throws(() => buildCollaborations(entries, []), /Conteúdo editorial ausente/);
  assert.throws(() => buildCollaborations(entries, [page('outro')]), /sem metadados/);
  assert.throws(() => buildCollaborations(entries, [page('projeto'), page('projeto')]), /duplicado/);
  assert.throws(() => buildCollaborations([{ id: 'outro', data: entries[0].data }], [page('projeto')]), /inválido ou duplicado/);
});

const source = `collaboration_id: projeto
status: published
kind: project
title: Projeto
description: Descrição
destination: Destino
country: País
cover:
  src: media/collaborations/foto.jpg
  alt: Paisagem
partner:
  name: Parceiro
type: exchange
received: [Hospedagem]
delivered: [Fotografias]
date:
  year: 2024
  month: 2
  day: 29
`;

test('valida projetos publicados e exige data, parceiro e termos da colaboração', () => {
  assert.equal(validateMetadataText(source, 'collaboration').valid, true);
  assert.equal(validateMetadataText(source.replace('date:\n  year: 2024\n  month: 2\n  day: 29\n', ''), 'collaboration').valid, false);
  assert.equal(validateMetadataText(source.replace('partner:\n  name: Parceiro\n', ''), 'collaboration').valid, false);
  assert.equal(validateMetadataText(source.replace('delivered: [Fotografias]\n', ''), 'collaboration').valid, false);
  assert.equal(validateMetadataText(source.replace('  day: 29\n', ''), 'collaboration').valid, true);
  assert.equal(validateMetadataText(source.replace('year: 2024', 'year: 2025'), 'collaboration').valid, false);
});

test('rejeita caminhos externos e identificadores de vídeo inválidos', () => {
  assert.equal(validateMetadataText(source.replace('media/collaborations/foto.jpg', '../foto.jpg'), 'collaboration').valid, false);
  assert.equal(validateMetadataText(`${source}videos:\n  - id: invalid\n    title: Vídeo\n`, 'collaboration').valid, false);
});

test('gera mailto com acentos, caracteres especiais e quebras de linha codificados', () => {
  const url = buildCollaborationEmail({
    name: 'João & Ana', company: 'Viagem + Cia', email: 'joao@example.com',
    website: 'https://exemplo.com/?a=1&b=2', type: 'Permuta', destination: 'São Paulo', proposal: 'Olá!\nGostaríamos de conversar.',
  });
  assert.ok(url.startsWith('mailto:contato@odisseiamundana.com?'));
  const params = new URLSearchParams(url.split('?')[1]);
  assert.equal(params.get('subject'), 'Proposta de colaboração — Odisseia Mundana');
  assert.match(params.get('body'), /Nome: João & Ana\r\n/);
  assert.match(params.get('body'), /https:\/\/exemplo.com\/\?a=1&b=2/);
  assert.match(params.get('body'), /Olá!\nGostaríamos de conversar\./);
  assert.ok(url.length < MAX_MAILTO_LENGTH);
});
