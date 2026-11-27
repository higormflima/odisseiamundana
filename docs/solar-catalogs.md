# Catálogos do Planejador Elétrico

Os catálogos são dados locais; a aplicação não consulta essas fontes durante o uso. Valores sem fonte adequada não são completados por suposição.

Para a arquitetura, as fórmulas e o processo de atualização dos registros, consulte [planejador-eletrico.md](./planejador-eletrico.md).

## Insolação por país

Fonte: [Solar Analytica — Solar resource by nation](https://solaranalytica.com/solar-resource-by-nation), baseada na reanálise ERA5 do Copernicus Climate Change Service. A série consultada cobre 1940–2025; os valores cadastrados são a média das médias anuais no período de referência 1991–2020. A agregação é ponderada pela área de cada país, usando limites Natural Earth 5.1.1.

O catálogo contém **238 países e territórios**: todas as feições da fonte com código ISO 3166 de três letras, exceto a Antártida. Ficam de fora apenas áreas sem código de país próprio na fonte (bancos e recifes, bases militares, zonas-tampão, campos de gelo, Baikonur, Somalilândia e Chipre do Norte). França, Noruega e Kosovo, que a fonte publica sem código ISO, usam FRA, NOR e XKX. O seletor agrupa os países por continente, com a América do Sul primeiro. A unidade na fonte é kWh/m²/dia; os valores são usados numericamente como uma estimativa de HSP equivalente.

A lista é gerada por `node --use-system-ca scripts/generate-solar-resource-countries.mjs`, que grava `src/lib/solar/solar-resource-countries.ts`; não edite esse arquivo manualmente. O script:

1. lê `https://solaranalytica.com/solar-resource-by-nation/data.json` (contrato `solar-resource-by-nation-v1`, 258 feições, licença CC BY 4.0);
2. calcula, para cada feição, a média das 30 médias anuais publicadas de 1991 a 2020, arredondada a três casas, o mesmo valor exibido na página da fonte (por exemplo, Brasil 5,015 e Finlândia 2,318);
3. converte o código ISO alfa-3 em alfa-2 com a tabela pública [mledoze/countries](https://github.com/mledoze/countries) e obtém o nome em português com `Intl.DisplayNames('pt-BR')`, com poucos ajustes de nome registrados no próprio script.

`--use-system-ca` permite usar os certificados do sistema em redes com inspeção TLS. Territórios pequenos marcados pela fonte como menores que uma célula da grade ERA5 (por exemplo, Malta, Singapura e microestados) foram mantidos, mas a média representa a célula que os contém.

Não há HSP por estado brasileiro: não foi encontrada fonte que publique esse valor já agregado, e os dados em grade do Atlas Brasileiro de Energia Solar (INPE/LABREN, 2017) têm licença CC BY-NC-ND, que não permite publicar médias derivadas sem autorização. A etapa solar indica o [CRESESB SunData](https://cresesb.cepel.br/index.php?section=sundata), em que o usuário consulta a irradiação do próprio local e digita o valor; a ferramenta não copia dados dessa fonte.

São médias nacionais modeladas, não medições de uma localização nem mínimos sazonais. Em países extensos, a média pode diferir bastante do local do veículo. O valor pode ser editado e, quando necessário, informado manualmente.

A fonte informa a seguinte atribuição:

> Contains modified Copernicus Climate Change Service information. Neither the European Commission nor ECMWF is responsible for any use that may be made of the Copernicus information or data it contains. Changes made: monthly grids aggregated to Natural Earth 5.1.1 admin-0 feature area-weighted means.

Dados consultados em 27/11/2026, com licença CC BY 4.0. A página identifica a série como ERA5, fonte Copernicus Climate Change Service, e os limites como Natural Earth 5.1.1, de domínio público.

## Equipamentos consumidores

O catálogo tem 40 itens em sete categorias: dez referências de fabricante e 30 cenários genéricos de uso. Cada item registra fonte, data de consulta, condições e derivação, exibidas em **Fonte e premissas** no cartão.

### Referências de fabricante

| Item | Valor publicado | Derivação no catálogo | Fonte |
|---|---|---|---|
| Dometic CFX5 45 (12 V) | 0,76 Ah/h, ambiente 32 °C e interior 4 °C | 0,76 × 24 h × 12 V = 218,88 Wh/dia | [Dometic](https://www.dometic.com/en/product/dometic-cfx5-45-9620015959), 18/11/2026 |
| Dometic CFX3 45 (12 V) | 1,03 Ah/h, ambiente 32 °C e interior 4 °C | 1,03 × 24 h × 12 V = 296,64 Wh/dia | [Dometic](https://www.dometic.com/en-ae/product/dometic-cfx3-45-9620009573), 27/11/2026 |
| Resfri Ar geladeira 67 L (RESGED67), 12 V | 3,8 ± 0,5 A (Turbo: 5,6 A) | 45,6 W × 24 h × 50% = 547,2 Wh/dia | [Resfri Ar](https://resfriar.com.br/product/refrigerator-67-liters-refrigerator), 27/11/2026 |
| Resfri Ar geladeira 67 L (RESGED67), 24 V | 1,9 ± 0,5 A (Turbo: 2,8 A) | 45,6 W × 24 h × 50% = 547,2 Wh/dia | idem |
| Resfri Ar geladeira 75 L externa (RESGED75), 12/24 V | 3,8 ± 0,5 A em 12 V; 1,9 ± 0,5 A em 24 V | 45,6 W × 24 h × 50% = 547,2 Wh/dia | [Resfri Ar](https://resfriar.com.br/product/refrigerator-75-liters-external), 27/11/2026 |
| Resfri Ar geladeira 110 L side by side (RESGE110), 12/24 V | 6,4 ± 0,5 A em 12 V; 3,2 ± 0,5 A em 24 V | 76,8 W × 24 h × 50% = 921,6 Wh/dia | [Resfri Ar](https://resfriar.com.br/product/refrigerator-110-liters-side-by-side), 27/11/2026 |
| Resfri Ar RT8000 (400AC), 12 V | consumo máximo 650 W, 55 A, 6.500 BTU/h | 650 W × 8 h × 60% = 3.120 Wh/dia | [Resfri Ar](https://www.resfriar.com.br/produto/ar-condicionado-rt8000-serie-4-inverter), 27/11/2026 |
| Resfri Ar RT8000 (400AC), 24 V | consumo máximo 750 W, 31 A, 7.500 BTU/h | 750 W × 8 h × 60% = 3.600 Wh/dia | idem |

Os valores Dometic são consumos médios por hora nas condições publicadas e não recebem horas adicionais. A Resfri Ar publica corrente (geladeira) e consumo máximo (ar-condicionado), mas não o tempo de funcionamento do compressor. Para esses itens, o ciclo inicial vem do cenário genérico da RVing Toolbox para o mesmo tipo de aparelho (geladeira com compressor: 24 h a 50%; ar-condicionado: 8 h a 60%). O cartão informa essa combinação, e potência, horas e ciclo são editáveis. O RT8000 usa o consumo máximo; o modo inverter tende a consumir menos. As referências Resfri Ar têm valores publicados em 12 V e 24 V e aparecem como itens separados por tensão. As Dometic CFX5 45 e CFX3 45 têm consumo publicado só em 12 V; em banco de 24 V ficam visíveis, porém desabilitadas, a menos que o usuário ative o conversor 24→12 V.

### Cenários genéricos (RVing Toolbox)

Por autorização do proprietário, há cenários genéricos pré-preenchidos, identificados separadamente das referências de fabricante. A fonte é a tabela pública [RVing Toolbox — Power Budget](https://rvingtoolbox.com/calculators/power-budget), de Brian Hamilton, atualizada em 10/10/2026. Os seis primeiros itens foram consultados em 19/11/2026 e os demais em 27/11/2026. Não são médias estatísticas universais nem especificações do aparelho do usuário.

| Categoria | Exemplo | Potência | Uso diário | Energia por unidade |
|---|---|---|---|---|
| Refrigeração | Geladeira de absorção a gás (controles DC) | 12 W | 24 h | 288 Wh |
| Refrigeração | Geladeira com compressor DC | 55 W | 24 h × 50% | 660 Wh |
| Refrigeração | Geladeira residencial AC | 150 W | 24 h × 40% | 1.440 Wh |
| Refrigeração | Geladeira de absorção na tomada AC* | 325 W | 24 h × 60% | 4.680 Wh |
| Iluminação | Luminária LED DC | 3 W | 4 h | 12 Wh |
| Cozinha | Cafeteira AC | 900 W | 15 min | 225 Wh |
| Cozinha | Micro-ondas AC | 1.200 W | 10 min | 200 Wh |
| Cozinha | Chaleira elétrica AC | 1.500 W | 6 min | 150 Wh |
| Cozinha | Torradeira AC | 1.100 W | 5 min | 91,67 Wh |
| Cozinha | Cooktop de indução AC | 1.800 W | 30 min × 70% | 630 Wh |
| Cozinha | Panela elétrica ou airfryer AC | 1.000 W | 30 min × 60% | 300 Wh |
| Eletrônicos e Internet | Notebook com carregador AC | 60 W | 4 h | 240 Wh |
| Eletrônicos e Internet | Carregamento de celular DC | 10 W | 3 h | 30 Wh |
| Eletrônicos e Internet | TV LED 32" AC | 50 W | 3 h | 150 Wh |
| Eletrônicos e Internet | Starlink Standard (Gen 3) | 88 W | 8 h | 704 Wh |
| Eletrônicos e Internet | Starlink Mini | 25 W | 8 h | 200 Wh |
| Eletrônicos e Internet | Roteador ou hotspot DC | 10 W | 24 h | 240 Wh |
| Eletrônicos e Internet | Console de videogame AC | 150 W | 2 h | 300 Wh |
| Água e Higiene | Bomba DC | 75 W | 20 min | 25 Wh |
| Água e Higiene | Manta de aquecimento de tanque DC | 100 W | 24 h × 40% | 960 Wh |
| Água e Higiene | Aquecedor de água elétrico AC* | 1.400 W | 1,5 h | 2.100 Wh |
| Água e Higiene | Secador de cabelo AC | 1.500 W | 6 min | 150 Wh |
| Climatização e Aquecimento | Exaustor de teto DC | 30 W | 6 h | 180 Wh |
| Climatização e Aquecimento | Ventilador de aquecedor a gás DC | 100 W | 4,3 h | 430 Wh |
| Climatização e Aquecimento | Ar-condicionado AC 13.500 BTU* | 1.500 W | 8 h × 60% | 7.200 Wh |
| Climatização e Aquecimento | Ar-condicionado AC 15.000 BTU* | 1.700 W | 8 h × 60% | 8.160 Wh |
| Climatização e Aquecimento | Aquecedor elétrico AC | 1.500 W | 4 h × 70% | 4.200 Wh |
| Climatização e Aquecimento | Cobertor elétrico AC | 60 W | 8 h × 50% | 240 Wh |
| Saúde e Outros | CPAP DC | 40 W | 8 h | 320 Wh |
| Saúde e Outros | Detectores e controles em espera DC | 6 W | 24 h | 144 Wh |

\* Na fonte, uso típico com energia externa (tomada); o cartão avisa que o consumo é alto para sistemas somente com bateria.

O percentual indica o tempo em que o aparelho efetivamente funciona dentro das horas informadas (base `compressor-cycle`). O motor multiplica potência × horas × ciclo × quantidade, sem arredondamento intermediário. A tabela da fonte arredonda alguns totais de forma diferente (micro-ondas 204 Wh, torradeira 88 Wh, ventilador do aquecedor 432 Wh); o catálogo usa a potência e o tempo publicados. As energias da tabela são anteriores às perdas do inversor.

Os exemplos AC da fonte são para 120 V. A potência serve como cenário de consumo, não confirma compatibilidade com aparelhos ou inversores de 127/220/230 V. Não foram encontradas tabelas oficiais brasileiras acessíveis com potência e tempo de uso por aparelho (a Pesquisa de Posse e Hábitos do Procel/Eletrobras foi localizada apenas por fontes secundárias); para aparelhos com ENCE do Inmetro, o usuário pode informar o consumo mensal em kWh/mês. Não foram presumidos picos de partida. Os exemplos DC genéricos são cenários de potência (W × horas) e valem para banco de 12 V ou 24 V: a energia diária é a mesma na versão 12 V ou 24 V do aparelho. Por isso os nomes dizem "DC", e não "12 V"; a fonte mede o circuito de 12 V.

### Conversor 24→12 V

Em banco de 24 V, o usuário pode ativar **"Usar conversor 24→12 V"** para incluir referências de fabricante que só existem em 12 V. A energia desses aparelhos é dividida pela eficiência do conversor, e a perda aparece separada na composição do consumo. A referência editável é o Victron Orion-Tr Smart 24/12-30 (360 W), isolado: 88% de eficiência e consumo sem carga menor que 100 mA, segundo a [tabela oficial de especificações](https://www.victronenergy.com/media/pg/Orion-Tr_Smart_DC-DC_Charger_-_Isolated/en/specifications.html), consultada em 27/11/2026. A tabela não indica se a eficiência é típica ou máxima; o consumo sem carga não entra no cálculo. Sem o conversor, os itens só 12 V ficam desabilitados e, se estavam marcados, são desmarcados com aviso.

### Perfis prontos

`loadProfiles` marca conjuntos de itens do catálogo como ponto de partida: **Fim de semana**, **Viagem em tempo integral** e **Trabalho remoto**. São escolhas editoriais de exemplo, não consumo médio de viajantes. Ao aplicar um perfil, potência, horas e ciclo voltam aos valores do catálogo; equipamentos adicionados manualmente são mantidos. Em banco de 24 V, a Dometic CFX5 45 (só 12 V) é substituída pela geladeira genérica com compressor (`substituteAt24V`).

## Fatores da estimativa solar

Fonte: CRESESB/CEPEL, [*Manual de Engenharia para Sistemas Fotovoltaicos*](https://cresesb.cepel.br/index.php/publicacoes/download/Manual_de_Engenharia_FV_2014.pdf?section=publicacoes&cid=481), edição 2014, seção 6.2 (método do mês crítico), Eq. 6.2 e 6.3, p. 309. Consultado em 27/11/2026; o texto foi conferido no PDF da edição de 2014.

- **Red1 = 0,75**: "fator de redução (derating) da potência dos módulos fotovoltaicos", englobando sujeira, degradação, tolerância de fabricação e temperatura, default para módulos de silício cristalino.
- **Red2 = 0,9**: perdas no sistema, "incluindo fiação, controlador, diodos etc.".
- **η_bat = 86%**: eficiência global sugerida para bateria chumbo-ácido (Capítulo 4 do manual). Usada para chumbo-ácido e AGM. Para LiFePO₄, a ferramenta usa o produto das eficiências direcionais publicadas no perfil (por exemplo, 99,5% × 96% = 95,52% para os perfis NPP), sem transferir o valor do chumbo-ácido.

Os três valores são editáveis. O manual dimensiona pelo mês de pior irradiação no plano do painel; a ferramenta usa a HSP informada pelo usuário e avisa que médias anuais superestimam a geração nos meses de pouco sol.

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
