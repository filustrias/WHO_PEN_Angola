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
  { id: 'cronograma', rotulo: 'Cronograma', cor: 'ocre',
    descricao: 'Onde estamos e o que vem a seguir.' },
  { id: 'ciencia', rotulo: 'Ciência da implementação', cor: 'petroleo',
    descricao: 'Inovação, investigação de implementação e os enquadramentos.' },
  { id: 'implementacao', rotulo: 'RE-AIM e CFIR', cor: 'savana',
    descricao: 'Os dois enquadramentos aplicados ao PEN, com simuladores e exercícios.' },
  { id: 'evidencia', rotulo: 'Evidência', cor: 'petroleo',
    descricao: 'Literatura sobre o PEN e mapa de guias e materiais.' },
  { id: 'lacunas', rotulo: 'Lacunas de cuidado', cor: 'terracota',
    descricao: 'Da guia clínica ao indicador no piloto.' },
];

export interface ItemPagina {
  titulo: string;
  rota: string;
  secao: string;
  resumo: string;
}

/** Páginas que não vêm do Markdown (são ficheiros .astro próprios). */
const PAGINAS_PROPRIAS: ItemPagina[] = [
  { titulo: 'Cronograma', rota: 'cronograma/', secao: 'cronograma', resumo: 'Fases, actividades e estado do projecto.' },
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
