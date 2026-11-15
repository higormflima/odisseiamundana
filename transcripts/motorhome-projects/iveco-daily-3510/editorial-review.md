# Revisão inicial — construção da Iveco Daily 35.10

## Escopo e fontes

- Análise realizada em 15/11/2026, autorizada para os materiais locais.
- Foram lidos os títulos e as descrições dos 45 vídeos da playlist e a única
  transcrição local, `ZUPpQwlqrsg`. Nenhum vídeo foi assistido integralmente,
  nenhuma nova transcrição foi solicitada e nenhum arquivo-fonte foi alterado.
- Os arquivos originais permanecem em `imports/youtube/channel/`. O campo
  `info_file` do [inventário de vídeos](../../../imports/youtube/channel-video-inventory.csv)
  permite localizar o JSON original de cada `video_id`; os arquivos `.description`
  e `.pt.srt`, quando presentes, compartilham o nome-base.
- O [mapa de playlists importado](../../../imports/youtube/channel/playlists_videos_mapa.csv)
  contém 45 posições únicas desta playlist e todos os IDs possuem metadados locais.
- A ordem foi conferida diretamente na
  [playlist pública](https://www.youtube.com/playlist?list=PLA8vGdq_0fiMR3RYUXQ-0xKridLUsSf1f),
  em 15/11/2026: 45 posições, idênticas à importação. Foram comparados IDs e posições,
  não os títulos traduzidos automaticamente pela interface do YouTube.
- A sequência de IDs unidos por `LF`, sem quebra final, tem SHA-256
  `1b315373b2c4427eb7ecaf004934b0aec9915e3006142bc37111a33a27aaed6a`,
  idêntico no navegador, no inventário importado e no YAML consolidado.
- As descrições foram examinadas com os blocos de texto repetidos agrupados para
  leitura; os originais não foram normalizados nem regravados. Rodapés de parceiros,
  links de produtos, tags e listas de equipamentos de filmagem não comprovam que um
  componente foi instalado na Iveco.
- A notação `youtube:<id>:description` na proveniência aponta para a descrição no
  JSON original desse ID. Referências à transcrição incluem o intervalo de tempo.

## Sequência conferida e classificação de leitura

Esta tabela não reorganiza a playlist. A classificação serve à revisão; não cria
subpáginas nem transforma todos os vídeos em etapas da construção.

| Posição | ID | Assunto e limite de atribuição |
| --- | --- | --- |
| 1 | `NFc-9WhVAIY` | Projeto 3D no SketchUp. |
| 2 | `jWKbwh202hg` | Planilha de custos da construção; sem totais monetários recuperados da descrição. |
| 3 | `1asypqExBhA` | Planejamento das etapas de montagem. |
| 4 | `pBVVlorqkBU` | Isolamento térmico e acústico; material similar ao 3TC, não marca comprovada. |
| 5 | `WBOeLFDTGbo` | Recuperação do assoalho e montagem do piso. |
| 6 | `lM10PvYTkGA` | Instalação das janelas Finestra Car. |
| 7 | `yRH7NiOk9BQ` | Compra de janelas e divulgação comercial histórica. |
| 8 | `gJeIieF7oiY` | Rack dos painéis solares; descrição informa dois dias em duas pessoas. |
| 9 | `8Y2hkStLF14` | Passagem de fios e mangueiras; elétrica, hidráulica e gás. |
| 10 | `D4As-ZLi1wU` | Cama removível e materiais da estrutura. |
| 11 | `Sj5SnDLPo_A` | Instalação e teste do climatizador Maxiclima Fusion. |
| 12 | `nEwzvhLczJ8` | Caixa de água servida Seaflo e motivo da instalação. |
| 13 | `EYaOv9tWOps` | Medidores de nível e identificação da PPVille como fabricante dos reservatórios. |
| 14 | `BC2eZ3QBvTU` | Sistema hidráulico; capítulos mencionam bomba Seaflo e aquecedor Lorenzetti. Modelos e capacidades não confirmados. |
| 15 | `TMszKJB0tSI` | Reservatório de aproximadamente 200 litros; autonomia narrada depende do uso. |
| 16 | `ReYewD_68hE` | Time-lapse do banheiro; três minutos é duração do resumo, não da obra. |
| 17 | `fYhPvrB5Fbs` | Materiais e construção do banheiro; especificação do plástico desconhecida. |
| 18 | `LcJMFLZUHP4` | Banheiro portátil e preparação química descrita na fonte; fórmula não reproduzida nem validada. |
| 19 | `ZoLWq27xvR4` | Divulgação de desconto em peças; não é comprovante de compra ou custo. |
| 20 | `WgPm5eI12Ls` | Conceitos de energia solar off-grid; apresentação de componentes não prova marca/modelo instalado. |
| 21 | `tq5C4Fi2Brg` | Planilha de dimensionamento; exemplos de autonomia não são capacidade real comprovada da Iveco. |
| 22 | `C28HvEzwIPk` | Ligações dos painéis e controladores; alternativas discutidas não são escolhas comprovadas. |
| 23 | `L-FMpSbwU3M` | Instalação elétrica e limitações relatadas da ligação ao alternador. |
| 24 | `qHJbU6IYn1I` | Móveis em MDF e planejamento pelos equipamentos. |
| 25 | `lcmL0jd1fT4` | Pistões a gás das portas dos armários. |
| 26 | `bEbICB_8g1Y` | Revestimento em MDF e avaliação retrospectiva sobre pinus. |
| 27 | `Egs9kjhoBcU` | Cabine e bancos de couro; descrição contém trecho aparentemente copiado do tour. |
| 28 | `wuOiO7XYDgQ` | Tour geral com capítulos para os sistemas da Iveco. |
| 29 | `v7zynRLPtL4` | Time-lapse geral; compra em novembro/2018, término em julho/2019 e oito meses mencionados. |
| 30 | `qukRFG4Uxmw` | Projeto 3D e opção pela montagem artesanal. |
| 31 | `9b_Pe5VWjAU` | Distribuição de custos; sem cifras na descrição. |
| 32 | `bprzPgkzOi0` | Nome Chivunk; contexto, não etapa construtiva. |
| 33 | `CTWd2t3xvYA` | Avaliação dos problemas com a manutenção do veículo-base. |
| 34 | `WirltLUtCAs` | Custos da viagem, não da construção; descrição identifica a Iveco como ano 1998. |
| 35 | `v1AF-g1PZWc` | Experiência de pernoites e viagem; não é sistema da construção. |
| 36 | `j207oSW-lKM` | Tutorial Tripline; não altera a solução de mapa do site. |
| 37 | `aaZcWMbDNZo` | Avaliação do climatizador após uso na viagem. |
| 38 | `-_VZvjJXmwc` | Tour da instalação hidráulica concluída. |
| 39 | `MZ_rUN7TPPg` | Escolha de espuma após testes; resultado pessoal, não recomendação universal. |
| 40 | `Zjj-DIcmFCI` | Cozinha, frigobar 12 V e relato sobre água; potabilidade não validada por esta revisão. |
| 41 | `cSBNfboaYD8` | Tutorial Portal Motorhome; não comprova seu uso na construção original. |
| 42 | `h7ekFUxnFEY` | Depoimentos sobre projetos de outras pessoas. |
| 43 | `sCi4pZ1-AC8` | Motorhome do projeto Roadlifers; não é a Iveco deste registro. |
| 44 | `V67NFlkzRfs` | Fiat Ducato Rimor de amigos, comprado na Itália; não é a Iveco nem o novo motorhome adquirido na Polônia. |
| 45 | `ZUPpQwlqrsg` | Comparação posterior de baterias, com referência retrospectiva à bateria de chumbo-ácido usada na Iveco. |

## Confirmações do proprietário — 15/11/2026

- Construção iniciada em **dezembro de 2018**, não na data de compra da van.
- Término em **julho de 2019**, com aproximadamente **oito meses de período total**.
- Aproximadamente **seis meses de trabalho** e **dois meses de pausas distribuídas**,
  por períodos na oficina mecânica e espera de materiais, incluindo atraso na
  entrega das madeiras dos móveis. Não são oito meses contínuos de mão de obra.
- Local: **São José dos Campos, São Paulo**, na garagem de casa conforme as descrições.
- O período em `build_period` usa precisão de mês, sem dias inventados.
- Ano **1998**, motor **2.8 turbodiesel**, potência de **103 cv**, tração
  **traseira** e entre-eixos de **3,30 m**, confirmados pelo proprietário.
- Medidas totais fornecidas: **6,00 m** de comprimento, **2,00 m** de largura e
  **2,675 m** de altura. O proprietário confirmou que descrevem **a van original,
  antes da conversão**, não a altura do motorhome com rack, painéis e climatizador.
  Não foram tratadas como medidas internas úteis ou ficha oficial do fabricante.
- O proprietário confirmou que a configuração final utilizou os quatro itens
  identificados na planilha: **dois painéis Canadian Solar de 275 Wp cada**,
  **uma bateria Heliar Freedom DF4001 de 240 Ah**, **controlador MPPT Epever
  TRIRON 3210N de 30 A, 12/24 V**, e **inversor Hayonik de 500 W, 12 V/127 V,
  pico de 1.000 W**. Esses itens passaram de registros de compra para componentes
  confirmados da instalação. Não foi inferida a tensão de operação do banco
  apenas pela compatibilidade 12/24 V do controlador.
- O isolamento era **material similar ao 3TC, sem marca confirmada**. O nome
  “Manta aluminizada 3TC” da planilha não comprova a marca. A descrição do vídeo
  menciona poliestireno expandido, mas a composição não foi confirmada nesta
  entrevista; o YAML não a apresenta como especificação técnica estabelecida.
- O proprietário confirmou **Matsuri** como marca da bomba e **70 litros**
  para o reservatório de água servida. Não confirmou expressamente, nessa resposta,
  o modelo/vazão da bomba, o modelo do aquecedor ou os 200 litros de água limpa.
  Essa última capacidade permanece aproximada e sustentada pela descrição do vídeo,
  não por confirmação manual nesta rodada.

## Consolidação e grau de verificação

- Modelo e título foram fornecidos nas instruções do proprietário.
- Foram relacionados 13 sistemas/áreas, sete decisões e três dicas sustentadas
  pelas descrições. A classificação temática é uma organização editorial, não
  uma nova ordem dos vídeos.
- Materiais, equipamentos e processos extraídos das descrições estão como
  `reviewed`, não como confirmação pessoal do proprietário nem certificação técnica.
- O resumo é uma síntese editorial inicial, `ai_inference` / `unverified`,
  posteriormente aprovada pelo proprietário junto à página principal em
  15/11/2026. A aprovação editorial não certifica tecnicamente as instalações.
- As durações confirmadas pelo proprietário ficam separadas dos dois dias do rack,
  extraídos da descrição. Não foram somadas durações de vídeos para estimar trabalho.
- Inicialmente `main_costs` foi omitido por falta de cifras nas descrições.
  Após o recebimento da planilha original, foram registrados três subtotais
  disjuntos, conforme a seção abaixo. Mão de obra própria descrita como gratuita
  não significa ausência de serviços mecânicos pagos nem custo total zero.
- Os **7.500 EUR** do vídeo `V67NFlkzRfs` são de outro veículo. Os exemplos de
  aproximadamente **5.000 BRL** e **1.000 BRL**, em `ZUPpQwlqrsg` (03:25–03:41),
  comparam baterias; não foram registrados como pagamentos da construção.
- Fotografias e comparações antes/depois foram omitidas: miniaturas de vídeos não
  foram promovidas a documentação fotográfica de etapas.
- Cupons, descontos, parcerias, preços históricos e links de compra não foram
  tratados como ofertas atuais ou compras comprovadas.

## Revisão separada da transcrição automática

Fonte preservada: arquivo `.pt.srt` de `ZUPpQwlqrsg`, em `imports/youtube/channel/`,
com 283 blocos e último intervalo em 11:02,800–11:08,789. Não foi criada outra
cópia do original nem uma transcrição integral corrigida.

| Trecho | Leitura para esta revisão | Tratamento |
| --- | --- | --- |
| 00:28–00:43 | Referência à construção do próprio motorhome e à série de elétrica. | Contexto; não estabelece datas de construção. |
| 00:56–01:06 | A transcrição associa gravações ao fim da viagem em 2020. | Cronologia não confirmada por áudio; não usada como data da obra. |
| 01:39–01:48 e ocorrências posteriores | Variações como “Life po4” referem-se a LiFePO4, termo presente na descrição. | Normalização de leitura somente neste registro; original intacto. |
| 02:22–02:43 e ocorrências posteriores | Variações como “chumbo aço” foram lidas como chumbo-ácido, conforme a descrição e o contexto. | Não altera a fonte. |
| 02:28–02:43; 03:27–03:41 | Unidades transcritas como “a”/“A” são ambíguas entre corrente e capacidade. | Não converter automaticamente para Ah nem extrair especificação da bateria instalada. |
| 02:55–03:10 | Afirmações gerais sobre segurança térmica das baterias. | Não validadas tecnicamente e não transformadas em recomendação de segurança. |
| 03:25–03:41 | Preços aproximados de exemplos de baterias. | Comparação didática, não despesa do projeto. |
| 03:58–07:28 | Exemplos de descarga, ciclos e vida útil. | Não são garantias universais nem especificações comprovadas da bateria da Iveco. |
| 07:58–08:28 | Relato explícito de uso de bateria de chumbo-ácido no motorhome da viagem pelo Brasil. | Único dado específico da instalação extraído desta transcrição; sem inferir capacidade ou modelo. |
| 08:28–11:08 | Planilha, serviços de projeto, contatos e encerramento. | Não comprovam novos componentes ou alterações na Iveco. |

Receitas químicas, instruções de gás, dimensionamentos elétricos e alegações de
potabilidade presentes nas fontes não foram reproduzidos como instruções práticas
nem receberam validação técnica. A documentação é histórica; publicação de
orientações técnicas exige revisão específica.

## Planilha original fornecida pelo proprietário

- Arquivo recebido em 15/11/2026: `Custos Motorhome Odisseia Mundana.xlsx`.
- Cópia integral autorizada para download, com nome técnico
  `custos-motorhome-odisseia-mundana.xlsx`, em
  `public/downloads/motorhome-projects/iveco-daily-3510/`.
- Integridade conferida: **66.970 bytes**, SHA-256
  `ccdd127e22432a15a64eaf470b7d8eb3735bcd1b54f9f612c637aa9ad01c0378`.
  O original recebido, a cópia pública, a resposta HTTP local (200) e o arquivo
  gerado em `dist/` têm o mesmo conteúdo. O build continuou gerando 24 páginas,
  sem incluir a página de rascunho do motorhome. O servidor de desenvolvimento
  não informou `Content-Type` para o XLSX; a prévia usa o atributo `download`.
- Uma aba visível, `Sheet1`, com 380 itens nas linhas 4–383. Linhas 384–388
  contêm fórmulas com resultado zero; os totais em `D2` e `O389` usam
  `SUM(O4:O387)`. A moeda foi identificada pelos formatos `R$` da planilha.
- A soma foi conferida em centavos e cada total de item foi comparado a
  quantidade × valor unitário + frete, considerando campos numéricos vazios
  como zero para essa conferência. Não foram encontradas divergências nos
  380 itens. Nenhuma fórmula foi executada pelo Excel, nem links foram abertos.
- Resultado: **64.564,62 BRL**. Não é orçamento atual nem custo isolado da conversão.

| Grupo registrado no YAML | Itens | Subtotal (BRL) |
| --- | ---: | ---: |
| Categoria Veículo | 7 | 16.132,52 |
| Categoria Manutenção | 151 | 29.161,23 |
| Demais categorias | 222 | 19.270,87 |
| Total conferido | 380 | 64.564,62 |

O primeiro grupo inclui a compra da van e despesas associadas. Não confundir o
subtotal de Veículo com os 15.000,00 BRL de valor unitário da van em `M4`, nem
com o total de 15.100,00 BRL da linha 4, que inclui 100,00 BRL em `N4`.
As demais categorias incluem Cozinha, Hidráulica, Estrutura, Banheiro, Piso,
Isolamento, Móveis, Cama, Elétrica, GLP, Revestimento, Eletrodomésticos,
Ferramentas, Acessórios e Decoração.

### Datas e limites

- `A274` corresponde a **11/10/2004**, em uma compra de painel MDF branco de 3 mm:
  aparentemente inconsistente com a construção de 2018/2019. Não foi corrigida
  nem usada para alterar o período confirmado pelo proprietário.
- As linhas 382 e 383 estão datadas de **15/08/2019**, posteriores ao término
  da obra: ferramenta para sacar filtros e lavagem do tanque de combustível.
  Os valores continuam no total original, sem exclusões silenciosas.
- O total deve ser descrito como **total histórico registrado na planilha**,
  incluindo veículo, manutenção e demais categorias; não como oito meses
  exclusivos de despesas construtivas.
- A inspeção encontrou links comerciais históricos, nomes de fornecedores,
  localidades, o autor do documento e o logo da Odisseia Mundana. Não foram
  identificados documentos pessoais, dados de conta bancária, credenciais,
  contatos privados ou endereços residenciais completos na inspeção realizada.
  Não há abas ocultas, macros VBA ou vínculos de cálculo a outra pasta de trabalho
  entre as entradas do arquivo inspecionado.
- O arquivo original foi mantido integralmente, inclusive fórmulas, datas,
  links e propriedades. Sua presença no repositório não autoriza um push.

### Equipamentos identificados na planilha e confirmação de instalação

| Linha | Registro da fonte |
| --- | --- |
| 84 | Aquecedor Lorenzetti LZ750 BP GLP, 7,0 L/min. |
| 97 | “Manta aluminizada 3TC”, descrita como produto usado vendido por um amigo; diverge da descrição do vídeo, que diz similar ao 3TC. |
| 126 | Bomba pressurizada 3,0 GPM, 12 V, aproximadamente 11,6 L/min; marca registrada como “Padrão Seaflo”, não marca Seaflo comprovada. |
| 149 | Uma bateria Freedom DF4001 de 240 Ah, marca Heliar. |
| 188 | Um “Iversor Hayonik 500W 12V/127V Pico 1000W”; erro de grafia preservado na fonte. |
| 192 | Dois painéis Canadian Solar de 275 Wp policristalinos. |
| 193 | Um controlador MPPT Epever TRIRON 3210N, 30 A, 12/24 V. |

Os quatro itens do sistema solar (linhas 149, 188, 192 e 193) foram posteriormente
confirmados pelo proprietário como parte da configuração final e incorporados
ao YAML com proveniência manual confirmada. A identificação do isolamento foi
esclarecida como similar ao 3TC, sem marca confirmada. O proprietário identificou
a bomba como Matsuri; “Padrão Seaflo” não foi tratado como sua marca. Modelo/vazão
da bomba e modelo do aquecedor ainda carecem de confirmação manual; não presumir
a instalação de todos os itens somente por aparecerem na planilha.

## Prévia local autorizada

- A pedido do proprietário, foi criada a página de rascunho
  `/pt/motorhomes/iveco-daily-3510/`, somente em desenvolvimento.
- O MDX editorial permanece separado do YAML. O rascunho inclui resumo,
  carrossel na sequência integral da playlist, contexto da construção, sistemas
  expansíveis, custos históricos e link para a cópia original da planilha.
- Os títulos são carregados dos `.info.json` originais, sem duplicação dos
  registros e sem incorporar players. A sequência dos 45 IDs foi conferida na
  página renderizada e coincide com o hash registrado nesta revisão.
- A pedido do proprietário, o índice textual foi substituído por uma única
  linha de miniaturas 16:9, sem legendas visíveis, com carregamento sob demanda,
  rolagem nativa no celular e setas no desktop. Os títulos permanecem acessíveis
  a leitores de tela; links temáticos continuam localizando o vídeo no carrossel.
- A prévia tem aviso local e `noindex, nofollow`, sem novos links na navegação.
  O build de produção e o Pagefind mantiveram 24 páginas, sem incluir o rascunho.
- Conferidos os três subtotais, o total de R$64.564,62, o download HTTP 200
  com hash idêntico ao original e o layout sem rolagem horizontal em mobile.
- A autorização não abrange publicação, subpáginas, seleção de fotos nem nova
  análise audiovisual. A classificação de vídeos complementares permanece
  pendente antes da publicação.

## Aprovação da página principal e integração

- Em 15/11/2026, após validar a prévia e solicitar acesso pelo menu e pelo mapa,
  o proprietário respondeu **“Aprovar a página para publicação”**. O MDX passou
  a `published`. Isso autoriza sua inclusão no build, não commit ou push.
- O menu compartilhado inclui **Motorhome** após **Viagens**, com acesso direto
  à página principal. O mapa existente ganhou o ponto do projeto, sem cadastrar
  uma viagem fictícia ou adotar outra solução de mapas.
- Coordenadas públicas de referência de São José dos Campos:
  **latitude -23.17889, longitude -45.88694**. Fonte consultada em 15/11/2026:
  [Wikipédia — São José dos Campos](https://pt.wikipedia.org/wiki/S%C3%A3o_Jos%C3%A9_dos_Campos),
  que informa 23° 10′ 44″ S, 45° 53′ 13″ O. Não representam o endereço da garagem.
- O ponto fica em `representative_point`, com proveniência externa `reviewed`.
  Apenas projetos com página publicada e ponto completo entram no mapa.
- A publicação da página mantém o carrossel na ordem integral da playlist,
  inclusive seus conteúdos complementares. Subpáginas, seleção de fotos e nova
  análise audiovisual continuam dependendo de autorização.
- No conteúdo apresentado, foram removidas referências ao processo de extração
  dos cabos e do plástico. Não se afirma certificação das mangueiras nem
  especificação PVC do material reaproveitado sem comprovação técnica.
- Validação local: 22 testes direcionados aprovados; build e Pagefind com
  25 páginas, incluindo a página principal do motorhome. O HTML gerado contém
  os dois links de navegação, as 45 miniaturas e o novo marcador nas coordenadas
  registradas, sem `noindex`. Conferidos o clique no card, o menu mobile e a
  preservação dos oito marcadores de viagens e de seus links.

## Lacunas para entrevista ou fontes posteriores

1. Se necessário para conteúdo mais detalhado, confirmar modelo/vazão da bomba
   Matsuri e modelo do aquecedor; os quatro itens principais do sistema solar
   já foram confirmados.
2. Confirmar a capacidade de água limpa em entrevista, caso seja necessário
   apresentá-la como confirmação manual; a fonte atual informa aproximadamente
   200 litros. A água servida foi confirmada em 70 litros.
3. Se houver necessidade de uma versão revisada da planilha, confirmar a data
   correta de `A274`; nunca sobrescrever a cópia original para download.
4. Manter desconhecidas a composição técnica do isolamento e a especificação
   do plástico reaproveitado do banheiro; não são dedutíveis da marca citada
   informalmente ou das imagens.
5. Selecionar fotos autorizadas e identificar etapas e comparações reais.
6. Se for necessário detalhar o carrossel, decidir como distinguir os vídeos
   da construção, conteúdos complementares e veículos de terceiros, sem alterar
   a sequência da playlist.
7. Revisar a descrição aparentemente reutilizada em `Egs9kjhoBcU` antes de extrair
   detalhes adicionais da cabine. O título e a abertura sustentam apenas o tema.
8. Validar o piloto elétrico antes de completar as outras 12 páginas temáticas.
   A autorização posterior abaixo permite a prévia, não sua publicação.

## Piloto de elétrica e energia solar — autorização e revisão

O proprietário solicitou páginas para os 13 sistemas e aprovou começar por uma
página piloto de elétrica/solar. Autorizou obter legendas disponíveis no YouTube
e usar temporariamente o executável oficial portátil do yt-dlp. A página piloto
permanece `draft`, somente na prévia, até validação e aprovação de publicação.

Foram preservados sete VTTs automáticos `pt-orig`, sem correções nos originais.
O manifesto `solar-power.sources.json` registra URLs, caminhos e SHA-256 desses
arquivos e do SRT anterior. As leituras derivadas apenas retiraram tags e
repetições de legendas sobrepostas para análise; não são transcrições corrigidas.

| Fonte | Trechos usados | Síntese e limites |
| --- | --- | --- |
| `gJeIieF7oiY` | 03:00–06:00 | Teto curvo de fibra, apoio nas colunas metálicas, cantoneiras galvanizadas, soldagem, pintura e PU; ferramentas emprestadas. Não reproduzir afirmação antiga sobre legislação de altura. |
| `8Y2hkStLF14` | 00:00–05:00 | Planejamento das passagens antes do fechamento; cabos PP, layout e cuidado com rebarbas. Não transformar resistência do cabo em garantia universal. |
| `WgPm5eI12Ls` | 02:00–04:00; 06:00–11:00 | Sistema off-grid, bateria da casa e prioridade a cargas 12 V. Não reproduzir simplificações sobre corrente alternada e inversores. |
| `tq5C4Fi2Brg` | 02:00–14:00 | Consumo por potência/horas, cargas CC/CA, espaço, insolação e orçamento. A planilha de dimensionamento não é a planilha de custos disponibilizada. Números didáticos não são especificações finais. |
| `C28HvEzwIPk` | 01:00–07:00; 13:00–15:00 | Dois painéis de 275 Wp em paralelo, bateria 240 Ah, inversor 500 W e MPPT 30 A; uso histórico de disjuntores residenciais. Não publicar como receita de ligação/proteção ou certificar compatibilidade sem manuais. |
| `L-FMpSbwU3M` | 00:00–09:00 | Layout, iluminação LED, tomadas e cargas; alimentação externa manual por extensão, sem carregador externo de bateria; ligação ao alternador usada pouco. Não apresentar a comutação ou a ligação como orientação para reprodução. |
| `wuOiO7XYDgQ` | 04:00–06:00; 14:00–15:00; 19:00–23:00 | Componentes no bagageiro/armário, extensão de 20 m e frigobar 115 L convertido para 12 V. Foram lidos os trechos elétricos, não revisado integralmente o restante do tour. |
| `ZUPpQwlqrsg` | 01:39–08:28 | Reflexão posterior sobre tecnologias; uso de chumbo-ácido na Iveco, não instalação comprovada de lítio. Permanecem os limites da revisão anterior sobre preços, ciclos e segurança. |

### Normalizações e divergências

- Variações automáticas de MPPT, Epever/TRIRON, Canadian Solar, Heliar Freedom,
  LiFePO4 e chumbo-ácido foram lidas conforme os metadados e confirmações anteriores.
  Essa normalização editorial não modifica VTTs ou SRT.
- O dimensionamento menciona 220 V em exemplos e em uma referência ao inversor.
  A planilha, a confirmação do proprietário e o teste da instalação sustentam
  **127 V** para o equipamento final; não extrapolar exemplos para a instalação.
- “Três conjuntos” e “seis tomadas” não foram reinterpretados como divergência
  resolvida: a planilha registra três tomadas duplas, preservadas na tabela.
- Uso de disjuntores CA em circuitos CC, limites do controlador, transferência
  manual e alternador são relatos históricos, não recomendações validadas.
  Não reproduzir instruções de montagem, bitolas ou limites como projeto certificado.

### Custos associados ao piloto

- O proprietário autorizou materiais, equipamentos e serviços diretamente
  relacionados; compras compartilhadas podem reaparecer em etapas diferentes.
  Solicitou **não apresentar total** e manter o download da planilha integral.
- Foram associados 37 lançamentos da categoria Elétrica e a linha **356**,
  de **R$24,93**, cuja ligação ao aterramento da casa foi confirmada na entrevista.
  Cada uma das 38 compras foi conferida em quantidade, unidade, unitário,
  frete e total contra a extração da aba `Sheet1`.
- Linhas 232 e 289 são lotes; 310 e 311 registram uma unidade de compra de
  3 m e 6 m, respectivamente. Não multiplicar novamente pelo comprimento ou
  número de peças descrito. Campo vazio de frete não foi promovido a frete grátis.
- A grafia “Iversor” foi corrigida apenas no rótulo editorial; a planilha não mudou.
- Compras genéricas de PU, pintura, soldagem e ferramentas fora de Elétrica
  não permitem identificar inequivocamente o uso no rack. Não foram atribuídas
  sem confirmação: linhas 85, 98, 109, 119, 120, 142, 145, 159, 183, 198, 201,
  217, 279, 288 e 381. A furadeira portátil comprada não foi confundida com a
  furadeira de bancada emprestada. A revisão autoelétrica da linha 23 não foi
  convertida em custo do sistema solar.
- Esses 38 itens são despesas identificadas para a etapa, não uma afirmação
  de custo completo. Permanecem inalterados os três subtotais da visão geral
  e os bytes da planilha original.

## Planilha completa na visão geral

- A pedido do proprietário, foram importados os 380 lançamentos de `Sheet1`,
  linhas 4–383, para `cost_items`, na ordem original. As 38 associações do piloto
  foram preservadas; os demais itens não receberam atribuição de etapa por inferência.
- Conferidos quantidade, unidade, unitário, frete e valor final contra as células
  originais. A soma permanece 6.456.462 centavos. A proveniência do aterramento
  acompanha a linha 356, agora em `cost_items[352]`.
- A linha 179 não tem unidade, e a linha 321 não tem preço unitário, mas registra
  total zero. Essas ausências não foram convertidas em unidades ou preços inventados.
- As linhas 73, 82 e 141 contêm valores negativos na coluna Frete: -261, -15 e
  -340 reais; os totais respectivos são -201, 70 e -328 reais. Foram mantidos como
  lançamentos originais, com o rótulo Frete, sem afirmar desconto, reembolso ou
  estorno. O esclarecimento da natureza desses registros foi solicitado, mas
  não houve resposta antes do pedido seguinte de navegação.
- Somente itens, características/marca, categoria, quantidade e valores alimentam
  a apresentação. Não foram copiados fornecedores, endereços ou datas para a tabela.
- A tabela inicial contém dez itens; os demais são buscados em JSON no primeiro
  clique de “Ver mais” e inseridos em lotes de dez, mantendo o quadro de rolagem.
  O gráfico, os três subtotais e o XLSX original permanecem intactos.

## Aprovação de publicação do piloto

Em 15/11/2026, após validar a estrutura e os ajustes de navegação e custos,
o proprietário autorizou expressamente a publicação do piloto elétrico, além
do commit e push de todas as alterações. A página `solar-power` passou para
`published`. As outras 12 páginas serão desenvolvidas na próxima etapa;
essa aprovação não equivale a uma certificação técnica da instalação.
