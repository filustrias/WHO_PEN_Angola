"""Converte a planilha do calendário conjunto em dados/calendario.csv.

Uso (na pasta site/):  python scripts/importar-calendario.py
Lê o ficheiro "Calendário conjunto WHO PEN e PEN-Plus Angola*.xlsx" da pasta acima (PEN Angola).

Cada célula da planilha tem várias linhas começadas por "•"; cada linha vira uma actividade.
"(realizado)" passa a estado "realizado"; "(conjunta)", "(conjunto)" ou ", conjunta" no fim
passa a marca "conjunta". Os marcos, separados por ";", ficam com pacote "marco".
"""
import csv
import glob
import re
import sys
from pathlib import Path

import openpyxl

MESES = {'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
         'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12}

pasta = Path(__file__).resolve().parents[2]
ficheiros = sorted(glob.glob(str(pasta / 'Calendário conjunto WHO PEN e PEN-Plus Angola*.xlsx')))
if not ficheiros:
    sys.exit('Planilha do calendário não encontrada em ' + str(pasta))

folha = openpyxl.load_workbook(ficheiros[-1], data_only=True).worksheets[0]


def codigo(rotulo: str) -> str:
    """'Nov 2026 · 1.ª q' → '2026-11-1'; 'Jun 2027' → '2027-06'."""
    m = re.match(r'(\w{3})\w*\s+(\d{4})(?:\s*·\s*(\d)\.ª\s*q)?', rotulo.strip(), re.I)
    if not m:
        raise ValueError(f'Período não reconhecido: {rotulo!r}')
    mes = MESES[m.group(1).lower()]
    base = f'{m.group(2)}-{mes:02d}'
    return f'{base}-{m.group(3)}' if m.group(3) else base


def actividades(celula):
    for linha in str(celula or '').splitlines():
        texto = re.sub(r'^\s*[•\-]\s*', '', linha).strip()
        if not texto:
            continue
        realizado = bool(re.search(r'\(realizad[oa]\)', texto, re.I))
        texto = re.sub(r'\s*\(realizad[oa]\)', '', texto, flags=re.I).strip()
        conjunta = bool(re.search(r'(\((conjunt[oa])\)|,\s*conjunt[oa])\s*$', texto, re.I))
        texto = re.sub(r'(\s*\((conjunt[oa])\)|,\s*conjunt[oa])\s*$', '', texto, flags=re.I).strip()
        yield texto, realizado, conjunta


linhas = []
cabecalho_visto = False
for periodo, pen, plus, marcos in folha.iter_rows(min_row=1, max_col=4, values_only=True):
    if not cabecalho_visto:
        cabecalho_visto = str(periodo or '').strip().lower() == 'período'
        continue
    if not periodo:
        continue
    cod = codigo(str(periodo))
    for pacote, celula in (('pen', pen), ('plus', plus)):
        for texto, realizado, conjunta in actividades(celula):
            linhas.append([cod, pacote, texto, 'sim' if realizado else '', 'sim' if conjunta else ''])
    for marco in str(marcos or '').split(';'):
        marco = marco.strip()
        if marco:
            linhas.append([cod, 'marco', marco[0].upper() + marco[1:], '', ''])

destino = Path(__file__).resolve().parents[1] / 'dados' / 'calendario.csv'
with open(destino, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['periodo', 'pacote', 'texto', 'realizado', 'conjunta'])
    w.writerows(linhas)
print(f'{len(linhas)} linhas -> {destino}')
