// Envolve cada tabela num contentor que rola para os lados em ecrãs estreitos.
// Tabelas com sete ou mais colunas recebem a classe "larga" (letra menor).
import { visit } from 'unist-util-visit';

export default function rehypeTabelas() {
  return (arvore) => {
    visit(arvore, 'element', (no, indice, pai) => {
      if (no.tagName !== 'table' || !pai || indice === undefined) return;
      if (pai.type === 'element' && pai.properties?.className?.includes?.('tabela-rolavel')) return;
      let colunas = 0;
      visit(no, 'element', (n) => {
        if (n.tagName === 'tr' && !colunas) colunas = n.children.filter((c) => c.type === 'element').length;
      });
      const classes = ['tabela-rolavel'];
      if (colunas >= 7) classes.push('larga');
      pai.children[indice] = {
        type: 'element',
        tagName: 'div',
        properties: { className: classes, tabIndex: 0, role: 'region', ariaLabel: 'Tabela' },
        children: [no],
      };
    });
  };
}
