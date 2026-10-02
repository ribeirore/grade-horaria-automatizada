import { useEffect, useRef, useState } from 'react'
import type { Draft } from './draft'
import { minutes } from './draft'
import type { SolveResult } from '../types'

type Generation =
  | { status: 'idle' | 'running' | 'cancelled' }
  | { status: 'error'; error: string }
  | { status: 'done'; result: SolveResult }

export function useGenerator() {
  const worker = useRef<Worker | null>(null)
  const version = useRef(0)
  const [generation, setGeneration] = useState<Generation>({ status: 'idle' })
  useEffect(() => () => {
    version.current++
    worker.current?.terminate()
  }, [])
  function reset(status: 'idle' | 'cancelled' = 'idle') {
    version.current++
    worker.current?.terminate()
    worker.current = null
    setGeneration({ status })
  }
  async function generate(periodo: string, draft: Draft) {
    reset()
    const current = version.current
    setGeneration({ status: 'running' })
    try {
      const { default: dataset } = await import('../data/scheduling.json')
      if (current !== version.current) return
      const period = dataset.periods.find((item) => item.periodo === periodo)
      if (!period) throw new Error('Período indisponível')
      const instance = new Worker(new URL('../solver.worker.ts', import.meta.url), { type: 'module' })
      worker.current = instance
      const finish = (next: Generation) => {
        if (current !== version.current) return
        instance.terminate()
        worker.current = null
        setGeneration(next)
        requestAnimationFrame(() => {
          document.getElementById('generation-results')?.focus()
        })
      }
      instance.onmessage = (event: MessageEvent<{ result?: SolveResult; error?: string }>) => {
        finish(event.data.result
          ? { status: 'done', result: event.data.result }
          : { status: 'error', error: event.data.error ?? 'Resposta da busca inválida. Tente novamente.' })
      }
      instance.onerror = () => finish({ status: 'error', error: 'A busca não carregou. Tente novamente ou recarregue a página.' })
      instance.postMessage({
        periodo,
        courses: draft.selecionadas.map((code) => {
          const course = period.courses.find((item) => item.code === code)
          if (!course) throw new Error('Disciplina indisponível')
          return course
        }),
        blocks: draft.bloqueios.map((block) => ({ day: block.dia, start: minutes(block.inicio), end: minutes(block.fim) })),
        priorities: draft.prioridades,
        limit: 5,
      })
    } catch {
      if (current !== version.current) return
      worker.current?.terminate()
      worker.current = null
      setGeneration({ status: 'error', error: 'Não foi possível carregar os dados da geração. Tente novamente.' })
    }
  }
  return { generation, generate, reset }
}
