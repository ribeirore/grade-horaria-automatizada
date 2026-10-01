import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { solve, measure, gradeCost, overlaps, normalizeSearch, searchCourses, validSection } from '../src/solver.ts'
import { parseCsv } from '../scripts/prepare-data.mjs'
import type { Course, Dataset, Preferences, Section, Slot } from '../src/types.ts'

const preferences: Preferences = { gaps: 5, days: 2, start: 0, finish: 0, startMode: 'neutral' }
const section = (id: string, slots: Slot[]): Section => ({ id, label: id, credits: 4, slots })
const course = (code: string, sections: Section[]): Course => ({ code, name: code, abbreviation: code, catalogMatched: true, sections })
const slot = (start: number, end: number, day = 0): Slot => ({ day, start, end })
const solveCourses = (courses: Course[], extra = {}) => solve({ courses, blocks: [], locks: {}, preferences, ...extra })

test('CSV respeita vírgulas citadas, aspas, linhas citadas e CRLF', () => {
  assert.deepEqual(parseCsv('code,name\r\nA,"Leitor, espectador"\r\nB,"Nome ""citado"""\r\nC,"duas\nlinhas"'), [
    { code: 'A', name: 'Leitor, espectador' }, { code: 'B', name: 'Nome "citado"' }, { code: 'C', name: 'duas\nlinhas' },
  ])
  assert.throws(() => parseCsv('code,name\nA,"não encerrado'), /aspas/)
  assert.throws(() => parseCsv('code,name\nA,B,C'), /colunas/)
})
test('intervalos adjacentes são permitidos e sobreposição parcial é conflito', () => {
  assert.equal(overlaps(slot(540, 660), slot(660, 780)), false)
  assert.equal(overlaps(slot(540, 660), slot(650, 780)), true)
  assert.equal(overlaps(slot(540, 660), slot(540, 660, 1)), false)
})
test('turma inteira: bloqueio de um encontro impede a turma e a alternativa inclui todos seus blocos', () => {
  const a = course('A', [section('A-1', [slot(540, 660), slot(540, 660, 2)]), section('A-2', [slot(660, 780), slot(660, 780, 3)])])
  const result = solveCourses([a], { blocks: [slot(600, 620, 2)] })
  assert.equal(result.feasibleCount, 1)
  assert.equal(result.grades[0].sections[0].id, 'A-2')
  assert.equal(result.grades[0].sections[0].slots.length, 2)
})
test('uma turma por disciplina, créditos contados uma vez e métricas verificáveis', () => {
  const sections = [section('A-1', [slot(420, 540), slot(420, 540, 2)]), section('B-1', [slot(600, 660)])]
  const metrics = measure(sections)
  assert.equal(metrics.days, 2); assert.equal(metrics.gapMinutes, 60)
  assert.equal(metrics.classMinutes, 300); assert.equal(metrics.credits, 8)
  assert.equal(metrics.earliest, 420); assert.equal(metrics.latest, 660)
  assert.equal(metrics.averageStart, 420); assert.equal(metrics.averageEnd, 600)
  assert.equal(gradeCost(metrics, preferences), 9)
})
test('preferências de início e fim alteram a melhor opção de modo previsível', () => {
  const a = course('A', [section('A-1', [slot(420, 540)]), section('A-2', [slot(780, 900)])])
  assert.equal(solveCourses([a], { preferences: { ...preferences, start: 5, startMode: 'early' } }).grades[0].sections[0].id, 'A-1')
  assert.equal(solveCourses([a], { preferences: { ...preferences, start: 5, startMode: 'late' } }).grades[0].sections[0].id, 'A-2')
  assert.equal(solveCourses([a], { preferences: { ...preferences, finish: 5 } }).grades[0].sections[0].id, 'A-1')
})
test('turma fixada é respeitada, inclusive quando torna a combinação impossível', () => {
  const a = course('A', [section('A-1', [slot(420, 540)]), section('A-2', [slot(780, 900)])])
  assert.equal(solveCourses([a], { locks: { A: 'A-2' } }).grades[0].sections[0].id, 'A-2')
  const result = solveCourses([a], { locks: { A: 'A-2' }, blocks: [slot(800, 820)] })
  assert.equal(result.complete, true); assert.equal(result.grades.length, 0)
  assert.match(result.issues[0], /nenhuma turma/)
})
test('um conflito de pares é explicado e uma incompatibilidade global também é detectada', () => {
  const a = course('A', [section('A-1', [slot(420, 540)])]), b = course('B', [section('B-1', [slot(480, 600)])])
  assert.match(solveCourses([a, b]).issues[0], /todas as combinações/)
  const triangle = ['A', 'B', 'C'].map((code) => course(code, [section(`${code}-1`, [slot(420, 540)]), section(`${code}-2`, [slot(540, 660)])]))
  const result = solveCourses(triangle)
  assert.equal(result.complete, true); assert.equal(result.feasibleCount, 0)
  assert.match(result.issues[0], /combinação completa/)
})
test('busca limitada nunca declara inviabilidade comprovada ou ótimo global', () => {
  const courses = ['A', 'B', 'C'].map((code, index) => course(code, [section(`${code}-1`, [slot(420, 540, index)]), section(`${code}-2`, [slot(780, 900, index)])]))
  const result = solveCourses(courses, { maxNodes: 1 })
  assert.equal(result.complete, false); assert.match(result.issues[0], /não prova/)
})
test('turmas com conflitos internos são rejeitadas; seleção vazia não gera grade fictícia', () => {
  assert.equal(validSection(section('A-1', [slot(420, 540), slot(500, 600)])), false)
  assert.equal(solveCourses([]).grades.length, 0)
})
test('oráculo por produto cartesiano confere a poda e a contagem em 40 casos pequenos', () => {
  // Enumerador independente sem poda; detecta qualquer perda de solução na busca otimizada.
  for (let seed = 0; seed < 40; seed++) {
    const courses = Array.from({ length: 4 }, (_, i) => course(`C${i}`, Array.from({ length: 3 }, (_, j) => section(`C${i}-${j}`, [slot(420 + ((seed * (i + 1) + j * 2 + i) % 8) * 60, 480 + ((seed * (i + 1) + j * 2 + i) % 8) * 60, (i + j + seed) % 3)]))))
    let count = 0, minimum = Infinity
    for (const a of courses[0].sections) for (const b of courses[1].sections) for (const c of courses[2].sections) for (const d of courses[3].sections) {
      const chosen = [a, b, c, d], slots = chosen.flatMap((item) => item.slots)
      if (slots.some((item, index) => slots.slice(index + 1).some((other) => item.day === other.day && Math.max(item.start, other.start) < Math.min(item.end, other.end)))) continue
      count++; minimum = Math.min(minimum, gradeCost(measure(chosen), preferences))
    }
    const result = solveCourses(courses)
    assert.equal(result.complete, true); assert.equal(result.feasibleCount, count, `seed ${seed}`)
    if (count) assert.equal(result.grades[0].cost, minimum)
  }
})
test('busca por nome e código ignora acentos, caixa e exige todos os termos', () => {
  const courses = [course('MAT4162', []), { ...course('INF1383', []), name: 'Bancos de Dados' }]
  assert.equal(searchCourses(courses, 'inf dados')[0].code, 'INF1383')
  assert.equal(normalizeSearch(' CÁLCULO '), 'calculo')
})

const dataset: Dataset = JSON.parse(readFileSync(new URL('../public/data/offering.json', import.meta.url), 'utf8'))
test('base real: integridade da normalização em ambos os períodos', () => {
  assert.equal(dataset.meta.rawRows, 74381); assert.equal(dataset.meta.rawSections, 4947)
  assert.equal(dataset.meta.logicalSlots, 7952); assert.equal(dataset.meta.excluded.length, 4)
  assert.equal(dataset.meta.missingCatalogCodes, 927)
  let sectionCount = 0, slots = 0
  for (const period of dataset.periods) {
    assert.equal(new Set(period.courses.map((item) => item.code)).size, period.courses.length)
    for (const item of period.courses) for (const group of item.sections) {
      assert.equal(validSection(group), true, `${period.id}/${group.id}`)
      assert.equal(new Set(group.slots.map((item) => `${item.day}/${item.start}/${item.end}`)).size, group.slots.length)
      sectionCount++; slots += group.slots.length
    }
  }
  assert.equal(sectionCount, 4943); assert.equal(slots, 7942)
})
test('base real: exemplo de 4 disciplinas tem 203 combinações e todas as alternativas são válidas', () => {
  const period = dataset.periods.find((item) => item.id === '20261')!
  const codes = ['MAT4162', 'INF1383', 'FIS4002', 'CRE1227']
  const courses = period.courses.filter((item) => codes.includes(item.code))
  const result = solveCourses(courses)
  assert.equal(result.complete, true); assert.equal(result.feasibleCount, 203)
  assert.equal(result.grades[0].metrics.gapMinutes, 0)
  assert.equal(result.grades[0].metrics.credits, 17)
  const timetables = result.grades.map((grade) => grade.sections.map((section) => `${section.id.split('-')[0]}:${JSON.stringify(section.slots)}`).join('|'))
  assert.equal(new Set(timetables).size, result.grades.length)
  const sameTimes = solveCourses([course('A', [section('A-1', [slot(420, 540)]), section('A-2', [slot(420, 540)]), section('A-3', [slot(540, 660)])])])
  assert.equal(sameTimes.feasibleCount, 3)
  assert.equal(sameTimes.grades.length, 2)
  for (const grade of result.grades) {
    assert.equal(grade.sections.length, 4)
    assert.equal(new Set(grade.sections.map((item) => item.id.split('-')[0])).size, 4)
    const slots = grade.sections.flatMap((item) => item.slots)
    assert.equal(slots.some((item, index) => slots.slice(index + 1).some((other) => overlaps(item, other))), false)
  }
})
