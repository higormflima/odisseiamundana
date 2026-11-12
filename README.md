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

Para cadastrar projetos de parceria, imagens e vídeos na seção de colaborações, consulte [Colaborações](docs/collaborations.md).

## Preparação de fotografias

A primeira etapa do novo fluxo prepara e valida imagens, mas **ainda não as adiciona à galeria pública**. As galerias existentes permanecem independentes.

1. Crie uma pasta local como `.gallery-input/finland-2026/` e coloque nela cópias das fotos editadas. Essa pasta é ignorada pelo Git; mantenha os originais em seu armazenamento pessoal.
2. Para registrar uma nova foto, execute:

   ```powershell
   pnpm gallery:process --collection finland-2026 --file ".gallery-input/finland-2026/foto.jpg" --new
   ```

3. O comando informa o ID permanente e gera variantes JPEG e WebP em `media/gallery/` e um registro YAML em `metadata/gallery/`. Não envie a pasta de entrada nem fotos originais ao Git.
4. Uma foto idêntica é reconhecida mesmo após renomeação. Se uma foto já registrada for editada ou convertida, use o ID informado no registro para conservar sua identidade:

   ```powershell
   pnpm gallery:process --collection finland-2026 --file ".gallery-input/finland-2026/foto-editada.jpg" --id ID-DA-FOTO
   ```

   Use `--new` apenas para uma foto realmente nova. A associação de uma imagem alterada ao ID é uma decisão manual; o sistema não identifica conteúdo parecido automaticamente.
5. Se necessário, edite no YAML o campo opcional `overrides` da foto com `date` (`AAAA-MM-DD`), `country`, `region`, `city`, `alt` ou `featured`. A data EXIF extraída em `captured_at` não tem fuso horário e deve ser conferida; dados ausentes não são inventados.
6. Execute `pnpm gallery:validate`. O comando verifica registros, IDs, variantes, dimensões e metadados privados e informa o tamanho das variantes registradas por coleção e no total. Opcionalmente, defina `$env:GALLERY_MAX_MIB = '100'` antes do comando para receber um aviso quando o total ultrapassar esse valor.

O processamento aplica a orientação EXIF, preserva o perfil de cor quando disponível e remove EXIF, XMP e IPTC das cópias geradas; não envia coordenadas a serviços externos. Versões antigas de uma foto atualizada não são apagadas automaticamente: o relatório conta apenas as variantes referenciadas e não mede arquivos antigos ou o repositório inteiro. A migração das 63 fotos existentes, a publicação dos derivados e a escolha de um serviço de localização serão tratadas nas próximas etapas.

### Galeria fotográfica

Execute `pnpm dev` e acesse `/pt/galeria/` no endereço local exibido pelo Astro. A galeria reúne as fotos já disponíveis das viagens publicadas e inclui páginas para cada coleção. A ordem das coleções usa a data da viagem, não a data individual das fotos.

A galeria e seu link no menu também são gerados no build de produção. A galeria global e as coleções usam um mosaico com carregamento progressivo de 24 miniaturas, busca, filtros por continente e país da viagem, ordenação e visualizador próprio; as galerias dos relatos permanecem independentes. Busca e filtros geográficos utilizam os metadados da viagem, não uma localização individual presumida para cada imagem. A ordenação cronológica usa a data da viagem, pois as datas individuais ainda não estão disponíveis. URLs individuais, compartilhamento, coleções temáticas e integração com os IDs permanentes ainda serão implementados. As fotos existentes ainda não foram migradas para o novo registro.

Na página inicial, a chamada para a galeria usa uma seleção editorial de até seis miniaturas de viagens publicadas, definida em `src/pages/pt/index.astro`. Imagens indisponíveis ou de viagens não publicadas são omitidas; a seleção pode ser atualizada sem alterar a galeria principal.

As capas principais escolhem entre a miniatura e a imagem otimizada disponível conforme o tamanho de tela; o mosaico usa apenas miniaturas e carrega imagens fora da área visível de forma adiada. Ao ampliar uma foto no visualizador, use as setas do teclado para percorrê-la; os botões anterior e próxima continuam disponíveis.

Para adicionar fotos à galeria atual, mantenha somente cópias otimizadas em `media/journeys/` e informe os caminhos `src` e `thumbnail` e o texto alternativo factual em `gallery.photos` do YAML da viagem. Marque uma foto com `featured: true` para incluí-la nos destaques e outra com `cover: true` para usá-la como capa da coleção. Sem capa marcada, usa-se o primeiro destaque ou, na ausência deste, a primeira foto. O campo opcional `gallery.collection_title` define o título da coleção sem alterar o título da viagem. A abertura geral usa uma foto escolhida em `src/pages/pt/galeria/[...path].astro` entre as coleções publicadas; se ela não estiver disponível, usa o primeiro destaque. Uma coleção aparece na galeria somente se tiver fotos e um resumo de viagem publicado. Os campos `geography.continents`, `countries`, `regions` e `destinations` alimentam os filtros e a busca por dados da viagem.

Esse fluxo atual é independente do comando `gallery:process`: criar um registro em `metadata/gallery/` **não adiciona a foto ao site**. As correções `overrides` do registro técnico também ainda não são apresentadas na galeria. Antes de publicar novas fotos, verifique manualmente sua autorização, conteúdo, otimização e ausência de metadados privados; execute `pnpm test` e `pnpm build` e revise a prévia local. O relatório `gallery:validate` cobre apenas variantes do registro técnico, não as fotos antigas nem o tamanho total do repositório.

## Publicação

O site é gerado com Astro e publicado via GitHub Actions no GitHub Pages, usando o domínio personalizado https://odisseiamundana.com. O deploy ocorre após push para `main`; a configuração do workflow, por si só, não publica alterações locais.

## Idioma e contribuição

O idioma editorial atual do site e da documentação é português brasileiro. Identificadores técnicos, nomes de arquivos e propriedades seguem convenções em inglês.

Este é um projeto pessoal em desenvolvimento. Alterações na arquitetura, nos contratos de metadados ou na identidade visual devem respeitar as orientações documentadas no repositório, especialmente `AGENTS.md`, `PROJECT_BRIEF.md` e `media/branding/BRAND_GUIDELINES.md`.
