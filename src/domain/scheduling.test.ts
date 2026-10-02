import { expect, it } from 'vitest'
import { normalizeSections } from './scheduling'
import type { Oferta } from './catalog'

const ofertas: Oferta[] = ['20261','20252'].map((periodo) => ({
  periodo, totalTurmas: 1, totalBlocos: 2,
  disciplinas: [{ codigo:'A', nome:'Nome oficial', nomeCompleto:true, creditos:null, turmas:1 }],
}))
const row = (periodo = '20261', hora_inicio = '09:00', hora_fim = '10:00') => ({
  periodo, turma_id:'A-1', cod_disciplina:'A', turma:'1', dia_semana:'Sabado', hora_inicio, hora_fim,
})
it('deduplica encontros e mantém identidade por período, sábado e créditos desconhecidos', () => {
  const result = normalizeSections([row(),row(),row('20252')],ofertas)
  expect(result.excluded).toEqual([])
  for (const period of result.periods) {
    expect(period.courses[0].sections).toHaveLength(1)
    expect(period.courses[0].sections[0].credits).toBeNull()
    expect(period.courses[0].sections[0].slots).toEqual([{day:5,start:540,end:600}])
    expect(period.courses[0].sections[0].periodo).toBe(period.periodo)
  }
})
it('exclui choque interno sem inventar encontros e aceita adjacência', () => {
  expect(normalizeSections([row(),row('20261','09:30','10:30')],ofertas).excluded).toEqual([{periodo:'20261',turmaId:'A-1',reason:'Blocos da própria turma se sobrepõem'}])
  expect(normalizeSections([row(),row('20261','10:00','11:00')],ofertas).periods[0].courses[0].sections[0].slots).toHaveLength(2)
})
it('rejeita dado inválido e turma associada a outra disciplina', () => {
  expect(() => normalizeSections([row('20261','11:00','10:00')],ofertas)).toThrow()
  expect(() => normalizeSections([row(),{...row(),cod_disciplina:'B'}],ofertas)).toThrow()
})
