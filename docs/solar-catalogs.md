# Catálogos do Planejador Elétrico

Os catálogos são dados locais; a aplicação não consulta essas fontes durante o uso. Valores sem fonte adequada não são completados por suposição.

Para a arquitetura, as fórmulas e o processo de atualização dos registros, consulte [odisseia-solar.md](./odisseia-solar.md).

## Insolação por país

Fonte: [Solar Analytica — Solar resource by nation](https://solaranalytica.com/solar-resource-by-nation), baseada na reanálise ERA5 do Copernicus Climate Change Service. A série consultada cobre 1940–2025; os valores cadastrados são a média das médias anuais no período de referência 1991–2020. A agregação é ponderada pela área de cada país, usando limites Natural Earth 5.1.1.

O catálogo inicial contém oito países cujos registros foram conferidos: Brasil (5,015), China (4,647), Finlândia (2,318), Quênia (5,850), México (5,723), Omã (6,292), Filipinas (5,031) e Polônia (2,989). A unidade na fonte é kWh/m²/dia; os valores são usados numericamente como uma estimativa de HSP equivalente.

São médias nacionais modeladas, não medições de uma localização nem mínimos sazonais. Em países extensos, a média pode diferir bastante do local do veículo. O valor pode ser editado e, para países sem registro neste catálogo inicial, deve ser informado manualmente.

A fonte informa a seguinte atribuição:

> Contains modified Copernicus Climate Change Service information. Neither the European Commission nor ECMWF is responsible for any use that may be made of the Copernicus information or data it contains. Changes made: monthly grids aggregated to Natural Earth 5.1.1 admin-0 feature area-weighted means.

Dados consultados em 18/11/2026. A página identifica a série como ERA5, fonte Copernicus Climate Change Service, e os limites como Natural Earth 5.1.1, de domínio público.

## Equipamentos consumidores

O primeiro registro é uma referência específica de produto, não um valor universal para geladeiras. A página da Dometic para a CFX5 45 informa consumo de 0,76 Ah/h em 12 VDC, com ambiente a 32 °C e interior a 4 °C. O valor de 218,88 Wh/dia é derivado dessa medição: 0,76 Ah/h × 24 h/dia × 12 V.

O dado corresponde apenas às condições publicadas e à alimentação de 12 V. Não há perfil cadastrado para 24 V, nem horas de uso adicionais: o consumo já é diário e não deve ser multiplicado novamente por 24.

Por autorização do proprietário, também há cenários genéricos pré-preenchidos, identificados separadamente das referências de fabricante. A fonte é a tabela pública [RVing Toolbox — Power Budget](https://rvingtoolbox.com/calculators/power-budget), de Brian Hamilton, atualizada em 10/10/2026 e consultada em 19/11/2026. Não são médias estatísticas universais nem especificações do aparelho do usuário.

| Categoria | Exemplo | Potência | Uso diário | Energia por unidade |
|---|---|---|---|---|
| Iluminação | Luminária LED 12 V | 3 W | 4 h | 12 Wh |
| Cozinha | Cafeteira AC | 900 W | 15 min | 225 Wh |
| Eletrônicos | Notebook com carregador AC | 60 W | 4 h | 240 Wh |
| Água | Bomba 12 V | 75 W | 20 min | 25 Wh |
| Climatização | Exaustor de teto 12 V | 30 W | 6 h | 180 Wh |
| Outros | Conjunto de detectores e controles em espera 12 V | 6 W | 24 h | 144 Wh |

Basta selecionar os exemplos; quantidade, potência e horas já estão preenchidas e podem ser editadas. O motor multiplica potência × horas × quantidade, preservando `20/60 h` para a bomba, sem arredondamento intermediário. As energias da tabela são anteriores às perdas do inversor. Os exemplos AC da fonte são para 120 V: a potência serve como cenário de consumo, não confirma compatibilidade com aparelhos ou inversores de 127/220/230 V. Não foram presumidos picos de partida. Os exemplos DC ficam disponíveis apenas para banco de 12 V; não se presume conversor DC-DC em banco de 24 V.

## Painel fotovoltaico

A referência inicial é o painel flexível Renogy RNG-100DB-H de 100 W, voltado também a aplicações em veículos. A [página do fabricante](https://www.renogy.com/es/products/100-watt-12-volt-flexible-monocrystalline-solar-panel) informa, em STC, 100 W ±3%, Vmp de 20,7 V, Imp de 4,84 A, Voc de 24,4 V e Isc de 5,16 A.

A ficha técnica vinculada à página identifica a revisão como RNG-100DB-H-G3, enquanto a página comercial atual não identifica essa revisão no nome do produto. Para evitar misturar dados de versões, os coeficientes térmicos da ficha G3 não foram transferidos ao perfil. Além disso, não há coeficientes publicados para Vmp e Imp na página atual. Portanto, as verificações de tensão e corrente que exigem correção térmica permanecem pendentes até que os dados da revisão exata sejam confirmados; nenhuma estimativa é usada.

## Controlador MPPT

A referência editável é o Victron SmartSolar MPPT 100/20, com suporte a bancos de 12, 24 ou 48 V. A [ficha oficial](https://www.victronenergy.com/media/pg/Manual_SmartSolar_MPPT_75-10_up_to_100-20/en/technical-specifications.html) informa tensão PV máxima de circuito aberto de 100 V, corrente PV máxima de curto-circuito de 20 A, corrente máxima de carga de 20 A e eficiência de pico de 98%. As potências PV nominais são 290 W em 12 V, 580 W em 24 V e 1.160 W em 48 V.

O manual informa que a tensão PV deve exceder a tensão da bateria em 5 V para iniciar; depois de iniciado, o mínimo é a tensão da bateria mais 1 V. Esses limites são relativos à bateria, não valores fixos. A ficha não publica um limite separado para corrente PV operacional; o limite de curto-circuito não deve ser reutilizado como se fosse esse outro parâmetro. A eficiência cadastrada é de pico e não representa uma eficiência garantida em toda condição de carga.

## Inversor

As referências são Victron SUN 12/250 e SUN 24/250, com saída nominal de 230 Vac. A [ficha técnica oficial](https://www.victronenergy.com/media/pg/Sun_Inverter/en/technical-specifications.html) informa 200 W contínuos a 25 °C e 400 W de pico para ambos. No modelo 12/250, a eficiência máxima é 87%, o consumo sem carga é 4,2 W e o consumo em ECO é 0,8 W. No 24/250, os valores correspondentes são 88%, 5,2 W e 1,3 W.

Esses produtos são referências editáveis para saída nominal de 230 V, não modelos brasileiros de saída nominal 127 V ou 220 V. A eficiência publicada é máxima; o cálculo usa um valor editável e não trata o máximo como rendimento garantido para qualquer carga.

Por solicitação do proprietário, o formulário inicia em **220 V, 2.000 W contínuos, 90% de eficiência, 20 W sem carga e 8 h/dia ligado sem alimentar equipamentos**. São hipóteses editáveis de um cenário de planejamento, não médias estatísticas verificadas nem especificações atribuídas a um produto. As oito horas são uma hipótese de rotina do usuário, não um dado do equipamento.

A [ficha oficial Epever IPower-Plus 220 V](https://www.epever.com/upload/file/2107/EPEVER-Datasheet_IPower-Plus-220V.pdf), consultada em 19/11/2026, confirma a existência do porte de 2.000 W contínuos e 4.000 W por 5 s, com saída 220/230 V e frequência 50/60 Hz. Nos modelos de 12/24 V desse porte, publica eficiência nominal superior a 88%/91% e corrente sem carga inferior a 1,2/1,0 A (14,4/24 W à tensão nominal). O cenário 90%/20 W é uma aproximação de planejamento próxima dessas referências, não a reprodução das especificações ou rendimento garantido de um modelo.

O cenário comporta a cafeteira de 900 W e o notebook de 60 W simultâneos do catálogo, mas não garante todos os equipamentos de um motorhome. O relatório compara a potência contínua escolhida com a exigida pelas cargas simultâneas e avisa quando insuficiente. Picos de partida, tensão, forma de onda e limites da bateria continuam precisando de conferência.

## Verificações sem dados suficientes

Quando uma correção térmica depende de um coeficiente não publicado, o motor não calcula esse valor nem considera a verificação aprovada. A verificação aparece como não avaliada e a compatibilidade fica como `requires-confirmation`, salvo se outra verificação conhecida já indicar incompatibilidade. O mesmo tratamento se aplica quando a ficha do controlador não fornece um limite de corrente PV operacional separado.

Se a corrente calculada de saída exceder a corrente máxima de carga do MPPT, o motor pede confirmação em vez de declarar incompatibilidade elétrica: o controlador limita a potência de entrada, o que pode causar corte de produção. Limites de tensão PV, corrente de curto-circuito e corrente máxima da bateria continuam sendo tratados como verificações de incompatibilidade quando excedidos.

## Baterias

Há dois perfis editáveis de modelos LiFePO4 específicos e referências Freedom DF4100 e Rolls S12-230AGM-RE para as opções chumbo-ácido e AGM. São referências de produto, não valores universais. A eficiência ida-e-volta não permite inferir separadamente eficiência de carga e descarga; nenhuma divisão é feita. Freedom e Rolls usam a capacidade de descarga publicada para estimar o banco sem exigir eficiências direcionais.

| Perfil de referência | Tensão nominal / capacidade | Carga | Descarga | Limites publicados |
|---|---|---|---|---|
| NPP LFP12.8-100 | 12,8 V / 100 Ah | 99,5% a 0,2C e 25 °C; tensão de carga de 14,6 V | 96–99% a 1C e 25 °C; corte de 11,2 V | até 50 A de carga, 100 A contínuos e 300 A por menos de 100 ms; até 4 em série e 6 em paralelo |
| NPP LFP25.6-100 | 25,6 V / 100 Ah | 99,5% a 0,2C e 25 °C; tensão de carga de 29,2 V | 96–99% a 1C e 25 °C; corte de 22,4 V | até 50 A de carga e 100 A contínuos; até 2 em série e 6 em paralelo |

Fontes: fichas oficiais [NPP LFP12.8-100](https://npp-power.eu/wp-content/uploads/2021/12/LFP12.8-100_ext.pdf) e [NPP LFP25.6-100](https://npp-power.eu/wp-content/uploads/2024/01/LFP25.6-100_ext.pdf), consultadas em 18/11/2026. A capacidade nominal é publicada a C5 e 25 °C.

Para a descarga, o perfil usa 96%, o limite inferior da faixa de 96–99% publicada pelo fabricante, sem extrapolar a eficiência para outras taxas ou temperaturas. As fichas também indicam vida cíclica superior a 3.000 ciclos em ensaio a 0,2C e 100% de profundidade de descarga. O perfil registra 100% como essa condição documentada, não como promessa de vida útil em qualquer regime; o valor permanece editável.

Os modelos são referências distintas para bancos nominais de 12 V e 24 V. O motor preserva a tensão do banco (12/24 V) e usa a tensão nominal real da bateria (12,8/25,6 V) para converter capacidade em Ah e estimar correntes do inversor. A quantidade de baterias pode ser calculada em relação à capacidade de 100 Ah, respeitando o limite publicado de seis unidades em paralelo. Não foi cadastrado limite de descarga de pico para o modelo de 25,6 V porque a ficha consultada não apresenta esse dado.

As fontes consultadas ilustram por que os valores não devem ser generalizados:

- [Rolls Battery — Charge Efficiency - AGM Batteries](https://support.rollsbattery.com/en/support/solutions/articles/246550-charge-efficiency-agm-batteries) informa eficiência aproximada de 80% para baterias AGM VRLA de ciclo profundo, dependente da taxa de carga/descarga e da idade; não fornece eficiências direcionais separadas.
- [Victron Energy — Lithium SuperPack datasheet](https://www.victronenergy.com/upload/documents/Datasheet-12,8V-&-25,6-Lithium-SuperPack-EN.pdf) apresenta valores ida-e-volta para categorias de baterias, não parâmetros direcionais genéricos para todas as baterias dessas químicas.
- [NPP Power — LFP 12.8-18 datasheet](https://npp-power.eu/wp-content/uploads/2022/04/LFP12.8-18_ext.pdf) publica valores direcionais para um produto específico e taxas de operação específicas. Esses valores não são transferidos para a categoria LiFePO4.

### Chumbo-ácido — Freedom DF4100

O proprietário escolheu a DF4100 em 19/11/2026. A referência parcial usa o catálogo técnico Freedom by Heliar enviado como `Especifica_o_T_cnica_-_Bateria_Estacion_ria_Freedom_DF.pdf`, páginas 3–5 do PDF. Não foi identificada uma data de revisão no documento. O [anúncio da NeoSolar](https://www.neosolar.com.br/loja/bateria-estacionaria-freedom-df4001-240ah-220ah.html) mantém DF4001 no endereço, mas o conteúdo indexado anuncia DF4100; o acesso direto ao anúncio foi bloqueado por verificação de segurança. Os dados técnicos foram conferidos no PDF fornecido, sem misturar os modelos.

- Bateria de 12 V, chumbo-ácido com eletrólito fluido, não AGM/GEL.
- A tabela principal distingue DF4000/DF4001 (225 Ah em C20) de DF4100 (220 Ah em C20). Para a DF4100: 200 Ah em C10, 220 Ah em C20 e 240 Ah em C100, a 25 °C. O formulário começa em **220 Ah, C20**, não 240 Ah. O motor não modela a variação da capacidade com a taxa de descarga (efeito Peukert).
- DoD inicial de **20%**: condição publicada de vida útil projetada superior a quatro anos a 25 °C, não limite máximo nem garantia. O valor permanece editável.
- A ficha publica carga/equalização de 14,4–15,5 V e flutuação de 13,2–13,8 V a 25 °C por unidade. Essas faixas são exibidas como referência; não foi escolhido automaticamente um ponto de operação ou equalização.
- Os 10,5 V das tabelas de descarga são uma tensão final de ensaio, não um corte recomendado automaticamente.
- Eficiências direcionais de carga/descarga e limites máximos de corrente não estão publicados nessa ficha. Não são exigidos pelo guia nem estimados; correntes tabuladas para regimes de descarga não viram limites contínuos ou de pico.

O guia usa tensão nominal × capacidade C20 × DoD: aproximadamente **528 Wh utilizáveis por unidade**, nas condições de referência. A energia necessária é dividida pelo DoD para estimar o banco; isso não presume eficiência de descarga de 100%, pois a base já é a capacidade de descarga publicada. Não são calculadas perdas nem tempo de recarga. Em banco de 24 V, duas unidades de 12 V formam cada ramo em série.

Dados editados não são sobrescritos ao alternar a química. Campos legados de eficiências, carga/corte e corrente importados de projetos anteriores são preservados na exportação, mas não aplicados ao guia Freedom. Consulte [solar-report.md](./solar-report.md) para o formato JSON.

### AGM — Rolls S12-230AGM-RE

A opção AGM é apresentada separadamente por solicitação do proprietário, embora também seja chumbo-ácido. Fonte: [ficha oficial Rolls](https://rollsbattery.com/battery/s12-230agm-re/), revisão de 05/08/2022, consultada em 19/11/2026.

- Unidade de **12 V e 210 Ah em C20**, a 25 °C. Os 230 Ah do nome são C100; C10 é 189 Ah e C5 é 172 Ah.
- DoD inicial editável de **50%**, baseado na [orientação geral Rolls para sistemas off-grid](https://support.rollsbattery.com/en/support/solutions/articles/246449-what-is-the-best-battery-for-off-grid-systems-), não um limite máximo específico do modelo nem garantia de vida útil.
- Energia utilizável aproximada por unidade: `12 × 210 × 0,50 = 1.260 Wh`. O método é o mesmo de capacidade de descarga publicado usado para a Freedom; em 24 V são duas unidades em série por ramo.
- A ficha publica carga de 14,7 V, flutuação de 13,8 V a 25 °C e carga recomendada/máxima de 40/65 A. Esses dados não configuram automaticamente carregadores no guia.
- O rendimento típico de aproximadamente 80% da linha AGM é de ciclo completo, não duas eficiências direcionais nem medição específica deste modelo. Não é inserido como eficiência de carga ou descarga.

Nenhum dos dois métodos corrige automaticamente capacidade por temperatura, envelhecimento ou taxa de descarga. Quantidade por capacidade não certifica ligação série/paralelo, corrente ou proteção.
