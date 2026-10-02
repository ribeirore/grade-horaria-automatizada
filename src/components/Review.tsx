import { useEffect, useRef } from 'react'
import { dias, preferencias, sortedBlocks } from '../domain/draft'
import type { Draft } from '../domain/draft'
import type { Oferta } from '../domain/catalog'
import { plural } from '../labels'
export type Section = 'disciplinas' | 'disponibilidade' | 'preferencias'

export function Review({
  draft,
  oferta,
  onClose,
  onEdit,
}: {
  draft: Draft
  oferta: Oferta
  onClose: () => void
  onEdit: (section: Section) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  const selected = oferta.disciplinas.filter((item) =>
    draft.selecionadas.includes(item.codigo),
  )
  return (
    <dialog
      ref={ref}
      className="review-dialog"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      aria-labelledby="review-title"
    >
      <div className="review-content">
        <div className="review-heading">
          <div>
            <span className="eyebrow">
              Período {oferta.periodo.slice(0, 4)}.{oferta.periodo.slice(4)}
            </span>
            <h2 id="review-title">Revise suas escolhas</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Fechar revisão"
            onClick={onClose}
            autoFocus
          >
            ×
          </button>
        </div>
        <section>
          <div className="review-section-heading">
            <h3>Disciplinas · {selected.length}</h3>
            <button
              className="text-button"
              onClick={() => onEdit('disciplinas')}
            >
              Editar disciplinas
            </button>
          </div>
          {selected.length ? (
            <ul>
              {selected.map((item) => (
                <li key={item.codigo}>
                  <strong>{item.codigo}</strong> · {item.nome}
                  <small>
                    {item.turmas} {plural(item.turmas, 'turma')} ·{' '}
                    {item.creditos === null
                      ? 'Créditos não confirmados'
                      : `${item.creditos} ${plural(item.creditos, 'crédito')}`}
                    {!item.nomeCompleto && ' · Nome completo ausente'}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma disciplina selecionada.</p>
          )}
        </section>
        <section>
          <div className="review-section-heading">
            <h3>Bloqueios · {draft.bloqueios.length}</h3>
            <button
              className="text-button"
              onClick={() => onEdit('disponibilidade')}
            >
              Editar disponibilidade
            </button>
          </div>
          {draft.bloqueios.length ? (
            <ul>
              {sortedBlocks(draft.bloqueios).map((block) => (
                <li key={block.id}>
                  {dias[block.dia]} · {block.inicio}–{block.fim}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum horário bloqueado.</p>
          )}
        </section>
        <section>
          <div className="review-section-heading">
            <h3>Preferências, em ordem</h3>
            <button
              className="text-button"
              onClick={() => onEdit('preferencias')}
            >
              Editar preferências
            </button>
          </div>
          {draft.prioridades.length ? (
            <ol>
              {draft.prioridades.map((id) => (
                <li key={id}>{preferencias[id]}</li>
              ))}
            </ol>
          ) : (
            <p>Nenhum critério ativo.</p>
          )}
        </section>
        <p className="attention">
          Geração e comparação de grades ainda não disponíveis. Suas escolhas
          ficam neste navegador.
        </p>
        <button className="primary" onClick={onClose}>
          Concluir revisão
        </button>
      </div>
    </dialog>
  )
}
