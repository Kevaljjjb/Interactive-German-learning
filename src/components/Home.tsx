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

function formattedDate() {
  const value = new Intl.DateTimeFormat('en-US', {
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
  const greeting = profile.name.trim() ? `Hello, ${profile.name.trim()}!` : 'Hello, Explorer!'

  return (
    <div className="page home-page">
      <header className="page-topbar">
        <div>
          <span className="date-label">{formattedDate()}</span>
          <h1>{greeting}</h1>
        </div>
        <button className="daily-goal" type="button" onClick={onPersonalize}>
          <Target size={18} />
          <span><strong>{profile.dailyMinutes} min</strong><small>Daily goal</small></span>
        </button>
      </header>

      <section className="home-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow-pill"><Sparkles size={14} /> GERMAN YOU CAN SEE</span>
          <h2 id="hero-title">Grammar is not text.<br /><em>It is a pattern.</em></h2>
          <p>Move words, see rules in color, and learn with intuitive aha moments.</p>
          <div className="hero-actions">
            <button className="primary-button light" type="button" onClick={() => onOpenUnit(nextUnit)}>
              <Play size={17} fill="currentColor" /> Continue learning
            </button>
            <button className="text-button hero-link" type="button" onClick={onOpenPath}>
              All 12 chapters <ArrowRight size={17} />
            </button>
          </div>
          <div className="hero-progress">
            <span>{pathPercent}% of the A1 journey</span>
            <div className="progress-track dark"><span style={{ width: `${pathPercent}%` }} /></div>
          </div>
        </div>

        <div className="hero-visual" aria-label="A visual sentence with the verb in position two">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="floating-leaf leaf-a">✦</span>
          <span className="floating-leaf leaf-b">●</span>
          <div className="position-flag">POSITION 2</div>
          <div className="sentence-stack" lang="en">
            <span className="hero-word green-word"><span lang="de" translate="no">ICH</span><small>WHO?</small></span>
            <span className="hero-word coral-word"><span lang="de" translate="no">LERNE</span><small>VERB</small></span>
            <span className="hero-word blue-word"><span lang="de" translate="no">DEUTSCH</span><small>WHAT?</small></span>
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
                <span className="micro-icon blue" lang="de" translate="no">der</span>
                <span><small>COLOR CODE</small><strong>See articles</strong></span>
                <ChevronRight size={18} />
              </button>
              <button type="button" onClick={onPractice}>
                <span className="micro-icon yellow">A↔B</span>
                <span><small>2-MIN GAME</small><strong>Arrange sentences</strong></span>
                <ChevronRight size={18} />
              </button>
            </div>
          </section>

          <section className="section-block path-preview">
            <div className="section-heading">
              <div>
                <span className="section-kicker">A1 LEARNING PATH</span>
                <h2>Your next chapters</h2>
              </div>
              <button className="text-button" type="button" onClick={onOpenPath}>View all <ArrowRight size={16} /></button>
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
              <div><strong>{progress.streak} {progress.streak === 1 ? 'day' : 'days'}</strong><small>Your streak</small></div>
            </div>
            <div className="week-row">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                const visibleStreak = Math.min(progress.streak, todayIndex + 1)
                const isDone = visibleStreak > 0 && index <= todayIndex && index > todayIndex - visibleStreak
                return (
                  <span key={`${day}-${index}`} className={isDone ? 'done' : index === todayIndex ? 'today' : ''}>
                    <small>{day}</small><i>{isDone ? <Check size={12} /> : ''}</i>
                  </span>
                )
              })}
            </div>
            <p>Even 5 minutes count. Come back tomorrow and watch your garden grow.</p>
          </section>

          <section className="pattern-card">
            <div className="pattern-card-head">
              <span><span className="live-dot" /> LIVE PATTERN</span>
              <button type="button" onClick={() => setPatternMode(patternMode === 'subject' ? 'time' : 'subject')}>Swap</button>
            </div>
            <h3>What stays the same?</h3>
            <p>Tap “Swap” and watch the orange verb block.</p>
            <div className="mini-track" lang="en">
              {patternMode === 'subject' ? (
                <><span className="tone-green"><span lang="de" translate="no">Ich</span><small>1</small></span><span className="tone-coral"><span lang="de" translate="no">lerne</span><small>2</small></span><span className="tone-blue"><span lang="de" translate="no">heute</span><small>3</small></span></>
              ) : (
                <><span className="tone-yellow"><span lang="de" translate="no">Heute</span><small>1</small></span><span className="tone-coral"><span lang="de" translate="no">lerne</span><small>2</small></span><span className="tone-green"><span lang="de" translate="no">ich</span><small>3</small></span></>
              )}
            </div>
            <div className="aha-note"><span>💡</span><p><strong>Aha!</strong> The verb always stays in Position 2.</p></div>
          </section>

          <section className="mini-fingerprint-card">
            <div className="mini-fp-head">
              <span>🌱 GARDEN STATUS</span>
              <strong>{Math.round(Object.values(fingerprint.pillars).reduce((a, b) => a + b.score, 0) / 5)}% Vitality</strong>
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
                🌱 Water {progress.wobblyItems.length} {progress.wobblyItems.length === 1 ? 'pattern' : 'patterns'}
              </button>
            )}
          </section>

          <button className="leaves-card" type="button" onClick={onPractice}>
            <span className="leaves-icon"><Leaf size={22} /></span>
            <span><small>COLLECTED</small><strong>{progress.leaves} {progress.leaves === 1 ? 'leaf' : 'leaves'}</strong></span>
            <ArrowRight size={18} />
          </button>
        </aside>
      </div>
    </div>
  )
}
