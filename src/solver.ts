// Adaptado do motor de Herick Pinheiro, origin/feature d2e4c6a.
// Busca, poda e medição preservadas; contratos, ranking e créditos revisados para MatriculIA.
import type { Grade, Metrics, Section, Slot, SolveRequest, SolveResult } from './types'
import type { Preferencia } from './domain/draft'
import { preferencias } from './domain/draft'

export function overlaps(a: Slot, b: Slot): boolean {
  return a.day === b.day && a.start < b.end && b.start < a.end
}
export function conflicts(a: Section, b: Section): boolean {
  return a.slots.some((slot) => b.slots.some((other) => overlaps(slot, other)))
}
export function validSlot(slot: Slot): boolean {
  return Number.isInteger(slot.day) && slot.day >= 0 && slot.day < 6 &&
    Number.isInteger(slot.start) && Number.isInteger(slot.end) &&
    slot.start >= 0 && slot.end <= 1440 && slot.start < slot.end
}
export function validSection(section: Section): boolean {
  return section.slots.length > 0 && section.slots.every((slot, i) =>
    validSlot(slot) && !section.slots.slice(i + 1).some((other) => overlaps(slot, other)))
}
export function measure(sections: Section[]): Metrics {
  let gapMinutes = 0
  let classMinutes = 0
  let days = 0
  let firstSum = 0
  let lastSum = 0
  let earliest = 1440
  let latest = 0
  const allSlots = sections.flatMap((section) => section.slots)
  for (let day = 0; day < 6; day++) {
    const slots = allSlots.filter((slot) => slot.day === day).sort((a, b) => a.start - b.start)
    if (!slots.length) continue
    days++
    const first = slots[0].start
    const last = slots[slots.length - 1].end
    const duration = slots.reduce((total, slot) => total + slot.end - slot.start, 0)
    firstSum += first
    lastSum += last
    classMinutes += duration
    earliest = Math.min(earliest, first)
    latest = Math.max(latest, last)
    gapMinutes += last - first - duration
  }
  return {
    gapMinutes, classMinutes, days, earliest: days ? earliest : 0, latest,
    averageStart: days ? firstSum / days : 0,
    averageEnd: days ? lastSum / days : 0,
    credits: sections.some((section) => section.credits === null)
      ? null : sections.reduce((sum, section) => sum + section.credits!, 0),
  }
}
export function compareGrades(a: Grade, b: Grade, priorities: Preferencia[]): number {
  for (const priority of priorities) {
    const values = {
      intervalos: a.metrics.gapMinutes - b.metrics.gapMinutes,
      dias: a.metrics.days - b.metrics.days,
      cedo: a.metrics.averageStart - b.metrics.averageStart,
      tarde: b.metrics.averageStart - a.metrics.averageStart,
      termino: a.metrics.averageEnd - b.metrics.averageEnd,
    }
    if (values[priority]) return values[priority]
  }
  return a.signature.localeCompare(b.signature)
}
export function timetableKey(sections: Section[]): string {
  return [...sections].sort((a, b) => a.code.localeCompare(b.code)).map((section) =>
    `${section.code}:${section.slots.map((slot) => `${slot.day}/${slot.start}/${slot.end}`).sort().join(',')}`,
  ).join('|')
}
export function solve(request: SolveRequest): SolveResult {
  const started = performance.now()
  const result: SolveResult = { grades: [], complete: true, feasibleCount: 0, nodes: 0, elapsedMs: 0, issues: [] }
  const finish = () => {
    result.elapsedMs = performance.now() - started
    return result
  }
  if (!request.courses.length) {
    result.issues.push('Selecione pelo menos uma disciplina.')
    return finish()
  }
  if (new Set(request.courses.map((course) => course.code)).size !== request.courses.length ||
    request.blocks.some((slot) => !validSlot(slot)) ||
    request.priorities.some((id) => !Object.hasOwn(preferencias, id)) ||
    new Set(request.priorities).size !== request.priorities.length ||
    (request.priorities.includes('cedo') && request.priorities.includes('tarde')) ||
    request.courses.some((course) => course.sections.some((section) => section.periodo !== request.periodo || section.code !== course.code))) {
    throw new Error('Entrada da geração inválida')
  }
  const candidates = request.courses.map((course) => {
    const usable = course.sections.filter(validSection)
    const options = usable.filter((section) => !section.slots.some((slot) => request.blocks.some((block) => overlaps(slot, block))))
    if (!usable.length) result.issues.push(`${course.code}: nenhuma turma utilizável na oferta normalizada deste período.`)
    else if (!options.length) result.issues.push(`${course.code}: nenhuma turma atende aos bloqueios. Libere um horário ou retire a disciplina.`)
    return { course, options: options.sort((a, b) => a.id.localeCompare(b.id)) }
  })
  if (result.issues.length) return finish()
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      if (candidates[i].options.every((a) => candidates[j].options.every((b) => conflicts(a, b)))) {
        result.issues.push(`${candidates[i].course.code} e ${candidates[j].course.code}: todas as combinações disponíveis têm choque entre si. Retire uma delas ou libere um bloqueio.`)
      }
    }
  }
  if (result.issues.length) return finish()
  candidates.sort((a, b) => a.options.length - b.options.length || a.course.code.localeCompare(b.course.code))
  const selected: Section[] = []
  const maxNodes = request.maxNodes ?? 1_000_000
  const maxMs = request.maxMs ?? 3500
  const limit = Math.min(5, Math.max(1, Math.floor(request.limit ?? 5)))
  if (!Number.isFinite(maxNodes) || maxNodes < 0 || !Number.isFinite(maxMs) || maxMs < 0 || !Number.isFinite(limit)) {
    throw new Error('Limites da geração inválidos')
  }
  const top = new Map<string, Grade>()
  const compare = (a: Grade, b: Grade) => compareGrades(a, b, request.priorities)
  function visit(depth: number) {
    if (!result.complete) return
    if (result.nodes >= maxNodes || performance.now() - started >= maxMs) {
      result.complete = false
      return
    }
    result.nodes++
    if (depth === candidates.length) {
      result.feasibleCount++
      const sections = [...selected].sort((a, b) => a.code.localeCompare(b.code))
      const signature = sections.map((section) => `${section.periodo}/${section.id}`).join('|')
      const timetable = timetableKey(sections)
      const grade = { sections, metrics: measure(sections), signature }
      const previous = top.get(timetable)
      if (!previous || compare(grade, previous) < 0) top.set(timetable, grade)
      if (top.size > limit) {
        const worst = [...top].sort(([, a], [, b]) => compare(a, b)).at(-1)!
        top.delete(worst[0])
      }
      return
    }
    for (const option of candidates[depth].options) {
      if (selected.some((other) => conflicts(option, other))) continue
      // Poda preservada: cada disciplina restante deve ter uma opção compatível.
      if (candidates.slice(depth + 1).some(({ options }) => !options.some((future) =>
        !conflicts(option, future) && selected.every((other) => !conflicts(other, future))))) continue
      selected.push(option)
      visit(depth + 1)
      selected.pop()
      if (!result.complete) return
    }
  }
  visit(0)
  result.grades = [...top.values()].sort(compare)
  if (!result.grades.length) result.issues.push(result.complete
    ? 'Não existe uma grade para todas essas disciplinas com as restrições atuais. A combinação completa é impossível. Retire uma disciplina ou libere um bloqueio.'
    : 'A busca atingiu o limite antes de encontrar uma grade. Isso não prova impossibilidade. Reduza a seleção e tente novamente.')
  return finish()
}
