import { describe, expect, it } from 'vitest'
import { aggregateCatalog, filterCatalog, parseCsv } from './catalog'
import type { CsvRow } from './catalog'
import official from '../data/catalog.json'

const row = (changes: CsvRow = {}): CsvRow => ({
  periodo: '20261',
  turma_id: 'MAT1000-A',
  cod_disciplina: 'MAT1000',
  disciplina_abrev: 'Calc I',
  dia_semana: 'Segunda',
  hora_inicio: '09:00',
  hora_fim: '11:00',
  creditos: '4',
  ...changes,
})

describe('catálogo oficial agregado', () => {
  it('conta uma turma com blocos repetidos e preserva a identidade por período', () => {
    const data = aggregateCatalog(
      [
        row(),
        row(),
        row({ dia_semana: 'Quarta' }),
        row({ periodo: '20252' }),
        row({ turma_id: 'MAT1000-B' }),
      ],
      [],
    )
    expect(data[0]).toMatchObject({
      periodo: '20261',
      totalTurmas: 2,
      totalBlocos: 3,
    })
    expect(data[1]).toMatchObject({
      periodo: '20252',
      totalTurmas: 1,
      totalBlocos: 1,
    })
  })
  it('usa nome completo somente quando fornecido', () => {
    const full = aggregateCatalog(
      [row()],
      [{ cod_disciplina: 'MAT1000', disciplina: 'Cálculo I', creditos: '4' }],
    )[0].disciplinas[0]
    expect(full).toMatchObject({
      nome: 'Cálculo I',
      nomeCompleto: true,
      creditos: 4,
    })
    expect(aggregateCatalog([row()], [])[0].disciplinas[0]).toMatchObject({
      nome: 'Calc I',
      nomeCompleto: false,
    })
  })
  it.each(['', 'inválido', '-1'])(
    'não converte crédito desconhecido %s em zero',
    (creditos) => {
      expect(
        aggregateCatalog([row({ creditos })], [])[0].disciplinas[0].creditos,
      ).toBeNull()
    },
  )
  it('não escolhe arbitrariamente um crédito quando as fontes divergem', () => {
    expect(
      aggregateCatalog([row(), row({ creditos: '6' })], [])[0].disciplinas[0]
        .creditos,
    ).toBeNull()
  })
  it('rejeita turma vinculada a códigos diferentes e identidade ausente', () => {
    expect(() =>
      aggregateCatalog([row(), row({ cod_disciplina: 'OUT1000' })], []),
    ).toThrow()
    expect(() => aggregateCatalog([row({ turma_id: '' })], [])).toThrow()
  })
  it('lê CSV com CRLF, vírgulas, aspas e quebras em campo', () => {
    expect(
      parseCsv('codigo,nome\r\nA,"Cálculo, ""I"""\r\nB,"linha\n2"'),
    ).toEqual([
      { codigo: 'A', nome: 'Cálculo, "I"' },
      { codigo: 'B', nome: 'linha\n2' },
    ])
    expect(() => parseCsv('a,b\n"x,y')).toThrow()
    expect(() => parseCsv('a,b\nx')).toThrow()
  })
  it('confirma a contagem oficial e a ausência de dados brutos', () => {
    expect(
      official.ofertas.map((offer) => [
        offer.periodo,
        offer.disciplinas.length,
        offer.totalTurmas,
        offer.totalBlocos,
      ]),
    ).toEqual([
      ['20261', 1350, 2523, 4060],
      ['20252', 1364, 2424, 3892],
    ])
    expect(JSON.stringify(official)).not.toMatch(
      /PROF_|SALA_|professor_id|sala_id/,
    )
  })
  it('busca sem acentos, filtra selecionadas e desempata por código', () => {
    const offer = aggregateCatalog(
      [
        row({
          cod_disciplina: 'MAT1001',
          turma_id: 'B',
          disciplina_abrev: 'Cálculo',
        }),
        row({ disciplina_abrev: 'Cálculo' }),
      ],
      [],
    )[0]
    expect(
      filterCatalog(offer, 'CALCULO', [], false, 'nome').map(
        (item) => item.codigo,
      ),
    ).toEqual(['MAT1000', 'MAT1001'])
    expect(
      filterCatalog(offer, '', ['MAT1001'], true, 'turmas').map(
        (item) => item.codigo,
      ),
    ).toEqual(['MAT1001'])
    expect(filterCatalog(offer, 'MAT1000', [], false, 'codigo')).toHaveLength(1)
    expect(
      filterCatalog(offer, 'sem resultados', [], false, 'nome'),
    ).toHaveLength(0)
  })
  it('cada período lista somente disciplinas presentes nele', () => {
    const offers = aggregateCatalog(
      [row(), row({ periodo: '20252', cod_disciplina: 'OUT1000' })],
      [],
    )
    expect(offers[0].disciplinas.map((item) => item.codigo)).toEqual([
      'MAT1000',
    ])
    expect(offers[1].disciplinas.map((item) => item.codigo)).toEqual([
      'OUT1000',
    ])
  })
})
