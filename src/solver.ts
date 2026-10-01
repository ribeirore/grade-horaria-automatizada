import type { Course, Grade, Metrics, Preferences, Section, Slot, SolveRequest, SolveResult } from './types.ts'

export function overlaps(a: Slot, b: Slot): boolean {
  return a.day === b.day && a.start < b.end && b.start < a.end
}
export function conflicts(a: Section, b: Section): boolean {
  return a.slots.some((slot) => b.slots.some((other) => overlaps(slot, other)))
}
export function validSection(section: Section): boolean {
  return section.slots.length > 0 && section.slots.every((slot, i) =>
    Number.isInteger(slot.day) && slot.day >= 0 && slot.day < 6 &&
    slot.start >= 0 && slot.end <= 1440 && slot.start < slot.end &&
    !section.slots.slice(i + 1).some((other) => overlaps(slot, other)))
}
export function measure(sections: Section[]): Metrics {
  let gapMinutes = 0, classMinutes = 0, days = 0, firstSum = 0, lastSum = 0
  let earliest = 1440, latest = 0
  for (let day = 0; day < 6; day++) {
    const slots = sections.flatMap((section) => section.slots).filter((slot) => slot.day === day).sort((a, b) => a.start - b.start)
    if (!slots.length) continue
    days++
    const first = slots[0].start, last = slots[slots.length - 1].end
    const duration = slots.reduce((total, slot) => total + slot.end - slot.start, 0)
    firstSum += first; lastSum += last; classMinutes += duration
    earliest = Math.min(earliest, first); latest = Math.max(latest, last)
    gapMinutes += last - first - duration
  }
  return { gapMinutes, classMinutes, days, earliest: days ? earliest : 0, latest, averageStart: days ? firstSum / days : 0, averageEnd: days ? lastSum / days : 0, credits: sections.reduce((sum, section) => sum + section.credits, 0) }
}
export function gradeCost(metrics: Metrics, preferences: Preferences): number {
  const startPenalty = preferences.startMode === 'early' ? metrics.averageStart / 60 : preferences.startMode === 'late' ? (1440 - metrics.averageStart) / 60 : 0
  return metrics.gapMinutes / 60 * preferences.gaps + metrics.days * preferences.days + startPenalty * preferences.start + metrics.averageEnd / 60 * preferences.finish
}
function compare(a: Grade, b: Grade): number {
  return a.cost - b.cost || a.metrics.gapMinutes - b.metrics.gapMinutes || a.metrics.days - b.metrics.days || a.signature.localeCompare(b.signature)
}

export function solve(request: SolveRequest): SolveResult {
  const started = performance.now()
  const result: SolveResult = { grades: [], complete: true, feasibleCount: 0, nodes: 0, elapsedMs: 0, issues: [] }
  const finish = () => { result.elapsedMs = performance.now() - started; return result }
  if (!request.courses.length) { result.issues.push('Selecione pelo menos uma disciplina.'); return finish() }
  const candidates = request.courses.map((course) => ({ course, options: course.sections.filter((section) => validSection(section) && (!request.locks[course.code] || section.id === request.locks[course.code]) && !section.slots.some((slot) => request.blocks.some((block) => overlaps(slot, block)))) }))
  for (const { course, options } of candidates) {
    if (!options.length) result.issues.push(`${course.code} — ${course.name}: nenhuma turma atende aos bloqueios e à turma fixada. Libere um horário ou selecione outra turma.`)
  }
  if (result.issues.length) return finish()
  // Conflito estrutural comprovado entre dois conjuntos de turmas.
  for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
    if (candidates[i].options.every((a) => candidates[j].options.every((b) => conflicts(a, b)))) {
      result.issues.push(`${candidates[i].course.code} e ${candidates[j].course.code}: todas as combinações de turmas disponíveis têm choque entre si. Experimente retirar uma delas ou liberar uma turma fixada.`)
    }
  }
  if (result.issues.length) return finish()
  candidates.sort((a, b) => a.options.length - b.options.length || a.course.code.localeCompare(b.course.code))
  const selected: Section[] = []
  const maxNodes = request.maxNodes ?? 1_000_000, maxMs = request.maxMs ?? 3500, limit = request.limit ?? 8
  const top = new Map<string, Grade>()
  function visit(depth: number) {
    if (!result.complete) return
    result.nodes++
    if (result.nodes > maxNodes || (result.nodes % 128 === 0 && performance.now() - started > maxMs)) { result.complete = false; return }
    if (depth === candidates.length) {
      result.feasibleCount++
      const sections = [...selected].sort((a, b) => a.id.localeCompare(b.id))
      const metrics = measure(sections)
      const signature = sections.map((section) => section.id).join('|')
      // Horários distintos evitam alternativas que apenas trocam o código de turma.
      const timetable = sections.map((section) => `${section.id.split('-')[0]}:${section.slots.map((slot) => `${slot.day}/${slot.start}/${slot.end}`).sort().join(',')}`).join('|')
      const grade = { sections, metrics, signature, cost: gradeCost(metrics, request.preferences) }
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
      // Poda: uma disciplina restante precisa ter ao menos uma opção compatível.
      if (candidates.slice(depth + 1).some(({ options }) => !options.some((future) => !conflicts(option, future) && selected.every((other) => !conflicts(other, future))))) continue
      selected.push(option); visit(depth + 1); selected.pop()
      if (!result.complete) return
    }
  }
  visit(0)
  result.grades = [...top.values()].sort(compare)
  if (!result.grades.length) result.issues.push(result.complete ? 'Não existe uma grade para todas essas disciplinas com as restrições atuais. Mesmo quando cada par tem opções, a combinação completa pode ser impossível. Experimente retirar uma disciplina ou liberar um bloqueio.' : 'A busca atingiu o limite antes de encontrar uma grade. Isso não prova que a combinação seja impossível. Reduza a seleção ou fixe algumas turmas e tente novamente.')
  return finish()
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
}
export function searchCourses(courses: Course[], query: string): Course[] {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean)
  return courses.filter((course) => terms.every((term) => normalizeSearch(`${course.code} ${course.name} ${course.abbreviation}`).includes(term)))
    .sort((a, b) => Number(normalizeSearch(b.code).startsWith(normalizeSearch(query))) - Number(normalizeSearch(a.code).startsWith(normalizeSearch(query))) || a.code.localeCompare(b.code))
}
