import { dias, preferencias } from '../domain/draft'
import type { Preferencia } from '../domain/draft'
import type { SolveResult } from '../types'

import { timeLabel } from '../domain/time'

export function Results({ result, active, onSelect, priorities }: {
  result: SolveResult
  active: number
  onSelect: (index: number) => void
  priorities: Preferencia[]
}) {
  const grade = result.grades[active]
  return (
    <section className="results-panel glass" id="generation-results" tabIndex={-1} aria-labelledby="results-title">
      <h2 id="results-title">{grade ? (result.complete ? 'Suas alternativas' : 'Melhores encontradas') : (result.complete ? 'Nenhuma grade viável' : 'Busca incompleta')}</h2>
      <p role="status">
        {result.complete ? 'Busca completa.' : 'Busca interrompida pelo limite; as opções podem não ser as melhores possíveis.'}{' '}
        {result.feasibleCount.toLocaleString('pt-BR')} combinações viáveis avaliadas · {result.nodes.toLocaleString('pt-BR')} nós · {Math.round(result.elapsedMs)} ms.
      </p>
      {result.issues.length > 0 && <ul className="result-issues">{result.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
      {grade && <>
        <p className="ranking-explanation">{priorities.length
          ? `Prioridades, em ordem: ${priorities.map((id) => preferencias[id]).join(' → ')}. Um critério só desempata quando os anteriores são iguais.`
          : 'Sem preferências ativas. As alternativas são ordenadas pela identificação das turmas.'}</p>
        <div className="alternative-nav" aria-label="Alternativas de grade">
          {result.grades.map((item, index) => <button key={item.signature} className="secondary" aria-pressed={active === index} onClick={() => onSelect(index)}>Alternativa {index + 1}</button>)}
        </div>
        <div className="metrics-comparison">
          {result.grades.map((item, index) => <dl key={item.signature} className={active === index ? 'active-metrics' : ''} aria-label={`Métricas da alternativa ${index + 1}`}>
            <dt>Alternativa {index + 1}{active === index ? ' · em exibição' : ''}</dt>
            <dd><strong>{item.metrics.gapMinutes} min</strong> de intervalos</dd>
            <dd><strong>{item.metrics.days}</strong> dias no campus</dd>
            <dd><strong>{timeLabel(item.metrics.averageStart)}</strong> início médio</dd>
            <dd><strong>{timeLabel(item.metrics.averageEnd)}</strong> término médio</dd>
          </dl>)}
        </div>
        <p className="muted">Médias apenas nos dias com aula, arredondadas ao minuto para exibição. Intervalos não incluem os bloqueios pessoais. Empates usam a identificação das turmas.</p>
        <h3>Turmas da alternativa {active + 1}</h3>
        <p>{grade.metrics.credits === null ? 'Créditos totais não confirmados' : `${grade.metrics.credits} créditos no total`} · {grade.metrics.classMinutes} minutos de aula por semana</p>
        <ul className="meetings-list">
          {grade.sections.map((section) => <li key={section.id}>
            <details id={`meetings-${section.code}`}>
              <summary>{section.code} · turma {section.label} · {section.slots.length} encontros</summary>
              <ul>{section.slots.map((slot) => <li key={`${slot.day}/${slot.start}`}>
                {dias[slot.day]} · {timeLabel(slot.start)}–{timeLabel(slot.end)}
              </li>)}</ul>
              <p>{section.credits === null ? 'Créditos não confirmados' : `${section.credits} créditos`}</p>
            </details>
          </li>)}
        </ul>
      </>}
    </section>
  )
}
