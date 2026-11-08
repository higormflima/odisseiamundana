# Metadados de vídeos

O contrato `schemas/video.schema.json` define os dados de cada vídeo do YouTube associado a uma viagem. Ele é um rascunho 0.1 e é validado com JSON Schema Draft 2020-12 e Ajv, assim como os metadados de viagem.

Os registros ficam em `metadata/videos/<journey_id>/<video_id>.yaml`. O ID do arquivo é o ID do YouTube; `journey_id` liga o vídeo à viagem correspondente. A coleção Astro `videoMetadata` carrega esses arquivos para que as páginas MDX possam referenciá-los.

## Campos

- `video_id` e `journey_id` são os identificadores obrigatórios.
- `playlist_id` e `playlist_position` registram a origem e a ordem do vídeo na playlist.
- `title`, `description`, `thumbnail_url`, `duration_seconds` e `video_published_at` armazenam metadados públicos do vídeo. A data de publicação não é a data da viagem.
- `narration_status` distingue narração esperada, presente, ausente ou ainda desconhecida.
- `caption_status` registra se há legenda, se ela não foi encontrada, se não é esperada ou se ainda não foi verificada.
- `transcript_files` aponta para as fontes brutas existentes no repositório. As fontes permanecem imutáveis; revisão e correções ficam em arquivos separados.
- `provenance` registra a origem e o estado de verificação dos campos.

Campos opcionais desconhecidos são omitidos, sem preencher com `null`. Títulos, descrições e miniaturas descrevem o vídeo; não devem ser usados como fonte para as datas da viagem. Essas datas vêm das transcrições, conforme a regra do projeto.

Os metadados do vídeo ficam separados do frontmatter e do corpo editorial da página. A página pode referenciar `youtube_video_id`, e o Astro verifica se o ID existe na coleção `videoMetadata`.
