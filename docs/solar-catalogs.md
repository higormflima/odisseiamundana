# Catálogos da Odisseia Solar

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

O dado corresponde apenas às condições publicadas e à alimentação de 12 V. Não há perfil cadastrado para 24 V, nem horas de uso adicionais: o consumo já é diário e não deve ser multiplicado novamente por 24. Outros equipamentos só receberão valores de uso quando houver fonte direta adequada.

Por decisão do proprietário, o catálogo não usa horas típicas estimadas por fontes independentes. Neste momento, apenas a CFX5 45 tem um valor diário pré-preenchido; os demais equipamentos precisarão de dados publicados pelo fabricante ou de valores informados pelo usuário.

## Painel fotovoltaico

A referência inicial é o painel flexível Renogy RNG-100DB-H de 100 W, voltado também a aplicações em veículos. A [página do fabricante](https://www.renogy.com/es/products/100-watt-12-volt-flexible-monocrystalline-solar-panel) informa, em STC, 100 W ±3%, Vmp de 20,7 V, Imp de 4,84 A, Voc de 24,4 V e Isc de 5,16 A.

A ficha técnica vinculada à página identifica a revisão como RNG-100DB-H-G3, enquanto a página comercial atual não identifica essa revisão no nome do produto. Para evitar misturar dados de versões, os coeficientes térmicos da ficha G3 não foram transferidos ao perfil. Além disso, não há coeficientes publicados para Vmp e Imp na página atual. Portanto, as verificações de tensão e corrente que exigem correção térmica permanecem pendentes até que os dados da revisão exata sejam confirmados; nenhuma estimativa é usada.

## Controlador MPPT

A referência editável é o Victron SmartSolar MPPT 100/20, com suporte a bancos de 12, 24 ou 48 V. A [ficha oficial](https://www.victronenergy.com/media/pg/Manual_SmartSolar_MPPT_75-10_up_to_100-20/en/technical-specifications.html) informa tensão PV máxima de circuito aberto de 100 V, corrente PV máxima de curto-circuito de 20 A, corrente máxima de carga de 20 A e eficiência de pico de 98%. As potências PV nominais são 290 W em 12 V, 580 W em 24 V e 1.160 W em 48 V.

O manual informa que a tensão PV deve exceder a tensão da bateria em 5 V para iniciar; depois de iniciado, o mínimo é a tensão da bateria mais 1 V. Esses limites são relativos à bateria, não valores fixos. A ficha não publica um limite separado para corrente PV operacional; o limite de curto-circuito não deve ser reutilizado como se fosse esse outro parâmetro. A eficiência cadastrada é de pico e não representa uma eficiência garantida em toda condição de carga.

## Inversor

As referências são Victron SUN 12/250 e SUN 24/250, com saída nominal de 230 Vac. A [ficha técnica oficial](https://www.victronenergy.com/media/pg/Sun_Inverter/en/technical-specifications.html) informa 200 W contínuos a 25 °C e 400 W de pico para ambos. No modelo 12/250, a eficiência máxima é 87%, o consumo sem carga é 4,2 W e o consumo em ECO é 0,8 W. No 24/250, os valores correspondentes são 88%, 5,2 W e 1,3 W.

Esses produtos são referências editáveis para saída nominal de 230 V, não modelos brasileiros de saída nominal 127 V ou 220 V. A eficiência publicada é máxima; o cálculo deve usar um valor editável e não tratar o máximo como rendimento garantido para qualquer carga. Não há perfil pré-preenchido de inversor 127/220 V.

## Verificações sem dados suficientes

Quando uma correção térmica depende de um coeficiente não publicado, o motor não calcula esse valor nem considera a verificação aprovada. A verificação aparece como não avaliada e a compatibilidade fica como `requires-confirmation`, salvo se outra verificação conhecida já indicar incompatibilidade. O mesmo tratamento se aplica quando a ficha do controlador não fornece um limite de corrente PV operacional separado.

Se a corrente calculada de saída exceder a corrente máxima de carga do MPPT, o motor pede confirmação em vez de declarar incompatibilidade elétrica: o controlador limita a potência de entrada, o que pode causar corte de produção. Limites de tensão PV, corrente de curto-circuito e corrente máxima da bateria continuam sendo tratados como verificações de incompatibilidade quando excedidos.

## Baterias

Não há parâmetros numéricos genéricos pré-cadastrados para nenhuma química. Há dois perfis editáveis de modelos LiFePO4 específicos; eles são referências de produto, não valores universais. Chumbo-ácido permanece sem perfil numérico até haver uma ficha de modelo com dados direcionais suficientes. A eficiência ida-e-volta não permite inferir separadamente eficiência de carga e descarga sem uma hipótese; por isso, nenhuma divisão é feita.

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

Para chumbo-ácido, devem ser informados os dados do modelo escolhido: tensão e capacidade nominais, profundidade de descarga, eficiências separadas e tensão de carga. Limites de corrente devem ser usados quando publicados. A seleção de chumbo-ácido não recebe valores padrão nem eficiências genéricas.
