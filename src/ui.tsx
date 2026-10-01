import type { CSSProperties } from 'react'
import type { Block, Course, Grade, Section } from './types.ts'
import { COLORS, DAYS, SHORT_DAYS, time } from './format.ts'
type IconName = 'calendar' | 'search' | 'plus' | 'close' | 'clock' | 'spark' | 'lock' | 'arrow' | 'print' | 'download' | 'check' | 'info' | 'sliders' | 'chevron'
const paths: Record<IconName, string> = {
  calendar: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 10h1m6 0h1m-8 4h1m6 0h1',
  search: 'm21 21-5-5M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z',
  plus: 'M12 5v14M5 12h14', close: 'm6 6 12 12M6 18 18 6',
  clock: 'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
  spark: 'm12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7L12 3z',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M6 10h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zm6 5v3',
  arrow: 'M4 12h16m-6-6 6 6-6 6', print: 'M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v8H7v-8zm10-3h.01',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', check: 'm5 12 4 4L19 6',
  info: 'M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
  sliders: 'M4 7h5m5 0h6M4 17h10m5 0h1M9 4v6m5 4v6', chevron: 'm9 5 7 7-7 7',
}
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}

export function Calendar({ grade, courses, blocks, onSection }: { grade?: Grade; courses: Course[]; blocks: Block[]; onSection: (section: Section, course: Course) => void }) {
  const slots = [...(grade?.sections.flatMap((section) => section.slots) ?? []), ...blocks]
  const start = Math.min(420, ...slots.map((slot) => Math.floor(slot.start / 60) * 60))
  const end = Math.max(1140, ...slots.map((slot) => Math.ceil(slot.end / 60) * 60))
  const hours = Array.from({ length: (end - start) / 60 }, (_, i) => start + i * 60)
  const position = (from: number, until: number): CSSProperties => ({ top: `${(from - start) / (end - start) * 100}%`, height: `${(until - from) / (end - start) * 100}%` })
  return <div className="calendar-scroll" tabIndex={0} aria-label="Grade semanal, role horizontalmente para ver todos os dias">
    <div className="calendar" style={{ '--hour-count': hours.length } as CSSProperties}>
      <div className="calendar-corner"><Icon name="clock" size={16} /></div>
      {DAYS.map((day, i) => <div className={`day-heading ${i === 5 ? 'weekend' : ''}`} key={day}><span>{SHORT_DAYS[i]}</span><strong>{day}</strong></div>)}
      <div className="time-axis">{hours.map((hour) => <div key={hour}>{time(hour)}</div>)}<span className="last-hour">{time(end)}</span></div>
      {DAYS.map((day, dayIndex) => <div className={`day-column ${dayIndex === 5 ? 'weekend' : ''}`} key={day}>
        {blocks.filter((block) => block.day === dayIndex).map((block) => <div key={block.id} className="blocked-slot" style={position(block.start, block.end)} title={`${block.label || 'Indisponível'} · ${time(block.start)}–${time(block.end)}`}><span><Icon name="lock" size={12} /> Bloqueado</span></div>)}
        {grade?.sections.flatMap((section) => {
          const course = courses.find((item) => item.sections.some((itemSection) => itemSection.id === section.id))
          if (!course) return []
          const color = COLORS[courses.indexOf(course) % COLORS.length]
          return section.slots.filter((slot) => slot.day === dayIndex).map((slot) => <button type="button" key={`${section.id}/${slot.start}`} className={`class-slot color-${color}${slot.end - slot.start < 90 ? ' short-slot' : ''}`} style={position(slot.start, slot.end)} onClick={() => onSection(section, course)} aria-label={`${course.code}, ${course.name}, turma ${section.label}, ${day}, ${time(slot.start)} a ${time(slot.end)}. Ver detalhes.`}>
            <span className="class-code">{course.code}<span>{section.label}</span></span>
            <strong>{course.abbreviation}</strong>
            <span className="class-time">{time(slot.start)}–{time(slot.end)}</span>
          </button>)
        })}
      </div>)}
    </div>
  </div>
}
