# Relatório PDF — Planejador Elétrico

Para a arquitetura, as fórmulas e as limitações gerais da ferramenta, consulte [odisseia-solar.md](./odisseia-solar.md).

## Relatório

O guia básico é montado localmente no navegador a partir da configuração atual, com cinco seções: resumo, consumo dos equipamentos, banco de baterias estimado, inversor e premissas/limites. Quando o usuário ativa a etapa solar, entra uma sexta seção, **Energia solar e controlador**, antes das premissas. O inventário distingue referências de fabricante, cenários genéricos editáveis e cargas próprias.

Freedom DF4100 e Rolls AGM usam a capacidade de descarga publicada e DoD para estimar energia e quantidade de baterias, sem exigir eficiências direcionais desconhecidas. LiFePO₄ preserva o método com eficiência de descarga do perfil. Nenhum método promete capacidade real em qualquer temperatura ou regime.

Não são inventados parâmetros ausentes. Recarga por alternador ou tomada, carregadores, cabos e proteções ficam fora do escopo deste guia, explicitados em uma nota de limites em vez de várias seções incompletas. Painéis e controlador só aparecem quando a etapa solar é ativada, com o método e os fatores de perda do CRESESB descritos em [odisseia-solar.md](./odisseia-solar.md). Avisos de incompatibilidades conhecidas, como ultrapassar limite publicado de paralelos ou descarga, continuam visíveis.

O cálculo do inversor informa potências mínimas contínua e de pico e verifica correntes da bateria/BMS. A potência contínua escolhida é comparada à mínima calculada; insuficiência gera aviso. A potência de pico e a duração de partida ainda exigem conferência na ficha do modelo.

Sem potência de partida publicada, o pico calculado não confirma a partida dos aparelhos. Sem cargas AC, o guia informa que o inversor não é necessário para as cargas selecionadas.

O relatório usa blocos de resumo, títulos numerados, valores em destaque, tabela de cargas adaptada a cartões no celular e avisos apenas quando aplicáveis. A composição do consumo separa cargas DC, cargas AC, perdas no inversor e funcionamento sem carga.

O fluxo é explícito: **Gerar PDF → Salvar/Compartilhar PDF** quando o navegador aceita compartilhar arquivos. O primeiro botão gera um arquivo A4 diretamente no dispositivo com jsPDF, carregado apenas ao exportar. O segundo chama `navigator.share()` diretamente no novo toque, sem carregar ou gerar arquivos antes dessa chamada, entregando um `File` com nome `.pdf` e tipo `application/pdf` ao menu nativo. No iPhone, esse é o menu em que o usuário pode escolher **Salvar em Arquivos**, sem depender dos controles do visualizador de PDFs.

A detecção usa `navigator.canShare({ files })` com o arquivo real. Apenas sem esse suporte, a ferramenta oferece **Baixar PDF**, um link nativo com nome de arquivo e atributo `download`. O retorno do compartilhamento não muda essa escolha: concluir, fechar o menu ou receber uma recusa preserva o PDF e permite tentar novamente, sem revelar outro botão de salvamento. A conclusão da API não é apresentada como confirmação de que o usuário salvou o arquivo. `AbortError` recebe uma mensagem neutra, pois o retorno da API não permite confirmar se o arquivo foi salvo no destino.

**Visualizar PDF** abre um diálogo na própria página, com PDF.js e seu worker servidos localmente. Não usa URLs Blob em abas externas nem o visualizador nativo do navegador. A biblioteca só é carregada ao visualizar; o arquivo já gerado é lido diretamente em memória e não é enviado a um serviço. O visualizador renderiza uma página de cada vez, oferece **Anterior**, **Próxima**, **Ampliar** e **Ajustar à tela**, e preserva o relatório HTML para leitura com tecnologia assistiva. Fechar, sair do relatório ou gerar outro PDF cancela renderizações pendentes, encerra o worker e libera o canvas. Falhas de carregamento ou renderização são informadas em português, sem impedir o salvamento do PDF.

A dependência `pdfjs-dist` fica na linha `~5.4.624`, compatível com o mínimo Node 22.12 do projeto. Antes de atualizar para outra linha, confira seu requisito de Node e valide o worker no build de produção.

Não há clique automático de download após operações assíncronas, `window.open()`, `window.print()`, captura de tela ou serviço externo de geração. O compartilhamento só ocorre por ação explícita e para o destino escolhido pelo usuário. Tela e PDF compartilham a mesma apresentação de dados em `report-presentation.ts`, evitando divergência de valores, exclusões e avisos.

A URL local usada pelo download permanece válida enquanto o relatório estiver aberto, sem expiração de um segundo. Ao gerar novamente ou sair da etapa do relatório, o link anterior é removido e sua URL é revogada. Uma geração ainda em andamento não pode disponibilizar um arquivo obsoleto após essas ações.

O PDF contém texto selecionável, fontes oficiais incorporadas, cabeçalhos, rodapés numerados e paginação automática, incluindo continuação da tabela de equipamentos. Manrope regular/negrito e DM Serif Display são servidas localmente em `public/media/branding/fonts/`, com suas licenças OFL. A primeira exportação precisa carregar os arquivos da ferramenta; não depende do Google Fonts em tempo de geração. O navegador ainda controla permissões e o destino do download.

Durante a geração, o botão fica ocupado e indisponível para evitar cliques duplicados. Falhas são informadas em português, sem perder o formulário ou recorrer silenciosamente à impressão. Os avisos de validação do formulário também são localizados em português, independentemente do idioma do navegador.

## Planilha Excel

**Baixar planilha (Excel)** gera, no próprio clique, um arquivo `.xlsx` com duas abas:

- **Resumo:** identificação, resumo do sistema, banco de baterias (incluindo como ligá-las), inversor, energia solar quando ativada, avisos, premissas e o aviso final.
- **Consumo:** uma linha por equipamento (nome, categoria, alimentação, quantidade, uso por unidade e energia por dia em Wh) e a composição do consumo diário. Quantidades e energias são células numéricas, que podem ser somadas e editadas.

O arquivo abre diretamente no Excel, no Numbers e no Google Planilhas, sem conversão. É montado em `src/lib/solar/report-xlsx.ts`, sem dependências: um pacote ZIP sem compressão com as partes mínimas do formato Office Open XML (`[Content_Types].xml`, relações, `workbook.xml`, `styles.xml` e uma planilha por aba, com textos em células `inlineStr`). A geração reutiliza a mesma apresentação da tela e do PDF e não descarta um PDF já gerado. A compatibilidade foi conferida abrindo o arquivo no Excel e no `openpyxl`.

## Progresso salvo no navegador

O formulário é salvo automaticamente no `localStorage` do navegador (chave `odisseia-mundana:planejador-eletrico`), incluindo a etapa atual e os equipamentos adicionados manualmente. Nada é enviado a um servidor. **Recomeçar** apaga esses dados após confirmação. A lógica fica em `src/scripts/solarWizardStorage.ts`: cada campo é identificado pelo grupo do rádio ou pelo primeiro atributo `data-*`, prefixado pelo equipamento do catálogo; campos desconhecidos são ignorados ao restaurar, e a versão do formato (`version: 1`) invalida dados incompatíveis.

## Contrato JSON legado

A interface pública oferece o PDF e a planilha Excel, sem botões, seletor de arquivo ou fluxo de importação/exportação JSON. O progresso salvo no navegador usa um formato próprio e independente desse contrato.

O contrato versionado `.odisseia-solar.json` permanece isolado em `src/lib/solar/project-file.ts`, com os testes de validação das versões 1 e 2 preservados. Esse módulo legado não é carregado pelo assistente público.
