import type { Section } from './types.ts'

export const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const SHORT_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const COLORS = ['teal', 'blue', 'violet', 'amber', 'rose', 'green', 'indigo', 'orange', 'cyan', 'pink', 'lime', 'slate']
export function time(value: number): string { return `${Math.floor(value / 60).toString().padStart(2, '0')}:${Math.round(value % 60).toString().padStart(2, '0')}` }
export function duration(minutes: number): string {
  const hours = Math.floor(minutes / 60), rest = minutes % 60
  return hours ? `${hours}h${rest ? ` ${rest}min` : ''}` : `${rest}min`
}
export function sectionTimes(section: Section): string {
  return section.slots.map((slot) => `${SHORT_DAYS[slot.day]} ${time(slot.start)}–${time(slot.end)}`).join(' · ')
}
