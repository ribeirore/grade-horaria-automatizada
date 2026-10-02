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

# Scheduling verification deliberately independent of TypeScript normalization.
scheduling = json.loads(Path('src/data/scheduling.json').read_text())
assert scheduling['source'] == catalog['source']
classes = defaultdict(list)
for row in schedule:
    classes[(row['periodo'], row['turma_id'])].append(row)
days = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
def minute(value):
    h, m = map(int, value.split(':'))
    assert 0 <= h < 24 and 0 <= m < 60
    return 60 * h + m
expected_sections = {}
excluded = []
for (period, identity), rows in sorted(classes.items()):
    codes = {r['cod_disciplina'] for r in rows}
    assert len(codes) == 1
    slots = sorted({(days.index(r['dia_semana']), minute(r['hora_inicio']), minute(r['hora_fim'])) for r in rows})
    assert all(start < end for day, start, end in slots)
    if any(a[0] == b[0] and max(a[1], b[1]) < min(a[2], b[2]) for i, a in enumerate(slots) for b in slots[i+1:]):
        excluded.append({'periodo': period, 'turmaId': identity, 'reason': 'Blocos da própria turma se sobrepõem'})
        continue
    expected_sections[(period, identity)] = (next(iter(codes)), slots, rows[0]['turma'])
assert scheduling['excluded'] == excluded
assert len(excluded) == 4
actual_sections = {}
for period in scheduling['periods']:
    offer = next(o for o in catalog['ofertas'] if o['periodo'] == period['periodo'])
    courses = {c['codigo']: c for c in offer['disciplinas']}
    assert {c['code'] for c in period['courses']} == set(courses)
    for course in period['courses']:
        assert course['name'] == courses[course['code']]['nome']
        for section in course['sections']:
            key = (section['periodo'], section['id'])
            assert section['periodo'] == period['periodo']
            assert key not in actual_sections
            assert section['code'] == course['code']
            assert section['credits'] == courses[course['code']]['creditos']
            actual_sections[key] = (section['code'], [(s['day'], s['start'], s['end']) for s in section['slots']], section['label'])
assert actual_sections == expected_sections
assert len(actual_sections) == 4943
assert sum(len(s[1]) for s in actual_sections.values()) == 7942
assert not any(field in json.dumps(scheduling) for field in ['PROF_', 'SALA_', 'professor_id', 'sala_id'])
report = {'revision': scheduling['source']['revision'], 'usableClasses': len(actual_sections), 'usableBlocks': 7942, 'excluded': excluded, 'result': 'All identities, complete meetings, labels, unknown credits and exclusions match independent CSV normalization.'}
Path('docs/scheduling-verification.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
print(json.dumps(report, indent=2, ensure_ascii=False))
