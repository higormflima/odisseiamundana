# Diretrizes de identidade visual — Odisseia Mundana

## Conceito da marca

Odisseia Mundana une viagem, aventura e exploração do mundo. Sua expressão visual combina referências náuticas, cartográficas e clássicas com uma apresentação editorial contemporânea. O site deve parecer uma revista digital de viagens, com histórias e fotografias reais no centro da experiência.

## Elementos oficiais

- **Timão:** navegação e jornada.
- **Globo:** exploração mundial.
- **Ondas:** movimento e aventura.
- **Faixa e lettering:** personalidade e reconhecimento da marca.
- **Logo completo:** assinatura institucional principal.

Os arquivos originais fornecidos estão preservados em `media/branding/`: composições em `logos/`, elementos em `components/`, originais em `source/`, materiais históricos em `youtube/` e `social/`, e fotografias em `profile/`. Arquivos derivados para uso digital ficam em `public/media/branding/optimized/`.

## Paleta de cores

| Cor | HEX | Aplicação preferencial |
|---|---|---|
| Marrom náutico | `#784330` | Detalhes de identidade |
| Cobre | `#D18E59` | Acentos discretos |
| Dourado | `#C39F51` | Destaques editoriais pontuais |
| Grafite | `#282829` | Texto e contraste |
| Azul ciano | `#00AFEF` | Links, foco e ênfases |
| Azul oceano | `#314B7B` | Elementos complementares |
| Verde | `#00A859` | Uso pontual ligado ao globo |
| Branco | `#FEFEFE` | Superfície e contraste |

Priorizar fundos neutros, texto grafite e ciano como destaque. Marrom, cobre e dourado são acentos; verde deve aparecer com parcimônia. Não usar toda a paleta simultaneamente. Garantir contraste legível, especialmente em textos pequenos e estados interativos.

## Tipografia aprovada

- **DM Serif Display:** títulos principais, títulos de viagem, seções editoriais e chamadas.
- **Manrope:** corpo, menus, navegação, botões, legendas, metadados e informação técnica.

Preservar essa combinação. As famílias são carregadas via Google Fonts com `display=swap`, preconnect e alternativas locais de fallback.

## Direção visual

- Fotografia real em primeiro plano, sem filtros artificiais.
- Ritmo editorial, espaços em branco e leitura confortável.
- Interface limpa, responsiva e fácil de navegar.
- Cards consistentes, sem bordas ou sombras pesadas.
- Elementos náuticos discretos, sem repetir timão, ondas ou globo em toda seção.
- Evitar aparência de dashboard, documentação, blog genérico ou banner promocional.

## Uso do logo

Usar a composição oficial sem redesenhar, recolorir, distorcer ou mudar proporções. O logo principal é a assinatura institucional e pode aparecer no cabeçalho e em apresentações da marca. Em espaços pequenos, usar apenas uma versão compacta oficial existente e legível; não inventar símbolo ou abreviação. Manter área livre suficiente e contraste com o fundo.

## Diretrizes de fotografia

Valorizar paisagens, experiências e momentos originais. Usar imagens grandes com recorte responsivo cuidadoso, sem esconder o assunto principal. Manter os arquivos de origem inalterados; criar cópias otimizadas separadas quando necessárias. Os banners antigos são referência histórica, não layouts prontos para páginas.

## Aplicação nos componentes

Homepage, cabeçalho, navegação, rodapé, arquivo de viagens, artigos, botões, links, galerias e players devem compartilhar os tokens CSS globais. Estados de foco precisam ser visíveis e contrastantes. Em mobile, preservar legibilidade, proporção do logo e enquadramento fotográfico.

## Regras para o Codex

1. Consultar este documento antes de qualquer alteração visual.
2. Preservar arquivos originais e usar cópias para otimização.
3. Não redesenhar ou alterar o logo oficial.
4. Não introduzir outras famílias tipográficas nem dependências visuais sem autorização.
5. Não inventar conteúdo de viagem nem ampliar o escopo funcional durante tarefas de identidade visual.
6. Manter componentes consistentes com os tokens CSS e verificar responsividade, acessibilidade e caminhos de assets no GitHub Pages.
