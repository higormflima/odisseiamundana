export const plannerUrl = 'https://odisseiamundana.com/pt/planejador-eletrico/';

/** Endereço curto exibido nos arquivos; o link clicável leva o parâmetro de origem. */
export const plannerDisplayUrl = 'odisseiamundana.com/pt/planejador-eletrico';

/** Link do planejador com utm_source/utm_medium para medir visitas vindas de PDFs e planilhas compartilhados. */
export function plannerShareUrl(source: 'relatorio-pdf' | 'relatorio-excel'): string {
  const url = new URL(plannerUrl);
  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', source === 'relatorio-pdf' ? 'pdf' : 'planilha');
  url.searchParams.set('utm_campaign', 'planejador-eletrico');
  return url.href;
}
