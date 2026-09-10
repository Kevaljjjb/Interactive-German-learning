import { ArrowRight, Check, Clock3, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { curriculum } from '../data/curriculum'
import type { GrammarUnit, ProgressState } from '../types'

type LearningPathProps = {
  progress: ProgressState
  onOpenUnit: (unit: GrammarUnit) => void
}

const groups = [
  { title: 'Wurzeln', subtitle: 'Sätze, Fragen und Dinge', range: [1, 4], color: '#78956D' },
  { title: 'Verbindungen', subtitle: 'Zeit, Modalität und Fälle', range: [5, 8], color: '#C98755' },
  { title: 'Freies Sprechen', subtitle: 'Menschen, Vergangenheit und Raum', range: [9, 12], color: '#6879A7' },
]

export function LearningPath({ progress, onOpenUnit }: LearningPathProps) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase('de')
  const filtered = useMemo(() => {
    if (!normalizedQuery) return curriculum
    return curriculum.filter((unit) =>
      [unit.title, unit.theme, unit.description, ...unit.topics].join(' ').toLocaleLowerCase('de').includes(normalizedQuery),
    )
  }, [normalizedQuery])

  const percent = Math.round((progress.completedUnits.length / curriculum.length) * 100)
  const topicCount = curriculum.reduce((total, unit) => total + unit.topics.length, 0)

  return (
    <div className="page path-page">
      <header className="path-header">
        <div className="path-title-block">
          <span className="section-kicker">DEIN KOMPLETTER A1-WEG</span>
          <h1>Grammatik zum Anfassen.</h1>
          <p>12 Kapitel · {topicCount} Themen · originale Erklärungen und Übungen</p>
        </div>
        <div className="path-completion">
          <div className="completion-ring" style={{ background: `conic-gradient(#476F57 ${percent}%, #e7ebe5 0)` }}>
            <span>{percent}%</span>
          </div>
          <div><strong>{progress.completedUnits.length} von 12</strong><small>Kapitel gemeistert</small></div>
        </div>
      </header>

      <div className="path-toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            type="search"
            aria-label="Thema oder Kapitel suchen"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Thema suchen, z. B. Akkusativ …"
          />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Suche leeren">×</button>}
        </label>
        <div className="gender-legend" aria-label="Farblegende für Nomen">
          <span><i className="legend-dot der" /> der</span>
          <span><i className="legend-dot die" /> die</span>
          <span><i className="legend-dot das" /> das</span>
          <span><i className="legend-dot plural" /> Plural</span>
        </div>
      </div>

      {normalizedQuery ? (
        <section className="search-results">
          <div className="section-heading">
            <div><span className="section-kicker">SUCHERGEBNIS</span><h2>{filtered.length} passende Kapitel</h2></div>
          </div>
          {filtered.length > 0 ? (
            <div className="unit-grid compact-grid">
              {filtered.map((unit) => (
                <UnitCard key={unit.id} unit={unit} progress={progress} onOpen={onOpenUnit} />
              ))}
            </div>
          ) : (
            <div className="empty-search"><span>🌱</span><h3>Noch kein Treffer</h3><p>Versuch „Perfekt“, „Zeit“ oder „Artikel“.</p></div>
          )}
        </section>
      ) : (
        <div className="curriculum-groups">
          {groups.map((group, groupIndex) => {
            const units = curriculum.filter((unit) => unit.number >= group.range[0] && unit.number <= group.range[1])
            return (
              <section className="path-group" key={group.title}>
                <div className="group-marker">
                  <span style={{ background: group.color }}>{groupIndex + 1}</span>
                  <div><small>ETAPPE {groupIndex + 1}</small><h2>{group.title}</h2><p>{group.subtitle}</p></div>
                </div>
                <div className="unit-grid">
                  {units.map((unit) => (
                    <UnitCard key={unit.id} unit={unit} progress={progress} onOpen={onOpenUnit} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <section className="coverage-note">
        <span className="coverage-icon"><Sparkles size={22} /></span>
        <div>
          <strong>Die wichtigsten A1-Muster – mit eigenen Beispielen.</strong>
          <p>Orientiert an typischen A1-Themen und Netzwerk neu A1. Keine offizielle Buchzuordnung: Einzelne Vertiefungen reichen bis A2. Alle Erklärungen, Beispiele und Spiele sind neu geschrieben.</p>
        </div>
      </section>
    </div>
  )
}

type UnitCardProps = {
  unit: GrammarUnit
  progress: ProgressState
  onOpen: (unit: GrammarUnit) => void
}

function UnitCard({ unit, progress, onOpen }: UnitCardProps) {
  const done = progress.completedUnits.includes(unit.id)
  const score = progress.unitScores[unit.id] ?? 0

  return (
    <article className={done ? 'unit-card complete' : 'unit-card'}>
      <button type="button" onClick={() => onOpen(unit)} aria-label={`${unit.title} öffnen`}>
        <div className="unit-card-top">
          <span className="unit-icon" style={{ background: unit.softColor }}><span>{unit.icon}</span></span>
          <span className="unit-index">{done ? <Check size={16} /> : String(unit.number).padStart(2, '0')}</span>
        </div>
        <div className="unit-card-copy">
          <small>{unit.theme.toUpperCase()}</small>
          <h3>{unit.title}</h3>
          <p>{unit.description}</p>
        </div>
        <div className="topic-list">
          {unit.topics.slice(0, 3).map((topic) => <span key={topic}>{topic}</span>)}
          {unit.topics.length > 3 && <span>+{unit.topics.length - 3}</span>}
        </div>
        <div className="unit-card-footer">
          <span><Clock3 size={14} /> {unit.duration} Min.</span>
          <span className="unit-status">{done ? `${score}/3 richtig` : 'Entdecken'} <ArrowRight size={16} /></span>
        </div>
        <i className="unit-accent" style={{ background: unit.color }} />
      </button>
    </article>
  )
}
