import { useState } from 'react'
import type { CSSProperties } from 'react'
import { dias, layoutBlocks, minutes, sortedBlocks } from '../domain/draft'
import type { Bloqueio } from '../domain/draft'
import { plural } from '../labels'

export function Calendar({
  bloqueios,
  onEdit,
  onRemove,
  onAdd,
}: {
  bloqueios: Bloqueio[]
  onEdit: (block: Bloqueio) => void
  onRemove: (id: string) => void
  onAdd: () => void
}) {
  const [day, setDay] = useState(0)
  const start = Math.min(
    420,
    ...bloqueios.map((block) => Math.floor(minutes(block.inicio) / 60) * 60),
  )
  const end = Math.max(
    1380,
    ...bloqueios.map((block) => Math.ceil(minutes(block.fim) / 60) * 60),
  )
  const hours = Array.from(
    { length: (end - start) / 60 + 1 },
    (_, index) => start / 60 + index,
  )
  const height = ((end - start) / 60) * 38
  return (
    <section className="calendar-panel glass" aria-labelledby="calendar-title">
      <div className="calendar-heading">
        <div>
          <span className="eyebrow">Seu planejamento</span>
          <h2 id="calendar-title">A semana começa aqui.</h2>
          <p>Visualize seus horários indisponíveis.</p>
        </div>
        <span className="legend">
          <span className="hatch-swatch" />
          Bloqueio
        </span>
      </div>
      <div className="day-nav">
        <button
          className="secondary"
          aria-label="Dia anterior"
          disabled={day === 0}
          onClick={() => setDay(day - 1)}
        >
          ←
        </button>
        <strong aria-live="polite">
          {dias[day]}
          <span>{day + 1} de 6</span>
        </strong>
        <button
          className="secondary"
          aria-label="Próximo dia"
          disabled={day === 5}
          onClick={() => setDay(day + 1)}
        >
          →
        </button>
      </div>
      <div
        className="week"
        style={{ '--grid-height': `${height}px` } as CSSProperties}
      >
        <div className="time-column">
          <div className="day-heading">Hora</div>
          <div className="time-axis" style={{ height }}>
            {hours.map((hour, index) => (
              <span key={hour} style={{ top: `${index * 38}px` }}>
                {String(hour).padStart(2, '0')}:00
              </span>
            ))}
          </div>
        </div>
        {dias.map((label, index) => (
          <div
            className={`day-column ${day === index ? 'current-day' : ''}`}
            key={label}
          >
            <div className="day-heading">
              {label}
              <span>
                {bloqueios.filter((block) => block.dia === index).length}{' '}
                {plural(
                  bloqueios.filter((block) => block.dia === index).length,
                  'bloqueio',
                )}
              </span>
            </div>
            <div className="day-track" style={{ height }}>
              {layoutBlocks(
                bloqueios.filter((block) => block.dia === index),
              ).map(({ block, lane, lanes }) => {
                const duration = minutes(block.fim) - minutes(block.inicio)
                return (
                  <button
                    className={`calendar-block ${duration < 60 ? 'short-block' : ''} ${duration < 120 ? 'compact-block' : ''}`}
                    key={block.id}
                    onClick={() => onEdit(block)}
                    aria-label={`Editar bloqueio ${label}, ${block.inicio} a ${block.fim}`}
                    style={{
                      top: `${((minutes(block.inicio) - start) / 60) * 38}px`,
                      height: `${(duration / 60) * 38}px`,
                      left: `calc(${(lane / lanes) * 100}% + 3px)`,
                      width: `calc(${100 / lanes}% - 6px)`,
                    }}
                  >
                    <span>Indisponível</span>
                    <small>
                      {block.inicio}
                      <br />
                      {block.fim}
                    </small>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {bloqueios.length === 0 && (
          <div className="calendar-empty">
            <span className="empty-line" />
            <h3>Espaço para a sua rotina</h3>
            <p>
              Adicione seus compromissos.
              <br />
              Eles aparecerão aqui como bloqueios.
            </p>
            <button className="secondary" onClick={onAdd}>
              Adicionar um bloqueio
            </button>
          </div>
        )}
      </div>
      <div className="calendar-caption">
        <span>Segunda a sábado · horários proporcionais</span>
        <span>Somente bloqueios. Aulas ainda não geradas.</span>
      </div>
      <div className="block-summary">
        <div className="block-summary-heading">
          <h3>
            Bloqueios registrados <span>{bloqueios.length}</span>
          </h3>
          <button className="text-button" onClick={onAdd}>
            + Adicionar
          </button>
        </div>
        {bloqueios.length === 0 ? (
          <p className="muted">Nenhum bloqueio neste período.</p>
        ) : (
          <ul className="block-list">
            {sortedBlocks(bloqueios).map((block) => (
              <li key={block.id}>
                <span>
                  <strong>{dias[block.dia]}</strong>
                  <span>
                    {block.inicio}–{block.fim} · Indisponível
                  </span>
                </span>
                <div>
                  <button
                    className="text-button"
                    aria-label={`Editar ${dias[block.dia]} ${block.inicio}–${block.fim}`}
                    onClick={() => onEdit(block)}
                  >
                    Editar
                  </button>
                  <button
                    className="text-button"
                    aria-label={`Remover bloqueio ${dias[block.dia]} ${block.inicio}–${block.fim}`}
                    onClick={() => onRemove(block.id)}
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
