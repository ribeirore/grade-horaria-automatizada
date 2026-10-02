// Adaptado de Herick Pinheiro, d2e4c6a; sem serviços externos.
import { solve } from './solver'
import type { SolveRequest } from './types'

self.onmessage = (event: MessageEvent<SolveRequest>) => {
  try {
    self.postMessage({ result: solve(event.data) })
  } catch {
    self.postMessage({ error: 'Não foi possível concluir a busca. Revise as escolhas e tente novamente.' })
  }
}
