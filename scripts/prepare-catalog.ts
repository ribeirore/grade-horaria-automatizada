import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { aggregateCatalog, parseCsv } from '../src/domain/catalog.ts'

import { normalizeSections } from '../src/domain/scheduling.ts'

const revision = 'd506455be974a49c8aa79ab74cd89731a60cfefc'
const base = `https://raw.githubusercontent.com/igor-peres/impact-lab-sieng2026/${revision}/data/case3_grade_horaria`
const paths = process.argv.slice(2)
const files = ['turmas_horarios.csv', 'disciplinas.csv']
const hashes = [
  '3468276fecb56ede63eb1855eef8f66684124697af596801dd6e71f9c5938f63',
  '54b905aa31aa13d375aec1f3530a8c45a811160ca5c3be54b77618eba8161e4e',
]
const buffers = await Promise.all(
  files.map(async (file, index) => {
    if (paths[index]) return readFile(paths[index])
    const response = await fetch(`${base}/${file}`)
    if (!response.ok)
      throw new Error(`Falha ao baixar ${file}: ${response.status}`)
    return Buffer.from(await response.arrayBuffer())
  }),
)
const expected = ['74381', '1017']
buffers.forEach((buffer, index) => {
  if (createHash('sha256').update(buffer).digest('hex') !== hashes[index]) {
    throw new Error(
      `Conteúdo de ${files[index]} não corresponde à revisão oficial fixada`,
    )
  }
})
const rows = buffers.map((buffer) => parseCsv(buffer.toString('utf8')))
rows.forEach((items, index) => {
  if (String(items.length) !== expected[index])
    throw new Error(`Quantidade inesperada em ${files[index]}`)
})
const ofertas = aggregateCatalog(rows[0], rows[1])
const payload = {
  schemaVersion: 1,
  source: {
    url: `https://github.com/igor-peres/impact-lab-sieng2026/tree/${revision}/data/case3_grade_horaria`,
    revision,
    files: files.map((name, index) => ({
      name,
      sha256: createHash('sha256').update(buffers[index]).digest('hex'),
      rows: rows[index].length,
    })),
  },
  ofertas,
}
await mkdir('src/data', { recursive: true })
await writeFile('src/data/catalog.json', `${JSON.stringify(payload)}\n`)
await writeFile('src/data/scheduling.json', `${JSON.stringify({ schemaVersion: 1, source: payload.source, ...normalizeSections(rows[0], ofertas) })}\n`)
console.log(
  JSON.stringify(
    ofertas.map(({ periodo, disciplinas, totalTurmas, totalBlocos }) => ({
      periodo,
      disciplinas: disciplinas.length,
      totalTurmas,
      totalBlocos,
    })),
    null,
    2,
  ),
)
