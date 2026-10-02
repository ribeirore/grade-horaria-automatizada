import type { Course, Section } from '../types'
import type { Oferta } from './catalog'
import { minutes } from './draft'
import { overlaps } from '../solver'

export function normalizeSections(rows: Record<string, string>[], ofertas: Oferta[]) {
  const classes = new Map<string, Section>()
  const days = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
  for (const row of rows) {
    const identity = `${row.periodo}/${row.turma_id}`
    let section = classes.get(identity)
    if (!section) {
      const course = ofertas.find((offer) => offer.periodo === row.periodo)?.disciplinas.find((item) => item.codigo === row.cod_disciplina)
      if (!course) throw new Error(`Disciplina sem catálogo: ${identity}`)
      section = { id: row.turma_id, periodo: row.periodo, code: row.cod_disciplina, label: row.turma, credits: course.creditos, slots: [] }
      classes.set(identity, section)
    }
    if (section.code !== row.cod_disciplina) throw new Error('Turma com múltiplas disciplinas')
    const slot = { day: days.indexOf(row.dia_semana), start: minutes(row.hora_inicio), end: minutes(row.hora_fim) }
    if (slot.day < 0 || !Number.isFinite(slot.start) || !Number.isFinite(slot.end) || slot.start >= slot.end) {
      throw new Error(`Horário oficial inválido: ${identity}`)
    }
    if (!section.slots.some((other) => other.day === slot.day && other.start === slot.start && other.end === slot.end)) section.slots.push(slot)
  }
  const excluded: { periodo: string; turmaId: string; reason: string }[] = []
  const usable: Section[] = []
  for (const section of classes.values()) {
    section.slots.sort((a, b) => a.day - b.day || a.start - b.start || a.end - b.end)
    if (section.slots.some((slot, i) => section.slots.slice(i + 1).some((other) => overlaps(slot, other)))) {
      excluded.push({ periodo: section.periodo, turmaId: section.id, reason: 'Blocos da própria turma se sobrepõem' })
    } else usable.push(section)
  }
  return {
    excluded: excluded.sort((a, b) => `${a.periodo}/${a.turmaId}`.localeCompare(`${b.periodo}/${b.turmaId}`)),
    periods: ofertas.map((oferta) => ({
      periodo: oferta.periodo,
      courses: oferta.disciplinas.map((item): Course => ({
        code: item.codigo, name: item.nome,
        sections: usable.filter((section) => section.periodo === oferta.periodo && section.code === item.codigo).sort((a, b) => a.id.localeCompare(b.id)),
      })),
    })),
  }
}
