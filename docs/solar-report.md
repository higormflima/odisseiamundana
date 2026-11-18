# Relatório e arquivos de projeto — Odisseia Solar

Para a arquitetura, as fórmulas e as limitações gerais da ferramenta, consulte [odisseia-solar.md](./odisseia-solar.md).

## Relatório

O relatório é montado localmente no navegador a partir da configuração atual. Ele apresenta consumo, memória de cálculo de bateria, contagem por capacidade e dimensionamento preliminar do inversor quando há cargas AC. Os valores do inventário distinguem referências do catálogo de dados informados pelo usuário.

Não são inventados parâmetros ausentes. O dimensionamento numérico de painéis e a verificação do MPPT ficam pendentes até haver parâmetros validados de perdas, temperatura do módulo e limites do controlador. Os carregadores DC-DC e AC-DC ficam pendentes até haver metas de recarga e limites das fontes. Cabos e proteções não recebem seção ou corrente nominal sem comprimento, método de instalação, temperatura, agrupamento e validação normativa específica.

O cálculo do inversor informa potências mínimas contínua e de pico e verifica correntes da bateria/BMS. Ele não compara essas potências mínimas com as potências contínua e de pico nominais do modelo selecionado; essa comparação precisa ser feita na ficha do equipamento.

O botão de PDF usa a impressão do navegador. A pessoa pode selecionar “Salvar como PDF”; o documento é formatado para papel A4 e não depende de biblioteca ou serviço externo.

## Arquivo JSON

O arquivo `.odisseia-solar.json` transporta uma configuração entre dispositivos. A versão atual do formato é `1`; o arquivo não contém código executável e não é enviado a servidor nem guardado automaticamente.

Na importação, o aplicativo limita o tamanho a 1 MB, analisa o JSON como dado, valida versão, propriedades, tipos, faixas e referências conhecidas e só então aplica a configuração. Arquivos inválidos ou com propriedades não reconhecidas são recusados com uma mensagem explícita. Os campos textuais importados são renderizados como texto, nunca como HTML.

Alterações futuras incompatíveis devem incrementar a versão do formato ou definir uma migração explícita antes de aceitar os novos arquivos.
