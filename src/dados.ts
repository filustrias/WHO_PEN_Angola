import fs from 'node:fs';
import path from 'node:path';

/** Lê um CSV de dados/ (separador vírgula, aspas para campos com vírgulas). */
export function lerCsv(nome: string): Record<string, string>[] {
  const texto = fs.readFileSync(path.resolve('dados', nome), 'utf8').replace(/^﻿/, '');
  const linhas: string[][] = [];
  let campo = '';
  let linha: string[] = [];
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); campo = '';
      if (linha.some((x) => x.trim() !== '')) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); if (linha.some((x) => x.trim() !== '')) linhas.push(linha); }
  const [cabecalho, ...resto] = linhas;
  return resto.map((l) => Object.fromEntries(cabecalho.map((k, j) => [k.trim(), (l[j] ?? '').trim()])));
}

export type Estado = 'concluido' | 'em-curso' | 'por-fazer' | 'a-confirmar';

export const ESTADOS: Record<Estado, string> = {
  concluido: 'Concluído',
  'em-curso': 'Em curso',
  'por-fazer': 'Por fazer',
  'a-confirmar': 'A confirmar',
};

export interface Actividade { actividade: string; inicio: string; fim: string; estado: Estado; notas: string }
export interface Fase { nome: string; inicio: string; fim: string; actividades: Actividade[] }

/** Agrupa as linhas de dados/cronograma.csv por fase, pela ordem em que aparecem. */
export function cronograma(): Fase[] {
  const fases: Fase[] = [];
  for (const l of lerCsv('cronograma.csv')) {
    let f = fases.find((x) => x.nome === l.fase);
    if (!f) { f = { nome: l.fase, inicio: l.inicio, fim: l.fim, actividades: [] }; fases.push(f); }
    const estado = (l.estado in ESTADOS ? l.estado : 'a-confirmar') as Estado;
    f.actividades.push({ actividade: l.actividade, inicio: l.inicio, fim: l.fim, estado, notas: l.notas });
    if (l.inicio < f.inicio) f.inicio = l.inicio;
    if (l.fim > f.fim) f.fim = l.fim;
  }
  return fases;
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** "2026-10" → índice absoluto de mês, para fazer contas. */
export const mesIndice = (am: string) => { const [a, m] = am.split('-').map(Number); return a * 12 + (m - 1); };
export const mesDeIndice = (i: number) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
export const nomeMes = (am: string, curto = false) => {
  const [a, m] = am.split('-').map(Number);
  const n = MESES[m - 1];
  return curto ? n.slice(0, 3) : `${n} de ${a}`;
};
/** "Outubro a Novembro de 2026" ou "Outubro de 2026 a Março de 2027" */
export function periodo(inicio: string, fim: string): string {
  if (inicio === fim) return nomeMes(inicio);
  const [ai] = inicio.split('-');
  const [af] = fim.split('-');
  return ai === af ? `${nomeMes(inicio).split(' de ')[0]} a ${nomeMes(fim)}` : `${nomeMes(inicio)} a ${nomeMes(fim)}`;
}
