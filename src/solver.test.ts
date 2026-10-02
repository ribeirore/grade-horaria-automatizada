// Casos de restrições e oráculo adaptados de Herick Pinheiro, d2e4c6a.
import { describe, expect, it } from 'vitest'
import { solve, measure, overlaps, validSection, timetableKey } from './solver'
import type { Course, Section, Slot, SolveRequest } from './types'
import type { Preferencia } from './domain/draft'
import dataset from './data/scheduling.json'

const slot = (start: number, end: number, day = 0): Slot => ({ day, start, end })
const section = (id: string, slots: Slot[], credits: number | null = 4): Section => ({
  id, slots, credits, code: id.split('-')[0], periodo: '20261', label: id,
})
const course = (code: string, sections: Section[]): Course => ({ code, name: code, sections })
const solveCourses = (courses: Course[], extra: Partial<SolveRequest> = {}) => solve({ periodo: '20261', courses, blocks: [], priorities: ['intervalos', 'dias'], ...extra })

it('permite adjacência e detecta colisão parcial, apenas no mesmo dia', () => {
  expect(overlaps(slot(540, 660), slot(660, 780))).toBe(false)
  expect(overlaps(slot(540, 660), slot(650, 780))).toBe(true)
  expect(overlaps(slot(540, 660), slot(540, 660, 1))).toBe(false)
})
it('bloquear um encontro impede a turma inteira; alternativa inclui todos os encontros', () => {
  const a = course('A', [section('A-1', [slot(540, 660), slot(540, 660, 2)]), section('A-2', [slot(660, 780), slot(660, 780, 3)])])
  const result = solveCourses([a], { blocks: [slot(600, 620, 2)] })
  expect(result.feasibleCount).toBe(1)
  expect(result.grades[0].sections[0].id).toBe('A-2')
  expect(result.grades[0].sections[0].slots).toHaveLength(2)
})
it('mede créditos uma vez, intervalos, médias e sábado; desconhecido permanece null', () => {
  const groups = [section('A-1', [slot(420, 540), slot(420, 540, 5)]), section('B-1', [slot(600, 660)])]
  expect(measure(groups)).toEqual({ days: 2, gapMinutes: 60, classMinutes: 300, credits: 8, earliest: 420, latest: 660, averageStart: 420, averageEnd: 600 })
  groups[1].credits = null
  expect(measure(groups).credits).toBeNull()
})
it('ranking lexicográfico muda ao inverter prioridades, sem peso escondido', () => {
  const a = course('A', [section('A-1', [slot(420, 480), slot(900, 960)]), section('A-2', [slot(480, 540, 0), slot(480, 540, 1)])])
  expect(solveCourses([a], { priorities: ['intervalos', 'dias'] }).grades[0].sections[0].id).toBe('A-2')
  expect(solveCourses([a], { priorities: ['dias', 'intervalos'] }).grades[0].sections[0].id).toBe('A-1')
})
it.each([['cedo', 'A-1'], ['tarde', 'A-2'], ['termino', 'A-1']] as const)('critério %s é explicável', (id, expected) => {
  const a = course('A', [section('A-1', [slot(420, 540)]), section('A-2', [slot(780, 900)])])
  expect(solveCourses([a], { priorities: [id] }).grades[0].sections[0].id).toBe(expected)
})
it('horários iguais têm representante determinístico e saída limitada a cinco', () => {
  const a = course('A', [section('A-2', [slot(420, 480)]), section('A-1', [slot(420, 480)]), ...Array.from({ length: 8 }, (_, i) => section(`A-${i+3}`, [slot(480 + i*60, 540+i*60)]))])
  const result = solveCourses([a], { priorities: [], limit: 99 })
  expect(result.grades).toHaveLength(5)
  expect(result.grades[0].sections[0].id).toBe('A-1')
  expect(new Set(result.grades.map((g) => timetableKey(g.sections))).size).toBe(5)
  expect(solveCourses([{ ...a, sections: a.sections.toReversed() }], { priorities: [] }).grades).toEqual(result.grades)
})
it('distingue oferta inutilizável e bloqueios eliminando todas as opções', () => {
  expect(solveCourses([course('A', [])]).issues[0]).toContain('nenhuma turma utilizável')
  const a = course('A', [section('A-1', [slot(420, 540)])])
  expect(solveCourses([a], { blocks: [slot(420, 540)] }).issues[0]).toContain('nenhuma turma atende aos bloqueios')
})
it('distingue conflito de pares e impossibilidade global', () => {
  const a = course('A', [section('A-1', [slot(420, 540)])])
  const b = course('B', [section('B-1', [slot(480, 600)])])
  expect(solveCourses([a, b]).issues[0]).toContain('todas as combinações')
  const triangle = ['A', 'B', 'C'].map((code) => course(code, [section(`${code}-1`, [slot(420, 540)]), section(`${code}-2`, [slot(540, 660)])]))
  const result = solveCourses(triangle)
  expect(result.complete).toBe(true)
  expect(result.feasibleCount).toBe(0)
  expect(result.issues[0]).toContain('combinação completa')
})
it('buscas cortadas por nós ou tempo não provam impossibilidade; resultados parciais são válidos', () => {
  const courses = ['A','B','C'].map((code, i) => course(code, [section(`${code}-1`, [slot(420,540,i)]), section(`${code}-2`, [slot(780,900,i)])]))
  for (const extra of [{ maxNodes: 1 }, { maxMs: 0 }]) {
    const result = solveCourses(courses, extra)
    expect(result.complete).toBe(false)
    expect(result.issues[0]).toContain('não prova')
  }
  const partial = solveCourses(courses, { maxNodes: 5 })
  expect(partial.complete).toBe(false)
  expect(partial.grades.length).toBeGreaterThan(0)
})
it('rejeita turma com choque interno, entrada malformada e evita seleção vazia fictícia', () => {
  expect(validSection(section('A-1', [slot(420,540), slot(500,600)]))).toBe(false)
  expect(solveCourses([]).grades).toHaveLength(0)
  expect(() => solveCourses([course('A', [])], { blocks: [slot(600,500)] })).toThrow()
  expect(() => solveCourses([course('A', [])], { priorities: ['cedo','tarde'] })).toThrow()
})

describe('oráculo cartesiano independente em 40 casos pequenos', () => {
  it('confere poda, contagem, deduplicação, ranking e top 5 para diferentes ordens', () => {
    const orders: Preferencia[][] = [[], ['intervalos', 'dias'], ['dias', 'tarde'], ['cedo', 'termino'], ['termino', 'intervalos']]
    for (let seed = 0; seed < 40; seed++) {
      const courses = Array.from({ length: 4 }, (_, i) => course(`C${i}`, Array.from({ length: 3 }, (_, j) => section(`C${i}-${j}`, [slot(420 + ((seed*(i+1)+j*2+i)%8)*60, 480+((seed*(i+1)+j*2+i)%8)*60, (i+j+seed)%3)]))))
      const combinations: Section[][] = []
      for (const a of courses[0].sections) for (const b of courses[1].sections) for (const c of courses[2].sections) for (const d of courses[3].sections) {
        const selected = [a,b,c,d]
        const slots = selected.flatMap((item) => item.slots)
        if (slots.some((s,i) => slots.slice(i+1).some((o) => s.day === o.day && Math.max(s.start,o.start) < Math.min(s.end,o.end)))) continue
        combinations.push(selected)
      }
      const independent = (selected: Section[]) => {
        const slots = selected.flatMap((s) => s.slots)
        let gaps = 0, starts = 0, ends = 0, days = 0
        for (let day = 0; day < 6; day++) {
          const meetings = slots.filter((s) => s.day === day).sort((a,b) => a.start-b.start)
          if (!meetings.length) continue
          days++; starts += meetings[0].start; ends += meetings.at(-1)!.end
          for (let i=1;i<meetings.length;i++) gaps += meetings[i].start-meetings[i-1].end
        }
        return { intervalos: gaps, dias: days, cedo: starts/days, tarde: -starts/days, termino: ends/days }
      }
      for (const priorities of orders) {
        const expected = [...combinations].sort((a,b) => {
          const x=independent(a), y=independent(b)
          for (const p of priorities) if (x[p] !== y[p]) return x[p]-y[p]
          return a.map((s) => `${s.periodo}/${s.id}`).join('|').localeCompare(b.map((s) => `${s.periodo}/${s.id}`).join('|'))
        })
        const result = solveCourses(courses, { priorities })
        expect(result.complete).toBe(true)
        expect(result.feasibleCount, `seed ${seed}`).toBe(combinations.length)
        expect(result.grades.map((g) => g.signature)).toEqual(expected.slice(0,5).map((sections) => sections.map((s) => `${s.periodo}/${s.id}`).join('|')))
      }
    }
  })
})
it('integridade oficial: 4943 turmas utilizáveis, 7942 blocos, quatro exclusões', () => {
  const sections = dataset.periods.flatMap((p) => p.courses.flatMap<Section>((c) => c.sections))
  expect(sections).toHaveLength(4943)
  expect(sections.reduce((sum,s) => sum+s.slots.length,0)).toBe(7942)
  expect(dataset.excluded).toHaveLength(4)
  expect(sections.every(validSection)).toBe(true)
  expect(sections.some((s) => s.credits === null)).toBe(true)
})
it('exemplo oficial: 203 combinações, até cinco alternativas válidas e 17 créditos', () => {
  const codes = ['MAT4162','INF1383','FIS4002','CRE1227']
  const courses = dataset.periods.find((p) => p.periodo === '20261')!.courses.filter((c) => codes.includes(c.code))
  const result = solveCourses(courses)
  expect(result.complete).toBe(true)
  expect(result.feasibleCount).toBe(203)
  expect(result.grades).toHaveLength(5)
  expect(result.grades[0].metrics.gapMinutes).toBe(0)
  expect(result.grades[0].metrics.credits).toBe(17)
  for (const g of result.grades) {
    expect(new Set(g.sections.map((s) => s.code)).size).toBe(4)
    const slots=g.sections.flatMap((s) => s.slots)
    expect(slots.some((s,i) => slots.slice(i+1).some((o) => overlaps(s,o)))).toBe(false)
  }
})
