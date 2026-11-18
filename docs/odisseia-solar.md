# Odisseia Solar — arquitetura e manutenção

## Finalidade

A Odisseia Solar é uma ferramenta local de pré-dimensionamento para veículos, disponível em `/pt/odisseia-solar/`. Ela organiza dados informados, aplica cálculos documentados e sinaliza como pendente o que não pode ser verificado com os parâmetros disponíveis. Não substitui um projeto executivo nem a validação de um profissional qualificado.

## Arquitetura

| Responsabilidade | Arquivo |
|---|---|
| Rota Astro em português | `src/pages/pt/odisseia-solar.astro` |
| Integração ao layout e à navegação do site | `src/layouts/SiteLayout.astro` |
| Etapas do formulário, estado local, relatório, impressão e arquivo de projeto | `src/components/SolarConfigurationWizard.astro` |
| Catálogos locais de insolação, cargas e componentes | `src/lib/solar/catalogs.ts` |
| Tipos de domínio e funções puras de cálculo | `src/lib/solar/calculations.ts` |
| Composição do relatório a partir das funções de cálculo | `src/lib/solar/report.ts` |
| Formato e validação estrita do JSON transportável | `src/lib/solar/project-file.ts` |
| Testes do motor, catálogos, relatório e JSON | `tests/solar-*.test.mjs` |

O fluxo é: formulário no navegador → dados locais do catálogo e valores editáveis → funções de cálculo → relatório na tela. A impressão usa a própria janela de impressão do navegador. A exportação cria um arquivo JSON local, e a importação valida o conteúdo antes de aplicar os valores. Não há backend, banco de dados, API de cálculo ou salvamento automático; os dados do formulário não persistem após recarregar a página.

## Fórmulas e interpretação

Nas fórmulas, `η` representa eficiência em fração decimal (por exemplo, 95% = 0,95), e `DoD` representa profundidade de descarga também em fração.

### Energia das cargas

| Base informada | Energia diária por unidade |
|---|---|
| Potência e tempo | `P × horas por dia` |
| Potência média contínua | `P_média × 24` |
| Ciclo de compressor | `P_funcionamento × janela diária × ciclo de trabalho` |
| Energia diária publicada ou informada | `Wh/dia informado` — não se multiplica novamente por 24 |
| Corrente e tempo | `I × V × horas por dia`; somente para carga DC na tensão do banco |

O resultado de cada base é multiplicado pela quantidade. Cargas AC são convertidas para a energia exigida no barramento da bateria dividindo sua energia diária pela eficiência do inversor. O consumo em espera é `P_espera × horas sem carga`.

```text
E_barramento/dia =
  E_cargas_DC/dia
  + E_cargas_AC/dia ÷ η_inversor
  + P_espera × horas_sem_carga
```

O cálculo de energia diária não depende da simultaneidade. A simultaneidade é usada no dimensionamento de potência do inversor.

### Banco de baterias

```text
E_utilizável = E_barramento/dia × dias_de_autonomia
E_nominal = E_utilizável ÷ (DoD × η_descarga)
Capacidade_Ah = E_nominal ÷ tensão_nominal_real_da_bateria
```

A tensão nominal real (por exemplo, 12,8 V ou 25,6 V) é usada na conversão para Ah e na corrente do inversor. A eficiência de carga não entra nessa fórmula de capacidade; ela é usada nos cálculos que representam recarga e geração fotovoltaica.

Para a configuração reportada, a quantidade em paralelo é arredondada para cima a partir da capacidade nominal em Ah dividida pela capacidade de cada unidade. O perfil LiFePO₄ correspondente é tratado como uma unidade do banco nominal de 12 V ou 24 V; para chumbo-ácido, a quantidade em série deriva da tensão do banco dividida pela tensão de cada bateria. Limites conhecidos de unidades em paralelo geram aviso quando excedidos.

### Arranjo fotovoltaico e MPPT

O motor possui `calculatePvSizing`, mas o relatório atual da interface mantém PV/MPPT pendentes e não chama essa função; portanto, o fluxo atual não apresenta resultado numérico de PV/MPPT. A função de cálculo usa:

```text
P_requerida =
  E_barramento/dia
  ÷ (HSP × fator_de_desempenho × η_MPPT × η_carga_bateria)
```

O fator de desempenho do arranjo exclui as eficiências do MPPT e da bateria, que são aplicadas separadamente. A quantidade de módulos é arredondada para cima e ajustada à configuração em série informada. As correções térmicas usam os coeficientes do modelo exato do módulo em relação a 25 °C, como fração por °C (`fator = 1 + coeficiente × (temperatura − 25 °C)`): Voc é verificada na temperatura mínima; Vmp e correntes, na máxima. Coeficientes ausentes deixam a verificação pendente, em vez de receberem valores presumidos.

A corrente de saída estimada do MPPT é `potência instalada × η_MPPT ÷ tensão de carga da bateria`. O motor também verifica limites de tensão PV, corrente de curto-circuito, corrente operacional quando publicada e corrente máxima de carga. Falhas conhecidas são marcadas como incompatíveis; dados ausentes e possível limitação de potência exigem confirmação.

### Inversor e carregadores

Para as cargas AC marcadas como simultâneas:

```text
P_contínua mínima = soma(P_nominal × quantidade)
P_pico mínimo = soma(max(P_nominal, P_partida) × quantidade)
I_bateria = P ÷ (tensão_nominal_real_da_bateria × η_inversor)
```

O motor verifica as correntes contínua e de pico contra os limites informados para a bateria/BMS. Essa verificação não compara automaticamente as potências calculadas com as potências contínua e de pico nominais do modelo de inversor escolhido; consulte essa limitação também em [solar-report.md](./solar-report.md).

As funções de dimensionamento DC-DC e AC-DC do motor, quando recebem um plano de recarga completo, calculam:

```text
I_saida = energia_a_armazenar ÷ (tempo × tensão_de_carga × η_carga_bateria)
P_saida = I_saida × tensão_de_carga
P_entrada = P_saida ÷ η_carregador
I_entrada_DC = P_entrada ÷ tensão_do_veículo
I_entrada_AC = P_entrada ÷ (tensão_AC × fator_de_potência)
```

Os limites da bateria, alternador ou circuito só podem ser verificados quando seus dados forem conhecidos. Cabos e proteções permanecem adiados; a implementação não escolhe seções ou correntes nominais sem dados de instalação e validação normativa específica.

## Atualização de dados

Os catálogos são cópias locais e não são consultados em tempo de execução. Seus valores, tipos e referências estão em `src/lib/solar/catalogs.ts`; a descrição das fontes, condições e limitações fica em [solar-catalogs.md](./solar-catalogs.md).

Ao atualizar um registro:

1. Use uma fonte adequada ao dado — preferencialmente ficha oficial do modelo exato ou fonte metodológica identificável. Não transfira parâmetros entre revisões ou produtos parecidos.
2. Registre nome e URL da fonte, data de consulta, unidade, condições de ensaio e derivação quando o valor for calculado.
3. Mantenha campos desconhecidos ausentes; não preencha lacunas com estimativas, valores genéricos ou conversões não justificadas.
4. Para países, mantenha o código de três letras, o período, a unidade, a metodologia de agregação e a atribuição da fonte junto ao conjunto de dados.
5. Atualize `docs/solar-catalogs.md` e os testes de catálogo ou cálculo afetados. Valide com `pnpm.cmd test` e `pnpm.cmd exec astro build`.
6. Se a alteração mudar o formato exportado do projeto, atualize a validação em `project-file.ts` e trate a compatibilidade pela versão do JSON; não aceite propriedades novas silenciosamente.

## Limitações conhecidas

- As HSP cadastradas são médias nacionais modeladas, não medições locais ou valores sazonais.
- Os perfis de bateria são referências de modelos específicos LiFePO₄. Chumbo-ácido exige dados do modelo escolhido; não há eficiências genéricas.
- O relatório deixa PV/MPPT pendentes sem fator de desempenho aprovado, coeficientes térmicos da revisão exata e limites do controlador.
- Os carregadores DC-DC e AC-DC ficam pendentes sem metas de energia e tempo de recarga e limites das fontes.
- O relatório não dimensiona numericamente cabos, fusíveis ou disjuntores.
- A referência Victron SUN é para saída nominal de 230 V. Para outras tensões, os dados do inversor devem ser informados; ainda assim, a potência nominal do modelo selecionado não é comparada automaticamente com a potência mínima calculada.
- O arquivo JSON é um formato local versionado, limitado e validado; não é sincronizado entre dispositivos. O PDF depende da impressão do navegador e da escolha “Salvar como PDF”.

Consulte [solar-report.md](./solar-report.md) para os detalhes de impressão e do contrato JSON e [solar-catalogs.md](./solar-catalogs.md) para as fontes e condições dos dados atuais.
