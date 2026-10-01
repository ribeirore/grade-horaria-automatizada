import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

// CSV com campos citados, vírgulas internas, aspas escapadas e CRLF.
export function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++ }
      else quoted = !quoted
    } else if (char === ',' && !quoted) { row.push(field); field = '' }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field); if (row.some(Boolean)) rows.push(row)
      row = []; field = ''
    } else field += char
  }
  if (quoted) throw new Error('Campo CSV com aspas não encerradas')
  if (field || row.length) { row.push(field); rows.push(row) }
  const headers = rows.shift().map((value) => value.replace(/^\uFEFF/, ''))
  return rows.map((values, index) => {
    if (values.length !== headers.length) throw new Error(`Quantidade de colunas inválida na linha ${index + 2}`)
    return Object.fromEntries(headers.map((header, i) => [header, values[i]]))
  })
}

export async function prepareData() {
const root = new URL('../', import.meta.url)
const raw = await readFile(new URL('data/raw/turmas_horarios.csv', root), 'utf8')
const catalogText = await readFile(new URL('data/raw/disciplinas.csv', root), 'utf8')
const rows = parseCsv(raw)
const catalog = new Map(parseCsv(catalogText).map((row) => [row.cod_disciplina, row.disciplina]))
const days = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
const sections = new Map()
const minutes = (time) => {
  if (!/^\d{2}:\d{2}$/.test(time)) return NaN
  const [hour, minute] = time.split(':').map(Number)
  return hour < 24 && minute < 60 ? hour * 60 + minute : NaN
}
for (const row of rows) {
  const key = `${row.periodo}/${row.turma_id}`
  if (!sections.has(key)) sections.set(key, {
    period: row.periodo, id: row.turma_id, courseCode: row.cod_disciplina,
    label: row.turma, abbreviation: row.disciplina_abrev,
    credits: Number(row.creditos), slots: new Map(), invalid: false,
  })
  const section = sections.get(key)
  const day = days.indexOf(row.dia_semana)
  const start = minutes(row.hora_inicio), end = minutes(row.hora_fim)
  if (day < 0 || !Number.isFinite(start) || !Number.isFinite(end) || start >= end) section.invalid = true
  section.slots.set(`${day}/${start}/${end}`, { day, start, end })
}
const periods = new Map(), excluded = [], missingCatalog = new Set()
let logicalSlots = 0, includedSlots = 0
for (const section of sections.values()) {
  if (!catalog.has(section.courseCode)) missingCatalog.add(section.courseCode)
  const slots = [...section.slots.values()].sort((a, b) => a.day - b.day || a.start - b.start || a.end - b.end)
  logicalSlots += slots.length
  const overlaps = slots.some((slot, i) => slots.slice(i + 1).some((other) => slot.day === other.day && slot.start < other.end && other.start < slot.end))
  if (section.invalid || overlaps) {
    excluded.push({ period: section.period, section: section.id, reason: section.invalid ? 'Horário inválido' : 'Blocos da própria turma se sobrepõem' })
    continue
  }
  if (!periods.has(section.period)) periods.set(section.period, new Map())
  const courses = periods.get(section.period)
  if (!courses.has(section.courseCode)) courses.set(section.courseCode, {
    code: section.courseCode, name: catalog.get(section.courseCode) || section.abbreviation,
    abbreviation: section.abbreviation, catalogMatched: catalog.has(section.courseCode), sections: [],
  })
  courses.get(section.courseCode).sections.push({ id: section.id, label: section.label, credits: section.credits, slots })
  includedSlots += slots.length
}
const dataset = {
  meta: {
    source: 'LIA Impact Lab — Case 3 / SGU', sourceDate: '2026-08-17',
    sourceUrl: 'https://github.com/igor-peres/impact-lab-sieng2026',
    rawRows: rows.length, rawSections: sections.size, logicalSlots, includedSlots,
    missingCatalogCodes: missingCatalog.size, excluded,
    sha256: { schedules: createHash('sha256').update(raw).digest('hex'), catalog: createHash('sha256').update(catalogText).digest('hex') },
  },
  periods: [...periods].sort(([a], [b]) => b.localeCompare(a)).map(([id, courses]) => ({
    id, label: `${id.slice(0, 4)}.${id.slice(4)}`,
    courses: [...courses.values()].sort((a, b) => a.code.localeCompare(b.code)).map((course) => ({
      ...course, sections: course.sections.sort((a, b) => a.label.localeCompare(b.label)),
    })),
  })),
}
await mkdir(new URL('public/data/', root), { recursive: true })
await writeFile(new URL('public/data/offering.json', root), JSON.stringify(dataset))
await writeFile(new URL('data/quality-report.json', root), JSON.stringify(dataset.meta, null, 2) + '\n')
console.log(JSON.stringify({ rows: rows.length, sections: sections.size, logicalSlots, includedSlots, excluded, periods: dataset.periods.map((period) => ({ period: period.label, courses: period.courses.length, sections: period.courses.reduce((sum, course) => sum + course.sections.length, 0) })) }, null, 2))
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await prepareData()
