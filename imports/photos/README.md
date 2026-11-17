# Recebimento de fotos pelo GitHub

Esta pasta recebe fotos de outro computador, sem necessidade de agente, clone local ou processamento no computador de origem. O processamento posterior depende de pedido explícito do proprietário para o lote.

## Organização

Use uma subpasta por viagem e por envio:

```text
imports/photos/
  <journey-id>/
    <batch-id>/
      foto-original.jpg
```

Use identificadores em inglês, sem espaços, como `finland-2026/batch-01`. O exemplo ilustra apenas a organização; nenhum lote é criado automaticamente. Use um novo identificador para cada envio, sem sobrescrever arquivos anteriores. Não renomeie as fotos.

## Como enviar pelo navegador

1. No computador de origem, organize cópias das fotos em uma pasta `<journey-id>` com uma subpasta `<batch-id>`. Mantenha sua cópia pessoal de segurança.
2. Entre na sua conta e abra [`imports/photos/` no GitHub](https://github.com/higormflima/odisseiamundana/tree/main/imports/photos), na branch `main`.
3. Selecione **Add file → Upload files** e arraste a pasta da viagem, preservando a estrutura do lote.
4. Confira os caminhos e os arquivos antes de confirmar. Não substitua arquivos existentes.
5. Escreva uma mensagem como `Recebe fotos de finland-2026, lote batch-01` e confirme o commit diretamente na `main`.
6. Avise no chat qual pasta recebeu os arquivos. O simples aviso de chegada não autoriza processamento; indique explicitamente quando quiser iniciar a análise ou preparação do lote.

O [upload pelo navegador](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository) permite até 100 arquivos por envio e 25 MiB por arquivo. Se precisar dividir um lote em vários envios, mantenha a mesma pasta e envie apenas os arquivos restantes. Arquivos acima desse limite exigem combinar outra forma de transferência; não os converta automaticamente.

## Regras para agentes

- A presença de arquivos nesta pasta, um commit ou um `git pull` não autorizam abrir ou analisar as fotos.
- Antes da autorização, limite-se, se solicitado, a confirmar recebimento, nomes, quantidade e tamanho dos arquivos, sem interpretar imagens ou extrair EXIF.
- Não converta, comprima, redimensione, gere miniaturas, crie legendas ou metadados, execute `gallery:process` nem integre fotos ao site sem pedido explícito para o lote.
- Após autorização de processamento, preserve os arquivos recebidos e grave os derivados separadamente, conforme o fluxo aprovado para a tarefa.
- Não sobrescreva ou exclua arquivos recebidos sem autorização explícita, inclusive depois de processá-los.
- Não acrescente automações que processem ou publiquem esta pasta.

## Publicação e armazenamento

Esta pasta não é uma galeria e não é copiada para o site pelo fluxo atual. O envio à `main` aciona os workflows habituais de validação e deploy, mas não processa nem publica essas fotos nas páginas.

O repositório é público: os arquivos recebidos ficam acessíveis pelo GitHub, mesmo sem aparecer no site. Esta transferência é uma exceção autorizada à recomendação geral de manter fotos originais fora do Git.

Apagar um lote posteriormente não apaga suas versões anteriores do histórico nem recupera o espaço correspondente no Git. Não trate esta pasta como armazenamento temporário descartável e mantenha sua própria cópia de segurança dos originais.
