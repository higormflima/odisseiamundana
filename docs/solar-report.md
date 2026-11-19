# Relatório PDF — Planejador Elétrico

Para a arquitetura, as fórmulas e as limitações gerais da ferramenta, consulte [odisseia-solar.md](./odisseia-solar.md).

## Relatório

O guia básico é montado localmente no navegador a partir da configuração atual, com cinco seções: resumo, consumo dos equipamentos, banco de baterias estimado, inversor e premissas/limites. O inventário distingue referências de fabricante, cenários genéricos editáveis e cargas próprias.

Freedom DF4100 e Rolls AGM usam a capacidade de descarga publicada e DoD para estimar energia e quantidade de baterias, sem exigir eficiências direcionais desconhecidas. LiFePO₄ preserva o método com eficiência de descarga do perfil. Nenhum método promete capacidade real em qualquer temperatura ou regime.

Não são inventados parâmetros ausentes. Painéis, MPPT, recarga, carregadores, cabos e proteções ficam fora do escopo deste guia, explicitados em uma nota de limites em vez de várias seções incompletas. Avisos de incompatibilidades conhecidas, como ultrapassar limite publicado de paralelos ou descarga, continuam visíveis.

O cálculo do inversor informa potências mínimas contínua e de pico e verifica correntes da bateria/BMS. A potência contínua escolhida é comparada à mínima calculada; insuficiência gera aviso. A potência de pico e a duração de partida ainda exigem conferência na ficha do modelo.

Sem potência de partida publicada, o pico calculado não confirma a partida dos aparelhos. Sem cargas AC, o guia informa que o inversor não é necessário para as cargas selecionadas.

O relatório usa blocos de resumo, títulos numerados, valores em destaque, tabela de cargas adaptada a cartões no celular e avisos apenas quando aplicáveis. A composição do consumo separa cargas DC, cargas AC, perdas no inversor e funcionamento sem carga.

O fluxo é explícito: **Gerar PDF → Salvar/Compartilhar PDF** quando o navegador aceita compartilhar arquivos. O primeiro botão gera um arquivo A4 diretamente no dispositivo com jsPDF, carregado apenas ao exportar. O segundo chama `navigator.share()` diretamente no novo toque, sem carregar ou gerar arquivos antes dessa chamada, entregando um `File` com nome `.pdf` e tipo `application/pdf` ao menu nativo. No iPhone, esse é o menu em que o usuário pode escolher **Salvar em Arquivos**, sem depender dos controles do visualizador de PDFs.

A detecção usa `navigator.canShare({ files })` com o arquivo real. Sem suporte, a ferramenta oferece **Baixar PDF**, um link nativo com nome de arquivo e atributo `download`. A opção **Visualizar PDF** é secundária: abre uma nova aba e não promete salvamento. Cancelar o compartilhamento ou receber uma recusa do navegador preserva o PDF, permite tentar novamente e revela também a alternativa de download. A conclusão da API não é apresentada como confirmação de que o usuário salvou o arquivo.

Não há clique automático de download após operações assíncronas, `window.open()`, `window.print()`, captura de tela ou serviço externo de geração. O compartilhamento só ocorre por ação explícita e para o destino escolhido pelo usuário. Tela e PDF compartilham a mesma apresentação de dados em `report-presentation.ts`, evitando divergência de valores, exclusões e avisos.

A URL local do PDF permanece válida enquanto o relatório estiver aberto, sem expiração de um segundo. Ao gerar novamente ou sair da etapa do relatório, o link anterior é removido e sua URL é revogada. Uma geração ainda em andamento não pode disponibilizar um arquivo obsoleto após essas ações.

O PDF contém texto selecionável, fontes oficiais incorporadas, cabeçalhos, rodapés numerados e paginação automática, incluindo continuação da tabela de equipamentos. Manrope regular/negrito e DM Serif Display são servidas localmente em `public/media/branding/fonts/`, com suas licenças OFL. A primeira exportação precisa carregar os arquivos da ferramenta; não depende do Google Fonts em tempo de geração. O navegador ainda controla permissões e o destino do download.

Durante a geração, o botão fica ocupado e indisponível para evitar cliques duplicados. Falhas são informadas em português, sem perder o formulário ou recorrer silenciosamente à impressão. Os avisos de validação do formulário também são localizados em português, independentemente do idioma do navegador.

## Contrato JSON legado

A interface pública oferece apenas o PDF, sem botões, seletor de arquivo ou fluxo de importação/exportação JSON. Os dados do formulário continuam locais e não persistem ao recarregar a página.

O contrato versionado `.odisseia-solar.json` permanece isolado em `src/lib/solar/project-file.ts`, com os testes de validação das versões 1 e 2 preservados. Esse módulo legado não é carregado pelo assistente público.
