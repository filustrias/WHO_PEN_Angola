// Aceita a sintaxe do Quarto nos ficheiros Markdown, para que os textos
// escritos para o livro funcionem aqui sem reescrita:
//   ::: {.classe}  …  :::        caixas (incluindo callouts, colunas e abas)
//   [texto]{.classe}             etiquetas
//   ```{=html} … ```             HTML embutido
//   : legenda {#tbl-x}           legenda de tabela
//   ## Título {#sec-x .unnumbered}  identificador do título
//   @sec-x                       ligação para outra página ou secção
//   [texto](ficheiro.qmd)        ligação para outra página
import fs from 'node:fs';
import path from 'node:path';
import { visit } from 'unist-util-visit';

const PASTA = path.resolve('conteudo');

// Identificadores que ficaram só no livro antigo
const EXTERNOS = {
  'sec-enquadramentos': {
    url: 'https://filustrias.github.io/PEN_Angola/reaim-prism-cfir-pen-angola.html',
    titulo: 'RE-AIM, PRISM e CFIR (livro)',
  },
};

function lerFrontmatter(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const dados = {};
  if (!m) return dados;
  for (const linha of m[1].split(/\r?\n/)) {
    const c = linha.match(/^(\w+):\s*(.*)$/);
    if (c) dados[c[1]] = c[2].replace(/^["']|["']$/g, '');
  }
  return dados;
}

// Mapa id → { url, titulo } e ficheiro de origem → url, a partir de conteudo/
function construirMapas(base) {
  const ids = { ...EXTERNOS };
  const origens = {};
  if (!fs.existsSync(PASTA)) return { ids, origens };
  for (const f of fs.readdirSync(PASTA).filter((x) => x.endsWith('.md'))) {
    const texto = fs.readFileSync(path.join(PASTA, f), 'utf8');
    const fm = lerFrontmatter(texto);
    if (!fm.rota) continue;
    const url = base + fm.rota.replace(/^\/+/, '');
    if (fm.id) ids[fm.id] = { url, titulo: fm.titulo };
    if (fm.origem) origens[fm.origem] = url;
    for (const m of texto.matchAll(/^#{1,6}\s+(.+?)\s*\{[^}]*#([\w-]+)[^}]*\}\s*$/gm)) {
      ids[m[2]] = { url: `${url}#${m[2]}`, titulo: m[1].trim() };
    }
  }
  return { ids, origens };
}

function atributos(texto) {
  const classes = [];
  const props = {};
  let id = null;
  for (const m of texto.matchAll(/([\w-]+)="([^"]*)"|\.([\w-]+)|#([\w-]+)/g)) {
    if (m[3]) classes.push(m[3]);
    else if (m[4]) id = m[4];
    else props[m[1]] = m[2];
  }
  return { classes, props, id };
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function preprocessar(fonte, base, mapas) {
  const linhas = fonte.split(/\r?\n/);
  const saida = [];
  let emHtml = false;
  let emCodigo = false;
  let anterior = '';

  for (let i = 0; i < linhas.length; i++) {
    let linha = linhas[i];

    if (emHtml) {
      if (/^```\s*$/.test(linha)) { emHtml = false; saida.push(''); continue; }
      if (linha.trim() === '') continue; // linhas vazias partiriam o bloco HTML
      saida.push(linha.replace(/src="infografico\//g, `src="${base}infografico/`));
      continue;
    }
    if (/^```\{=html\}\s*$/.test(linha)) { emHtml = true; saida.push(''); continue; }

    // Diagrama Mermaid: o texto vai escapado para dentro de <pre class="mermaid">,
    // e o layout carrega o Mermaid só nas páginas que o usam
    if (/^```\s*(\{mermaid\}|mermaid)\s*$/.test(linha)) {
      const corpo = [];
      let legendaFig = '';
      for (i++; i < linhas.length && !/^```\s*$/.test(linhas[i]); i++) {
        const opcao = linhas[i].match(/^%%\|\s*([\w-]+):\s*(.*)$/);
        if (opcao) { if (opcao[1] === 'fig-cap') legendaFig = opcao[2].replace(/^"|"$/g, ''); continue; }
        if (linhas[i].trim() !== '') corpo.push(linhas[i]);
      }
      const texto = corpo.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      saida.push('', `<figure class="diagrama"><pre class="mermaid">${texto}</pre>${legendaFig ? `<figcaption>${esc(legendaFig)}</figcaption>` : ''}</figure>`, '');
      continue;
    }
    if (/^```/.test(linha)) { emCodigo = !emCodigo; saida.push(linha); continue; }
    if (emCodigo) { saida.push(linha); continue; }

    // Abertura de caixa
    const abre = linha.match(/^:{3,}\s*(?:\{(.*)\}|([\w-]+))\s*$/);
    if (abre) {
      const { classes, props, id } = abre[1] !== undefined ? atributos(abre[1]) : { classes: [abre[2]], props: {}, id: null };
      const tipoCallout = classes.find((c) => c.startsWith('callout-'));
      if (tipoCallout) classes.unshift('callout');
      let estilo = '';
      if (props.width) estilo = ` style="flex-basis:${esc(props.width)}"`;
      const idAttr = id ? ` id="${esc(id)}"` : '';
      saida.push('', `<div class="${esc(classes.join(' '))}"${idAttr}${estilo}>`, '');
      if (props.title) saida.push(`<p class="callout-titulo">${esc(props.title)}</p>`, '');
      continue;
    }
    // Fecho de caixa
    if (/^:{3,}\s*$/.test(linha)) { saida.push('', '</div>', ''); continue; }

    // Legenda de tabela
    const legenda = linha.match(/^:\s+(.+?)\s*(\{[^}]*\})?\s*$/);
    if (legenda && anterior.trim() === '') {
      saida.push(`<p class="legenda">${esc(legenda[1])}</p>`);
      anterior = linha;
      continue;
    }

    // Etiquetas [texto]{.classe}
    linha = linha.replace(/\[([^\]\n]+)\]\{\.([\w-]+)\}/g, '<span class="$2">$1</span>');

    // Ligações para ficheiros .qmd
    linha = linha.replace(/\]\(([\w-]+\.qmd)(#[\w-]+)?\)/g, (todo, f, frag) => {
      const url = mapas.origens[f];
      return url ? `](${url}${frag ?? ''})` : todo;
    });

    // Referências cruzadas @sec-x
    linha = linha.replace(/(^|[\s(\[—–-])@((?:sec|tbl|fig)-[\w-]+?)(?=[\s.,;:)\]!?]|$)/g, (todo, antes, id) => {
      const alvo = mapas.ids[id];
      return alvo ? `${antes}[${alvo.titulo}](${alvo.url})` : todo;
    });

    saida.push(linha);

    // Um <div …>…</div> numa só linha seguido de texto: separar, para o texto ser lido como Markdown
    if (/^<div[^>]*>.*<\/div>\s*$/.test(linha) && (linhas[i + 1] ?? '').trim() !== '') saida.push('');
    anterior = linha;
  }
  return saida.join('\n');
}

export default function remarkQuarto(opcoes = {}) {
  const base = (opcoes.base ?? '/').replace(/\/?$/, '/');
  const original = this.parser;
  this.parser = (documento, ficheiro) => {
    const mapas = construirMapas(base);
    const texto = preprocessar(String(documento), base, mapas);
    return original(texto, ficheiro);
  };

  // Títulos: "Título {#id .classe}" → id no elemento, sem as chavetas no texto
  return (arvore) => {
    visit(arvore, 'heading', (no) => {
      const ultimo = no.children[no.children.length - 1];
      if (!ultimo || ultimo.type !== 'text') return;
      const m = ultimo.value.match(/\s*\{([^}]*)\}\s*$/);
      if (!m) return;
      ultimo.value = ultimo.value.slice(0, m.index);
      const { id } = atributos(m[1]);
      if (id) {
        no.data ??= {};
        no.data.hProperties = { ...(no.data.hProperties ?? {}), id };
      }
    });
  };
}
