import { useMemo, useState } from 'react'
import type { Dispatch } from 'react'
import { filterCatalog } from '../domain/catalog'
import type { Oferta } from '../domain/catalog'
import type { Action, Draft } from '../domain/draft'
import { plural } from '../labels'

export function Disciplinas({
  oferta,
  draft,
  dispatch,
}: {
  oferta: Oferta
  draft: Draft
  dispatch: Dispatch<Action>
}) {
  const [query, setQuery] = useState('')
  const [selectedOnly, setSelectedOnly] = useState(false)
  const [sort, setSort] = useState('nome')
  const [page, setPage] = useState(0)
  const results = useMemo(
    () => filterCatalog(oferta, query, draft.selecionadas, selectedOnly, sort),
    [oferta, query, draft.selecionadas, selectedOnly, sort],
  )
  const pages = Math.ceil(results.length / 12)
  const current = Math.min(page, Math.max(0, pages - 1))
  return (
    <>
      <div className="section-heading">
        <h2 id="section-title">Escolha as disciplinas</h2>
        <p>
          Adicione o que você quer cursar em {oferta.periodo.slice(0, 4)}.
          {oferta.periodo.slice(4)}.
        </p>
      </div>
      <label className="field">
        Buscar por código ou nome
        <input
          type="search"
          placeholder="Ex. MAT ou cálculo"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(0)
          }}
        />
      </label>
      <div className="catalog-tools">
        <label className="check">
          <input
            type="checkbox"
            checked={selectedOnly}
            onChange={(event) => {
              setSelectedOnly(event.target.checked)
              setPage(0)
            }}
          />
          Só selecionadas
        </label>
        <label className="sort-label">
          Ordenar
          <select
            aria-label="Ordenar"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value)
              setPage(0)
            }}
          >
            <option value="nome">Nome</option>
            <option value="codigo">Código</option>
            <option value="turmas">Mais turmas</option>
          </select>
        </label>
      </div>
      <p className="result-count" role="status">
        {results.length.toLocaleString('pt-BR')}{' '}
        {plural(results.length, 'disciplina')} · {draft.selecionadas.length}{' '}
        {plural(draft.selecionadas.length, 'selecionada')}
      </p>
      <ul className="course-list">
        {results.slice(current * 12, (current + 1) * 12).map((item) => {
          const selected = draft.selecionadas.includes(item.codigo)
          return (
            <li
              key={item.codigo}
              className={selected ? 'course selected' : 'course'}
            >
              <span className="course-code">
                {item.codigo}
                {selected && (
                  <span className="selection-label"> · Selecionada</span>
                )}
              </span>
              <h3>{item.nome}</h3>
              <div className="course-bottom">
                <span>
                  {item.turmas} {item.turmas === 1 ? 'turma' : 'turmas'} ·{' '}
                  {item.creditos === null
                    ? 'Créditos não confirmados'
                    : `${item.creditos} ${plural(item.creditos, 'crédito')}`}
                </span>
                <button
                  className={selected ? 'text-button' : 'add-button'}
                  aria-label={`${selected ? 'Remover' : 'Adicionar'} ${item.codigo}`}
                  onClick={() =>
                    dispatch({ type: 'disciplina', codigo: item.codigo })
                  }
                >
                  {selected ? 'Remover' : '+ Adicionar'}
                </button>
              </div>
              <details>
                <summary>Detalhes da oferta</summary>
                <p>
                  {item.nomeCompleto
                    ? 'Nome do catálogo oficial.'
                    : 'Abreviação oficial. Nome completo ausente no catálogo.'}{' '}
                  A quantidade de turmas considera cada turma uma única vez
                  neste período.
                </p>
              </details>
            </li>
          )
        })}
      </ul>
      {results.length === 0 && (
        <div className="empty-list">
          <h3>Nenhuma disciplina encontrada</h3>
          <p>
            {selectedOnly
              ? 'Adicione disciplinas ou desmarque o filtro de selecionadas.'
              : 'Tente outro código ou uma parte do nome.'}
          </p>
          <button
            className="secondary"
            onClick={() => {
              setQuery('')
              setSelectedOnly(false)
              setPage(0)
            }}
          >
            Limpar busca e filtro
          </button>
        </div>
      )}
      {pages > 1 && (
        <div className="pagination">
          <button
            className="secondary"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Anterior
          </button>
          <span>
            {current + 1} de {pages}
          </span>
          <button
            className="secondary"
            disabled={current === pages - 1}
            onClick={() => setPage(current + 1)}
          >
            Próxima
          </button>
        </div>
      )}
    </>
  )
}
