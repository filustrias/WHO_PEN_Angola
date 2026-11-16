# PEN Angola — site

Site do projecto PEN Angola, feito com [Astro](https://astro.build) 7.4.1 (site estático).
Substitui, a prazo, o livro Quarto em `../quarto_book`.

## Trabalhar no site

```
npm install        # uma vez
npm run dev        # pré-visualização em http://localhost:4321
npm run build      # gera dist/ e verifica os links internos (falha se houver links partidos)
```

Requer Node 22.22 ou superior.

## Onde está cada coisa

| Pasta ou ficheiro | O que tem |
| --- | --- |
| `conteudo/*.md` | Uma página por ficheiro. Frontmatter: `titulo`, `subtitulo`, `resumo`, `secao`, `ordem`, `rota`, `id` |
| `dados/calendario.csv` | O calendário conjunto: uma linha por actividade ou marco (gerado da planilha) |
| `dados/etapas.csv` | Etapas e fases da pesquisa de implementação, para a linha do tempo |
| `src/navegacao.ts` | Ordem e nomes das secções do menu |
| `src/pages/` | Página inicial, calendário e o gerador das páginas de `conteudo/` |
| `src/plugins/` | Leitura da sintaxe do Quarto, secções especiais e tabelas |
| `src/styles/global.css` | Paleta, temas claro e escuro, tipografia |
| `src/styles/componentes/` | Estilos dos componentes RE-AIM e CFIR (vindos do livro) |
| `public/infografico/` | Scripts dos componentes RE-AIM e CFIR (vindos do livro) |

## Escrever páginas

Os ficheiros aceitam Markdown normal e também a sintaxe do Quarto usada no livro:

- caixas: `::: {.callout-note}` … `:::`, `::: {.callout-exemplo}`, colunas, abas (`::: {.panel-tabset}`);
- etiquetas: `[texto]{.classe}`;
- HTML embutido: ```` ```{=html} ````;
- diagramas: ```` ```{mermaid} ```` ou ```` ```mermaid ````;
- ligações para outras páginas: `@sec-reaim`, ou `[texto](reaim.qmd)`.

Secções especiais:

- `## Abertura`: o título não aparece e os parágrafos seguintes ficam em destaque;
- `## Elementos visuais` e `## Conteúdo da página inicial`: não aparecem (notas internas);
- `` `[a confirmar…]` ``: aparece como etiqueta discreta.

Para trazer de novo um capítulo do livro: `npm run importar reaim.qmd` (atenção: substitui o ficheiro em `conteudo/`).

## Calendário

A fonte é a planilha `Calendário conjunto WHO PEN e PEN-Plus Angola (…).xlsx`, na pasta acima.
Depois de a alterar, correr `python scripts/importar-calendario.py` para gerar `dados/calendario.csv`.

- Cada linha "•" de uma célula vira uma actividade; "(realizado)" e "(conjunta)" passam a etiquetas.
- Os marcos, separados por ";", aparecem em destaque e na linha do tempo.
- Períodos: `2026-10` (mês) ou `2026-11-1` / `2026-11-2` (1.ª e 2.ª quinzena).
- As faixas da linha do tempo (etapas e pesquisa de implementação) estão em `dados/etapas.csv`.

## Publicação

`.github/workflows/deploy.yml` publica no GitHub Pages a cada push para `main`
(activar uma vez em Settings → Pages → Source: GitHub Actions).
O prefixo do endereço vem de `BASE_PATH`; para o Cloudflare, basta deixá-lo em `/`.
