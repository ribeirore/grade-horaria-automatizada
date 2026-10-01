import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Block, Course, Dataset, Preferences, Section, SolveResult } from './types.ts'
import { searchCourses } from './solver.ts'
import { Calendar, Icon } from './ui.tsx'
import { COLORS, DAYS, SHORT_DAYS, duration, sectionTimes, time } from './format.ts'
import './App.css'

interface Config { period: string; selected: string[]; locks: Record<string, string>; blocks: Block[]; preferences: Preferences }
const STORAGE_KEY = 'gradelia.config.v1'
const PRESETS: { id: string; label: string; description: string; preferences: Preferences }[] = [
  { id: 'compact', label: 'Menos intervalos', description: 'Prioriza aulas em sequência e menos dias no campus.', preferences: { gaps: 5, days: 2, start: 0, finish: 0, startMode: 'neutral' } },
  { id: 'early', label: 'Começar cedo', description: 'Prioriza a primeira aula mais cedo, em média, nos dias de aula.', preferences: { gaps: 2, days: 1, start: 5, finish: 0, startMode: 'early' } },
  { id: 'late', label: 'Começar tarde', description: 'Prioriza a primeira aula mais tarde, em média, nos dias de aula.', preferences: { gaps: 2, days: 1, start: 5, finish: 0, startMode: 'late' } },
  { id: 'finish', label: 'Terminar cedo', description: 'Prioriza sair mais cedo, em média, nos dias de aula.', preferences: { gaps: 2, days: 1, start: 0, finish: 5, startMode: 'neutral' } },
  { id: 'days', label: 'Menos dias', description: 'Prioriza concentrar as aulas em menos dias da semana.', preferences: { gaps: 2, days: 5, start: 0, finish: 0, startMode: 'neutral' } },
]
const DEFAULT_CONFIG: Config = { period: '20261', selected: [], locks: {}, blocks: [], preferences: PRESETS[0].preferences }
function restoreConfig(): Config {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!value || typeof value.period !== 'string' || !Array.isArray(value.selected) || !Array.isArray(value.blocks)) return DEFAULT_CONFIG
    const prefs = value.preferences
    if (!prefs || !['early', 'late', 'neutral'].includes(prefs.startMode) || !['gaps', 'days', 'start', 'finish'].every((key) => Number.isFinite(prefs[key]) && prefs[key] >= 0 && prefs[key] <= 5)) return DEFAULT_CONFIG
    return {
      period: value.period, selected: [...new Set<string>(value.selected.filter((item: unknown) => typeof item === 'string'))].slice(0, 12),
      locks: value.locks && typeof value.locks === 'object' ? Object.fromEntries(Object.entries(value.locks).filter(([, item]) => typeof item === 'string')) as Record<string, string> : {},
      blocks: value.blocks.filter((block: Block) => block && typeof block.id === 'string' && typeof block.label === 'string' && Number.isInteger(block.day) && block.day >= 0 && block.day <= 5 && Number.isFinite(block.start) && Number.isFinite(block.end) && block.start >= 0 && block.end <= 1440 && block.start < block.end).slice(0, 60),
      preferences: prefs,
    }
  } catch { return DEFAULT_CONFIG }
}
function presetFor(prefs: Preferences) { return PRESETS.find((preset) => JSON.stringify(preset.preferences) === JSON.stringify(prefs)) }

function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [dataError, setDataError] = useState(false)
  const [config, setConfig] = useState<Config>(restoreConfig)
  const [tab, setTab] = useState<'courses' | 'blocks' | 'preferences'>('courses')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SolveResult | null>(null)
  const [active, setActive] = useState(0)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [details, setDetails] = useState<{ section: Section; course: Course } | null>(null)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [blockDay, setBlockDay] = useState('weekdays')
  const [blockLabel, setBlockLabel] = useState('')
  const worker = useRef<Worker | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/offering.json`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('Dados indisponíveis'); return response.json() as Promise<Dataset> })
      .then((data) => {
        if (!data.periods?.length) throw new Error('Base sem períodos')
        setDataset(data)
        setConfig((previous) => {
          const period = data.periods.find((item) => item.id === previous.period) ?? data.periods[0]
          const selected = previous.selected.filter((code) => period.courses.some((course) => course.code === code))
          const locks = Object.fromEntries(Object.entries(previous.locks).filter(([code, id]) => selected.includes(code) && period.courses.some((course) => course.code === code && course.sections.some((section) => section.id === id))))
          return { ...previous, period: period.id, selected, locks }
        })
      }).catch((error: Error) => { if (error.name !== 'AbortError') setDataError(true) })
    return () => controller.abort()
  }, [])
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) } catch { /* A aplicação também funciona sem armazenamento. */ } }, [config])
  useEffect(() => () => worker.current?.terminate(), [])
  useEffect(() => {
    if (details || sourceOpen) dialog.current?.showModal()
    else dialog.current?.close()
  }, [details, sourceOpen])

  const period = dataset?.periods.find((item) => item.id === config.period)
  const courses = config.selected.map((code) => period?.courses.find((course) => course.code === code)).filter((course): course is Course => !!course)
  const grade = result?.grades[active]
  const matches = period && query.trim() ? searchCourses(period.courses, query).filter((course) => !config.selected.includes(course.code)) : []
  const preset = presetFor(config.preferences)

  function update(next: Config) {
    worker.current?.terminate(); worker.current = null
    setBusy(false); setResult(null); setActive(0); setNotice(''); setConfig(next)
  }
  function run(next: Config = config) {
    if (!dataset || !next.selected.length) return
    worker.current?.terminate()
    setBusy(true); setResult(null); setActive(0); setNotice('')
    const nextPeriod = dataset.periods.find((item) => item.id === next.period)!
    const selectedCourses = next.selected.map((code) => nextPeriod.courses.find((course) => course.code === code)).filter((course): course is Course => !!course)
    const instance = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' })
    worker.current = instance
    instance.onmessage = (event: MessageEvent<{ result?: SolveResult; error?: string }>) => {
      if (worker.current !== instance) return
      setBusy(false)
      if (event.data.result) setResult(event.data.result)
      else setNotice(event.data.error || 'Erro ao montar a grade.')
      instance.terminate(); worker.current = null
    }
    instance.onerror = () => { if (worker.current !== instance) return; setBusy(false); setNotice('Não foi possível iniciar a busca. Recarregue a página e tente novamente.'); instance.terminate(); worker.current = null }
    instance.postMessage({ courses: selectedCourses, blocks: next.blocks, locks: next.locks, preferences: next.preferences })
  }
  function addCourse(course: Course) {
    if (config.selected.length >= 12) { setNotice('Você pode selecionar até 12 disciplinas por busca.'); return }
    update({ ...config, selected: [...config.selected, course.code] }); setQuery('')
  }
  function removeCourse(code: string) {
    const locks = { ...config.locks }; delete locks[code]
    update({ ...config, selected: config.selected.filter((item) => item !== code), locks })
  }
  function addBlock(event: FormEvent) {
    event.preventDefault()
    const form = new FormData(event.currentTarget as HTMLFormElement)
    const from = String(form.get('start')), until = String(form.get('end'))
    const dayValue = String(form.get('day')), label = String(form.get('label')).trim()
    setBlockDay(dayValue)
    const toMinutes = (value: string) => { const [hours, minutes] = value.split(':').map(Number); return hours * 60 + minutes }
    const start = toMinutes(from), end = toMinutes(until)
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) { setNotice('O horário final precisa ser depois do inicial.'); return }
    const days = (dayValue === 'weekdays' ? [0, 1, 2, 3, 4] : [Number(dayValue)]).filter((day) => !config.blocks.some((item) => item.day === day && item.start === start && item.end === end))
    if (!days.length) { setNotice('Esse intervalo já está bloqueado nos dias escolhidos.'); return }
    if (config.blocks.length + days.length > 60) { setNotice('Limite de 60 bloqueios atingido. Remova algum antes de adicionar.'); return }
    const blocks = days.map((day) => ({ id: crypto.randomUUID(), day, start, end, label: label || 'Indisponível' }))
    update({ ...config, blocks: [...config.blocks, ...blocks] }); setBlockLabel('')
  }
  function example() {
    if (!dataset) return
    const examplePeriod = dataset.periods.find((item) => item.id === '20261')!
    const selected = ['MAT4162', 'INF1383', 'FIS4002', 'CRE1227'].filter((code) => examplePeriod.courses.some((course) => course.code === code))
    const next = { ...DEFAULT_CONFIG, selected }
    update(next); setTab('courses'); run(next)
  }
  function saveGrade() {
    if (!grade) return
    const file = JSON.stringify({ application: 'GradeLIA', period: period?.label, source: dataset?.meta.sourceUrl, sourceDate: dataset?.meta.sourceDate, optimalSearchComplete: result?.complete, preferences: config.preferences, blocks: config.blocks, metrics: grade.metrics, courses: grade.sections.map((section) => ({ code: courses.find((course) => course.sections.some((item) => item.id === section.id))?.code, ...section })) }, null, 2)
    const url = URL.createObjectURL(new Blob([file], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `grade-${period?.label}.json`; link.click(); URL.revokeObjectURL(url)
  }

  if (dataError) return <main className="loading-page"><Icon name="info" size={36} /><h1>Não conseguimos carregar a oferta</h1><p>Confira sua conexão e tente novamente.</p><button className="primary" onClick={() => location.reload()}>Tentar novamente</button></main>
  if (!dataset || !period) return <main className="loading-page"><div className="spinner" /><h1>Preparando sua semana</h1><p>Carregando a oferta de disciplinas…</p></main>

  return <>
    <header className="app-header">
      <a className="brand" href={import.meta.env.BASE_URL} aria-label="GradeLIA início"><span className="brand-mark"><Icon name="calendar" size={23} /></span>Grade<span>LIA</span></a>
      <div className="header-label"><span className="live-dot" /> Planejador de horários<span className="hackathon-tag">LIA Impact Lab</span></div>
      <button className="text-button source-button" onClick={() => setSourceOpen(true)}><Icon name="info" /> Sobre os dados</button>
    </header>
    <main className="app-layout">
      <aside className="planner">
        <div className="planner-intro"><span className="eyebrow">DO SEU JEITO</span><h1>Vamos montar<br />sua grade?</h1><p>Escolha as disciplinas. A gente encontra<br className="desktop-break" /> os horários que combinam com você.</p></div>
        <label className="period-field"><span>Período da oferta</span><select value={config.period} onChange={(event) => { update({ ...config, period: event.target.value, selected: [], locks: {} }); setQuery('') }}>{dataset.periods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <div className="planner-tabs" role="tablist" aria-label="Configurar grade">
          <button role="tab" aria-selected={tab === 'courses'} aria-controls="planner-panel" onClick={() => setTab('courses')}><Icon name="calendar" size={16} />Disciplinas{config.selected.length > 0 && <span className="tab-count">{config.selected.length}</span>}</button>
          <button role="tab" aria-selected={tab === 'blocks'} aria-controls="planner-panel" onClick={() => setTab('blocks')}><Icon name="lock" size={16} />Bloqueios{config.blocks.length > 0 && <span className="tab-count">{config.blocks.length}</span>}</button>
          <button role="tab" aria-selected={tab === 'preferences'} aria-controls="planner-panel" onClick={() => setTab('preferences')}><Icon name="sliders" size={16} />Preferências</button>
        </div>
        <div className="planner-content" id="planner-panel" role="tabpanel">
          {tab === 'courses' && <>
            <label className="search-field"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou código da disciplina" aria-label="Buscar disciplina" autoComplete="off" /></label>
            {query.trim() && <div className="search-results" aria-live="polite"><div className="search-caption">{matches.length ? `${matches.length} disciplina${matches.length === 1 ? '' : 's'} encontrada${matches.length === 1 ? '' : 's'}` : 'Nenhuma disciplina disponível com esse termo'}</div>{matches.slice(0, 12).map((course) => <button key={course.code} className="search-result" onClick={() => addCourse(course)}><span><strong>{course.code}</strong><span>{course.name}</span><small>{course.sections.length} turma{course.sections.length > 1 ? 's' : ''}</small></span><Icon name="plus" /></button>)}{matches.length > 12 && <p className="small-muted">Refine a busca para ver as demais disciplinas.</p>}</div>}
            <div className="section-label"><span>SUAS DISCIPLINAS <b>{courses.length.toString().padStart(2, '0')}</b></span>{courses.length > 0 && <button className="text-button" onClick={() => update({ ...config, selected: [], locks: {} })}>Limpar</button>}</div>
            {!courses.length ? <div className="selection-empty"><Icon name="plus" size={24} /><p>Adicione sua primeira disciplina</p><small>Busque por nome ou código, como INF1383.</small></div> : <div className="selected-list">{courses.map((course, index) => <article className="selected-course" key={course.code}>
              <div className="course-heading"><span className={`course-dot color-${COLORS[index % COLORS.length]}`} /><strong>{course.code}</strong><span className="credits-tag">{course.sections[0].credits} créd.</span><button className="icon-button remove-course" aria-label={`Remover ${course.code}`} onClick={() => removeCourse(course.code)}><Icon name="close" size={15} /></button></div>
              <p>{course.name}</p>
              <label className="section-selector"><Icon name={config.locks[course.code] ? 'lock' : 'sliders'} size={13} /><select aria-label={`Turma de ${course.code}`} value={config.locks[course.code] || ''} onChange={(event) => update({ ...config, locks: { ...config.locks, [course.code]: event.target.value } })}><option value="">Qualquer turma · {course.sections.length} opções</option>{course.sections.map((section) => <option key={section.id} value={section.id}>{section.label} · {sectionTimes(section)}</option>)}</select></label>
            </article>)}</div>}
            <div className="tip"><Icon name="info" size={15} /><p>Uma disciplina inclui todos os encontros da turma. Você também pode fixar uma turma específica.</p></div>
          </>}
          {tab === 'blocks' && <>
            <h2 className="panel-heading">Quando você não pode?</h2><p className="panel-description">Reserve seu estágio, trabalho ou outros compromissos. Esses horários serão sempre respeitados.</p>
            <form className="block-form" onSubmit={addBlock}>
              <label>Dia<select name="day" value={blockDay} onChange={(event) => setBlockDay(event.target.value)}><option value="weekdays">Segunda a sexta</option>{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
              <div className="time-inputs"><label>Das<input name="start" aria-label="Início do bloqueio" type="time" required defaultValue="13:00" /></label><span>até</span><label>Às<input name="end" aria-label="Fim do bloqueio" type="time" required defaultValue="18:00" /></label></div>
              <label>Nome <span className="optional">opcional</span><input name="label" value={blockLabel} onChange={(event) => setBlockLabel(event.target.value)} maxLength={40} placeholder="Ex.: estágio" /></label>
              <button className="secondary" type="submit"><Icon name="plus" />Adicionar bloqueio</button>
            </form>
            <div className="section-label"><span>HORÁRIOS BLOQUEADOS</span>{config.blocks.length > 0 && <button className="text-button" onClick={() => update({ ...config, blocks: [] })}>Limpar</button>}</div>
            <div className="block-list">{config.blocks.length ? config.blocks.map((block) => <div className="block-item" key={block.id}><Icon name="lock" size={16} /><div><strong>{block.label}</strong><span>{SHORT_DAYS[block.day]} · {time(block.start)}–{time(block.end)}</span></div><button className="icon-button" aria-label={`Remover bloqueio ${SHORT_DAYS[block.day]} ${time(block.start)} ${block.label}`} onClick={() => update({ ...config, blocks: config.blocks.filter((item) => item.id !== block.id) })}><Icon name="close" size={15} /></button></div>) : <p className="small-muted">Você ainda não adicionou bloqueios.</p>}</div>
          </>}
          {tab === 'preferences' && <>
            <h2 className="panel-heading">O que faz uma boa semana?</h2><p className="panel-description">Escolha uma prioridade ou ajuste os pesos. Preferências ordenam apenas grades sem choque.</p>
            <div className="presets">{PRESETS.map((item) => <button className={preset?.id === item.id ? 'preset active-preset' : 'preset'} key={item.id} aria-pressed={preset?.id === item.id} onClick={() => update({ ...config, preferences: item.preferences })}><span>{item.label}</span>{preset?.id === item.id ? <Icon name="check" size={16} /> : <Icon name="chevron" size={14} />}</button>)}</div>
            <p className="preset-description">{preset?.description ?? 'Preferências personalizadas. Ajuste a importância de cada critério.'}</p>
            <div className="section-label"><span>AJUSTE FINO</span><span className="custom-tag">{preset ? 'Preset' : 'Personalizado'}</span></div>
            <label className="start-mode">Primeira aula do dia<select value={config.preferences.startMode} onChange={(event) => update({ ...config, preferences: { ...config.preferences, startMode: event.target.value as Preferences['startMode'] } })}><option value="neutral">Sem preferência</option><option value="early">Começar mais cedo</option><option value="late">Começar mais tarde</option></select></label>
            {(['gaps', 'days', 'start', 'finish'] as const).map((key) => <label className="weight-field" key={key}><span>{({ gaps: 'Menos intervalos', days: 'Menos dias no campus', start: 'Horário da primeira aula', finish: 'Terminar mais cedo' })[key]}<b>{key === 'start' && config.preferences.startMode === 'neutral' ? '—' : config.preferences[key]}</b></span><input type="range" min="0" max="5" step="1" disabled={key === 'start' && config.preferences.startMode === 'neutral'} value={config.preferences[key]} onChange={(event) => update({ ...config, preferences: { ...config.preferences, [key]: Number(event.target.value) } })} /><small><span>Sem importância</span><span>Muito importante</span></small></label>)}
            <details className="method-details"><summary>Como comparamos as grades?</summary><p>A pontuação soma horas de intervalo, dias no campus e a média diária do início e do fim das aulas, multiplicados pelos pesos. Menor pontuação é melhor. Para começar tarde, usamos o tempo entre a primeira aula e meia-noite. Em empate, priorizamos menos intervalos e menos dias. O tempo antes da primeira e depois da última aula não conta como intervalo.</p></details>
          </>}
        </div>
        <div className="planner-footer"><button className="primary generate-button" disabled={!courses.length || busy} onClick={() => run()}>{busy ? <><span className="button-spinner" />Buscando combinações…</> : <><Icon name="spark" />Gerar minhas grades<Icon name="arrow" /></>}</button><span className="saved-hint">Preferências salvas neste navegador</span></div>
      </aside>
      <section className="workspace">
        <div className="workspace-title"><div><div className="workspace-eyebrow">SUA SEMANA, BEM PLANEJADA</div><h2>{grade ? 'Encontramos seu encaixe.' : 'Espaço para o que importa.'}</h2><p>{grade ? `Uma turma por disciplina. Todos os encontros no seu calendário.` : 'Uma grade sem choques, que respeita sua rotina.'}</p></div><span className="period-badge"><Icon name="calendar" size={15} />Oferta {period.label}</span></div>
        <div aria-live="polite" className="announcements">
          {notice && <div className="notice"><Icon name="info" /><span>{notice}</span></div>}
          {result && !result.grades.length && <div className="no-solution"><div><Icon name="info" /><h3>{result.complete ? 'Não há um encaixe com essas escolhas' : 'A busca precisa de uma seleção menor'}</h3></div>{result.issues.map((issue) => <p key={issue}>{issue}</p>)}<button className="text-button" onClick={() => setTab('blocks')}>Revisar meus bloqueios <Icon name="arrow" size={14} /></button></div>}
          {grade && result && <div className={`result-status ${result.complete ? '' : 'limited-status'}`}><Icon name={result.complete ? 'check' : 'info'} size={16} /><span>{result.complete ? `Busca concluída · ${result.feasibleCount.toLocaleString('pt-BR')} combinações válidas` : `Busca limitada · ${result.feasibleCount.toLocaleString('pt-BR')} combinações válidas encontradas`}</span><small>{result.complete ? 'Melhores grades pelos seus critérios' : 'O melhor resultado global ainda não foi comprovado'}</small></div>}
        </div>
        <div className="metrics"><div><span className="metric-icon"><Icon name="calendar" /></span><div><strong>{grade ? `${grade.metrics.days} dias` : '—'}</strong><span>no campus</span></div></div><div><span className="metric-icon"><Icon name="clock" /></span><div><strong>{grade ? duration(grade.metrics.gapMinutes) : '—'}</strong><span>de intervalos na semana</span></div></div><div><span className="metric-icon"><Icon name="spark" /></span><div><strong>{grade ? `${grade.metrics.credits} créditos` : '—'}</strong><span>{grade ? `${courses.length} disciplinas` : 'sua carga escolhida'}</span></div></div><div><span className="metric-icon"><Icon name="clock" /></span><div><strong>{grade ? `${time(grade.metrics.earliest)}–${time(grade.metrics.latest)}` : '—'}</strong><span>primeira e última aula da semana</span></div></div></div>
        {result && result.grades.length > 0 && <div className="alternatives"><div className="alternatives-title"><h3>Explore os encaixes</h3><span>{result.grades.length} grades com horários distintos</span></div><div className="alternative-cards">{result.grades.map((item, index) => <button key={item.signature} className={`alternative ${active === index ? 'chosen-alternative' : ''}`} onClick={() => setActive(index)} aria-pressed={active === index}><span><strong>{index === 0 ? 'Mais alinhada' : `Alternativa ${index + 1}`}</strong>{active === index && <Icon name="check" size={14} />}</span><small>{item.metrics.days} dias · {duration(item.metrics.gapMinutes)} de intervalo</small><span className="alternative-times">{time(item.metrics.earliest)}–{time(item.metrics.latest)}<b>{item.cost.toFixed(1)} pts</b></span></button>)}</div><small className="ranking-note">Menos pontos = maior alinhamento aos pesos escolhidos. Início e fim exibidos são os extremos da semana.</small></div>}
        <div className="calendar-card">
          <div className="calendar-toolbar"><h3><Icon name="calendar" />Grade semanal</h3><div>{grade ? <><button className="text-button" onClick={() => window.print()}><Icon name="print" size={16} />Imprimir</button><button className="text-button" onClick={saveGrade}><Icon name="download" size={16} />Salvar grade</button></> : <span className="calendar-hint">Cada bloco = um encontro</span>}</div></div>
          <div className="calendar-container"><Calendar grade={grade} courses={courses} blocks={config.blocks} onSection={(section, course) => setDetails({ section, course })} />
            {!grade && !busy && !result && !config.blocks.length && <div className="calendar-empty"><div className="empty-calendar-icon"><Icon name="calendar" size={30} /></div><h3>Sua próxima semana começa aqui</h3><p>Adicione disciplinas e bloqueios para encontrar<br />uma grade que faça sentido para você.</p><button className="secondary" onClick={example}>Experimentar um exemplo <Icon name="arrow" size={16} /></button><small>4 disciplinas reais da oferta 2026.1</small></div>}
            {busy && <div className="calendar-busy"><div className="spinner" /><strong>Encontrando os melhores encaixes</strong><span>Testando turmas e respeitando seus bloqueios…</span></div>}
          </div>
          <div className="calendar-footer"><div className="legend"><span className="legend-class" /> Aula<span className="legend-block" /> Horário bloqueado</div><span>{grade ? 'Clique em uma aula para ver os detalhes' : 'Sua grade aparecerá aqui'}<span className="mobile-scroll-note"> · Deslize para ver os dias</span></span></div>
        </div>
        <footer className="workspace-footer"><span>Feito para o LIA Impact Lab · PUC-Rio</span><button className="text-button" onClick={() => setSourceOpen(true)}>Oferta histórica, sem integração de matrícula <Icon name="info" size={13} /></button></footer>
      </section>
    </main>
    <dialog ref={dialog} className="detail-dialog" aria-label={details ? `Detalhes de ${details.course.code}` : 'Sobre os dados'} onCancel={() => { setDetails(null); setSourceOpen(false) }} onClick={(event) => { if (event.target === dialog.current) { setDetails(null); setSourceOpen(false) } }}><button className="icon-button dialog-close" aria-label="Fechar detalhes" onClick={() => { setDetails(null); setSourceOpen(false) }}><Icon name="close" /></button>
      {details && <><span className="eyebrow">{details.course.code} · OFERTA {period.label}</span><h2>{details.course.name}</h2><div className="detail-tags"><span>Turma {details.section.label}</span><span>{details.section.credits} créditos</span></div><h3>Todos os encontros desta turma</h3><ul className="meeting-list">{details.section.slots.map((slot) => <li key={`${slot.day}/${slot.start}`}><span>{DAYS[slot.day]}</span><strong>{time(slot.start)}–{time(slot.end)}</strong></li>)}</ul><p className="small-muted">A escolha da turma inclui todos esses encontros. Nomes de professores e salas não são exibidos porque a base do case usa identificadores anônimos.</p>{!details.course.catalogMatched && <p className="small-muted">Nome abreviado da oferta: esta disciplina não está no catálogo complementar.</p>}</>}
      {sourceOpen && <><span className="eyebrow">DADOS E LIMITES</span><h2>Uma oferta real.<br />Um recorte transparente.</h2><p>Usamos somente os CSVs oficiais do Case 3 do LIA Impact Lab, com ofertas de 2025.2 e 2026.1. Estes dados foram extraídos em 17/08/2026 e não representam a matrícula atual.</p><div className="source-stats"><div><strong>{dataset.meta.rawRows.toLocaleString('pt-BR')}</strong><span>linhas de origem</span></div><div><strong>{dataset.meta.logicalSlots.toLocaleString('pt-BR')}</strong><span>blocos distintos</span></div></div><p>Linhas repetidas de horário foram agrupadas. {dataset.meta.excluded.length} turmas com encontros internos sobrepostos foram excluídas da busca. O período escolhido contém {period.courses.length.toLocaleString('pt-BR')} disciplinas com turmas utilizáveis.</p><p>Não verificamos pré-requisitos, histórico do aluno, disponibilidade de vagas ou elegibilidade para matrícula. A turma é escolhida sempre por inteiro.</p><a className="source-link" href={dataset.meta.sourceUrl} target="_blank" rel="noreferrer">Ver repositório oficial dos dados <Icon name="arrow" size={16} /></a></>}
    </dialog>
  </>
}

export default App
