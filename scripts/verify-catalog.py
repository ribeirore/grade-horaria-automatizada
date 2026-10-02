"""Independent verification with Python's standard CSV library, against raw inputs.
Usage: python3 scripts/verify-catalog.py /tmp/turmas.csv /tmp/disciplinas.csv
Raw files stay outside the repository and the public bundle.
"""
import csv
import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path

schedule_path, names_path = map(Path, sys.argv[1:3])
schedule = list(csv.DictReader(schedule_path.open(encoding='utf-8-sig')))
names = {row['cod_disciplina']: row for row in csv.DictReader(names_path.open(encoding='utf-8-sig'))}
catalog = json.loads(Path('src/data/catalog.json').read_text())
grouped = defaultdict(list)
for row in schedule:
    grouped[(row['periodo'], row['cod_disciplina'])].append(row)

report = {'revision': catalog['source']['revision'], 'checkedCourses': len(grouped), 'periods': []}
for offer in catalog['ofertas']:
    period = offer['periodo']
    expected_codes = {code for p, code in grouped if p == period}
    assert {course['codigo'] for course in offer['disciplinas']} == expected_codes
    for course in offer['disciplinas']:
        rows = grouped[(period, course['codigo'])]
        full = names.get(course['codigo'])
        assert course['turmas'] == len({(row['periodo'], row['turma_id']) for row in rows})
        assert course['nome'] == (full['disciplina'] if full and full['disciplina'] else rows[0]['disciplina_abrev']).strip()
        assert course['nomeCompleto'] == bool(full and full['disciplina'])
        credit_values = {float(row['creditos']) if row['creditos'].strip() else None for row in rows}
        if full:
            credit_values.add(float(full['creditos']) if full['creditos'].strip() else None)
        assert course['creditos'] == (next(iter(credit_values)) if len(credit_values) == 1 else None)
    period_rows = [row for row in schedule if row['periodo'] == period]
    classes = len({(row['periodo'], row['turma_id']) for row in period_rows})
    blocks = len({(row['turma_id'], row['dia_semana'], row['hora_inicio'], row['hora_fim']) for row in period_rows})
    assert offer['totalTurmas'] == classes
    assert offer['totalBlocos'] == blocks
    report['periods'].append({'periodo': period, 'courses': len(expected_codes), 'classes': classes, 'blocks': blocks, 'missingFullNames': sum(not c['nomeCompleto'] for c in offer['disciplinas']), 'unknownCredits': sum(c['creditos'] is None for c in offer['disciplinas'])})
for source, path in zip(catalog['source']['files'], [schedule_path, names_path]):
    assert source['sha256'] == hashlib.sha256(path.read_bytes()).hexdigest()
payload = json.dumps(catalog)
assert not any(field in payload for field in ['PROF_', 'SALA_', 'professor_id', 'sala_id'])
report['result'] = 'Every offered course, name, credit value, class count, period total, block total and source hash matches.'
Path('docs/catalog-verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
