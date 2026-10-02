import { useState } from 'react'
import type { Dispatch, FormEvent } from 'react'
import { blockError, dias } from '../domain/draft'
import type { Action, Bloqueio } from '../domain/draft'

export function Disponibilidade({
  dispatch,
  editing,
  onDone,
}: {
  dispatch: Dispatch<Action>
  editing: Bloqueio | null
  onDone: () => void
}) {
  const [dia, setDia] = useState(editing?.dia ?? 0)
  const [inicio, setInicio] = useState(editing?.inicio ?? '09:00')
  const [fim, setFim] = useState(editing?.fim ?? '12:00')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    const next = { dia, inicio, fim }
    const invalid = blockError(next)
    if (invalid) {
      setError(invalid)
      setMessage('')
      return
    }
    dispatch({
      type: 'bloqueio',
      bloqueio: { ...next, id: editing?.id ?? crypto.randomUUID() },
    })
    setError(null)
    setMessage(
      editing
        ? 'Bloqueio atualizado.'
        : `Bloqueio adicionado · ${dias[dia]}, ${inicio}–${fim}.`,
    )
    if (editing) onDone()
  }
  return (
    <>
      <div className="section-heading">
        <h2 id="section-title">
          {editing ? 'Editar bloqueio' : 'Reserve seus horários'}
        </h2>
        <p>Marque compromissos em que você não pode ter aula.</p>
      </div>
      <form onSubmit={submit} noValidate>
        <label className="field">
          Dia da semana
          <select
            id="block-day"
            value={dia}
            onChange={(event) => setDia(Number(event.target.value))}
          >
            {dias.map((day, index) => (
              <option value={index} key={day}>
                {day}
              </option>
            ))}
          </select>
        </label>
        <div className="time-fields">
          <label className="field">
            Início
            <input
              type="time"
              value={inicio}
              aria-describedby={error ? 'block-error' : undefined}
              aria-invalid={Boolean(error)}
              onChange={(event) => setInicio(event.target.value)}
            />
          </label>
          <label className="field">
            Fim
            <input
              type="time"
              value={fim}
              aria-describedby={error ? 'block-error' : undefined}
              aria-invalid={Boolean(error)}
              onChange={(event) => setFim(event.target.value)}
            />
          </label>
        </div>
        <p className="muted">
          Use horários entre 00:00 e 23:59. O fim deve ser no mesmo dia, depois
          do início.
        </p>
        {error && (
          <p id="block-error" className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="primary" type="submit">
            {editing ? 'Salvar bloqueio' : '+ Adicionar bloqueio'}
          </button>
          {editing && (
            <button className="text-button" type="button" onClick={onDone}>
              Cancelar edição
            </button>
          )}
        </div>
        <p className="feedback" role="status">
          {message}
        </p>
      </form>
      <div className="explanation">
        <h3>Sua disponibilidade, à vista</h3>
        <p>
          Os intervalos hachurados na semana são indisponíveis. Você também pode
          editar e remover cada bloqueio na lista abaixo do calendário.
        </p>
        <p>
          Bloqueios que se sobrepõem são mantidos como compromissos separados.
        </p>
      </div>
    </>
  )
}
