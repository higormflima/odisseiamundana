# Instruções para agentes de desenvolvimento

- Leia `PROJECT_BRIEF.md` antes de alterar a arquitetura ou o conteúdo.
- Converse e documente decisões em português brasileiro; use inglês para nomes técnicos e identificadores.
- Não invente informações de viagem. Datas mencionadas nas transcrições dos vídeos são a fonte autoritativa para as viagens.
- Preserve cada transcrição original exatamente como recebida. Revise transcrições automáticas em arquivo separado, anotando correções e trechos incertos.
- Não apresente conteúdo não verificado como fato confirmado nem publique páginas em rascunho.
- Escreva o conteúdo editorial em primeira pessoa do plural, como relato dos próprios viajantes ("passamos", "nossa base", "enviamos"). Não use terceira pessoa nem nomes dos viajantes como sujeito ("Higor e Maja passaram").
- Não inclua nas páginas publicadas notas internas do processo editorial: status de transcrição ou narração, avisos de revisão, blocos de fontes ou proveniência, nem referências como "o vídeo menciona" ou "no guia". Essas informações ficam nos metadados e nos registros de revisão.
- Mantenha metadados YAML independentes do conteúdo editorial MDX e da apresentação Astro.
- Prefira componentes nativos Astro e não acrescente React ou outras dependências sem necessidade aprovada.
- Não escolha soluções de mapas por conta própria.
- Prefira implementações simples e incrementais. Explique decisões técnicas em português.
- Antes de qualquer alteração visual, consulte `media/branding/BRAND_GUIDELINES.md`.
- Tabelas de preços ou custos usam o componente `CostTable` e seguem as regras de `docs/cost-tables.md`.
- Fotos da construção do motorhome ficam restritas às páginas da construção e ao card do mapa; não devem integrar a galeria geral nem ganhar coleção fotográfica própria.
- Fotos recebidas em `imports/photos/` aguardam autorização explícita do proprietário para o lote: não abra, analise, extraia EXIF, converta, otimize, gere miniaturas, crie metadados nem publique essas fotos apenas porque foram carregadas ou sincronizadas. Consulte `imports/photos/README.md` antes de trabalhar nesse fluxo.
- Preserve o conteúdo dos arquivos recebidos. Quando o proprietário solicitar, renomeie as fotos na própria pasta conforme o padrão indicado, sem exigir cópias com os nomes antigos; isso não autoriza análise ou processamento. Não sobrescreva arquivos nem exclua lotes sem autorização explícita; o envio de originais nessa pasta é uma exceção autorizada à recomendação geral de mantê-los fora do Git.
