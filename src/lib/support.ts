/**
 * Canais de contribuição voluntária exibidos no Planejador Elétrico.
 * Um canal só aparece quando está ativo e com os dados preenchidos; veja docs/support.md.
 */
export interface SupportChannels {
  pix: {
    /** Chave Pix aleatória (EVP), que não expõe CPF, e-mail ou telefone. */
    key: string;
    /** Nome do recebedor mostrado ao doador para conferência no app do banco. */
    recipientNamePt: string;
    /** QR Code exportado pelo app do banco, servido de public/; opcional. */
    qrImageSrc?: string;
    /** Código "Pix copia e cola" do mesmo QR; deve conter a chave. Opcional. */
    copyPasteCode?: string;
    /** Link de cobrança gerado pelo banco, que abre uma página com os dados do Pix. Opcional. */
    paymentUrl?: string;
  };
  githubSponsors: {
    /** Ativar somente depois que o GitHub aprovar o perfil de patrocínio. */
    enabled: boolean;
    url: string;
  };
}

export const supportChannels: SupportChannels = {
  pix: {
    key: '940ed89c-8c77-48ef-bafd-4c9521aa1d30',
    recipientNamePt: 'Higor Lima (Odisseia Mundana)',
    qrImageSrc: 'media/support/pix-qr.png',
    // Decodificado do QR Code gerado pelo app do banco (Pix estático, sem valor definido).
    copyPasteCode: '00020126940014BR.GOV.BCB.PIX0136940ed89c-8c77-48ef-bafd-4c9521aa1d300232Valeu por contribuir c o projeto5204000053039865802BR5924Higor Matheus de Freitas6009SAO PAULO62140510BxuD3Wuyk86304BC18',
        paymentUrl: 'https://nubank.com.br/cobrar/1b93w5/6b097d64-b9e5-4629-a677-4f8ce9e7ff3a',
  },
  githubSponsors: {
    enabled: false,
    url: 'https://github.com/sponsors/higormflima',
  },
};

const randomPixKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface VisibleSupportChannels {
  pix?: SupportChannels['pix'];
  githubSponsorsUrl?: string;
}

/** Retorna apenas os canais prontos para exibição; chave Pix precisa ser aleatória (formato UUID). */
export function visibleSupportChannels(channels: SupportChannels): VisibleSupportChannels {
  const key = channels.pix.key.trim();
  if (key && !randomPixKeyPattern.test(key)) {
    throw new TypeError('Use uma chave Pix aleatória (formato UUID) para não expor dados pessoais.');
  }
  const code = channels.pix.copyPasteCode?.trim();
  if (code && (!code.startsWith('000201') || !code.includes(`BR.GOV.BCB.PIX`) || !code.includes(key))) {
    throw new TypeError('O código Pix copia e cola precisa ser um BR Code da mesma chave aleatória.');
  }
  if (channels.pix.paymentUrl && !/^https:\/\/[^\s]+$/.test(channels.pix.paymentUrl)) {
    throw new TypeError('O link de pagamento Pix precisa usar https.');
  }
  return {
    ...(key && channels.pix.recipientNamePt.trim() ? { pix: { ...channels.pix, key } } : {}),
    ...(channels.githubSponsors.enabled ? { githubSponsorsUrl: channels.githubSponsors.url } : {}),
  };
}
