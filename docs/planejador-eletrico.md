# Planejador Elétrico — arquitetura e manutenção

## Finalidade

O Planejador Elétrico é uma ferramenta local de pré-dimensionamento de sistemas off-grid, com o título de página **Planejador Elétrico para Motorhome e Van**, disponível em `/pt/planejador-eletrico/`. O endereço antigo `/pt/odisseia-solar/` redireciona para o novo, preservando parâmetros como `utm_source`, e não é indexado. Ele soma o consumo dos equipamentos e estima banco de baterias, inversor e, opcionalmente, painéis solares e corrente mínima do controlador de carga. Não substitui um projeto executivo nem a validação de um profissional qualificado.

O nome anterior era Odisseia Solar. Os identificadores internos de código (pastas `solar/`, classes `.solar-*` e o formato legado `odisseia-solar-project`) permanecem; só o endereço público mudou. A interface pública oferece o relatório PDF e a planilha Excel (.xlsx), sem importação ou exportação JSON.

As etapas são: **Veículo → Cargas → Bateria → Solar (opcional) → Relatório**. Nas cargas, o usuário pode começar por um perfil pronto, buscar no catálogo, ajustar potência, horas e ciclo de funcionamento, ou adicionar equipamentos próprios. Uma ajuda explica como descobrir o consumo pela etiqueta, pela ENCE do Inmetro, por medidor de tomada ou por monitor de bateria.

## Arquitetura

| Responsabilidade | Arquivo |
|---|---|
| Rota Astro em português, metadados e JSON-LD | `src/pages/pt/planejador-eletrico.astro` (redirecionamento em `src/pages/pt/odisseia-solar.astro`) |
| Integração ao layout e à navegação do site | `src/layouts/SiteLayout.astro` |
| Estrutura da página, progresso e diálogo do PDF | `src/components/SolarConfigurationWizard.astro` |
| Marcação de cada etapa e do resumo lateral | `src/components/solar/*.astro` |
| Estado do formulário, eventos, relatório e ações do PDF/Excel | `src/scripts/solarWizard.ts` |
| Progresso salvo no navegador | `src/scripts/solarWizardStorage.ts` |
| Estilos do planejador (seletores prefixados por `.solar-`) | `src/styles/solar-wizard.css` |
| Catálogos locais de insolação, cargas, perfis, fatores solares e componentes | `src/lib/solar/catalogs.ts` |
| Tipos de domínio e funções puras de cálculo | `src/lib/solar/calculations.ts` |
| Composição do relatório a partir das funções de cálculo | `src/lib/solar/report.ts` |
| Texto e valores compartilhados entre tela e PDF | `src/lib/solar/report-presentation.ts` |
| Geração local do PDF A4 com fontes incorporadas | `src/lib/solar/report-pdf.ts` |
| Planilha Excel (.xlsx) sem dependências | `src/lib/solar/report-xlsx.ts` |
| Visualização local do PDF, sem abas externas | `src/lib/solar/pdf-preview.ts` |
| Mensagens de validação do formulário em português | `src/lib/solar/validation.ts` |
| Contrato JSON legado e validação, sem integração à interface pública | `src/lib/solar/project-file.ts` |
| Testes do motor, catálogos, relatório e JSON | `tests/solar-*.test.mjs` |

O fluxo é: formulário no navegador → dados locais do catálogo e valores editáveis → funções de cálculo → apresentação compartilhada → relatório na tela, PDF e planilha Excel. O PDF é gerado localmente com jsPDF e salvo por compartilhamento nativo ou download, sem impressão. Não há backend, banco de dados nem API de cálculo. O progresso fica salvo apenas no `localStorage` do navegador e pode ser apagado com **Recomeçar**.

## Fórmulas e interpretação

Nas fórmulas, `η` representa eficiência em fração decimal (por exemplo, 95% = 0,95), e `DoD` representa profundidade de descarga também em fração.

### Energia das cargas

| Base informada | Energia diária por unidade |
|---|---|
| Potência e tempo | `P × horas por dia` |
| Potência média contínua | `P_média × 24` |
| Ciclo de compressor | `P_funcionamento × janela diária × ciclo de trabalho` |
| Carga DC por conversor 24→12 V | energia do aparelho ÷ η_conversor; a diferença aparece como perda do conversor |`n| Energia diária publicada ou informada | `Wh/dia informado` — não se multiplica novamente por 24 |
| Corrente e tempo | `I × V × horas por dia`; somente para carga DC na tensão do banco |
| Consumo mensal de etiqueta (kWh/mês) | `kWh/mês × 1.000 ÷ 30`; convenção de mês de 30 dias, sem correção para as condições do veículo |
| Consumo diário em Ah | `Ah/dia × V`; somente para carga DC na tensão do banco |

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
E_nominal_LiFePO4 = E_utilizável ÷ (DoD × η_descarga)
E_nominal_capacidade_publicada = E_utilizável ÷ DoD
Capacidade_Ah = E_nominal ÷ tensão_nominal_real_da_bateria
```

A base `published-discharge`, usada para Freedom e Rolls AGM, representa capacidade de descarga publicada: não supõe eficiência de descarga de 100% nem calcula perdas/tempo de recarga. Energia utilizável aproximada por unidade é tensão × Ah publicados × DoD. A base anterior `stored-energy`, com eficiência de descarga, é preservada para LiFePO₄ e cálculos existentes.

A tensão nominal real (por exemplo, 12,8 V ou 25,6 V) é usada na conversão para Ah e na corrente do inversor. A eficiência de carga não entra nessa fórmula de capacidade; as funções técnicas de recarga e geração do motor continuam exigindo-a, mas não são chamadas pelo guia.

Para a configuração reportada, a quantidade em paralelo é arredondada para cima a partir da capacidade nominal em Ah dividida pela capacidade de cada unidade. O perfil LiFePO₄ correspondente é tratado como uma unidade do banco nominal de 12 V ou 24 V; para chumbo-ácido/AGM, a quantidade em série deriva da tensão do banco dividida pela tensão de cada bateria. Limites conhecidos de unidades em paralelo geram aviso quando excedidos.

### Arranjo fotovoltaico e MPPT

O motor possui `calculatePvSizing`, mas a interface usa a estimativa mais simples de cobertura descrita abaixo. A função detalhada, disponível para uso técnico futuro, usa:

```text
P_requerida =
  E_barramento/dia
  ÷ (HSP × fator_de_desempenho × η_MPPT × η_carga_bateria)
```

O fator de desempenho do arranjo exclui as eficiências do MPPT e da bateria, que são aplicadas separadamente. A quantidade de módulos é arredondada para cima e ajustada à configuração em série informada. As correções térmicas usam os coeficientes do modelo exato do módulo em relação a 25 °C, como fração por °C (`fator = 1 + coeficiente × (temperatura − 25 °C)`): Voc é verificada na temperatura mínima; Vmp e correntes, na máxima. Coeficientes ausentes deixam a verificação pendente, em vez de receberem valores presumidos.

A corrente de saída estimada do MPPT é `potência instalada × η_MPPT ÷ tensão de carga da bateria`. O motor também verifica limites de tensão PV, corrente de curto-circuito, corrente operacional quando publicada e corrente máxima de carga. Falhas conhecidas são marcadas como incompatíveis; dados ausentes e possível limitação de potência exigem confirmação.

### Cobertura solar e controlador (etapa opcional)

A etapa solar segue o método do mês crítico do *Manual de Engenharia para Sistemas Fotovoltaicos* (CRESESB/CEPEL, 2014, seção 6.2, Eq. 6.2 e 6.3, p. 309), implementado em `calculateSolarCoverage`:

```text
E_gerar = E_barramento/dia ÷ η_bat
P_ideal (Wp) = E_gerar ÷ (HSP × Red1 × Red2)
Geração (Wh/dia) = P_disponível × HSP × Red1 × Red2 × η_bat
Cobertura = Geração ÷ E_barramento/dia
Déficit = max(0, E_barramento/dia − Geração)
I_controlador_mínima = P_instalar ÷ tensão nominal do banco
P_instalar = min(P_ideal, P_disponível), ou P_ideal sem limite informado
```

- `Red1 = 0,75` (default do manual): sujeira, degradação, tolerância de fabricação e temperatura de módulos de silício cristalino.
- `Red2 = 0,9` (default do manual): fiação, controlador, diodos e demais perdas.
- `η_bat` é a eficiência global da bateria: 86% para chumbo-ácido e AGM (valor sugerido pelo manual para chumbo-ácido); para LiFePO₄, o produto das eficiências de carga e descarga do perfil escolhido. Todos os valores são editáveis.
- O limite do teto é informado como potência máxima em Wp. Sem esse limite, a ferramenta mostra só a potência ideal.
- A corrente do controlador é conservadora: potência a instalar ÷ tensão nominal do banco, sem perdas. Ela usa a menor potência entre a ideal e a que cabe no veículo, porque um teto maior que o necessário não obriga a instalar mais painéis; nesse caso, o relatório mostra a "potência recomendada para instalar". Tensão máxima de entrada e correção por temperatura não são verificadas sem um painel e um controlador específicos.
- A sugestão de controlador (`suggestChargeControllers`) escolhe o menor tamanho comum entre 10, 20, 30 e 40 A — correntes nominais mais comuns no varejo, definidas pelo proprietário como referência de planejamento. Acima de 40 A, divide o arranjo em controladores iguais, cada um ligado a uma parte dos painéis, e informa que também existem modelos de corrente maior.
- A HSP nacional é média anual; o manual dimensiona pelo mês de pior irradiação. O texto da interface e do relatório orienta o usuário a informar um valor menor para inverno ou regiões de pouco sol.

A função `calculatePvSizing`, mais detalhada e dependente de módulo e MPPT específicos, continua disponível no motor, mas não é usada pela interface.

### Inversor e carregadores

Para as cargas AC marcadas como simultâneas:

```text
P_contínua mínima = soma(P_nominal × quantidade)
P_pico mínimo = soma(max(P_nominal, P_partida) × quantidade)
I_bateria = P ÷ (tensão_nominal_real_da_bateria × η_inversor)
```

O motor verifica as correntes contínua e de pico contra os limites informados para a bateria/BMS. O guia compara a potência contínua mínima à potência escolhida no formulário; o pico e sua duração exigem conferência na ficha. O cenário inicial editável é 220 V e 2.000 W, com hipóteses de eficiência e uso descritas em [solar-catalogs.md](./solar-catalogs.md).

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
6. O contrato JSON legado em `project-file.ts` não faz parte da interface pública. Preserve a compatibilidade e a validação estrita ao alterá-lo.

## Limitações conhecidas

- As HSP cadastradas são médias nacionais anuais modeladas, não medições locais nem o mês crítico usado no método do CRESESB.
- As três opções são LiFePO₄ (perfis NPP), chumbo-ácido (Freedom DF4100, 220 Ah C20) e AGM (Rolls S12-230AGM-RE, 210 Ah C20). DoD inicial de Freedom/AGM é 20%/50%, editável e com bases distintas documentadas; não há eficiências genéricas nem ajuste automático por regime de descarga.
- O guia não dimensiona recarga por alternador ou tomada, carregadores, cabos, fusíveis ou disjuntores. Painéis e controlador recebem apenas a estimativa de cobertura e a corrente mínima; tensão máxima de entrada, arranjo série/paralelo e correção térmica exigem as fichas do painel e do controlador escolhidos.
- Há exemplos genéricos de potência e uso diário em todas as categorias, além das referências de fabricante (Dometic, Resfri Ar); não representam especificações universais. Os exemplos DC genéricos valem em 12 e 24 V; referências de fabricante de outra tensão ficam visíveis porém desabilitadas, e em banco de 24 V podem ser incluídas pelo conversor 24→12 V, com a perda do conversor no consumo.
- Os perfis prontos (fim de semana, tempo integral, trabalho remoto) apenas marcam itens do catálogo; não representam consumo médio de viajantes.
- A referência Victron SUN é para saída nominal de 230 V; o cenário inicial de 220 V é uma hipótese de planejamento editável, não a indicação de um produto. A comparação de potência contínua não confirma picos de partida.
- Não há importação/exportação JSON nem sincronização entre dispositivos; o progresso salvo vale só para o navegador em uso. O PDF e a planilha são gerados localmente, mas o navegador e o sistema operacional controlam permissões e destino do salvamento.

Consulte [solar-report.md](./solar-report.md) para os detalhes do PDF e do contrato legado e [solar-catalogs.md](./solar-catalogs.md) para as fontes e condições dos dados atuais.
