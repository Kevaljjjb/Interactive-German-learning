import { ArrowRight, Check, ChevronRight, Flame, Leaf, Play, Sparkles, Target } from 'lucide-react'
import { useState } from 'react'
import { curriculum } from '../data/curriculum'
import type { DailyPlan, DailySlot, GrammarUnit, LearnerProfile, LearningFingerprint, ProgressState } from '../types'
import { SmartDailyPlan } from './SmartDailyPlan'

type HomeProps = {
  profile: LearnerProfile
  fingerprint: LearningFingerprint
  progress: ProgressState
  dailyPlan: DailyPlan
  onOpenUnit: (unit: GrammarUnit) => void
  onOpenPath: () => void
  onPractice: () => void
  onPersonalize: () => void
  onStartDailySlot: (slot: DailySlot) => void
  onClearWobbly?: () => void
  onPracticeWobbly?: (unitId: string) => void
}

function germanDate() {
  const value = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function Home({
  profile,
  fingerprint,
  progress,
  dailyPlan,
  onOpenUnit,
  onOpenPath,
  onPractice,
  onPersonalize,
  onStartDailySlot,
  onClearWobbly,
  onPracticeWobbly,
}: HomeProps) {
  const [patternMode, setPatternMode] = useState<'subject' | 'time'>('subject')
  const nextUnit = curriculum.find((unit) => !progress.completedUnits.includes(unit.id)) ?? curriculum[0]
  const pathPercent = Math.round((progress.completedUnits.length / curriculum.length) * 100)
  const todayIndex = (new Date().getDay() + 6) % 7
  const greeting = profile.name.trim() ? `Hallo, ${profile.name.trim()}!` : 'Hallo, Entdecker!'

  return (
    <div className="page home-page">
      <header className="page-topbar">
        <div>
          <span className="date-label">{germanDate()}</span>
          <h1>{greeting}</h1>
        </div>
        <button className="daily-goal" type="button" onClick={onPersonalize}>
          <Target size={18} />
          <span><strong>{profile.dailyMinutes} Min.</strong><small>Tagesziel</small></span>
        </button>
      </header>

      <section className="home-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow-pill"><Sparkles size={14} /> DEUTSCH, DAS DU SEHEN KANNST</span>
          <h2 id="hero-title">Grammatik ist kein Text.<br /><em>Sie ist ein Muster.</em></h2>
          <p>Verschiebe Wörter, sieh Regeln in Farbe und lerne mit kleinen Aha-Momenten.</p>
          <div className="hero-actions">
            <button className="primary-button light" type="button" onClick={() => onOpenUnit(nextUnit)}>
              <Play size={17} fill="currentColor" /> Weiterlernen
            </button>
            <button className="text-button hero-link" type="button" onClick={onOpenPath}>
              Alle 12 Kapitel <ArrowRight size={17} />
            </button>
          </div>
          <div className="hero-progress">
            <span>{pathPercent}% des A1-Wegs</span>
            <div className="progress-track dark"><span style={{ width: `${pathPercent}%` }} /></div>
          </div>
        </div>

        <div className="hero-visual" aria-label="Ein visueller Satz mit dem Verb auf Position zwei">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="floating-leaf leaf-a">✦</span>
          <span className="floating-leaf leaf-b">●</span>
          <div className="position-flag">POSITION 2</div>
          <div className="sentence-stack notranslate" translate="no" lang="de">
            <span className="hero-word green-word">ICH<small>WER?</small></span>
            <span className="hero-word coral-word">LERNE<small>VERB</small></span>
            <span className="hero-word blue-word">DEUTSCH<small>WAS?</small></span>
          </div>
          <div className="mascot-bubble" aria-hidden="true">
            <span className="mascot-eyes">••</span>
            <span className="mascot-smile">⌣</span>
          </div>
        </div>
      </section>

      <div className="dashboard-layout">
        <div className="dashboard-main">
          <SmartDailyPlan
            dailyPlan={dailyPlan}
            currentUnit={nextUnit}
            onStartSlot={onStartDailySlot}
            onOpenUnit={(unitId) => {
              const u = curriculum.find((unit) => unit.id === unitId) ?? nextUnit
              onOpenUnit(u)
            }}
            onOpenGame={onPractice}
            onWarmup={() => {
              if (progress.wobblyItems && progress.wobblyItems.length > 0 && onPracticeWobbly) {
                onPracticeWobbly(progress.wobblyItems[0].unitId)
              } else {
                onPractice()
              }
            }}
          />

          <section className="section-block quick-actions-block">

            <div className="micro-lessons">
              <button type="button" onClick={() => onOpenUnit(curriculum[2])}>
                <span className="micro-icon blue">der</span>
                <span><small>FARBCODE</small><strong>Artikel sehen</strong></span>
                <ChevronRight size={18} />
              </button>
              <button type="button" onClick={onPractice}>
                <span className="micro-icon yellow">A↔B</span>
                <span><small>2-MIN-SPIEL</small><strong>Sätze ordnen</strong></span>
                <ChevronRight size={18} />
              </button>
            </div>
          </section>

          <section className="section-block path-preview">
            <div className="section-heading">
              <div>
                <span className="section-kicker">A1-LERNPFAD</span>
                <h2>Deine nächsten Beete</h2>
              </div>
              <button className="text-button" type="button" onClick={onOpenPath}>Alle ansehen <ArrowRight size={16} /></button>
            </div>
            <div className="preview-units">
              {curriculum.slice(0, 3).map((unit) => {
                const done = progress.completedUnits.includes(unit.id)
                const score = progress.unitScores[unit.id]
                return (
                  <button key={unit.id} className="preview-unit" type="button" onClick={() => onOpenUnit(unit)}>
                    <span className="preview-number" style={{ background: unit.softColor, color: unit.color }}>
                      {done ? <Check size={18} /> : String(unit.number).padStart(2, '0')}
                    </span>
                    <span className="preview-copy"><small>{unit.theme}</small><strong>{unit.title}</strong></span>
                    <span className="preview-score">{score ? `${score}/3` : 'Start'} <ChevronRight size={15} /></span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <aside className="dashboard-aside">
          <section className="streak-card">
            <div className="streak-top">
              <span className="streak-flame"><Flame size={24} fill="currentColor" /></span>
              <div><strong>{progress.streak} {progress.streak === 1 ? 'Tag' : 'Tage'}</strong><small>Deine kleine Serie</small></div>
            </div>
            <div className="week-row">
              {['M', 'D', 'M', 'D', 'F', 'S', 'S'].map((day, index) => {
                const visibleStreak = Math.min(progress.streak, todayIndex + 1)
                const isDone = visibleStreak > 0 && index <= todayIndex && index > todayIndex - visibleStreak
                return (
                  <span key={`${day}-${index}`} className={isDone ? 'done' : index === todayIndex ? 'today' : ''}>
                    <small>{day}</small><i>{isDone ? <Check size={12} /> : ''}</i>
                  </span>
                )
              })}
            </div>
            <p>Schon 5 Minuten zählen. Komm morgen wieder und lass deinen Garten wachsen.</p>
          </section>

          <section className="pattern-card">
            <div className="pattern-card-head">
              <span><span className="live-dot" /> LIVE-MUSTER</span>
              <button type="button" onClick={() => setPatternMode(patternMode === 'subject' ? 'time' : 'subject')}>Tauschen</button>
            </div>
            <h3>Was bleibt gleich?</h3>
            <p>Tippe auf „Tauschen“ und beobachte den orangefarbenen Verbblock.</p>
            <div className="mini-track notranslate" translate="no" lang="de">
              {patternMode === 'subject' ? (
                <><span className="tone-green">Ich<small>1</small></span><span className="tone-coral">lerne<small>2</small></span><span className="tone-blue">heute<small>3</small></span></>
              ) : (
                <><span className="tone-yellow">Heute<small>1</small></span><span className="tone-coral">lerne<small>2</small></span><span className="tone-green">ich<small>3</small></span></>
              )}
            </div>
            <div className="aha-note"><span>💡</span><p><strong>Aha!</strong> Das Verb bleibt immer auf Position 2.</p></div>
          </section>

          <section className="mini-fingerprint-card">
            <div className="mini-fp-head">
              <span>🌱 GARTEN-STATUS</span>
              <strong>{Math.round(Object.values(fingerprint.pillars).reduce((a, b) => a + b.score, 0) / 5)}% Vitalität</strong>
            </div>
            <div className="mini-fp-bars">
              {Object.values(fingerprint.pillars).map((p) => (
                <div key={p.label} className="mini-fp-col" title={`${p.germanName}: ${p.score}%`}>
                  <div className="mini-fp-track"><span style={{ height: `${p.score}%` }} /></div>
                  <small>{p.label.slice(0, 3)}</small>
                </div>
              ))}
            </div>
            {progress.wobblyItems && progress.wobblyItems.length > 0 && onClearWobbly && (
              <button type="button" className="mini-watering-btn" onClick={onClearWobbly}>
                🌱 {progress.wobblyItems.length} Muster gießen
              </button>
            )}
          </section>

          <button className="leaves-card" type="button" onClick={onPractice}>
            <span className="leaves-icon"><Leaf size={22} /></span>
            <span><small>GESAMMELT</small><strong>{progress.leaves} Blätter</strong></span>
            <ArrowRight size={18} />
          </button>
        </aside>
      </div>
    </div>
  )
}
