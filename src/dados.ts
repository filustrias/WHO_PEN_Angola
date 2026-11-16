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

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Períodos do calendário: "2026-10" (mês inteiro) ou "2026-11-1" / "2026-11-2" (quinzena).
 * Para fazer contas, cada período ocupa uma ou duas "meias" (quinzenas) num eixo contínuo.
 */
export interface Periodo {
  codigo: string;
  ano: number;
  mes: number; // 1–12
  quinzena: 0 | 1 | 2; // 0 = mês inteiro
  meiaInicio: number; // índice da primeira quinzena
  meiaFim: number; // índice da última quinzena (inclusive)
  inicio: string; // data ISO do primeiro dia
  fim: string; // data ISO do dia seguinte ao último
}

export function periodo(codigo: string): Periodo {
  const [a, m, q] = codigo.split('-').map(Number);
  const quinzena = (q === 1 || q === 2 ? q : 0) as 0 | 1 | 2;
  const base = (a * 12 + (m - 1)) * 2;
  const meiaInicio = quinzena === 2 ? base + 1 : base;
  const meiaFim = quinzena === 1 ? base : base + 1;
  return { codigo, ano: a, mes: m, quinzena, meiaInicio, meiaFim, inicio: dataDaMeia(meiaInicio), fim: dataDaMeia(meiaFim + 1) };
}

/** Data ISO em que começa uma quinzena do eixo (dia 1 ou dia 16). */
export function dataDaMeia(meia: number): string {
  const mesAbs = Math.floor(meia / 2);
  const a = Math.floor(mesAbs / 12);
  const m = (mesAbs % 12) + 1;
  return `${a}-${String(m).padStart(2, '0')}-${meia % 2 ? '16' : '01'}`;
}

export const nomeMes = (mes: number, curto = false) => (curto ? MESES_CURTOS : MESES)[mes - 1];

/** "Novembro de 2026 · 1.ª quinzena" ou "Junho de 2027" */
export function rotuloPeriodo(p: Periodo, curto = false): string {
  const mes = curto ? `${nomeMes(p.mes, true)} ${p.ano}` : `${nomeMes(p.mes)} de ${p.ano}`;
  return p.quinzena ? `${mes} · ${p.quinzena}.ª ${curto ? 'q' : 'quinzena'}` : mes;
}

export interface Actividade { texto: string; realizado: boolean; conjunta: boolean }
export interface LinhaCalendario { periodo: Periodo; pen: Actividade[]; plus: Actividade[]; marcos: string[] }

/** dados/calendario.csv agrupado por período, pela ordem do ficheiro. */
export function calendario(): LinhaCalendario[] {
  const linhas: LinhaCalendario[] = [];
  for (const l of lerCsv('calendario.csv')) {
    let linha = linhas.find((x) => x.periodo.codigo === l.periodo);
    if (!linha) { linha = { periodo: periodo(l.periodo), pen: [], plus: [], marcos: [] }; linhas.push(linha); }
    const a = { texto: l.texto, realizado: l.realizado === 'sim', conjunta: l.conjunta === 'sim' };
    if (l.pacote === 'pen') linha.pen.push(a);
    else if (l.pacote === 'plus') linha.plus.push(a);
    else if (l.pacote === 'marco') linha.marcos.push(l.texto);
  }
  return linhas;
}

export interface Etapa { nome: string; faixa: 'etapa' | 'pesquisa'; inicio: Periodo; fim: Periodo; descricao: string }

/** dados/etapas.csv: as etapas do projecto e as fases da pesquisa de implementação. */
export function etapas(): Etapa[] {
  return lerCsv('etapas.csv').map((l) => ({
    nome: l.nome,
    faixa: l.faixa === 'pesquisa' ? 'pesquisa' : 'etapa',
    inicio: periodo(l.inicio),
    fim: periodo(l.fim),
    descricao: l.descricao,
  }));
}
