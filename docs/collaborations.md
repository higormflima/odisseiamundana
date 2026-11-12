# Colaborações

Cada projeto tem dados em `metadata/collaborations/` e texto editorial em `content/collaborations/`, separados da apresentação. O contrato dos dados está em `schemas/collaboration.schema.json`; o build valida os arquivos antes de gerar o site.

## Cadastrar um projeto

1. Copie os arquivos de exemplo para novos arquivos `.yaml` e `.mdx`, usando o mesmo identificador simples em inglês, por exemplo `winter-project`. No YAML, o nome do arquivo deve coincidir com `collaboration_id`; no MDX, informe o mesmo identificador no frontmatter.
2. No YAML, altere `kind` para `project` e `status` para `draft`. Preencha título, descrição, destino, país e foto de capa com texto alternativo factual. Escreva o relato em primeira pessoa do plural no MDX. Não apresente informações não verificadas como fatos.
3. Após confirmação e revisão, registre `date` com `year` e `month` confirmados e, se disponível, `day`. Informe `partner.name`, `type` (`exchange`, `sponsorship`, `paid` ou `special`), `received` e `delivered`. Esses campos são obrigatórios para publicar um projeto real. A ordenação é decrescente; quando só se conhece o mês, o projeto fica após outros com dia informado no mesmo mês.
4. Opcionalmente, adicione apresentação do parceiro em `partner.description`, links HTTPS em `partner.website` e `partner.instagram`, e seu logotipo em `partner.logo` com `src` e `alt`. Use apenas logotipos autorizados e confiáveis; não substitua por imagens genéricas.
5. Adicione fotos em `photos`, com `src`, `alt` e, quando houver, `thumbnail`, `caption`, `width` e `height`. Os caminhos começam por `media/`. Coloque cópias otimizadas em `media/collaborations/` ou use imagens já disponíveis em `media/journeys/`; mantenha originais fora do repositório. Para vídeos, use `videos` com `id` de 11 caracteres e `title` descritivo para cada vídeo do YouTube.
6. Execute `node scripts/sync-public-media.mjs` antes da prévia local ao acrescentar mídias e depois `pnpm dev`. Em desenvolvimento, rascunhos são mostrados com indicação de prévia. Execute `pnpm test` e `pnpm build`; o build sincroniza as mídias, valida os dados e falha caso arquivos de imagem referenciados não existam na mídia pública.
7. Apenas após aprovação do conteúdo, altere `status` para `published`. No build de produção, rascunhos não são listados nem geram páginas. O exemplo ilustrativo deixa automaticamente de ser listado e de gerar sua rota quando houver um projeto real publicado; seus arquivos de origem permanecem no repositório.

O exemplo `exemplo-laponia` é identificado como ilustrativo e não representa uma parceria. Sua data e os dados de um parceiro não foram inventados. Para substituí-lo, cadastre uma colaboração real conforme os passos acima.

## Contato e SEO

O formulário abre um `mailto:` para `contato@odisseiamundana.com` com os campos codificados. Ele não envia nem armazena dados e depende de um aplicativo ou serviço de e-mail configurado; o visitante deve confirmar o envio. Há um limite de tamanho para reduzir problemas com aplicativos de e-mail: se a mensagem ultrapassá-lo, o formulário solicita que ela seja reduzida ou enviada diretamente ao endereço informado.

Cada projeto gera título, descrição, URL canônica e metadados Open Graph com a imagem de capa. O exemplo é identificado como tal tanto no portfólio quanto na página individual.
