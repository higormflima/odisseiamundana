# Contribuições voluntárias

O Planejador Elétrico mostra, na etapa do relatório, o bloco **"Gostou da ferramenta? Apoie o projeto"**. A configuração fica em `src/lib/support.ts` e o bloco em `src/components/solar/SolarSupport.astro`. Cada canal só aparece quando está ativo e completo; sem nenhum canal, o bloco não é renderizado.

## Pix

- Use somente uma **chave Pix aleatória** (formato UUID, criada no app do banco). Chaves de CPF, e-mail ou telefone exporiam dados pessoais em uma página pública; a validação rejeita esses formatos.
- Preencha `pix.key` e `pix.recipientNamePt` (nome que o doador verá no app do banco para conferência).
- QR Code: `public/media/support/pix-qr.png` foi recortado do QR gerado no app do Nubank, convertido para módulos escuros sobre fundo branco com margem de silêncio e conferido por leitura automática (OpenCV). É um Pix estático, sem valor definido.
- `pix.copyPasteCode` guarda o código "Pix copia e cola" decodificado desse QR. O botão **Copiar código Pix** copia esse código; sem ele, copia a chave. A validação exige que o código seja um BR Code da mesma chave.
- `pix.paymentUrl` guarda o link de cobrança do Nubank, exibido como **Abrir página de pagamento**.
- Se a chave mudar, gere um novo QR no app do banco e atualize os quatro campos juntos.

## GitHub Sponsors

A conta pessoal `higormflima` foi inscrita em 27/11/2026 e aguarda aprovação do GitHub. Requisitos do GitHub: autenticação em dois fatores, perfil de patrocínio, faixas de valor, conta bancária no país de residência via Stripe Connect e formulário fiscal W-8BEN. Doações de contas pessoais não têm taxa do GitHub; quem doa precisa ter conta no GitHub.

Para ativar depois da aprovação:

1. Confira que `https://github.com/sponsors/higormflima` abre o perfil com as faixas publicadas.
2. Em `src/lib/support.ts`, altere `githubSponsors.enabled` para `true`.
3. Crie `.github/FUNDING.yml` com `github: higormflima` para exibir o botão **Sponsor** no repositório.
4. Atualize o teste `configuração publicada é válida, exibe o Pix e mantém o GitHub Sponsors desligado até a aprovação` em `tests/support.test.mjs`, que hoje garante o canal desligado.
5. Rode `pnpm.cmd test` e `pnpm.cmd build` antes de publicar.
