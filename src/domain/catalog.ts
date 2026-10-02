export type CsvRow = Record<string, string>
export type Disciplina = {
  codigo: string
  nome: string
  nomeCompleto: boolean
  creditos: number | null
  turmas: number
}
export type Oferta = {
  periodo: string
  disciplinas: Disciplina[]
  totalTurmas: number
  totalBlocos: number
}

export function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"'
        i++
      } else quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      if (row.some(Boolean)) rows.push(row)
      row = []
      field = ''
    } else field += char
  }
  if (quoted) throw new Error('CSV com aspas incompletas')
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  const headers =
    rows.shift()?.map((s) => s.replace(/^\uFEFF/, '').trim()) ?? []
  return rows.map((values) => {
    if (values.length !== headers.length)
      throw new Error('CSV com número de colunas inválido')
    return Object.fromEntries(headers.map((key, i) => [key, values[i].trim()]))
  })
}

function credits(value: string | undefined): number | null {
  if (!value?.trim()) return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

export function aggregateCatalog(
  horarios: CsvRow[],
  catalogo: CsvRow[],
): Oferta[] {
  const names = new Map(catalogo.map((row) => [row.cod_disciplina, row]))
  const periods = new Map<
    string,
    Map<string, { rows: CsvRow[]; turmas: Set<string> }>
  >()
  const classCodes = new Map<string, string>()
  const blocks = new Map<string, Set<string>>()
  for (const row of horarios) {
    if (
      !row.periodo ||
      !row.turma_id ||
      !row.cod_disciplina ||
      !row.disciplina_abrev
    ) {
      throw new Error('Oferta sem identidade ou nome oficial')
    }
    const identity = JSON.stringify([row.periodo, row.turma_id])
    if (
      classCodes.has(identity) &&
      classCodes.get(identity) !== row.cod_disciplina
    ) {
      throw new Error('Turma associada a mais de uma disciplina')
    }
    classCodes.set(identity, row.cod_disciplina)
    const period = periods.get(row.periodo) ?? new Map()
    const entry = period.get(row.cod_disciplina) ?? {
      rows: [],
      turmas: new Set(),
    }
    entry.rows.push(row)
    entry.turmas.add(identity)
    period.set(row.cod_disciplina, entry)
    periods.set(row.periodo, period)
    const times = blocks.get(row.periodo) ?? new Set()
    times.add(
      JSON.stringify([
        row.turma_id,
        row.dia_semana,
        row.hora_inicio,
        row.hora_fim,
      ]),
    )
    blocks.set(row.periodo, times)
  }
  return [...periods]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([periodo, courses]) => {
      const disciplinas = [...courses]
        .map(([codigo, entry]): Disciplina => {
          const full = names.get(codigo)
          const values = new Set(entry.rows.map((row) => credits(row.creditos)))
          if (full) values.add(credits(full.creditos))
          return {
            codigo,
            nome: full?.disciplina || entry.rows[0].disciplina_abrev,
            nomeCompleto: Boolean(full?.disciplina),
            creditos: values.size === 1 ? [...values][0] : null,
            turmas: entry.turmas.size,
          }
        })
        .sort((a, b) => a.codigo.localeCompare(b.codigo))
      return {
        periodo,
        disciplinas,
        totalTurmas: disciplinas.reduce((sum, item) => sum + item.turmas, 0),
        totalBlocos: blocks.get(periodo)?.size ?? 0,
      }
    })
}

export const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')

export function filterCatalog(
  oferta: Oferta,
  query: string,
  selected: string[],
  onlySelected: boolean,
  sort: string,
) {
  const search = normalizeSearch(query.trim())
  return oferta.disciplinas
    .filter(
      (item) =>
        (!onlySelected || selected.includes(item.codigo)) &&
        normalizeSearch(`${item.codigo} ${item.nome}`).includes(search),
    )
    .sort((a, b) => {
      if (sort === 'turmas')
        return b.turmas - a.turmas || a.codigo.localeCompare(b.codigo)
      if (sort === 'codigo') return a.codigo.localeCompare(b.codigo)
      return (
        a.nome.localeCompare(b.nome, 'pt-BR') ||
        a.codigo.localeCompare(b.codigo)
      )
    })
}
