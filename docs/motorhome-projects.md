# Projetos de motorhome

O contrato independente [motorhome-project.schema.json](../schemas/motorhome-project.schema.json)
documenta construções, conversões e melhorias, sem tratar o projeto como viagem.
É um rascunho 0.6. Os arquivos ficam em
`metadata/motorhome-projects/<project_id>.yaml`, com identificadores em inglês e
valores em português brasileiro. Apenas `project_id` é obrigatório.

O [registro inicial da Iveco Daily](../metadata/motorhome-projects/iveco-daily-3510.yaml)
consolida títulos e descrições dos 45 vídeos, 35 transcrições únicas para as seis
páginas temáticas e as
confirmações iniciais do proprietário. A sequência foi conferida na playlist
pública em 15/11/2026. A [revisão e as lacunas](../transcripts/motorhome-projects/iveco-daily-3510/editorial-review.md)
ficam separadas do conteúdo editorial. Após validar o rascunho, o proprietário
aprovou a página principal para publicação em 15/11/2026.

## Página, navegação e mapa

O conteúdo editorial fica em
`content/motorhome-projects/iveco-daily-3510/overview.mdx`, com `status: published`.
As coleções `motorhomeProjectPages` e `motorhomeProjectMetadata` mantêm MDX e
YAML separados. A rota `src/pages/pt/motorhomes/[projectId].astro` carrega os
títulos dos vídeos diretamente dos arquivos originais `.info.json`, na ordem
de `playlist_order`, sem duplicar registros ou incorporar players.

Com `pnpm dev`, acesse `/pt/motorhomes/iveco-daily-3510/`. Rascunhos só são
gerados em desenvolvimento, com aviso de prévia e `noindex, nofollow`; em
produção a rota aceita apenas páginas com `status: published`.

O item **Motorhome**, após **Viagens**, contém **Iveco Daily 35.10** e
**Planejador Elétrico**. O primeiro abre um submenu com **Construção Iveco Daily**,
as etapas disponíveis e **Custos do Projeto** sempre na última posição;
o segundo leva diretamente à ferramenta solar. Essa hierarquia é a mesma
no desktop e no mobile, sem alterar os endereços das páginas.
O último link abre a visão geral na âncora `#construction-costs`, incluindo
“Nossas contas” e “Planilha de custos completa”, mesmo quando usado de outra página.
Desktop e mobile usam o mesmo filtro de publicação das etapas. O mapa também inclui o projeto,
em São José dos Campos, São Paulo. O campo opcional `representative_point`
armazena nome e coordenadas no YAML, sem acoplar o dado ao Astro.
O ponto representa a cidade, não o endereço da garagem. A fonte das coordenadas
fica na proveniência e no registro de revisão.

`buildMotorhomeMapEntries` inclui somente projetos com ponto e página publicada,
sem criar viagens ou alterar seus contratos. O identificador interno do mapa
recebe o prefixo `motorhome-` para evitar colisões com IDs de viagens. O card
reutiliza a apresentação existente, com o link **Conhecer o motorhome**; os cards
de viagem mantêm **Explorar viagem**.

A página inclui contexto editorial, carrossel dos 45 vídeos, sistemas expansíveis,
tabela dos 380 lançamentos, gráfico de pizza dos custos e download da planilha.
A tabela usa `CostTable` dentro de `CostTableFrame`, também reutilizado nas etapas.
O HTML inicial contém dez itens. O botão **Ver mais** busca `costs.json` apenas
no primeiro clique, mantém os dados em memória e acrescenta dez linhas por clique,
sem aumentar a altura do quadro. Falhas deixam os itens já carregados disponíveis,
mostram mensagem e permitem tentar novamente. Sem JavaScript, o download integral
continua disponível. O JSON é gerado estaticamente a partir do mesmo YAML e segue
o filtro de publicação da página principal e `BASE_URL`.
O gráfico usa CSS, sem
dependências ou JavaScript, com os três subtotais de `main_costs`, proporções
calculadas em centavos, legenda textual com valores/percentuais e total histórico.
Preserva o contexto de 2018/2019 e não apresenta o total como custo apenas da conversão.
As tabelas das etapas continuam usando `CostTable`. O carrossel mantém uma única linha
de miniaturas 16:9 na ordem original, com rolagem horizontal nativa, setas no
desktop e navegação por teclado. As imagens de 320 × 180 pixels são carregadas
sob demanda do YouTube, sem players nem reprodução automática. Os títulos ficam
nos nomes acessíveis e nas dicas ao passar o mouse, sem legendas visíveis.
O componente compartilhado `VideoCarousel.astro` atende a visão geral e as etapas.
As setas respeitam a preferência por movimento reduzido e ficam desativadas
nos limites; sem JavaScript, a rolagem nativa continua disponível. Os links dos
sistemas continuam apontando para a miniatura correspondente.
Notas e proveniência permanecem fora da apresentação. A aprovação libera a
página no build; o site remoto só muda após commit, push e deploy.

### Páginas temáticas e agrupamento de sistemas

A coleção separada `motorhomeSystemPages` carrega
`content/motorhome-systems/<project_id>/<page_id>.mdx`. Não colocar esses arquivos
na coleção da visão geral: ela gera uma rota por projeto e alimenta o mapa.
O frontmatter contém `project_id` como referência, `page_id` para a URL estável,
`system_ids` com uma ou mais etapas distintas, `title`, `language`, `status`
e `sort_order` para a ordem do submenu. Os sistemas continuam no YAML, separados
do texto editorial; o frontmatter apenas seleciona quais entram em cada página.

Ao final da visão geral e das páginas temáticas, `MotorhomeStepNavigation` exibe
**Etapa anterior** e **Próxima etapa**. A sequência começa na visão geral e segue
`sort_order`, como o submenu, limitada ao mesmo projeto e às páginas disponíveis
no ambiente atual. A visão geral leva à primeira etapa; esta permite voltar à
visão geral. O primeiro e o último item omitem o destino inexistente.
Os links funcionam sem JavaScript e não incluem a âncora de custos.

A rota `/pt/motorhomes/<project_id>/<page_id>/` verifica a existência das etapas
e de todos os seus vídeos na playlist. Exibe primeiro o resumo editorial, depois
atributos do YAML, custos e miniaturas na ordem original da playlist.
O frontmatter opcional `featured_video_id` destaca um vídeo das etapas da página
na primeira posição, sem repeti-lo nem alterar a ordem relativa dos demais ou a
playlist original. Em Água e Banheiro, `BC2eZ3QBvTU` é o vídeo principal.
Ele e `-_VZvjJXmwc` usam a mesma miniatura, mas são vídeos diferentes:
montagem completa e tour posterior da instalação, respectivamente.
`buildMotorhomeSystemPage` une atributos textuais idênticos e referências de vídeo,
sem repetir itens. `buildSystemCostRows` seleciona cada compra uma vez se qualquer
etapa da página constar em `system_ids`; compras distintas com descrições iguais
continuam separadas. Não somar subtotais por etapa nem inferir associações ausentes.
As tabelas das etapas são ordenadas por `amount` decrescente. Compras com
`allocation_uncertain: true` ficam no final, também por valor, com o detalhe
“Uso não individualizado na planilha”. Isso não altera a ordem original dos
380 lançamentos na planilha completa nem seus valores.
Os links dos sistemas na visão geral apontam à página que os reúne.
Nas etapas, a tabela fica em um quadro com altura calculada para dez itens,
ajustada às quebras de linha de cada tela. A rolagem vertical permite acessar
as demais compras, também pelo teclado; o download permanece fora do quadro.
Descrições longas podem quebrar palavras dentro do quadro para não criar
rolagem horizontal nem reduzir a área das dez linhas em telas estreitas.
O piloto `/pt/motorhomes/iveco-daily-3510/solar-power/` foi aprovado para publicação
em 15/11/2026 e está em `published`, incluindo submenus e link na visão geral.
A aprovação da página principal não publica automaticamente outras etapas.
A URL e o conteúdo do piloto elétrico foram preservados.

Em 17/11/2026, foi aprovado reunir as 13 etapas originais em seis páginas:

| Página | `page_id` | Etapas em `system_ids` |
| --- | --- | --- |
| Planejamento e Projeto | `planning` | `planning` |
| Estrutura e Conforto Térmico | `structure-thermal-comfort` | `thermal-insulation`, `flooring`, `windows`, `climate-control` |
| Sistema Elétrico Fotovoltaico | `solar-power` | `solar-power` |
| Água e Banheiro | `water-bathroom` | `plumbing`, `bathroom` |
| Móveis e Conforto Interno | `furniture-interior-comfort` | `furniture-interiors`, `bed`, `cabin` |
| Cozinha e Gás | `kitchen-gas` | `kitchen`, `gas` |

Os rótulos dos menus usam maiúscula inicial nas palavras principais, mantendo
artigos, preposições e conjunções em minúsculas.

Em 17/11/2026, o proprietário revisou e aprovou as cinco páginas restantes,
autorizando a mudança para `published`, o commit e o push. Os seis temas agora
entram no build de produção, nos submenus e nos links da visão geral.

`planning` tem seis vídeos. Por decisão do
proprietário, não tem tabela própria: inclui um link à seção de custos completos,
sem apresentar aquisição/documentação do veículo como despesas de planejamento.
As outras quatro páginas publicadas reúnem:

| Página | Vídeos únicos | Compras | Compras com uso não individualizado |
| --- | ---: | ---: | ---: |
| Estrutura e Conforto Térmico | 8 | 36 | 15 |
| Água e Banheiro | 10 | 74 | 9 |
| Móveis e Conforto Interno | 7 | 43 | 10 |
| Cozinha e Gás | 5 | 38 | 6 |

As contagens não devem ser somadas como totais do projeto: vídeos e compras
podem aparecer em mais de uma página. As páginas compartilham a rota, o carrossel
e a tabela do piloto; os 13 sistemas originais permanecem no YAML. As correções,
os limites das transcrições e os critérios de associação dos custos ficam no
registro editorial, não no corpo MDX. Novos rascunhos continuam exigindo aprovação
antes da publicação.

## Campos e tipos

| Campo | Tipo e estrutura |
| --- | --- |
| `project_id` | Identificador estável em kebab-case; coincide com o nome do arquivo. |
| `title` | Texto com o nome do projeto. |
| `summary` | Resumo introdutório curto, separado do futuro corpo MDX. |
| `vehicle_model` | Texto com fabricante/modelo do veículo-base. |
| `chassis` | Texto com configuração, versão ou características relevantes. |
| `build_location` | Texto com o local comprovado da construção ou intervenção. |
| `map_image` | Imagem aprovada para o card do mapa, com `src` em `media/` e `alt`. Sua publicação é independente de `photo_gallery.status`. |
| `representative_point` | Objeto opcional com `name` e `coordinates`, contendo `lat` entre -90 e 90 e `lng` entre -180 e 180. Ponto público representativo, não endereço particular. |
| `build_period` | Objeto com `start` e/ou `end`: strings `AAAA`, `AAAA-MM` ou `AAAA-MM-DD`. |
| `main_costs` | Lista de objetos com `description`, `amount` numérico não negativo, `currency` ISO de três letras e `unit` descrevendo a base do valor; opcionais `approximate`, `system_id` e `video_ids`. |
| `cost_items` | Lançamentos por linha da planilha: `source_row` único, `description`, `quantity` positiva, `amount` e `currency`; opcionais `category`, `detail`, `unit`, `unit_price`, `shipping`, `system_ids` e `allocation_uncertain`. Preserva valores negativos do original; quando há unitário, o total confere com quantidade × unitário + frete discriminado. |
| `photos` | Lista com `photo_id`, `src`, `alt`; opcionais `thumbnail`, `caption`, `stage`, `detail`, `system_id`. Caminhos relativos ao repositório, para imagens otimizadas em `media/`. |
| `photo_gallery` | Objeto opcional com `status` (`draft` ou `published`) e `pages`: seleções ordenadas de `photo_id` por `page_id`; `overview` identifica a página principal. Uma foto pode aparecer em várias seleções sem duplicar o arquivo. Referências ausentes ou repetidas na mesma seleção são rejeitadas. |
| `videos` | Lista de referências com `video_id` original e `youtube_url` canônica, nos formatos já usados pelo contrato de vídeos. |
| `playlist_id` | Identificador original da playlist do YouTube. |
| `playlist_order` | Lista de IDs presentes em `videos`, sem repetição, na ordem da playlist; o primeiro ID ocupa a posição 1. |
| `systems` | Lista com `system_id`, `title`; opcionais `summary`, `video_ids` e listas textuais `materials`, `equipment`, `tools`, `technologies`, `processes`, `precautions`. |
| `decisions` | Lista com `solution`; opcionais `reason`, `system_id`, `video_ids`. Omitir a justificativa quando não informada. |
| `tips` | Lista com `description`; opcionais `system_id`, `video_ids`. Somente recomendações efetivamente compartilhadas. |
| `duration` | Lista com `description` contextual, `value` numérico positivo, `unit` (`minutes`, `hours`, `days`, `weeks`, `months`, `years`); opcionais `approximate`, `system_id`, `video_ids`. Não confundir duração da instalação com duração do vídeo. |
| `before_after` | Lista com `title`, `before`, `after`; cada estado contém `description` e/ou `photo_ids`. Opcionais `system_id`, `video_ids`. As fotos são referenciadas, não duplicadas. |
| `notes` | Texto usado com moderação para observações que não cabem nos demais campos. |
| `downloads` | Lista opcional com `title` e `path` de planilhas `.xlsx` autorizadas; caminho relativo a `public/`, em `downloads/motorhome-projects/<project_id>/`. Não cria link público em página automaticamente. |
| `provenance` | Lista com `source_type`, `verification_status`, `source_id`, `fields`, seguindo o vocabulário de proveniência existente. |

`system_id` liga custos, fotografias, decisões, dicas, durações e comparações a um
item de `systems`. `video_ids` liga cada assunto às referências únicas em `videos`.
Um vídeo pode participar de vários sistemas sem duplicar seu registro. Os
processos de um sistema seguem a lógica do tema; não alteram a playlist.

### Fotografias da construção

O lote recebido em `imports/photos/construction-motorhome-iveco/batch-20261117/`
foi analisado e teve sua distribuição e padrão de qualidade aprovados pelo
proprietário antes do processamento integral. Dos 66 arquivos, 47 fotos foram
selecionadas; cinco versões visualmente repetidas, dois gráficos e 12 fotos de
reserva ficaram fora da integração. Nenhum original foi renomeado ou excluído.
O inventário, as folhas de contato e a correspondência entre arquivos recebidos
e IDs foram mantidos no material de revisão da sessão. Cada foto também registra
em `detail` o caminho recebido e o SHA-256 original; esse registro técnico não
é exibido na galeria.

Os derivados ficam em `media/journeys/2018-construction-motorhome-iveco/`,
com `optimized/` (até 2400 px no lado maior) e `thumbnails/` (até 480 px).
São WebP com qualidade 85, orientação corrigida, proporções preservadas e sem
ampliação. Os derivados não contêm EXIF, XMP ou IPTC; o perfil de cor é preservado
quando disponível. Os nomes `construction-NNN.webp` correspondem à numeração
do inventário, não a uma data ou sequência cronológica comprovada.

`MotorhomePhotoGallery` reutiliza `PhotoGallery` e respeita a ordem das seleções.
As fotos não recebem local/mês inferidos da construção e ficam restritas às
páginas da construção e ao card do mapa. Por decisão do proprietário, não devem
integrar a galeria geral de viagens nem ganhar uma coleção fotográfica própria.
Os textos alternativos descrevem apenas o que é
visível; não identificam especificações ocultas dos equipamentos.

As seleções foram aprovadas para publicação nas sete páginas da construção,
com `photo_gallery.status: published`. O build inclui os 94 derivados das 47 fotos
selecionadas. A foto 055 também ilustra o card do mapa por meio de `map_image`.
Isso não cria coleção nem acrescenta fotos à galeria geral.

Para futuras revisões, `photo_gallery.status: draft` limita as seleções à prévia
de desenvolvimento. `pnpm dev` sincroniza esses derivados para revisão local;
`pnpm build` remove as cópias públicas de rascunho, exceto a imagem aprovada em
`map_image`. A publicação das páginas existentes permanece independente.

Cada `cost_items` representa uma compra, não um subtotal adicional de `main_costs`.
`system_ids` permite reutilizar a compra em várias etapas sem duplicar o registro.
Omitir `system_ids` quando não houver evidência de aplicação. Na entrevista de
17/11/2026, o proprietário autorizou uma exceção para compras classificáveis
pelo contexto da categoria, mas sem aplicação individualizada: registrar
`allocation_uncertain: true`, sempre junto de `system_ids`, e colocá-las no
final da tabela com indicação explícita. A autorização é editorial, não
confirmação de instalação. O detalhe de uso prevalece sobre a categoria.
Ferramentas e conjuntos de uso geral sem aplicação documentada permanecem
somente na planilha completa.
`source_row` aponta para a linha da aba/planilha indicada na proveniência.
Nas tabelas das etapas, quantidade, unitário e frete vão em `detail`, mantendo as
duas colunas de `CostTable`. Frete ausente não significa frete gratuito.
Unidade e preço unitário ausentes também não são preenchidos automaticamente.
Valores negativos da coluna Frete são preservados sob o rótulo original, sem
interpretá-los como descontos ou estornos não confirmados.
Lotes lançados como uma unidade preservam essa quantidade, mesmo quando o
detalhe informa vários metros ou peças. Por decisão do proprietário, não há
total nessas tabelas, e há link para a planilha integral.

Projetos futuros podem registrar apenas melhorias: não é obrigatório ter período
completo, custos, comparação ou todos os sistemas. Uma intervenção pode ser
contextualizada em `systems[].processes`, `photos[].stage` e nas descrições dos
custos e durações, sem criar agora outra hierarquia de entidades.

### Exemplo de estrutura preenchida — dados inteiramente fictícios

Este bloco serve apenas para demonstrar tipos e relações. **Não descreve a Iveco
nem recomenda materiais, procedimentos ou custos.** IDs, caminhos e valores são
demonstrativos; não devem ser copiados como fatos.

```yaml
project_id: demonstration-project
title: Projeto demonstrativo
summary: Exemplo estrutural sem correspondência com uma construção real.
vehicle_model: Veículo demonstrativo
chassis: Configuração demonstrativa
build_location: Local demonstrativo
build_period:
  start: "2000"
  end: "2001-02"
main_costs:
  - description: Item fictício
    amount: 100
    currency: BRL
    unit: total de uma unidade, sem frete
    approximate: true
    system_id: example-system
    video_ids: [AAAAAAAAAAA]
photos:
  - photo_id: example-before
    src: media/motorhome-projects/demonstration-project/before.webp
    alt: Imagem demonstrativa anterior
    stage: Antes da intervenção fictícia
    detail: Detalhe demonstrativo
    system_id: example-system
videos:
  - video_id: AAAAAAAAAAA
    youtube_url: https://www.youtube.com/watch?v=AAAAAAAAAAA
playlist_id: PL_DEMONSTRATION
playlist_order: [AAAAAAAAAAA]
systems:
  - system_id: example-system
    title: Sistema demonstrativo
    summary: Descrição fictícia do sistema.
    video_ids: [AAAAAAAAAAA]
    materials: [Material demonstrativo]
    equipment: [Equipamento demonstrativo]
    tools: [Ferramenta demonstrativa]
    technologies: [Tecnologia demonstrativa]
    processes: [Etapa demonstrativa]
    precautions: [Limitação demonstrativa]
decisions:
  - solution: Solução fictícia
    reason: Justificativa fictícia
    system_id: example-system
    video_ids: [AAAAAAAAAAA]
tips:
  - description: Recomendação fictícia, não aplicável a uma instalação real.
    system_id: example-system
    video_ids: [AAAAAAAAAAA]
duration:
  - description: Duração fictícia da intervenção
    value: 2
    unit: hours
    approximate: true
    system_id: example-system
    video_ids: [AAAAAAAAAAA]
before_after:
  - title: Comparação fictícia
    before:
      photo_ids: [example-before]
    after:
      description: Estado posterior demonstrativo, sem imagem.
    system_id: example-system
    video_ids: [AAAAAAAAAAA]
notes: Dados demonstrativos; não utilizar como informações da construção.
provenance:
  - source_type: manual
    verification_status: unverified
    source_id: demonstration-only
    fields: [main_costs, systems, decisions, tips, duration, before_after]
```

## Planilha para download

O proprietário autorizou uma cópia integral de sua planilha original em
`public/downloads/motorhome-projects/iveco-daily-3510/custos-motorhome-odisseia-mundana.xlsx`.
O nome técnico foi simplificado, mas os bytes do arquivo foram preservados.
O arquivo recebido fora do repositório não foi alterado.

O campo `downloads` registra o rótulo e o caminho do arquivo sem acoplar os
metadados ao Astro. A prévia usa um link HTML com
o atributo `download` e prefixa `path` com `import.meta.env.BASE_URL`, seguindo o
padrão de URLs do site. Texto aprovado: **Baixar planilha original de custos (.xlsx)**.

A planilha contém preços históricos e inclui compra/despesas do veículo,
manutenção e outras categorias. Não apresentar seu total como custo isolado da
conversão, nem como orçamento atual. Há datas inconsistentes e despesas posteriores
ao período da construção, documentadas na revisão. O download preserva esses
registros originais, sem correções silenciosas.

## Fontes, ausências e ordem

- Omitir informações desconhecidas, sem `null`, strings vazias ou datas fabricadas.
  Uma lista vazia não comprova que não houve itens; preferir omitir o campo.
- Não usar datas de publicação dos vídeos como período da obra.
- Registrar custos somente com moeda, contexto, unidade e fonte. Não converter
  moedas, calcular totais ou extrapolar valores sem informação suficiente.
- `source_type`: `manual`, `transcript`, `youtube_metadata`, `external_source` ou
  `ai_inference`. `verification_status`: `unverified`, `reviewed` ou `confirmed`.
  Uma inferência não é fato confirmado por ter passado na validação técnica.
- `source_id` identifica a confirmação do proprietário ou o arquivo/vídeo de
  origem; para transcrições, incluir o intervalo de tempo. `fields` identifica os
  campos abrangidos, por exemplo `systems[0].equipment`.
- Uma informação não encontrada permanece ausente; registrar a lacuna no registro
  de revisão. Preservar transcrições e metadados importados exatamente como recebidos.
  As legendas brutas do piloto têm normalização de linhas desativada em
  `.gitattributes`, preservando seus hashes também em outros sistemas operacionais.
- `videos` não armazena cópias de títulos ou descrições. O contrato atual de vídeos,
  que exige `journey_id`, permanece intacto. A integração compartilhada será decidida
  depois, sem inventar uma viagem ou duplicar o registro original.
- `playlist_order` deve reproduzir a playlist completa na data da conferência.
  Enquanto a sequência não for verificada, omitir o campo. Vídeos complementares
  podem existir em `videos` fora dessa sequência. Não ordenar por título, data de
  publicação ou sistema; registrar a fonte e a data da conferência em `provenance`.

## Validação

```powershell
pnpm validate:metadata
node --test tests\metadata-validation.test.mjs tests\motorhome-project-validation.test.mjs
node --test tests\motorhome-playlist.test.mjs tests\motorhome-costs.test.mjs tests\motorhome-system-pages.test.mjs
node --test tests\motorhome-map-data.test.mjs tests\journey-map-data.test.mjs
```

O mecanismo existente interpreta YAML com `yaml` e usa Ajv / JSON Schema Draft
2020-12, sem dependências novas nem regras de viagens aplicadas aos projetos.
Também verifica IDs duplicados, referências internas de sistemas, vídeos e fotos,
correspondência entre ID e URL do vídeo e datas completas existentes no calendário.
Uma ordem não vazia exige `playlist_id`. A validação não consulta o YouTube, não
atesta fatos, não verifica arquivos de mídia e não confirma a ordem atual remota.

O build já executa `validate:metadata`; cadastrar somente um YAML não cria uma
página. O marcador exige também MDX publicado e ponto representativo. A validação das referências de vídeos é interna
ao projeto nesta etapa, não uma exigência de registro em `metadata/videos/`.

## Etapas posteriores — dependem de confirmação

1. Revalidar a ordem da playlist quando a série for atualizada; a sequência de 45
   vídeos foi conferida em 15/11/2026, mas pode mudar.
2. Completar a entrevista sobre equipamentos e interpretação das fontes.
   O período, local e configuração foram confirmados; a planilha original
   foi fornecida e seus totais foram conferidos. Consultar o registro de revisão.
3. Definir eventual integração compartilhada dos registros de vídeos; a prévia
   já carrega os títulos originais no Astro, sem modificar o contrato de viagens.

Análise audiovisual completa da série e sincronização de mídias permanecem fora
do escopo. A aprovação da página não autoriza commit ou push.
