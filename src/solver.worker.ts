import { solve } from './solver.ts'
import type { SolveRequest } from './types.ts'

self.onmessage = (event: MessageEvent<SolveRequest>) => {
  try { self.postMessage({ result: solve(event.data) }) }
  catch { self.postMessage({ error: 'Não foi possível concluir a busca. Tente novamente com menos disciplinas.' }) }
}
