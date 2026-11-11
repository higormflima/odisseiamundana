# Odisseia Mundana

**Revista digital de viagens • Histórias reais • Travel on a Budget**

🌍 **Site oficial:** https://odisseiamundana.com  
▶️ **YouTube:** https://youtube.com/@odisseiamundana  
📷 **Instagram:** https://www.instagram.com/odisseiamundana/

A **Odisseia Mundana** é um projeto de viagens e exploração criado por Higor (brasileiro) e Maja (polonesa). Compartilhamos nossas viagens, aventuras, descobertas culturais e experiências de vida entre o Brasil, a Polônia, a Europa e outros destinos.

Nosso estilo é **travel on a budget**: acreditamos que grandes experiências não precisam de grandes orçamentos. Por isso, além de mostrar lugares e contar histórias, publicamos dicas para economizar, planejar melhor as viagens e aproveitar cada destino. Também compartilhamos projetos práticos, como a construção artesanal de um motorhome, tutoriais, planilhas e outros materiais relacionados às nossas experiências.

Este repositório é a base digital do projeto: reúne o conteúdo editorial, dados estruturados das viagens, transcrições, imagens otimizadas, ferramentas de validação e o código do site. O objetivo é preservar e organizar conhecimento de viagem de forma reutilizável e apresentá-lo em uma revista digital visual, com fotografias, vídeos e conteúdo editorial.

## O que você encontra no site

- **Viagens pela Europa:** destinos, roteiros, experiências e descobertas.
- **Construção de motorhome:** nossa experiência de planejamento e construção artesanal.
- **Vida na Polônia:** cultura, cotidiano e informações para brasileiros interessados no país.
- **Mais sobre nós:** nossa história e outros conteúdos do projeto.

Acesse o [site oficial](https://odisseiamundana.com) para explorar os conteúdos publicados. Os vídeos e materiais complementares também estão disponíveis no [canal do YouTube](https://youtube.com/@odisseiamundana).

## Ambiente de desenvolvimento

Requisitos: Node.js 22.12 ou superior e pnpm 11.25 ou superior.

```powershell
pnpm install
pnpm dev
```

Abra o endereço local exibido pelo Astro. Para validar e gerar o website estático:

```powershell
pnpm test
pnpm build
pnpm preview
```

Os testes verificam casos válidos e inválidos dos contratos JSON Schema e referências entre páginas editoriais e viagens. O build valida os metadados YAML contra os contratos JSON Schema antes de gerar as páginas.

## Organização do conteúdo

- `metadata/`: dados estruturados em YAML, separados da apresentação.
- `schemas/`: contratos JSON Schema para validação.
- `content/`: páginas editoriais Markdown/MDX. Cada viagem pode ter uma visão geral e páginas para seus vídeos por roteiro, cidade ou assunto.
- `transcripts/`: transcrições originais preservadas e registros de revisão em arquivos separados.
- `imports/`: exportações brutas de fontes externas (por exemplo Google Maps), preservadas antes da conversão em metadados.
- `media/`: imagens otimizadas usadas pelo site.
- `src/`: páginas, layouts e componentes Astro.

O status de publicação de uma página MDX deve ser `draft` até que conteúdo, fontes e revisão estejam adequados. O website lista e gera apenas páginas com status `published`.

## Metadados

Os arquivos em `metadata/journeys/` são processados por `yaml` e validados com Ajv contra `schemas/journey.schema.json`. O contrato JSON Schema é a fonte única das regras dos dados.

## Publicação

O site é gerado com Astro e publicado via GitHub Actions no GitHub Pages, usando o domínio personalizado https://odisseiamundana.com. O deploy ocorre após push para `main`; a configuração do workflow, por si só, não publica alterações locais.

## Idioma e contribuição

O idioma editorial atual do site e da documentação é português brasileiro. Identificadores técnicos, nomes de arquivos e propriedades seguem convenções em inglês.

Este é um projeto pessoal em desenvolvimento. Alterações na arquitetura, nos contratos de metadados ou na identidade visual devem respeitar as orientações documentadas no repositório, especialmente `AGENTS.md`, `PROJECT_BRIEF.md` e `media/branding/BRAND_GUIDELINES.md`.
