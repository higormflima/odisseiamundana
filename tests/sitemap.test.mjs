import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { buildSitemap } from '../scripts/generate-sitemap.mjs';

test('sitemap lista páginas publicadas e ignora a raiz de redirecionamento e arquivos avulsos', () => {
  const xml = buildSitemap([
    'index.html',
    path.join('pt', 'index.html'),
    path.join('pt', 'odisseia-solar', 'index.html'),
    'google86753ef2b7570414.html',
    path.join('404', 'index.html'),
  ], 'https://odisseiamundana.com');

  assert.deepEqual([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]), [
    'https://odisseiamundana.com/pt/',
    'https://odisseiamundana.com/pt/odisseia-solar/',
  ]);
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
});
