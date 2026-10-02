export const dias = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const
export const preferencias = {
  intervalos: 'Menos intervalos entre aulas',
  cedo: 'Começar mais cedo',
  tarde: 'Começar mais tarde',
  termino: 'Terminar mais cedo',
  dias: 'Menos dias no campus',
} as const
export type Preferencia = keyof typeof preferencias
export type Bloqueio = { id: string; dia: number; inicio: string; fim: string }
export type Draft = {
  selecionadas: string[]
  bloqueios: Bloqueio[]
  prioridades: Preferencia[]
}
export type FormState = { periodo: string; drafts: Record<string, Draft> }
export type Action =
  | { type: 'periodo'; periodo: string }
  | { type: 'disciplina'; codigo: string }
  | { type: 'bloqueio'; bloqueio: Bloqueio }
  | { type: 'removerBloqueio'; id: string }
  | { type: 'preferencia'; id: Preferencia }
  | { type: 'mover'; id: Preferencia; direcao: -1 | 1 }

export const emptyDraft = (): Draft => ({
  selecionadas: [],
  bloqueios: [],
  prioridades: [],
})
export function minutes(time: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

export function blockError(block: Omit<Bloqueio, 'id'>): string | null {
  if (!Number.isInteger(block.dia) || block.dia < 0 || block.dia > 5)
    return 'Escolha um dia de segunda a sábado.'
  const start = minutes(block.inicio)
  const end = minutes(block.fim)
  if (!Number.isFinite(start) || !Number.isFinite(end))
    return 'Informe os horários de início e fim.'
  if (end <= start) return 'O fim precisa ser posterior ao início.'
  return null
}

export function reducer(state: FormState, action: Action): FormState {
  if (action.type === 'periodo') {
    return {
      periodo: action.periodo,
      drafts: {
        ...state.drafts,
        [action.periodo]: state.drafts[action.periodo] ?? emptyDraft(),
      },
    }
  }
  const draft = state.drafts[state.periodo]
  let next = draft
  switch (action.type) {
    case 'disciplina':
      next = {
        ...draft,
        selecionadas: draft.selecionadas.includes(action.codigo)
          ? draft.selecionadas.filter((id) => id !== action.codigo)
          : [...draft.selecionadas, action.codigo],
      }
      break
    case 'bloqueio':
      if (blockError(action.bloqueio) || !action.bloqueio.id) return state
      next = {
        ...draft,
        bloqueios: [
          ...draft.bloqueios.filter((block) => block.id !== action.bloqueio.id),
          action.bloqueio,
        ],
      }
      break
    case 'removerBloqueio':
      next = {
        ...draft,
        bloqueios: draft.bloqueios.filter((block) => block.id !== action.id),
      }
      break
    case 'preferencia': {
      if (!Object.hasOwn(preferencias, action.id)) return state
      const excluded =
        action.id === 'cedo' ? 'tarde' : action.id === 'tarde' ? 'cedo' : null
      const priorities = draft.prioridades.includes(action.id)
        ? draft.prioridades.filter((id) => id !== action.id)
        : [...draft.prioridades.filter((id) => id !== excluded), action.id]
      next = { ...draft, prioridades: priorities }
      break
    }
    case 'mover': {
      const priorities = [...draft.prioridades]
      const index = priorities.indexOf(action.id)
      const target = index + action.direcao
      if (index < 0 || target < 0 || target >= priorities.length) return state
      const previous = priorities[index]
      priorities[index] = priorities[target]
      priorities[target] = previous
      next = { ...draft, prioridades: priorities }
      break
    }
  }
  return { ...state, drafts: { ...state.drafts, [state.periodo]: next } }
}

export function sortedBlocks(blocks: Bloqueio[]) {
  return [...blocks].sort(
    (a, b) =>
      a.dia - b.dia ||
      a.inicio.localeCompare(b.inicio) ||
      a.fim.localeCompare(b.fim),
  )
}

// Give overlapping commitments separate lanes; their duration remains proportional.
export function layoutBlocks(blocks: Bloqueio[]) {
  const groups: Bloqueio[][] = []
  for (const block of sortedBlocks(blocks)) {
    const group = groups.at(-1)
    if (
      group &&
      minutes(block.inicio) <
        Math.max(...group.map((item) => minutes(item.fim)))
    )
      group.push(block)
    else groups.push([block])
  }
  return groups.flatMap((group) =>
    group.map((block, lane) => ({ block, lane, lanes: group.length })),
  )
}
