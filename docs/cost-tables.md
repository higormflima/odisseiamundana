# Tabelas de custos

Toda tabela de preços ou custos de viagem nas páginas MDX usa o componente `src/components/CostTable.astro`. Não use tabelas Markdown para custos: o componente garante o mesmo layout em todas as viagens, no desktop e no celular.

## Uso

```mdx
import CostTable from '../../../src/components/CostTable.astro';

<CostTable
  caption="O que pagamos nesta viagem, em fevereiro de 2026 — não são preços atuais."
  amountLabel="Total do casal"
  rows={[
    { item: 'Passagem aérea', detail: '330€ por pessoa + 65€ de mala extra', amount: '725€' },
    { item: 'Cabana', detail: '4 noites', amount: '710€' },
  ]}
  total={{ label: 'Total aproximado', amount: '~2.537€' }}
/>
```

## Regras de conteúdo

- **Duas colunas.** A primeira traz o item; a segunda, o valor. Não acrescente colunas.
- **Valor para o grupo inteiro, salvo exceção aprovada.** A coluna normalmente mostra quanto o grupo pagou, e `amountLabel` nomeia esse grupo ("Total do casal", "Total da família"). No Tour du Mont Blanc, o proprietário aprovou valores por pessoa; nesse caso, identifique claramente a base em `amountLabel` e use-a em todas as linhas e no total.
- **Preço unitário no detalhe.** Quando a coluna mostra o valor do grupo, preço por pessoa, por noite ou por dia pode ficar em `detail`, junto de duração, quantidade e do que não foi comprado, em frase curta.
- **Itens curtos.** `item` é um nome de duas ou três palavras. Quantidades como "5 dias" ou "4 noites" vão no detalhe.
- **Valores aproximados com `~`.** Use `~` quando o valor for estimado ("cerca de 50€ de combustível") e no total, se ele for aproximado.
- **Linha de total quando os valores somam.** Ela fecha a tabela e confere com a soma das linhas. Se não conferir, verifique antes de publicar. Omita `total` quando os valores forem médias, diárias ou preços avulsos que não podem ser somados.
- **Legenda com o contexto.** `caption` diz quando os valores foram pagos e que não são preços atuais. Ela substitui o parágrafo de aviso antes da tabela.
- **Formato dos números.** Padrão brasileiro: vírgula decimal e ponto de milhar (`26,50€`, `2.537€`), com o símbolo da moeda colado ao número.

## Fontes

Os valores seguem as regras gerais do projeto: vêm das transcrições e das confirmações registradas nos arquivos de revisão, sem inventar dados. Quando o vídeo não deixa claro se um preço é por pessoa ou por grupo, confirme com o proprietário e registre a confirmação no arquivo de revisão da transcrição e nos metadados YAML da viagem (`cost_eur` ou `cost_eur_per_person`).
