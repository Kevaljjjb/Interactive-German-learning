import { useEffect, useMemo, useRef, useState } from 'react'
import { BrainCircuit, CheckCircle2, Compass, ExternalLink, Search, ShieldCheck, Sparkles, X } from 'lucide-react'
import { curriculum } from '../data/curriculum'
import { lessonHref } from '../lib/routes'
import type { LessonTab, ProgressState } from '../types'

type GuideStatus = { available: boolean; provider?: string; model?: string }
type Recommendation = { unitId: string; tab: LessonTab; topic?: string; label: string; reason: string }
type Props = { open: boolean; initialQuestion?: string; progress: ProgressState; onClose: () => void }

const starters = ['Teach me German word order', 'I want to understand the accusative', 'Help me with der, die, das', 'How does the German past tense work?']
const stopWords = new Set(['the', 'and', 'with', 'that', 'this', 'want', 'learn', 'help', 'where', 'should', 'start', 'german', 'understand', 'about', 'does', 'work'])
const aliases: Record<string, string[]> = {
  'hallo-verbmotor': ['word order', 'verb position', 'conjugation', 'present tense'],
  'menschen-fragen': ['questions', 'question words', 'vowel change'],
  'essen-artikel': ['articles', 'accusative', 'der die das', 'der to den'],
  'zuhause-besitz': ['possessive', 'mein dein', 'compound nouns'],
  'alltag-satzklammer': ['separable verbs', 'sentence bracket', 'prefix'],
  'freizeit-modal': ['modal verbs', 'können müssen wollen'],
  'stadt-dativ': ['dative', 'mit bei', 'directions'],
  'shopping-vergleich': ['comparison', 'comparative', 'adjectives'],
  'arbeit-pronomen': ['pronouns', 'mir dir'],
  'gesund-imperativ': ['imperative', 'commands', 'health'],
  'gestern-perfekt': ['past tense', 'perfect tense', 'perfekt', 'participle'],
  'reisen-wechsel': ['two way prepositions', 'location movement', 'wohin'],
}

function words(value: string) {
  return value.toLocaleLowerCase('en').replace(/[^a-z0-9äöüß]+/g, ' ').split(' ').filter(word => word.length > 2 && !stopWords.has(word))
}

function findLocalMatches(question: string): Recommendation[] {
  const query = words(question)
  if (!query.length) return []
  return curriculum.map(unit => {
    const haystack = [unit.title, unit.description, unit.rule.label, ...unit.topics, ...(aliases[unit.id] ?? [])].join(' ').toLocaleLowerCase('en')
    const score = query.reduce((total, word) => total + (haystack.includes(word) ? 2 : 0), 0)
      + (aliases[unit.id]?.some(alias => question.toLocaleLowerCase('en').includes(alias)) ? 5 : 0)
    const topic = unit.topics.find(item => words(item).some(word => query.includes(word)))
    return { unit, score, topic }
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.unit.number - b.unit.number).slice(0, 3).map(({ unit, topic }) => ({
    unitId: unit.id, tab: 'discover' as const, topic, label: unit.title,
    reason: topic ? `Open the visual lesson for ${topic}.` : unit.description,
  }))
}

export function AILearningGuide({ open, initialQuestion = '', progress, onClose }: Props) {
  const [status, setStatus] = useState<GuideStatus | null>(null)
  const [question, setQuestion] = useState(initialQuestion)
  const [consent, setConsent] = useState(false)
  const [answer, setAnswer] = useState('')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const localMatches = useMemo(() => findLocalMatches(question), [question])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    fetch('/api/tutor/status', { signal: controller.signal })
      .then(async response => response.ok ? response.json() : { available: false })
      .then(value => setStatus({ available: value.available === true, provider: value.provider, model: value.model }))
      .catch(() => { if (!controller.signal.aborted) setStatus({ available: false }) })
    return () => controller.abort()
  }, [open])
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const selector = 'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50)
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); return }
      if (event.key !== 'Tab' || !modalRef.current) return
      const focusable = [...modalRef.current.querySelectorAll<HTMLElement>(selector)]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', handleKey)
    return () => { window.clearTimeout(timer); window.removeEventListener('keydown', handleKey); previouslyFocused?.focus() }
  }, [open, onClose])
  useEffect(() => () => requestRef.current?.abort(), [])

  const ask = async () => {
    if (!question.trim() || !consent || !status?.available || busy) return
    const controller = new AbortController()
    requestRef.current = controller
    setBusy(true)
    setError('')
    setAnswer('')
    try {
      const response = await fetch('/api/guide', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ question: question.trim(), completedUnitIds: progress.completedUnits }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'The guide could not answer.')
      setAnswer(typeof data.answer === 'string' ? data.answer : '')
      const known = new Set(curriculum.map(unit => unit.id))
      setRecommendations(Array.isArray(data.recommendations) ? data.recommendations.filter((item: Recommendation) => known.has(item.unitId)).slice(0, 3) : [])
    } catch (problem) {
      if (!controller.signal.aborted) setError(problem instanceof Error ? problem.message : 'Connection failed.')
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }

  if (!open) return null
  const paths = recommendations.length ? recommendations : localMatches

  return (
    <div className="ai-guide-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside ref={modalRef} className="ai-guide" role="dialog" aria-modal="true" aria-labelledby="ai-guide-title">
        <header className="ai-guide-head">
          <span className="ai-guide-mark"><BrainCircuit size={25} /></span>
          <div><small>AI LEARNING COMPASS</small><h2 id="ai-guide-title">What do you want to learn?</h2></div>
          <button type="button" className="ai-guide-close" onClick={onClose} aria-label="Close AI guide"><X size={21} /></button>
        </header>

        <div className="ai-guide-status">
          <span className={status?.available ? 'connected' : ''}><i />{status === null ? 'Checking Codex…' : status.available ? `${status.provider === 'codex-cli' ? 'Codex CLI' : status.provider} connected · ${status.model}` : 'AI offline · local topic search still works'}</span>
          <small>English guidance · German examples</small>
        </div>

        <div className="ai-guide-body">
          <p className="ai-guide-intro">Describe a grammar topic, a confusing sentence, or a learning goal. The guide explains where to begin and creates safe links into your course.</p>
          <div className="guide-starters" aria-label="Example questions">
            {starters.map(starter => <button type="button" key={starter} onClick={() => setQuestion(starter)}>{starter}</button>)}
          </div>
          <label className="guide-question" htmlFor="guide-question"><Search size={18} /><textarea ref={inputRef} id="guide-question" rows={3} maxLength={800} value={question} onChange={event => { setQuestion(event.target.value); setRecommendations([]); setAnswer('') }} placeholder="For example: I keep mixing up accusative and dative. Where should I start?" /></label>

          <label className="guide-consent">
            <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} />
            <span><strong>Use my connected AI</strong><small>Send only this question and completed chapter IDs. No name, answer history, or browser data.</small></span>
          </label>
          <button type="button" className="guide-submit" disabled={!question.trim() || !consent || !status?.available || busy} onClick={ask}>
            {busy ? <><Sparkles className="guide-thinking" size={18} /> Building your route…</> : <><Compass size={18} /> Ask AI and build my route</>}
          </button>
          {!status?.available && status !== null && <div className="guide-offline"><ShieldCheck size={18} /><span>Codex is unavailable, but matching course links appear below. Run <code>npm run ai:status</code> to check the connection.</span></div>}
          {error && <p className="tutor-error" role="alert">{error}</p>}
          {answer && <div className="guide-answer" aria-live="polite"><small><Sparkles size={14} /> AI STUDY NOTE</small><p>{answer}</p></div>}

          {paths.length > 0 && <section className="guide-routes" aria-labelledby="guide-routes-title">
            <div><small>YOUR DIRECT ROUTE</small><h3 id="guide-routes-title">Start learning in one click</h3></div>
            {paths.map((item, index) => {
              const unit = curriculum.find(candidate => candidate.id === item.unitId)!
              return <a key={`${item.unitId}-${item.tab}-${item.topic ?? index}`} href={lessonHref(item.unitId, item.tab, item.topic)} onClick={() => { onClose(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                <span className="guide-route-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="guide-route-icon" style={{ background: unit.softColor }}>{unit.icon}</span>
                <span><small>{item.topic ?? unit.theme}</small><strong>{item.label || unit.title}</strong><p>{item.reason}</p></span>
                <ExternalLink size={18} />
              </a>
            })}
          </section>}
          {answer && <p className="guide-safety"><CheckCircle2 size={15} /> AI suggestions never change your scores. Check generated explanations against the chapter.</p>}
        </div>
      </aside>
    </div>
  )
}
