# Protótipo de metadados e legendas do YouTube

Este comando consulta a YouTube Data API v3 para obter metadados públicos e listar/baixar faixas de legenda. Ele usa apenas chamadas `GET`; não cria, edita nem exclui vídeos, legendas ou metadados no YouTube.

## O que o protótipo faz

- Recebe uma playlist de viagem ou uma lista de IDs de vídeo.
- Pode preencher registros YAML com título, descrição, miniatura, duração, data de publicação, posição na playlist e URL do vídeo.
- Exclui vídeos sem narração informados com `--exclude-video-id`.
- Solicita OAuth Desktop com PKCE e escopo `youtube.force-ssl`.
- Lista as faixas existentes de cada vídeo.
- Baixa uma faixa em português somente quando há exatamente uma candidata não rascunho e sem falha.
- Salva o arquivo VTT bruto sem transformá-lo e cria um JSON separado com origem, idioma, ID da faixa, data de coleta e hash SHA-256.
- Não substitui nenhuma fonte bruta já existente para o mesmo vídeo.
- Informa vídeos sem faixa em português, faixas ambíguas e erros de cota.

O script não gera transcrições por reconhecimento de fala, não traduz faixas e não transforma a transcrição em conteúdo editorial. Faixas ausentes ou ambíguas exigem revisão ou obtenção manual pelo YouTube Studio. A revisão humana permanece necessária antes de usar fatos ou datas em metadados e conteúdo.

Para obter somente os metadados dos vídeos de uma playlist:

```powershell
pnpm youtube:metadata -- `
  --client-secrets "<caminho-fora-do-repositório>" `
  --journey-id finland-2026 `
  --playlist-id PLA8vGdq_0fiP_0AZsVpPN7kTaztdiR70V `
  --write-video-metadata `
  --metadata-only
```

Os arquivos são gravados em `metadata/videos/<journey-id>/`. O script preenche campos ausentes e preserva os valores que já existirem.

## Configuração única do Google Cloud

1. Crie ou selecione um projeto no Google Cloud e habilite **YouTube Data API v3**.
2. Configure a tela de consentimento OAuth. Para uso pessoal em teste, adicione a conta que administra o canal como usuário de teste.
3. Crie uma credencial OAuth do tipo **Desktop app** e baixe o JSON.
4. Guarde esse JSON fora do repositório. Ele identifica o cliente OAuth e não deve ser commitado. O programa não mostra seu conteúdo.

O consentimento solicitado é amplo: `youtube.force-ssl` pode permitir ver, editar e excluir vídeos, avaliações, comentários e legendas. O protótipo só chama os métodos de listagem e download. O arquivo de credenciais e os tokens OAuth não devem ser enviados ao chat nem colocados no Git.

O acesso OAuth é interativo a cada execução. O token de acesso permanece apenas na memória do processo; não solicitamos acesso offline e não gravamos refresh token. Assim, cada lote exige uma nova autorização no Google.

## Finlândia: primeiro lote

Os vídeos 2 e 4 foram confirmados pelo proprietário como cenas com música e sem narração, então são excluídos. Vídeos 1, 3, 5 e 6 têm narração esperada; a fonte bruta existente do vídeo 1 é preservada automaticamente.

Para consultar a playlist da Finlândia como primeiro teste, exclua os vídeos 2 e 4, que não têm narração. O vídeo 1 já possui fonte bruta local e será preservado sem nova consulta:

```powershell
pnpm youtube:captions -- `
  --client-secrets "C:\Users\user\AppData\Roaming\Google\youtube-desktop-client.json" `
  --journey-id finland-2026 `
  --playlist-id PLA8vGdq_0fiP_0AZsVpPN7kTaztdiR70V `
  --exclude-video-id ioZ2A5aPBIk `
  --exclude-video-id Gw8IEGoNyLI
```

Se uma faixa única em português estiver disponível, o programa criará `transcripts/journeys/finland-2026/<video-id>.<idioma>.raw.vtt` e o respectivo arquivo `.source.json`. Se não existir uma faixa, o programa informa o caso sem tentar inventar ou gerar transcrição.

Também é possível informar IDs diretamente com `--video-id`. Para qualquer playlist com vídeos sem narração, use `--exclude-video-id <id>`. Playlists maiores que 30 vídeos são processadas em execuções com `--offset 0`, `--offset 30`, `--offset 60` e assim por diante. O offset conta os itens depois das exclusões.

## Limite de execução e cota

O programa limita cada execução a 30 vídeos para reservar margem da cota padrão. Uma chamada `captions.list` custa 50 unidades e cada `captions.download` custa 200; consultar e baixar uma faixa por vídeo usa até 250 unidades. Uma playlist maior pode ser dividida em lotes usando `--offset`. Se o YouTube retornar erro de cota, os arquivos já baixados ficam preservados; repita o mesmo offset para que esses IDs sejam ignorados ou exporte os casos restantes pelo Studio.

## Interpretação dos resultados

- `BAIXADO`: arquivo VTT bruto e sidecar de proveniência foram gravados.
- `SEM FAIXA PT`: a API não retornou uma faixa utilizável em português. Para vídeo narrado, avaliar exportação pelo Studio ou transcrição separada do áudio original.
- `REVISÃO NECESSÁRIA`: há mais de uma faixa em português; nenhuma foi escolhida automaticamente.
- `PRESERVADO`: já existe arquivo bruto para aquele ID; nada foi sobrescrito.

Não faça commit de credenciais OAuth, tokens, arquivos de cliente ou conteúdo ainda não revisado.
