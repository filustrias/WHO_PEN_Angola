// Importa os capítulos do livro Quarto (../quarto_book) para conteudo/*.md.
// O título (# …) e o subtítulo (::: {.chapter-subtitle}) passam para o frontmatter;
// o resto do texto fica igual, porque o plugin remark-quarto entende a sintaxe do Quarto.
//
// Uso: npm run importar            (importa todos os capítulos da lista)
//      npm run importar reaim.qmd  (importa só um)
import fs from 'node:fs';
import path from 'node:path';

const LIVRO = path.resolve('../quarto_book');
const DESTINO = path.resolve('conteudo');

const PAGINAS = [
  { origem: 'preparativos.qmd', ficheiro: 'projecto.md', rota: 'projecto/', secao: 'projecto', ordem: 1,
    resumo: 'As duas iniciativas, o financiamento, o objectivo e as frentes de trabalho.' },
  { origem: 'inovacao.qmd', ficheiro: 'inovacao.md', rota: 'ciencia/inovacao/', secao: 'ciencia', ordem: 2,
    resumo: 'O que é uma inovação em saúde e porque a inovação é o pacote, e não o elemento técnico isolado.' },
  { origem: 'ciencia-implementacao.qmd', ficheiro: 'investigacao.md', rota: 'ciencia/investigacao/', secao: 'ciencia', ordem: 3,
    resumo: 'Porque é preciso investigar a implementação, as definições e as fronteiras com os campos vizinhos.' },
  { origem: 'reaim.qmd', ficheiro: 'reaim.md', rota: 'implementacao/reaim/', secao: 'implementacao', ordem: 1,
    resumo: 'Alcance, efectividade, adopção, implementação e manutenção, com simulador e exercícios.' },
  { origem: 'cfir.qmd', ficheiro: 'cfir.md', rota: 'implementacao/cfir/', secao: 'implementacao', ordem: 2,
    resumo: 'Os cinco domínios e os constructos do CFIR, com mapa, pessoas e casos para explorar.' },
  { origem: 'cfir-reaim-desenho-pen.qmd', ficheiro: 'desenho.md', rota: 'implementacao/desenho/', secao: 'implementacao', ordem: 3,
    resumo: 'Desenhar a inovação PEN com o CFIR e planear a implementação com o RE-AIM.' },
  { origem: 'panorama-literatura-pen.qmd', ficheiro: 'panorama.md', rota: 'evidencia/panorama/', secao: 'evidencia', ordem: 1,
    resumo: 'Histórico do WHO PEN e do PEN-Plus, países onde foi implementado e tipos de estudo publicados.' },
  { origem: 'exploracao-guias-materiais.qmd', ficheiro: 'guias.md', rota: 'evidencia/guias/', secao: 'evidencia', ordem: 2,
    resumo: 'Guias clínicas e materiais didácticos e de comunicação sobre hipertensão, diabetes e risco cardiovascular.' },
  { origem: 'lacunas-de-cuidado-pen-angola.qmd', ficheiro: 'lacunas.md', rota: 'lacunas/', secao: 'lacunas', ordem: 1,
    resumo: 'Construir os protocolos e os indicadores do piloto a partir das lacunas de cuidado.' },
  { origem: 'producao-protocolos-clinicos.md', pasta: '..', ficheiro: 'protocolos.md', rota: 'protocolos/', secao: 'lacunas', ordem: 2,
    resumo: 'As duas etapas de produção, quem participa, os componentes de cada protocolo e a forma de disponibilização.' },
  { origem: 'seguimento-coorte-dcnt-pen-angola.md', pasta: '..', ficheiro: 'seguimento.md', rota: 'seguimento/', secao: 'lacunas', ordem: 3,
    subtitulo: 'Documento de trabalho para discussão · versão 0.1, 16 de Novembro de 2026',
    limpar: [/^\*\*Projecto PEN Angola[^\n]*\n(?:Versão[^\n]*\n)?\s*---\s*\n/m],
    resumo: 'Coorte de rotina, avaliação do serviço e investigação de métodos mistos, alinhadas com o RE-AIM, o PRISM e o CFIR.' },
];

const yaml = (v) => (typeof v === 'number' ? String(v) : JSON.stringify(v));

function importar(p) {
  const pasta = p.pasta ? path.resolve(p.pasta) : LIVRO;
  let texto = fs.readFileSync(path.join(pasta, p.origem), 'utf8').replace(/\r\n/g, '\n');
  texto = texto.replace(/^---\n[\s\S]*?\n---\n+/, ''); // frontmatter antigo, se houver

  const h1 = texto.match(/^# (.+?)\s*(?:\{([^}]*)\})?\s*$/m);
  if (!h1) throw new Error(`${p.origem}: sem título de nível 1`);
  const titulo = h1[1].trim();
  const id = h1[2]?.match(/#([\w-]+)/)?.[1];
  texto = texto.replace(h1[0], '');

  let subtitulo = p.subtitulo;
  for (const r of p.limpar ?? []) texto = texto.replace(r, '');
  texto = texto.replace(/^::: ?\{\.chapter-subtitle\}\n([\s\S]*?)\n:::\n/m, (_, s) => {
    subtitulo = s.trim();
    return '';
  });

  const fm = { titulo, subtitulo, resumo: p.resumo, secao: p.secao, ordem: p.ordem, rota: p.rota, id, origem: p.origem };
  const cabecalho = Object.entries(fm)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${yaml(v)}`)
    .join('\n');

  const nota = `<!-- Importado de ${p.pasta ? '' : 'quarto_book/'}${p.origem}. Pode editar aqui; não é preciso voltar à origem. -->`;
  fs.writeFileSync(path.join(DESTINO, p.ficheiro), `---\n${cabecalho}\n---\n\n${nota}\n\n${texto.trim()}\n`);
  console.log(`${p.origem} → conteudo/${p.ficheiro}`);
}

fs.mkdirSync(DESTINO, { recursive: true });
const pedidos = process.argv.slice(2);
for (const p of PAGINAS) if (!pedidos.length || pedidos.includes(p.origem)) importar(p);

// Scripts dos componentes interactivos
const js = path.join(LIVRO, 'infografico');
const destinoJs = path.resolve('public/infografico');
fs.mkdirSync(destinoJs, { recursive: true });
for (const f of fs.readdirSync(js)) fs.copyFileSync(path.join(js, f), path.join(destinoJs, f));
console.log('infografico/*.js → public/infografico/');
