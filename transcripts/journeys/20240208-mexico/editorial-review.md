# Revisão editorial — México

## Fontes e publicação

- Leitura das oito transcrições SRT relacionadas em [source-inventory.md](source-inventory.md), mais a descrição do vídeo de Suytun e a descrição do resumo.
- Os originais importados e as cópias locais das transcrições foram preservados sem alterações.
- Conteúdo editorial aprovado pelo proprietário em 15/11/2026 e marcado como `published`. Publicação via commit e push autorizada pelo proprietário na mesma data.
- Não foram criadas páginas individuais de experiências: a página principal reúne o relato, a galeria e a série em vídeo, seguindo as viagens atuais.

## Confirmações do proprietário — 15/11/2026

- Datas exatas: 09/02 a 23/02/2024. A transcrição de Holbox confirma fevereiro de 2024, mas não informa o intervalo exato.
- Ponto representativo no mapa: Cancún.
- Coordenadas aproximadas da cidade: 21.17429, -86.84656, conferidas em https://www.geonames.org/3531673/cancun.html. Não representam hotel ou localização pessoal.
- O ID técnico `20240208-mexico` foi mantido conforme o trabalho anterior. As mídias inicialmente separadas entre `20240208 Mexico` e `20240208-mexico` foram consolidadas na segunda pasta após solicitação do proprietário. Os nomes não são usados como fonte de datas.
- `duration_days: 15` conta as datas de início e fim inclusive. A duração de 14 dias do aluguel de carro vem da transcrição e não foi usada para substituir o período confirmado.

## Avaliação pessoal — entrevista de 15/11/2026

- Notas individuais informadas pelo proprietário, nesta ordem: Natureza 10, Experiências 8, Gastronomia 6, Preços 6, Infraestrutura 8, Acessibilidade 9, Cultura 10 e Segurança 7.
- Nota geral informada por último: 8. Não foi calculada como média dos critérios.
- Todas as notas usam a escala de 1 a 10 e refletem a experiência pessoal desta viagem. Registradas em `trip_card` nos metadados.

## Normalizações e limites do relato

- Nomes transcritos como “canc”, “vadoli”, “hosch”, “yucat”, “chenit” e “mahar Rual” foram normalizados no texto editorial para Cancún, Valladolid, Holbox, Yucatán, Chichén Itzá e Mahahual, com apoio dos títulos e descrições. Os SRT originais não foram corrigidos.
- O nome do primeiro cenote aparece como “chacai”/“chakai”, sem confirmação suficiente. Não foi atribuído um nome específico no relato.
- `KRn4-1fU55c`: não há SRT importado. A visita a Suytun é mencionada no resumo e na descrição; não foram inventados horários, regras, valores ou detalhes de narração.
- `39i3MZ2TVV0`: explicações sobre sacrifícios, regras do jogo de bola, origem de México, comparações entre civilizações e acústica não foram usadas como fatos históricos sem verificação externa. O relato se limita à visita às construções.
- `Px5T_YZcCfs`: explicações sobre a cor das salinas e o uso histórico da argila não foram publicadas sem conferência. O título original do vídeo foi preservado nos metadados.
- `nqnYWXGGn40`: passeios ao Canal dos Piratas e aos cenotes de Bacalar são possibilidades citadas, não visitas realizadas. A saída de caiaque ao nascer do sol foi cancelada por chuva.
- `iSvqT_cUo9Q`: duas tartarugas foram observadas, mas as idades estimadas pelo guia não foram tratadas como fatos. Encontros com animais não são garantidos.
- `BUEgFH8FTIk`: o ingresso às ruínas de Tulum é mencionado como opção, não como visita realizada. Opiniões negativas e dificuldades de acesso foram contextualizadas como a experiência daquela viagem.
- `ndNDSjJ8eiA`: não foi apresentada como certeza a origem da água de Punta Esmeralda nem se generalizou a gratuidade dos serviços. A cozinha da hospedagem e os passeios à praia e à Quinta Avenida estão narrados.

## Custos

- O resumo relata 9.800 MXN por 14 dias de aluguel com taxas e seguro e cerca de 1.300 km percorridos; esses dados foram registrados sem conversão cambial.
- Trechos de preços do passeio em Río Lagartos, hospedagem em Mahahual e apartamento em Playa del Carmen estão truncados ou incompletos no resumo.
- Não foi criada tabela de gastos nem orçamento total: escopo do total, inclusão de passagens e reconciliação de parcelas exigem confirmação.
- A opinião sobre custo e acesso às praias não foi transformada em informação tarifária atual.

## Fotografias

- As 22 fotos foram conferidas visualmente. Textos alternativos descrevem o que aparece nas imagens; não atribuem locais ou espécies incertas.
- Capa da coleção: `Mexico-56.jpg`. Destaque alterado de `Mexico-26.jpg` para `Mexico2-4.jpg` por solicitação do proprietário em 15/11/2026.
- As cópias otimizadas existentes têm lado máximo de 2.400 px; as miniaturas têm lado máximo de 480 px. Nenhum derivado apresentou EXIF, XMP ou IPTC.
- Originais mantidos em `media/journeys/20240208-mexico/photos/`; somente `optimized/` e as miniaturas dos vídeos em `thumbnails/` são sincronizados para `public/`.
- Os hashes dos 22 originais coincidem com as fotos recebidas no commit `5722d1b`.
- Na consolidação das pastas, os 75 arquivos de origem foram conferidos por SHA256; os 22 originais também foram comparados às entradas do commit e os 44 derivados às cópias públicas anteriores. A pasta pública consolidada contém somente 53 derivados, todos idênticos às respectivas fontes.

## Validação técnica

- Os 37 testes direcionados da validação final passaram e o build validou 67 arquivos YAML, gerando 24 páginas.
- Relato, galeria mexicana, galeria geral e marcador de Cancún conferidos na prévia local.
- Espaços nos caminhos das fotos são codificados nas URLs da galeria; capas e miniaturas responderam com HTTP 200, sem avisos de `srcset` nas galerias mexicana e geral.
