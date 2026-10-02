import { describe, expect, it } from 'vitest'
import { loadDrafts, saveDrafts, storageKey } from './storage'
import catalog from '../data/catalog.json'
import { emptyDraft } from './draft'

function storage(value: string | null = null) {
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next
    },
  }
}
describe('rascunhos versionados', () => {
  it('salva e recupera escolhas por período', () => {
    const store = storage()
    const state = {
      periodo: '20252',
      drafts: { '20252': { ...emptyDraft(), selecionadas: ['ACN1005'] } },
    }
    expect(saveDrafts(store, state)).toBeNull()
    expect(
      loadDrafts(store, catalog.ofertas).state.drafts['20252'].selecionadas,
    ).toEqual(['ACN1005'])
    expect(loadDrafts(store, catalog.ofertas).state.periodo).toBe('20252')
    expect(storageKey).toContain('v1')
  })
  it('continua operável quando o armazenamento falha', () => {
    const store = {
      getItem() {
        throw new Error('bloqueado')
      },
      setItem() {
        throw new Error('quota')
      },
    }
    const result = loadDrafts(store, catalog.ofertas)
    expect(result.warning).toBeTruthy()
    expect(result.state.periodo).toBe('20261')
    expect(saveDrafts(store, result.state)).toBeTruthy()
  })
  it.each([
    'malformado',
    JSON.stringify({ version: 2, drafts: {} }),
    JSON.stringify({
      version: 1,
      drafts: { '20261': { ...emptyDraft(), selecionadas: ['NAO_EXISTE'] } },
    }),
    JSON.stringify({
      version: 1,
      drafts: { '20261': { ...emptyDraft(), prioridades: ['cedo', 'tarde'] } },
    }),
    JSON.stringify({
      version: 1,
      drafts: {
        '20261': {
          ...emptyDraft(),
          bloqueios: [{ id: 'a', dia: 0, inicio: '12:00', fim: '09:00' }],
        },
      },
    }),
  ])('rejeita rascunho malformado sem quebrar a interface', (value) => {
    expect(loadDrafts(storage(value), catalog.ofertas).warning).toBeTruthy()
  })
})
