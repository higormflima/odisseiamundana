import assert from 'node:assert/strict';
import test from 'node:test';
import { supportChannels, visibleSupportChannels } from '../src/lib/support.ts';

const base = {
  pix: { key: '', recipientNamePt: '' },
  githubSponsors: { enabled: false, url: 'https://github.com/sponsors/higormflima' },
};

test('canais de apoio só aparecem quando estão ativos e completos', () => {
  assert.deepEqual(visibleSupportChannels(base), {});
  const key = '123e4567-e89b-12d3-a456-426614174000';
  assert.deepEqual(visibleSupportChannels({ ...base, pix: { key: ` ${key} `, recipientNamePt: 'Higor Lima' } }), {
    pix: { key, recipientNamePt: 'Higor Lima' },
  });
  assert.deepEqual(visibleSupportChannels({ ...base, pix: { key, recipientNamePt: '' } }), {});
  assert.deepEqual(visibleSupportChannels({ ...base, githubSponsors: { ...base.githubSponsors, enabled: true } }), {
    githubSponsorsUrl: 'https://github.com/sponsors/higormflima',
  });
});

test('rejeita chave Pix que exporia dados pessoais', () => {
  for (const key of ['higor@example.com', '12345678900', '+5511999999999']) {
    assert.throws(() => visibleSupportChannels({ ...base, pix: { key, recipientNamePt: 'Higor Lima' } }), /chave Pix aleatória/);
  }
});

test('código copia e cola precisa ser BR Code da mesma chave e o link precisa usar https', () => {
  const key = '123e4567-e89b-12d3-a456-426614174000';
  const pix = { key, recipientNamePt: 'Higor Lima' };
  assert.throws(() => visibleSupportChannels({ ...base, pix: { ...pix, copyPasteCode: '00020126BR.GOV.BCB.PIX0136outra-chave' } }), /mesma chave/);
  assert.throws(() => visibleSupportChannels({ ...base, pix: { ...pix, paymentUrl: 'http://exemplo.com' } }), /https/);
  assert.doesNotThrow(() => visibleSupportChannels({ ...base, pix: { ...pix, copyPasteCode: `00020126580014BR.GOV.BCB.PIX0136${key}`, paymentUrl: 'https://exemplo.com/pix' } }));
});

test('configuração publicada é válida, exibe o Pix e mantém o GitHub Sponsors desligado até a aprovação', () => {
  const visible = visibleSupportChannels(supportChannels);
  assert.ok(visible.pix);
  assert.equal(visible.githubSponsorsUrl, undefined);
});
