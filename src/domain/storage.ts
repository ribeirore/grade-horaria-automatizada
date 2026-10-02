import { blockError, emptyDraft, preferencias } from './draft'
import type { Bloqueio, Draft, FormState, Preferencia } from './draft'
import type { Oferta } from './catalog'

export const storageKey = 'lia-grade:rascunhos:v1'
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>
export function loadDrafts(
  storage: StorageLike,
  ofertas: Oferta[],
): { state: FormState; warning: string | null } {
  const initial: FormState = {
    periodo: ofertas[0].periodo,
    drafts: Object.fromEntries(
      ofertas.map((offer) => [offer.periodo, emptyDraft()]),
    ),
  }
  try {
    const raw = storage.getItem(storageKey)
    if (!raw) return { state: initial, warning: null }
    const data = JSON.parse(raw)
    if (data.version !== 1 || !data.drafts || typeof data.drafts !== 'object')
      throw new Error('Versão desconhecida')
    for (const offer of ofertas) {
      const draft: Draft | undefined = data.drafts[offer.periodo]
      if (!draft) continue
      if (
        !Array.isArray(draft.selecionadas) ||
        !Array.isArray(draft.bloqueios) ||
        !Array.isArray(draft.prioridades)
      )
        throw new Error('Rascunho inválido')
      const codes = new Set(offer.disciplinas.map((item) => item.codigo))
      const selected = [...new Set(draft.selecionadas)]
      if (selected.some((code) => !codes.has(code)))
        throw new Error('Disciplina fora do período')
      const ids = new Set<string>()
      for (const block of draft.bloqueios as Bloqueio[]) {
        if (
          !block ||
          typeof block.id !== 'string' ||
          !block.id ||
          ids.has(block.id) ||
          blockError(block)
        )
          throw new Error('Bloqueio inválido')
        ids.add(block.id)
      }
      const priorities = [...new Set(draft.prioridades)] as Preferencia[]
      if (
        priorities.some((id) => !Object.hasOwn(preferencias, id)) ||
        (priorities.includes('cedo') && priorities.includes('tarde'))
      )
        throw new Error('Prioridades incompatíveis')
      initial.drafts[offer.periodo] = {
        selecionadas: selected,
        bloqueios: draft.bloqueios,
        prioridades: priorities,
      }
    }
    if (ofertas.some((offer) => offer.periodo === data.periodo))
      initial.periodo = data.periodo
    return { state: initial, warning: null }
  } catch {
    return {
      state: initial,
      warning:
        'Não foi possível recuperar o rascunho salvo. Você pode continuar e revisar suas escolhas.',
    }
  }
}

export function saveDrafts(
  storage: StorageLike,
  state: FormState,
): string | null {
  try {
    storage.setItem(storageKey, JSON.stringify({ version: 1, ...state }))
    return null
  } catch {
    return 'Não foi possível salvar neste navegador. Você pode continuar, mas as novas escolhas podem se perder ao sair.'
  }
}
