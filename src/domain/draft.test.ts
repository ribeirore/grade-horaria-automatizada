import { describe, expect, it } from 'vitest'
import { blockError, emptyDraft, layoutBlocks, minutes, reducer } from './draft'
import type { FormState } from './draft'

const initial = (): FormState => ({
  periodo: '20261',
  drafts: { '20261': emptyDraft() },
})
const block = { id: 'a', dia: 0, inicio: '09:00', fim: '12:00' }
describe('escolhas e bloqueios', () => {
  it.each([
    { dia: -1, inicio: '09:00', fim: '12:00' },
    { dia: 6, inicio: '09:00', fim: '12:00' },
    { dia: 0, inicio: '', fim: '12:00' },
    { dia: 0, inicio: '24:00', fim: '12:00' },
    { dia: 0, inicio: '09:61', fim: '12:00' },
    { dia: 0, inicio: '12:00', fim: '12:00' },
    { dia: 0, inicio: '13:00', fim: '12:00' },
  ])('rejeita intervalo inválido %j', (candidate) => {
    expect(blockError(candidate)).not.toBeNull()
    const state = initial()
    expect(
      reducer(state, { type: 'bloqueio', bloqueio: { ...candidate, id: 'a' } }),
    ).toBe(state)
  })
  it('aceita sábado, limites do dia e horários fracionados', () => {
    expect(blockError({ dia: 5, inicio: '00:00', fim: '23:59' })).toBeNull()
    expect(minutes('09:15')).toBe(555)
  })
  it('adiciona, edita e remove o mesmo bloqueio sem duplicá-lo', () => {
    let state = reducer(initial(), { type: 'bloqueio', bloqueio: block })
    state = reducer(state, {
      type: 'bloqueio',
      bloqueio: { ...block, fim: '13:00' },
    })
    expect(state.drafts['20261'].bloqueios).toEqual([
      { ...block, fim: '13:00' },
    ])
    expect(
      reducer(state, { type: 'removerBloqueio', id: 'a' }).drafts['20261']
        .bloqueios,
    ).toEqual([])
  })
  it('preserva cada rascunho ao trocar de período', () => {
    let state = reducer(initial(), { type: 'disciplina', codigo: 'MAT1000' })
    state = reducer(state, { type: 'periodo', periodo: '20252' })
    state = reducer(state, { type: 'bloqueio', bloqueio: block })
    state = reducer(state, { type: 'periodo', periodo: '20261' })
    expect(state.drafts['20261'].selecionadas).toEqual(['MAT1000'])
    expect(state.drafts['20261'].bloqueios).toEqual([])
    expect(state.drafts['20252'].bloqueios).toEqual([block])
    expect(
      reducer(state, { type: 'disciplina', codigo: 'MAT1000' }).drafts['20261']
        .selecionadas,
    ).toEqual([])
  })
  it('impede prioridades incompatíveis e permite reordenar', () => {
    let state = reducer(initial(), { type: 'preferencia', id: 'cedo' })
    state = reducer(state, { type: 'preferencia', id: 'intervalos' })
    state = reducer(state, { type: 'preferencia', id: 'tarde' })
    expect(state.drafts['20261'].prioridades).toEqual(['intervalos', 'tarde'])
    state = reducer(state, { type: 'mover', id: 'tarde', direcao: -1 })
    expect(state.drafts['20261'].prioridades).toEqual(['tarde', 'intervalos'])
    expect(reducer(state, { type: 'mover', id: 'tarde', direcao: -1 })).toBe(
      state,
    )
  })
  it('dá pistas separadas a blocos sobrepostos, aceitando blocos consecutivos', () => {
    const lanes = layoutBlocks([
      block,
      { ...block, id: 'b', inicio: '11:00', fim: '13:00' },
      { ...block, id: 'c', inicio: '13:00', fim: '14:00' },
    ])
    expect(lanes.map(({ lane, lanes }) => [lane, lanes])).toEqual([
      [0, 2],
      [1, 2],
      [0, 1],
    ])
  })
})
