# Odisseia Mundana

Odisseia Mundana é uma revista digital de viagens e uma base de conhecimento organizada. O repositório separa metadados estruturados, conteúdo editorial, transcrições e a implementação do website.

## Ambiente de desenvolvimento

Requisitos: Node.js 22.12 ou superior e pnpm 11.25 ou superior.

```powershell
pnpm install
pnpm dev
```

Abra o endereço local exibido pelo Astro. Para gerar o website estático:

```powershell
pnpm build
pnpm preview
```

O build valida os metadados YAML contra os contratos JSON Schema antes de gerar as páginas.

## Organização do conteúdo

- `metadata/`: dados estruturados em YAML, separados da apresentação.
- `schemas/`: contratos JSON Schema para validação.
- `content/`: páginas editoriais Markdown/MDX. Cada viagem pode ter uma visão geral e páginas para seus vídeos por roteiro, cidade ou assunto.
- `transcripts/`: transcrições originais preservadas e registros de revisão em arquivos separados.
- `media/`: somente imagens otimizadas usadas pelo site.
- `src/`: páginas, layouts e componentes Astro.

O status de publicação de uma página MDX deve ser `draft` até que conteúdo, fontes e revisão estejam adequados. O website lista e gera apenas páginas com status `published`.

## Metadados

Os arquivos em `metadata/journeys/` são processados por `yaml` e validados com Ajv contra `schemas/journey.schema.json`. O contrato JSON Schema é a fonte única das regras dos dados.

## Publicação

O GitHub Actions tem workflows para validação e publicação no GitHub Pages. O deploy ocorre após push para `main`; a configuração do workflow, por si só, não publica alterações locais.
