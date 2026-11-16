// Três ajustes ao Markdown das páginas:
// 1. esconde secções que são instruções internas ("Elementos visuais", "Conteúdo da página inicial");
// 2. tira o título "Abertura" e põe os parágrafos seguintes em destaque (classe .abertura);
// 3. converte `[a confirmar…]` numa etiqueta discreta (classe .a-confirmar).
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';

const ESCONDER = ['elementos visuais', 'conteúdo da página inicial'];

export default function remarkSeccoes() {
  return (arvore) => {
    const novos = [];
    let esconderAte = 0; // nível do título que abriu a secção escondida
    let abertura = false;

    for (const no of arvore.children) {
      if (no.type === 'heading') {
        if (esconderAte && no.depth <= esconderAte) esconderAte = 0;
        abertura = false;
        const texto = toString(no).trim().toLowerCase();
        if (ESCONDER.includes(texto)) { esconderAte = no.depth; continue; }
        if (texto === 'abertura') { abertura = true; continue; }
      }
      if (esconderAte) continue;
      if (abertura && no.type === 'paragraph') {
        no.data ??= {};
        no.data.hProperties = { className: ['abertura'] };
      }
      novos.push(no);
    }
    arvore.children = novos;

    visit(arvore, 'inlineCode', (no, indice, pai) => {
      if (!pai || indice === undefined) return;
      if (/^\[a confirmar.*\]$/i.test(no.value)) {
        pai.children[indice] = {
          type: 'html',
          value: `<span class="a-confirmar">${no.value.slice(1, -1).replace(/</g, '&lt;')}</span>`,
        };
      }
    });
  };
}
