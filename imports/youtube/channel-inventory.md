# Inventário da importação do YouTube

## Resumo

- Data da importação: 2026-11-14.
- Canal: Odisseia Mundana - https://www.youtube.com/@OdisseiaMundana.
- ZIP de origem: odisseiamundana_yt_channel_metadata_complete.zip (52.178.267 bytes).
- Destino: imports/youtube/channel/.
- Arquivos importados: 1.037; tamanho total descompactado: 263.716.763 bytes (251,5 MiB).
- SHA-256 comparados entre origem ZIP e destino: 1.037; sem verificação: 0; divergências: 0.
- O ZIP continha uma entrada de diretório raiz, além de 1.037 arquivos; a entrada não foi copiada.
- Diferença para o inventário prévio: playlists_mapa.csv não foi encontrado no ZIP e não foi importado; foram importados somente os dois CSVs selecionados. O inventário prévio indicava 3 CSVs e 1.038 arquivos; o ZIP recebido contém 2 CSVs e 1.037 arquivos.
- Nomes indicativos de credenciais, cookies, OAuth, tokens ou chaves privadas: nenhum identificado; nenhum arquivo excluído por segredo.

### Quantidade e tamanho por extensão

| Extensão | Arquivos | Bytes |
|---|---:|---:|
| .csv | 2 | 111528 |
| .description | 322 | 914485 |
| .jpg | 1 | 178767 |
| .json | 322 | 219048731 |
| .srt | 69 | 1245504 |
| .webp | 321 | 42217748 |

## Arquivos de nível do canal

- .info.json: NA - Odisseia Mundana - Videos [UCkVDDa1rkGv_B-vRyFCi54g].info.json.
- .description: NA - Odisseia Mundana - Videos [UCkVDDa1rkGv_B-vRyFCi54g].description.
- .jpg: imagem do canal associada ao ID UCkVDDa1rkGv_B-vRyFCi54g.
- Esses 3 arquivos são recursos do canal e não foram contados como vídeos.

## Inventário de vídeos

Foram identificados 321 IDs de vídeo únicos nos arquivos info JSON. O inventário por vídeo, com título, upload_date, URL, arquivos associados, idioma indicado no nome do SRT e quantidade de comentários embutidos quando disponível, está em [channel-video-inventory.csv](channel-video-inventory.csv). Os JSON originais não foram alterados. O campo comments estava presente em 320 JSONs, com 7.208 entradas embutidas ao todo.

## CSVs originais

- lista_canal.csv: 321 registros; sem cabeçalho (confirmado pela primeira linha ser um registro). Campos por posição: data, título, views, likes, duração e URL. Separador: ponto e vírgula. Valores NA preservados. Bytes originais preservados.
- playlists_videos_mapa.csv: cabeçalho observado Playlist_Nome;Playlist_ID;Posicao_na_Playlist;Video_ID;Video_Titulo; 471 registros. Relação observada: nome/ID da playlist, posição, ID e título do vídeo. Bytes originais preservados.

## Cobertura e inconsistências

- Vídeos únicos nos info JSON: 321.
- Vídeos únicos em lista_canal.csv: 321.
- IDs do lista_canal.csv sem info JSON: 0.
- IDs com info JSON ausentes do lista_canal.csv: 0.
- IDs repetidos nos arquivos info JSON: 0. IDs inválidos/ausentes nos info JSON de vídeo: 0.
- Vídeos sem descrição: 0; sem miniatura: 0; sem arquivo SRT nesta extração: 252 de 321. A ausência de SRT não indica ausência de legenda no YouTube.
- Arquivos SRT preservados: 69. Cobertura: 69 vídeos com ao menos um SRT.
- Arquivos sem video_id identificável: 0 arquivos info JSON de vídeo; 2 CSVs sem ID de vídeo/canal no nome.
- playlists_videos_mapa.csv: 29 playlists únicas e 471 relações playlist/vídeo; IDs de vídeo únicos na tabela: 323.
- IDs de vídeo da tabela de playlists sem info JSON: 7: aYa-PdYlqHo, Yn1gu-_aeZI, sU9uzhLZJkg, 2Yo8n8ZvRas, p888pe9oBJU, cweDmigM7iQ, N8CIymQZhV4.
- IDs com info JSON ausentes do mapa de playlists: 5: rDjielpgoNI, yQgeVZ5keJU, 7FwVRGwFeh4, DAcOw1QmI-E, 1HX9fJnEXNU.
- Divergências foram avaliadas pela presença de IDs; posições e títulos da tabela não foram comparados com metadados do canal.

## Integridade e exclusões

- SHA-256 calculado para cada arquivo descompactado na origem e destino; todos os 1.037 pares coincidem.
- playlists_mapa.csv não foi encontrado no ZIP. A não importação segue a decisão do proprietário e não é falha de integridade.
- Nenhum outro arquivo foi excluído. Não foram identificados nomes de arquivos indicativos de segredos.
- Impacto observado: 251,5 MiB descompactados; ZIP original de 49,8 MiB. O repositório tinha 65,59 MiB de objetos Git empacotados antes da importação.

channel-video-inventory.csv é um arquivo derivado para consulta; os CSVs recebidos permanecem inalterados.
