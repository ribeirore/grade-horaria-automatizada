import { useEffect, useReducer, useState } from 'react'
import catalog from './data/catalog.json'
import { emptyDraft, reducer } from './domain/draft'
import { useGenerator } from './domain/useGenerator'
import { Results } from './components/Results'
import type { Action } from './domain/draft'
import type { Bloqueio } from './domain/draft'
import { loadDrafts, saveDrafts } from './domain/storage'
import { Disciplinas } from './components/Disciplinas'
import { Disponibilidade } from './components/Disponibilidade'
import { Preferencias } from './components/Preferencias'
import { Calendar } from './components/Calendar'
import { Review } from './components/Review'
import type { Section } from './components/Review'
import { plural } from './labels'
import './App.css'

const ofertas = catalog.ofertas
const periodLabel = (periodo: string) =>
  `${periodo.slice(0, 4)}.${periodo.slice(4)}`
const sections: { id: Section; label: string }[] = [
  { id: 'disciplinas', label: 'Disciplinas' },
  { id: 'disponibilidade', label: 'Disponibilidade' },
  { id: 'preferencias', label: 'Preferências' },
]
function initialize() {
  try {
    return loadDrafts(localStorage, ofertas)
  } catch {
    return {
      state: {
        periodo: ofertas[0].periodo,
        drafts: Object.fromEntries(
          ofertas.map((offer) => [offer.periodo, emptyDraft()]),
        ),
      },
      warning:
        'O armazenamento está indisponível. As escolhas durarão somente nesta sessão.',
    }
  }
}

function App() {
  const [initial] = useState(initialize)
  const [state, formDispatch] = useReducer(reducer, initial.state)
  const [warning, setWarning] = useState(initial.warning)
  const [section, setSection] = useState<Section>('disciplinas')
  const [editing, setEditing] = useState<Bloqueio | null>(null)
  const [review, setReview] = useState(false)
  const { generation, generate, reset } = useGenerator()
  const [active, setActive] = useState(0)
  function dispatch(action: Action) {
    reset()
    setActive(0)
    formDispatch(action)
  }
  const result = generation.status === 'done' ? generation.result : null
  const oferta = ofertas.find((offer) => offer.periodo === state.periodo)!
  const draft = state.drafts[state.periodo]
  useEffect(() => {
    try {
      const error = saveDrafts(localStorage, state)
      // Storage is an external system; surface a write failure without changing the draft.
      // oxlint-disable-next-line react/set-state-in-effect
      if (error) setWarning(error)
    } catch {
      setWarning(
        'O armazenamento está indisponível. As escolhas durarão somente nesta sessão.',
      )
    }
  }, [state])

  function closeReview() {
    setReview(false)
    requestAnimationFrame(() =>
      document.getElementById('review-button')?.focus(),
    )
  }

  function openSection(next: Section, block: Bloqueio | null = null) {
    setSection(next)
    setEditing(block)
    setReview(false)
    requestAnimationFrame(() => {
      document
        .getElementById('control-panel')
        ?.scrollIntoView({ block: 'nearest' })
      document
        .getElementById(
          next === 'disponibilidade' ? 'block-day' : `nav-${next}`,
        )
        ?.focus()
    })
  }
  return (
    <>
      <a className="skip-link" href="#control-panel">
        Ir para as escolhas
      </a>
      <div className="app-shell">
        <header className="app-header">
          <div className="brand">
            <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
              <path
                d="M12 25h8M13 29h6M12 22c0-4-5-5-5-11a9 9 0 0 1 18 0c0 6-5 7-5 11h-8ZM16 1v2M2 11h3M27 11h3M4 3l3 3M25 6l3-3M13 12l3 3 3-3M16 15v7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
            <div>
              <strong>MatriculIA</strong>
              <span>LIA Impact Lab · Case 3</span>
            </div>
          </div>
          <a
            className="source-link"
            href={catalog.source.url}
            target="_blank"
            rel="noreferrer"
          >
            Dados oficiais <span aria-hidden="true">↗</span>
          </a>
        </header>
        <main>
          <div className="workspace-heading">
            <div>
              <span className="eyebrow">Estação de trabalho</span>
              <h1>Planeje sua próxima grade.</h1>
              <p>
                Escolha disciplinas, reserve horários e defina o que importa
                para você.
              </p>
            </div>
            <label className="period-control">
              Período da oferta
              <select
                aria-label="Período da oferta"
                value={state.periodo}
                onChange={(event) => {
                  dispatch({ type: 'periodo', periodo: event.target.value })
                  setEditing(null)
                }}
              >
                {ofertas.map((offer) => (
                  <option value={offer.periodo} key={offer.periodo}>
                    {periodLabel(offer.periodo)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="offer-bar">
            <span>
              <strong>{periodLabel(state.periodo)}</strong> ·{' '}
              {oferta.disciplinas.length.toLocaleString('pt-BR')} disciplinas ·{' '}
              {oferta.totalTurmas.toLocaleString('pt-BR')} turmas na oferta
            </span>
            <span>
              {warning
                ? 'Rascunho somente nesta sessão'
                : 'Rascunho salvo neste navegador'}
            </span>
          </div>
          {warning && (
            <p className="attention storage-warning" role="alert">
              {warning}
            </p>
          )}
          <div className="workspace">
            <aside
              className="controls glass"
              id="control-panel"
              aria-label="Escolhas da grade"
            >
              <nav className="section-nav" aria-label="Configurar grade">
                {sections.map((item) => (
                  <button
                    id={`nav-${item.id}`}
                    key={item.id}
                    aria-pressed={section === item.id}
                    onClick={() => {
                      setSection(item.id)
                      setEditing(null)
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="panel-content" aria-labelledby="section-title">
                {section === 'disciplinas' && (
                  <Disciplinas
                    key={state.periodo}
                    oferta={oferta}
                    draft={draft}
                    dispatch={dispatch}
                  />
                )}
                {section === 'disponibilidade' && (
                  <Disponibilidade
                    key={`${state.periodo}-${editing?.id ?? 'new'}`}
                    dispatch={dispatch}
                    editing={editing}
                    onDone={() => setEditing(null)}
                  />
                )}
                {section === 'preferencias' && (
                  <Preferencias draft={draft} dispatch={dispatch} />
                )}
              </div>
              <div className="panel-footer">
                <div className="selection-summary">
                  <span>
                    <strong>{draft.selecionadas.length}</strong>{' '}
                    {plural(draft.selecionadas.length, 'disciplina')}
                  </span>
                  <span>
                    <strong>{draft.bloqueios.length}</strong>{' '}
                    {plural(draft.bloqueios.length, 'bloqueio')}
                  </span>
                  <span>
                    <strong>{draft.prioridades.length}</strong>{' '}
                    {plural(draft.prioridades.length, 'critério')}
                  </span>
                </div>
                <button
                  id="review-button"
                  className="primary review-button"
                  onClick={() => setReview(true)}
                >
                  Revisar escolhas <span aria-hidden="true">→</span>
                </button>
                <button
                  id="generate-button"
                  className="generate-button"
                  disabled={!draft.selecionadas.length || generation.status === 'running'}
                  onClick={() => { setActive(0); void generate(state.periodo, draft) }}
                  aria-describedby="generation-limit"
                >
                  {generation.status === 'running' ? 'Gerando…' : 'Gerar grade'}
                </button>
                <p id="generation-limit">
                  {draft.selecionadas.length ? 'Até 5 horários distintos, sem choque ou bloqueio.' : 'Selecione ao menos uma disciplina para gerar.'}
                </p>
              </div>
            </aside>
            <div className="schedule-area">
            {generation.status === 'running' && <section className="results-panel glass" aria-busy="true">
              <p role="status">Buscando grades sem conflitos…</p>
              <button className="secondary" onClick={() => { reset('cancelled'); requestAnimationFrame(() => document.getElementById('generate-button')?.focus()) }}>Cancelar busca</button>
            </section>}
            {generation.status === 'cancelled' && <p role="status" className="attention">Busca cancelada. Suas escolhas foram preservadas.</p>}
            {generation.status === 'error' && <section className="results-panel glass" id="generation-results" tabIndex={-1}>
              <p role="alert">{generation.error}</p>
              <button className="secondary" onClick={() => { setActive(0); void generate(state.periodo, draft) }}>Tentar novamente</button>
            </section>}
            {result && <Results result={result} active={active} onSelect={setActive} priorities={draft.prioridades} />}
            <Calendar
              grade={result?.grades[active]}
              bloqueios={draft.bloqueios}
              onAdd={() => openSection('disponibilidade')}
              onEdit={(block) => openSection('disponibilidade', block)}
              onRemove={(id) => {
                if (editing?.id === id) setEditing(null)
                dispatch({ type: 'removerBloqueio', id })
              }}
            />
            </div>
          </div>
        </main>
        <footer className="app-footer">
          <div>
            <strong>Sua grade começa com suas escolhas.</strong>
            <p>
              Sugestões com oferta histórica oficial. Esta ferramenta não
              efetiva matrícula, verifica pré-requisitos ou
              garante vagas.
            </p>
          </div>
          <details>
            <summary>Sobre a base e seus rascunhos</summary>
            <p>
              Oferta histórica oficial de 2025.2 e 2026.1. Fontes:
              disciplinas.csv e turmas_horarios.csv. Revisão{' '}
              <a href={catalog.source.url}>
                {catalog.source.revision.slice(0, 7)}
              </a>
              . Turmas contadas por período e identidade, sem duplicar linhas de
              horário. As escolhas são salvas por período, neste endereço do
              navegador; o site publicado terá seus próprios rascunhos.
            </p>
          </details>
        </footer>
      </div>
      {review && (
        <Review
          draft={draft}
          oferta={oferta}
          onClose={closeReview}
          onEdit={openSection}
        />
      )}
    </>
  )
}
export default App
