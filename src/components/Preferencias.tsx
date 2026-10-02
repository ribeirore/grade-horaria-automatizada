import type { Dispatch } from 'react'
import { preferencias } from '../domain/draft'
import type { Action, Draft, Preferencia } from '../domain/draft'

export function Preferencias({
  draft,
  dispatch,
}: {
  draft: Draft
  dispatch: Dispatch<Action>
}) {
  return (
    <>
      <div className="section-heading">
        <h2 id="section-title">O que vem primeiro?</h2>
        <p>Ative os critérios e coloque o mais importante no topo.</p>
      </div>
      <div className="preference-options">
        {Object.entries(preferencias).map(([id, label]) => (
          <label className="check preference-option" key={id}>
            <input
              type="checkbox"
              checked={draft.prioridades.includes(id as Preferencia)}
              onChange={() =>
                dispatch({ type: 'preferencia', id: id as Preferencia })
              }
            />
            {label}
          </label>
        ))}
      </div>
      <p className="muted">
        Começar cedo e começar tarde são alternativas. Ativar uma desativa a
        outra.
      </p>
      <h3 className="priority-heading">Ordem de prioridade</h3>
      {draft.prioridades.length === 0 ? (
        <p className="muted">
          Nenhum critério ativo. As preferências são opcionais.
        </p>
      ) : (
        <ol className="priorities">
          {draft.prioridades.map((id, index) => (
            <li key={id}>
              <span className="priority-number">{index + 1}</span>
              <span>{preferencias[id]}</span>
              <div className="reorder">
                <button
                  className="icon-button"
                  aria-label={`Subir ${preferencias[id]}`}
                  disabled={index === 0}
                  onClick={() => dispatch({ type: 'mover', id, direcao: -1 })}
                >
                  ↑
                </button>
                <button
                  className="icon-button"
                  aria-label={`Descer ${preferencias[id]}`}
                  disabled={index === draft.prioridades.length - 1}
                  onClick={() => dispatch({ type: 'mover', id, direcao: 1 })}
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="attention">
        As preferências ficarão salvas para a geração de grades, que ainda está
        em desenvolvimento.
      </p>
    </>
  )
}
