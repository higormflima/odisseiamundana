# Inventário de fontes — Lapônia, Finlândia

- Playlist: [Lapônia - Finlândia](https://www.youtube.com/playlist?list=PLA8vGdq_0fiP_0AZsVpPN7kTaztdiR70V)
- Canal: Odisseia Mundana
- Escopo da inspeção: títulos, IDs, ordem, duração exibida e disponibilidade de legendas/transcrições

## Vídeos da playlist

| Ordem | Título | ID | Duração exibida | Narração | Legendas e transcrição |
|---|---|---|---:|---|---|
| 1 | GUIA COMPLETO LAPÔNIA: Roteiro de 5 dias, Preços e Vila do Papai Noel ❄️ | `ZliBIZGRQBI` | 20 min 05 s | Esperada pelo proprietário | Fonte bruta automática existente; revisão pendente |
| 2 | 5 dias vivendo no Polo Norte | `ioZ2A5aPBIk` | 12 min 23 s | Ausente, confirmado pelo proprietário | Sem narração; não consultado pela API de legendas |
| 3 | Passeando em trenó de renas no Polo Norte | `Yis3MYpP0tg` | 7 min | Esperada pelo proprietário | API não retornou faixa; transcrição não obtida |
| 4 | Visitamos o Papai Noel no Polo Norte! (Santa Claus Village – Finlândia) | `Gw8IEGoNyLI` | 11 min 34 s | Ausente, confirmado pelo proprietário | Sem narração; excluído da consulta de legendas |
| 5 | Ranua Wildlife Park: o zoológico mais ao norte do mundo (Finlândia 2026) | `MoYc1xOJ0ww` | 11 min 20 s | Esperada pelo proprietário | Faixa em português baixada pela API; revisão textual por IA feita, áudio não conferido; ver `MoYc1xOJ0ww.pt.review.md` |
| 6 | Dog Sled na LAPÔNIA: A aventura mais mágica com huskies na Finlândia | `B6DJ_dQnZ8Q` | 11 min | Esperada pelo proprietário | Faixa em português baixada pela API; revisão textual por IA feita, áudio não conferido; ver `B6DJ_dQnZ8Q.pt.review.md` |

## Arquivos de transcrição

- `ZliBIZGRQBI.raw.txt`: transcrição automática em português existente, preservada sem alterações.
- `ZliBIZGRQBI.review.md`: revisão ainda pendente. A transcrição menciona fevereiro de 2026; essa é a fonte autoritativa para o mês da viagem.
- `MoYc1xOJ0ww.pt.raw.vtt` e `B6DJ_dQnZ8Q.pt.raw.vtt`: fontes VTT baixadas pela YouTube Data API. Permanecem sem revisão humana.
- Os arquivos `.source.json` correspondentes guardam os IDs e os detalhes da faixa de legenda usados na extração. Os arquivos `.review.md` registram candidatos de correção e incertezas sem alterar as fontes.
- Não foi criado arquivo de transcrição para os vídeos 2, 3 ou 4.

## Extração pela YouTube Data API

O protótipo OAuth consultou a YouTube Data API oficial para os seis vídeos. Os arquivos YAML guardam título, descrição publicada, URL canônica, posição na playlist, URL da miniatura, duração em segundos e data de publicação. A data de publicação do vídeo não é a data da viagem. Os links diretos de cada vídeo também ficam nesses YAMLs.

Na consulta de legendas, o vídeo 1 foi preservado porque já tinha uma fonte bruta; os vídeos 2 e 4 foram excluídos conforme a confirmação do proprietário de que não têm narração; o vídeo 3 não retornou faixa de legenda apesar de haver narração; os vídeos 5 e 6 forneceram uma faixa em português cada.

O escopo OAuth usado pela API (`youtube.force-ssl`) é amplo, mas o protótipo fez apenas listagem e download de legendas. Os tokens não são gravados no repositório nem em arquivos de saída.

## Miniaturas e metadados públicos

- A miniatura `maxresdefault` do vídeo 1 foi localizada anteriormente, mas não foi baixada nem adicionada ao repositório.
- URL de vídeo, miniatura, descrição, duração em segundos e data de publicação estão registrados nos arquivos `metadata/videos/finland-2026/<video-id>.yaml`.
- As durações da tabela correspondem aos valores `duration_seconds` retornados pela API e foram convertidas para leitura humana.
- Datas de publicação no YouTube não representam as datas da viagem. As datas da viagem devem vir das transcrições.
