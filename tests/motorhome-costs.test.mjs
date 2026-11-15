import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProjectCostRows, buildSystemCostRows } from '../src/lib/motorhomeCosts.mjs';

test('seleciona custos compartilhados e mantém quantidade do lançamento, frete ausente e frete zero distintos', () => {
  const items = [
    { description: 'Fio', detail: 'Compra de 3 m', quantity: 1, unit: 'und', unit_price: 7.38, amount: 7.38, currency: 'BRL', system_ids: ['solar', 'lighting'] },
    { description: 'Inversor', quantity: 1, unit: 'und', unit_price: 246, shipping: 0, amount: 246, currency: 'BRL', system_ids: ['solar'] },
    { description: 'Painéis', quantity: 2, unit: 'und', unit_price: 589, shipping: 51.85, amount: 1229.85, currency: 'BRL', system_ids: ['solar'] },
    { description: 'Outro', quantity: 1, unit: 'und', unit_price: 20, amount: 20, currency: 'BRL', system_ids: ['water'] },
  ];
  assert.deepEqual(buildSystemCostRows(items, 'solar'), [
    { item: 'Fio', detail: 'Compra de 3 m · 1 und × R$7,38', amount: 'R$7,38' },
    { item: 'Inversor', detail: '1 und × R$246,00 · Frete: R$0,00', amount: 'R$246,00' },
    { item: 'Painéis', detail: '2 und × R$589,00 · Frete: R$51,85', amount: 'R$1.229,85' },
  ]);
  assert.deepEqual(buildSystemCostRows(items, 'lighting'), [buildSystemCostRows(items, 'solar')[0]]);
  assert.deepEqual(buildSystemCostRows(items, 'unknown'), []);
});

test('mostra o livro completo sem atribuir etapas e preserva valores negativos e dados ausentes', () => {
  const items = [
    { description: 'Compra', category: 'Manutenção', quantity: 2, unit: 'und', unit_price: 30, shipping: -261, amount: -201, currency: 'BRL' },
    { description: 'Sem unidade', quantity: 1, unit_price: 27, amount: 27, currency: 'BRL' },
    { description: 'Sem unitário', quantity: 1, unit: 'und', amount: 0, currency: 'BRL' },
  ];
  assert.deepEqual(buildProjectCostRows(items), [
    { item: 'Compra', detail: 'Manutenção · 2 und × R$30,00 · Frete: -R$261,00', amount: '-R$201,00' },
    { item: 'Sem unidade', detail: '1 × R$27,00', amount: 'R$27,00' },
    { item: 'Sem unitário', detail: '1 und', amount: 'R$0,00' },
  ]);
  assert.deepEqual(buildSystemCostRows(items, 'solar-power'), []);
});
