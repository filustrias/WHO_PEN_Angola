// Verifica os links internos (href e src) e as âncoras (#…) nas páginas geradas em dist/.
// Se algum estiver partido, termina com erro e o build falha.
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const base = (process.env.BASE_PATH ?? '/').replace(/\/?$/, '/');

const paginas = [];
(function andar(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) andar(p);
    else if (f.name.endsWith('.html')) paginas.push(p);
  }
})(DIST);

const ids = new Map();
const idsDe = (ficheiro) => {
  if (!ids.has(ficheiro)) {
    const html = fs.readFileSync(ficheiro, 'utf8');
    ids.set(ficheiro, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return ids.get(ficheiro);
};

const problemas = [];
for (const pagina of paginas) {
  const html = fs.readFileSync(pagina, 'utf8');
  const urlPagina = '/' + path.relative(DIST, pagina).split(path.sep).join('/').replace(/index\.html$/, '');
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const alvo = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(alvo) || alvo.startsWith('//')) continue;
    const [caminhoAlvo, fragmento] = alvo.split('#');
    let ficheiro;
    if (caminhoAlvo === '') ficheiro = pagina;
    else {
      let p = decodeURIComponent(caminhoAlvo.split('?')[0]);
      if (p.startsWith('/')) {
        if (!p.startsWith(base)) { problemas.push(`${urlPagina}: ${alvo} (sem o prefixo ${base})`); continue; }
        p = p.slice(base.length);
      } else {
        p = path.posix.join(path.posix.dirname(urlPagina.replace(/^\//, '') + 'x'), p);
      }
      ficheiro = path.join(DIST, p);
      if (fs.existsSync(ficheiro) && fs.statSync(ficheiro).isDirectory()) ficheiro = path.join(ficheiro, 'index.html');
      if (!fs.existsSync(ficheiro)) { problemas.push(`${urlPagina}: ${alvo} (não existe)`); continue; }
    }
    if (fragmento && ficheiro.endsWith('.html') && !idsDe(ficheiro).has(decodeURIComponent(fragmento))) {
      problemas.push(`${urlPagina}: ${alvo} (âncora não encontrada)`);
    }
  }
}

if (problemas.length) {
  console.error(`\n${problemas.length} link(s) interno(s) partido(s):`);
  for (const p of problemas) console.error('  ' + p);
  process.exit(1);
}
console.log(`Links internos verificados em ${paginas.length} páginas: nenhum partido.`);
