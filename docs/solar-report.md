# Relatório e arquivos de projeto — Planejador Elétrico

Para a arquitetura, as fórmulas e as limitações gerais da ferramenta, consulte [odisseia-solar.md](./odisseia-solar.md).

## Relatório

O guia básico é montado localmente no navegador a partir da configuração atual, com cinco seções: resumo, consumo dos equipamentos, banco de baterias estimado, inversor e premissas/limites. O inventário distingue referências de fabricante, cenários genéricos editáveis e cargas próprias.

Freedom DF4100 e Rolls AGM usam a capacidade de descarga publicada e DoD para estimar energia e quantidade de baterias, sem exigir eficiências direcionais desconhecidas. LiFePO₄ preserva o método com eficiência de descarga do perfil. Nenhum método promete capacidade real em qualquer temperatura ou regime.

Não são inventados parâmetros ausentes. Painéis, MPPT, recarga, carregadores, cabos e proteções ficam fora do escopo deste guia, explicitados em uma nota de limites em vez de várias seções incompletas. Avisos de incompatibilidades conhecidas, como ultrapassar limite publicado de paralelos ou descarga, continuam visíveis.

O cálculo do inversor informa potências mínimas contínua e de pico e verifica correntes da bateria/BMS. A potência contínua escolhida é comparada à mínima calculada; insuficiência gera aviso. A potência de pico e a duração de partida ainda exigem conferência na ficha do modelo.

Sem potência de partida publicada, o pico calculado não confirma a partida dos aparelhos. Sem cargas AC, o guia informa que o inversor não é necessário para as cargas selecionadas.

O relatório usa blocos de resumo, títulos numerados, valores em destaque, tabela de cargas adaptada a cartões no celular e avisos apenas quando aplicáveis. A composição do consumo separa cargas DC, cargas AC, perdas no inversor e funcionamento sem carga.

O botão **Baixar relatório PDF** gera um arquivo A4 diretamente no dispositivo com jsPDF, carregado apenas ao exportar. Não usa `window.print()`, nova janela, captura de tela ou serviço externo. Tela e PDF compartilham a mesma apresentação de dados em `report-presentation.ts`, evitando divergência de valores, exclusões e avisos.

O PDF contém texto selecionável, fontes oficiais incorporadas, cabeçalhos, rodapés numerados e paginação automática, incluindo continuação da tabela de equipamentos. Manrope regular/negrito e DM Serif Display são servidas localmente em `public/media/branding/fonts/`, com suas licenças OFL. A primeira exportação precisa carregar os arquivos da ferramenta; não depende do Google Fonts em tempo de geração. O navegador ainda controla permissões e o destino do download.

Durante a geração, o botão fica ocupado e indisponível para evitar cliques duplicados. Falhas são informadas em português, sem perder o formulário ou recorrer silenciosamente à impressão. Os avisos de validação do formulário também são localizados em português, independentemente do idioma do navegador.

## Arquivo JSON

O arquivo `.odisseia-solar.json` transporta uma configuração entre dispositivos. A exportação usa a versão `2`, com aceitação explícita da versão `1`. O identificador continua `odisseia-solar-project`; o arquivo não contém código executável e não é enviado a servidor nem guardado automaticamente.

A versão 2 inclui `battery.agm` (capacidade e DoD) e permite `catalogLoads[].usage` (potência e horas), apenas para equipamentos com base potência-tempo. Ao importar arquivos sem ajustes de uso, os valores originais do catálogo são usados; AGM recebe sua referência inicial quando ausente na versão 1, sem alterar a química selecionada. A versão 1 continua recusando campos novos e a opção AGM.

A potência contínua é transportada como `inverter.ratedPowerW`, opcional na versão 2 para aceitar arquivos anteriores à inclusão desse campo. Quando ausente, o novo controle recebe 2.000 W como ponto de partida editável; os demais parâmetros importados são preservados. A versão 1 não aceita essa propriedade.

Campos Freedom legados de eficiências, carga/corte e corrente são preservados para reexportação, mas o guia passa a usar capacidade de descarga e DoD; a mensagem de importação explica essa mudança.

Na importação, o aplicativo limita o tamanho a 1 MB, analisa o JSON como dado, valida versão, propriedades, tipos, faixas e referências conhecidas e só então aplica a configuração. Arquivos inválidos ou com propriedades não reconhecidas são recusados com uma mensagem explícita. Os campos textuais importados são renderizados como texto, nunca como HTML.

Alterações futuras incompatíveis devem incrementar a versão do formato ou definir uma migração explícita antes de aceitar os novos arquivos.
