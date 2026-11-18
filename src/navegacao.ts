import { getCollection } from 'astro:content';

/** Junta o prefixo do site (base path) a um caminho interno. */
export function caminho(rota = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const limpa = rota.replace(/^\/+/, '');
  return base + limpa;
}

export interface Seccao {
  id: string;
  rotulo: string;
  descricao: string;
  cor: 'terracota' | 'petroleo' | 'ocre' | 'savana';
}

/** Ordem do menu. As páginas de cada secção vêm de conteudo/*.md (campo "secao"). */
export const SECCOES: Seccao[] = [
  { id: 'projecto', rotulo: 'Projecto', cor: 'terracota',
    descricao: 'Âmbito, financiamento e frentes de trabalho.' },
  { id: 'estrutura', rotulo: 'Estrutura', cor: 'petroleo',
    descricao: 'Níveis de atenção, fluxo de pacientes, PCDT e participação dos atores.' },
  { id: 'calendario', rotulo: 'Calendário', cor: 'ocre',
    descricao: 'O calendário conjunto WHO PEN e PEN-Plus, de Outubro de 2026 a Outubro de 2027.' },
  { id: 'ciencia', rotulo: 'Ciência da implementação', cor: 'petroleo',
    descricao: 'Inovação, investigação de implementação e os enquadramentos.' },
  { id: 'implementacao', rotulo: 'RE-AIM e CFIR', cor: 'savana',
    descricao: 'Os dois enquadramentos aplicados ao PEN, com simuladores e exercícios.' },
  { id: 'evidencia', rotulo: 'Evidência', cor: 'petroleo',
    descricao: 'Literatura sobre o PEN e mapa de guias e materiais.' },
  { id: 'lacunas', rotulo: 'Protocolos e seguimento', cor: 'terracota',
    descricao: 'Das lacunas de cuidado aos protocolos clínicos e ao seguimento dos utentes.' },
];

export interface ItemPagina {
  titulo: string;
  rota: string;
  secao: string;
  resumo: string;
}

/** Páginas que não vêm do Markdown (são ficheiros .astro próprios). */
const PAGINAS_PROPRIAS: ItemPagina[] = [
  { titulo: 'Estrutura do projecto', rota: 'estrutura/', secao: 'estrutura', resumo: 'Níveis de atenção, fluxo de pacientes, PCDT e participação dos atores.' },
  { titulo: 'Calendário', rota: 'calendario/', secao: 'calendario', resumo: 'O calendário conjunto WHO PEN e PEN-Plus, quinzena a quinzena.' },
];

/** Todas as páginas pela ordem de leitura: secção, depois campo "ordem". */
export async function paginasOrdenadas(): Promise<ItemPagina[]> {
  const md = await getCollection('paginas');
  const todas: (ItemPagina & { ordem: number })[] = [
    ...md.map((p) => ({ titulo: p.data.titulo, rota: p.data.rota, secao: p.data.secao, resumo: p.data.resumo, ordem: p.data.ordem })),
    ...PAGINAS_PROPRIAS.map((p) => ({ ...p, ordem: 0 })),
  ];
  const posicao = (s: string) => SECCOES.findIndex((x) => x.id === s);
  return todas.sort((a, b) => posicao(a.secao) - posicao(b.secao) || a.ordem - b.ordem);
}

/** Primeira página de cada secção (destino do item do menu). */
export async function entradaDaSeccao(id: string): Promise<string> {
  const todas = await paginasOrdenadas();
  return todas.find((p) => p.secao === id)?.rota ?? '';
}
