import { ArrowRight, Check, Clock3, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { curriculum } from '../data/curriculum'
import type { GrammarUnit, ProgressState } from '../types'

type LearningPathProps = {
  progress: ProgressState
  onOpenUnit: (unit: GrammarUnit) => void
  onOpenTopic: (unit: GrammarUnit, topic: string) => void
}

const groups = [
  { title: 'Roots', subtitle: 'Sentences, questions, and everyday things', range: [1, 4], color: '#78956D' },
  { title: 'Connections', subtitle: 'Time, modality, and cases', range: [5, 8], color: '#C98755' },
  { title: 'Free Expression', subtitle: 'People, past tense, and space', range: [9, 12], color: '#6879A7' },
]

export function LearningPath({ progress, onOpenUnit, onOpenTopic }: LearningPathProps) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase('de')
  const filtered = useMemo(() => {
    if (!normalizedQuery) return curriculum
    return curriculum.filter((unit) =>
      [unit.title, unit.theme, unit.description, ...unit.topics].join(' ').toLocaleLowerCase('de').includes(normalizedQuery),
    )
  }, [normalizedQuery])

  const matchingTopics = useMemo(() => curriculum.flatMap(unit => unit.topics
    .filter(topic => !normalizedQuery || [topic, unit.title, unit.theme].join(' ').toLocaleLowerCase('en').includes(normalizedQuery))
    .map(topic => ({ unit, topic }))), [normalizedQuery])
  const percent = Math.round((progress.completedUnits.length / curriculum.length) * 100)
  const topicCount = curriculum.reduce((total, unit) => total + unit.topics.length, 0)

  return (
    <div className="page path-page">
      <header className="path-header">
        <div className="path-title-block">
          <span className="section-kicker">YOUR COMPLETE A1 JOURNEY</span>
          <h1>Hands-on grammar.</h1>
          <p>12 chapters · {topicCount} topics · original explanations and interactive exercises</p>
        </div>
        <div className="path-completion">
          <div className="completion-ring" style={{ background: `conic-gradient(#476F57 ${percent}%, #e7ebe5 0)` }}>
            <span>{percent}%</span>
          </div>
          <div><strong>{progress.completedUnits.length} of 12</strong><small>chapters mastered</small></div>
        </div>
      </header>

      <div className="path-toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            type="search"
            aria-label="Search topic or chapter"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topic, e.g. accusative…"
          />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
        </label>
        <div className="gender-legend" aria-label="Color legend for noun genders">
          <span lang="de" translate="no"><i className="legend-dot der" /> der</span>
          <span lang="de" translate="no"><i className="legend-dot die" /> die</span>
          <span lang="de" translate="no"><i className="legend-dot das" /> das</span>
          <span><i className="legend-dot plural" /> Plural</span>
        </div>
      </div>

      <details className="topic-directory" open={Boolean(normalizedQuery)}>
        <summary><span><Sparkles size={17} /><strong>{normalizedQuery ? `${matchingTopics.length} matching topic links` : `Explore all ${topicCount} grammar topics`}</strong></span><small>Open a topic directly inside its visual chapter</small></summary>
        <div className="topic-directory-grid">
          {matchingTopics.map(({ unit, topic }) => <button type="button" key={`${unit.id}-${topic}`} onClick={() => onOpenTopic(unit, topic)}><span style={{ background: unit.softColor }}>{unit.icon}</span><span><strong>{topic}</strong><small>Chapter {unit.number} · {unit.title}</small></span><ArrowRight size={15} /></button>)}
        </div>
      </details>

      {normalizedQuery ? (
        <section className="search-results">
          <div className="section-heading">
            <div><span className="section-kicker">SEARCH RESULTS</span><h2>{filtered.length} matching {filtered.length === 1 ? 'chapter' : 'chapters'}</h2></div>
          </div>
          {filtered.length > 0 ? (
            <div className="unit-grid compact-grid">
              {filtered.map((unit) => (
                <UnitCard key={unit.id} unit={unit} progress={progress} onOpen={onOpenUnit} />
              ))}
            </div>
          ) : (
            <div className="empty-search"><span>🌱</span><h3>No results yet</h3><p>Try “Perfekt”, “time”, or “articles”.</p></div>
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
                  <div><small>STAGE {groupIndex + 1}</small><h2>{group.title}</h2><p>{group.subtitle}</p></div>
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
          <strong>Essential A1 grammar patterns — made clear and visual.</strong>
          <p>Aligned with core A1 learning goals and common textbook milestones. All explanations, visual models, and interactive games are newly designed.</p>
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
      <button type="button" onClick={() => onOpen(unit)} aria-label={`Open ${unit.title}`}>
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
          <span><Clock3 size={14} /> {unit.duration} min</span>
          <span className="unit-status">{done ? `${score}/3 correct` : 'Explore'} <ArrowRight size={16} /></span>
        </div>
        <i className="unit-accent" style={{ background: unit.color }} />
      </button>
    </article>
  )
}
