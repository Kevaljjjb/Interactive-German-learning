import { ArrowLeft, ArrowRight, BookOpen, Check, Clock3, Eye, Headphones, Lightbulb, Play, Sparkles, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AnswerSignal, ConfidenceRating, GrammarUnit, LearningMode, ProgressState, VisualStyle } from '../types'
import { PracticeSession } from './PracticeSession'
import { TutorPanel } from './TutorPanel'

type LessonTab = 'discover' | 'examples' | 'practice'

type LessonViewProps = {
  unit: GrammarUnit
  progress: ProgressState
  onBack: () => void
  onComplete: (score: number) => void
  onRecordAnswer: (correct: boolean, signal?: AnswerSignal) => void
  onRecordConfidence?: (unitId: string, prompt: string, confidence: ConfidenceRating, isCorrect: boolean) => void
  onModeSignal?: (mode: LearningMode) => void
  initialTab?: LessonTab
  visualStyle?: VisualStyle
  feedbackTone?: 'gentle' | 'direct'
}

export function LessonView({
  unit,
  progress,
  onBack,
  onComplete,
  onRecordAnswer,
  onRecordConfidence,
  onModeSignal,
  initialTab = 'discover',
  visualStyle = 'blocks',
  feedbackTone = 'gentle',
}: LessonViewProps) {
  const [tab, setTab] = useState<LessonTab>(initialTab)
  const [visualIndex, setVisualIndex] = useState(0)
  const [speakingText, setSpeakingText] = useState('')
  const completed = progress.completedUnits.includes(unit.id)
  const bestScore = progress.unitScores[unit.id] ?? 0

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [unit.id])

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.82
    utterance.pitch = 1
    setSpeakingText(text)
    utterance.onend = () => setSpeakingText('')
    utterance.onerror = () => setSpeakingText('')
    window.speechSynthesis.speak(utterance)
    onModeSignal?.('listening')
  }

  const visualState = unit.visual.states[visualIndex]

  return (
    <div className={`page lesson-page visual-style-${visualStyle}`}>
      <div className="lesson-topline">
        <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> Learning Path</button>
        <div className="lesson-top-progress">
          <span>Chapter {unit.number} of 12</span>
          <div className="progress-track"><span style={{ width: `${(unit.number / 12) * 100}%`, background: unit.color }} /></div>
        </div>
        <div className={completed ? 'mastery-pill done' : 'mastery-pill'}>
          {completed ? <Check size={15} /> : <Sparkles size={15} />}
          {completed ? `${bestScore}/3 correct` : 'In progress'}
        </div>
      </div>

      <header
        className="lesson-hero"
        style={{
          background: 'var(--unit-soft)',
          ['--unit-soft' as string]: unit.softColor,
          ['--unit-color' as string]: unit.color,
        }}
      >
        <div className="lesson-hero-copy">
          <span className="lesson-count" style={{ color: unit.color }}>CHAPTER {String(unit.number).padStart(2, '0')} · {unit.theme.toUpperCase()}</span>
          <h1>{unit.title}</h1>
          <p>{unit.description}</p>
          <div className="lesson-meta">
            <span><Clock3 size={16} /> {unit.duration} minutes</span>
            <span><Eye size={16} /> Visual</span>
            <span><Play size={15} /> 3 exercises</span>
          </div>
        </div>
        <div className="lesson-hero-art" aria-hidden="true">
          <span className="lesson-emoji">{unit.icon}</span>
          <i className="art-ring ring-a" style={{ borderColor: unit.color }} />
          <i className="art-ring ring-b" />
          <span className="art-card one">{unit.topics[0]}</span>
          <span className="art-card two">{unit.topics[1]}</span>
        </div>
      </header>

      <nav className="lesson-tabs" aria-label="Lesson sections" role="tablist">
        <button role="tab" aria-selected={tab === 'discover'} className={tab === 'discover' ? 'active' : ''} type="button" onClick={() => setTab('discover')}><Eye size={18} /> Discover</button>
        <button role="tab" aria-selected={tab === 'examples'} className={tab === 'examples' ? 'active' : ''} type="button" onClick={() => { setTab('examples'); onModeSignal?.('examples') }}><BookOpen size={18} /> Examples</button>
        <button role="tab" aria-selected={tab === 'practice'} className={tab === 'practice' ? 'active' : ''} type="button" onClick={() => setTab('practice')}><Play size={17} /> Practice <span>3</span></button>
      </nav>

      {tab === 'discover' && (
        <div className="lesson-content-grid">
          <div className="lesson-main-column">
            <section className="visual-lab">
              <div className="lab-heading">
                <div><span className="section-kicker">VISUAL CONCEPT</span><h2>{unit.rule.label}</h2></div>
                <span className="interactive-label"><i /> INTERACTIVE</span>
              </div>
              <p className="metaphor-copy">{unit.visual.metaphor}</p>
              <div className="state-switcher" role="tablist" aria-label="Switch visualization">
                {unit.visual.states.map((state, index) => (
                  <button
                    key={state.label}
                    type="button"
                    role="tab"
                    aria-selected={index === visualIndex}
                    className={index === visualIndex ? 'active' : ''}
                    onClick={() => { setVisualIndex(index); onModeSignal?.('visual') }}
                  >
                    {state.label}
                  </button>
                ))}
              </div>
              <div className="visual-stage" lang="en">
                <div className="stage-grid" />
                <div className="visual-title"><small>NOW VISIBLE</small><h3>{visualState.title}</h3></div>
                <div className="block-track notranslate" translate="no" lang="de" key={`${unit.id}-${visualIndex}`}>
                  {visualState.blocks.map((block, index) => (
                    <div key={`${block.text}-${index}`} className={`visual-block tone-${block.tone}${block.wide ? ' wide' : ''}`}>
                      <span>{block.text}</span>
                      {block.sub && <small>{block.sub}</small>}
                    </div>
                  ))}
                </div>
                <p className="visual-caption"><Lightbulb size={17} /> <span>{visualState.caption}</span></p>
              </div>
            </section>

            <section className="rule-card">
              <div className="rule-heading">
                <span className="rule-icon"><BookOpen size={21} /></span>
                <div><span className="section-kicker">THE RULE IN PLAIN TERMS</span><h2>{unit.rule.title}</h2></div>
              </div>
              <div className="formula-strip notranslate" translate="no" lang="de">{unit.rule.formula}</div>
              <p>{unit.rule.body}</p>
              <div className="memory-tip"><span>🧠</span><div><strong>Memory Hook</strong><p>{unit.rule.tip}</p></div></div>
            </section>

            <button className="next-section-card" type="button" onClick={() => setTab('examples')}>
              <span><small>UP NEXT</small><strong>See the rule in real sentences</strong></span>
              <span className="round-arrow"><ArrowRight size={19} /></span>
            </button>
          </div>

          <aside className="lesson-side-column">
            <section className="goal-card">
              <span className="section-kicker">WHAT YOU'LL BE ABLE TO DO</span>
              <ul>{unit.goals.map((goal) => <li key={goal}><Check size={15} /> {goal}</li>)}</ul>
            </section>
            <section className="topic-card">
              <span className="section-kicker">IN THIS CHAPTER</span>
              <div>{unit.topics.map((topic, index) => <span key={topic}><i>{String(index + 1).padStart(2, '0')}</i>{topic}</span>)}</div>
            </section>
            <section className="audio-card">
              <span className="audio-card-icon"><Headphones size={21} /></span>
              <div><strong>Listening aids vision.</strong><p>Have each German example read aloud slowly.</p></div>
            </section>
          </aside>
        </div>
      )}

      {tab === 'examples' && (
        <section className="examples-section">
          <div className="examples-intro">
            <span className="section-kicker">COLLECT PATTERNS</span>
            <h2>{unit.examples.length} sentences. One clear pattern.</h2>
            <p>Listen, read aloud, and pay special attention to the highlighted building block.</p>
          </div>
          <div className="example-grid">
            {unit.examples.map((example, index) => (
              <article className="example-card" key={example.de}>
                <div className="example-top"><span>{String(index + 1).padStart(2, '0')}</span><button type="button" className={speakingText === example.de ? 'speaking' : ''} onClick={() => speak(example.de)} aria-label={`Read aloud: ${example.de}`}><Volume2 size={18} /></button></div>
                <h3 className="notranslate" translate="no" lang="de">{highlight(example.de, example.focus)}</h3>
                <p>{example.en}</p>
                <div className="example-note"><Lightbulb size={15} /> {example.note}</div>
              </article>
            ))}
          </div>
          <div className="example-pattern-summary">
            <span className="summary-symbol">✦</span>
            <div><small>YOUR AHA MOMENT</small><strong>{unit.rule.formula}</strong><p>{unit.rule.title}</p></div>
            <button type="button" className="primary-button" onClick={() => setTab('practice')}>Try it now <ArrowRight size={17} /></button>
          </div>
        </section>
      )}

      {tab === 'examples' && <TutorPanel key={unit.id} unit={unit} progress={progress} style={visualStyle} />}

      {tab === 'practice' && (
        <section className="lesson-practice-wrap">
          <div className="practice-title">
            <span className="section-kicker">YOUR TURN</span>
            <h2>Play instead of memorizing.</h2>
            <p>You get immediate explanations — here, mistakes are just signposts.</p>
          </div>
          <PracticeSession
            key={unit.id}
            unit={unit}
            onComplete={onComplete}
            onRecordAnswer={onRecordAnswer}
            onRecordConfidence={onRecordConfidence}
            feedbackTone={feedbackTone}
            onBackToLesson={() => setTab('discover')}
          />
        </section>
      )}
    </div>
  )
}

function highlight(text: string, focus: string) {
  const index = text.indexOf(focus)
  if (index < 0) return text
  return <>{text.slice(0, index)}<mark>{focus}</mark>{text.slice(index + focus.length)}</>
}
