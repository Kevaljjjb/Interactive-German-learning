import { useEffect, useRef, useState } from 'react'
import { BrainCircuit, Check, Send, ShieldCheck, Sparkles } from 'lucide-react'
import type { GrammarUnit, ProgressState, VisualStyle } from '../types'

type Props = { unit: GrammarUnit; progress: ProgressState; style: VisualStyle }
type TutorStatus = { available: boolean; model?: string }

export function TutorPanel({ unit, progress, style }: Props) {
  const [status, setStatus] = useState<TutorStatus | null>(null)
  const [consent, setConsent] = useState(false)
  const [language, setLanguage] = useState<'en' | 'de'>('en')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [helpful, setHelpful] = useState(false)
  const requestRef = useRef<AbortController | null>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/tutor/status', { signal: controller.signal })
      .then(async response => response.ok ? response.json() : { available: false })
      .then(value => setStatus({ available: value.available === true, model: value.model }))
      .catch(() => { if (!controller.signal.aborted) setStatus({ available: false }) })
    return () => { controller.abort(); requestRef.current?.abort() }
  }, [])

  const ask = async (difficulty: 'simpler' | 'example' | 'challenge') => {
    if (!consent || !status?.available || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError('')
    setHelpful(false)
    const controller = new AbortController()
    requestRef.current = controller
    const stats = progress.unitStats?.[unit.id]
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({
          question: question.trim(), topic: unit.title, rule: unit.rule.body,
          examples: unit.examples.slice(0, 3).map(example => example.de), style, language, difficulty,
          learning: { attempts: stats?.attempts ?? 0, correct: stats?.correct ?? 0, uncertain: Boolean(progress.wobblyItems?.some(item => item.unitId === unit.id)) },
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'AI request failed.')
      if (typeof data.answer !== 'string') throw new Error('No explanation returned.')
      setAnswer(data.answer)
    } catch (problem) {
      if (!controller.signal.aborted) setError(problem instanceof Error ? problem.message : 'Connection failed.')
    } finally {
      busyRef.current = false
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  return (
    <section className="tutor-panel" aria-labelledby="tutor-heading">
      <div className="tutor-heading">
        <span className="tutor-logo"><BrainCircuit size={24} /></span>
        <div><span className="section-kicker">OPTIONAL · LIVE AI</span><h2 id="tutor-heading">Eine andere Erklärung, nur für dich.</h2></div>
        <span className="tutor-status">{status === null ? 'Checking connection…' : status.available ? status.model : 'Not connected'}</span>
      </div>
      <p>Stuck? Ask for a picture in words, another example, or a tiny challenge. The tutor receives only this chapter, its answer counts, your selected visual format, and your question—not your name or full history.</p>
      {!status?.available && status !== null && <div className="tutor-setup"><ShieldCheck size={18} /><div><strong>Connect a model when you’re ready.</strong><p>Set AI_PROVIDER, AI_MODEL and AI_API_KEY in <code>.env.local</code>, then restart the local server. All lessons work without AI. See README.md.</p></div></div>}
      <div className="tutor-controls">
        <label>Explanation language<select value={language} onChange={event => setLanguage(event.target.value as 'en' | 'de')}><option value="en">English + German examples</option><option value="de">Einfaches Deutsch</option></select></label>
        <label className="tutor-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} /> I agree to send this limited context to the configured AI provider. API usage may cost money.</label>
      </div>
      <label className="tutor-input-label" htmlFor="tutor-question">Your question or attempted answer (optional)</label>
      <textarea id="tutor-question" maxLength={800} value={question} onChange={event => setQuestion(event.target.value)} placeholder="Why does der become den? Show me with apples…" rows={3} />
      <div className="tutor-actions">
        <button className="primary-button" disabled={!consent || !status?.available || busy} onClick={() => ask('simpler')}><Send size={16} /> {busy ? 'Thinking…' : 'Explain more simply'}</button>
        <button className="secondary-button" disabled={!consent || !status?.available || busy} onClick={() => ask('example')}>Another example</button>
        <button className="secondary-button" disabled={!consent || !status?.available || busy} onClick={() => ask('challenge')}><Sparkles size={15} /> Challenge me</button>
      </div>
      {error && <p className="tutor-error" role="alert">{error}</p>}
      {answer && <div className="tutor-answer" aria-live="polite"><small>AI-GENERATED · CHECK AGAINST THE LESSON</small><p>{answer}</p><button className="text-button" disabled={helpful} onClick={() => setHelpful(true)}><Check size={16} />{helpful ? 'Aha! Keep exploring the examples above.' : 'That makes sense now'}</button></div>}
      <small className="tutor-disclaimer">AI can make mistakes. Responses are not graded and never change your mastery scores. Each request is independent; include your answer in the question field for feedback.</small>
    </section>
  )
}
