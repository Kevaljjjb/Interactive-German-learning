import { ArrowRight, Check, Sparkles, X, Heart, Zap, Clock, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FeedbackTone, GrammarAnxiety, LearnerProfile, LearningFingerprint, VisualStyle } from '../types'

type OnboardingModalProps = {
  isOpen: boolean
  profile: LearnerProfile
  onClose: () => void
  onComplete: (profile: LearnerProfile, fingerprintUpdate?: Partial<LearningFingerprint>) => void
}

export function OnboardingModal({ isOpen, profile, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(profile.name || '')
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(profile.visualStyle || 'blocks')
  const [dailyMinutes, setDailyMinutes] = useState<number>(profile.dailyMinutes || 10)
  const [grammarAnxiety, setGrammarAnxiety] = useState<GrammarAnxiety>(profile.grammarAnxiety || 'articles')
  const [feedback, setFeedback] = useState<FeedbackTone>(profile.feedback || 'gentle')
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusableSelector = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusTimer = window.setTimeout(() => {
      modalRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus()
    }, 0)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !modalRef.current) return
      const focusable = [...modalRef.current.querySelectorAll<HTMLElement>(focusableSelector)]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleFinish = () => {
    const updatedProfile: LearnerProfile = {
      ...profile,
      name: name.trim(),
      dailyMinutes,
      modes: visualStyle === 'rails'
        ? ['building', 'visual']
        : visualStyle === 'metaphors'
          ? ['examples', 'visual']
          : ['visual', 'building'],
      visualStyle,
      grammarAnxiety,
      feedback,
      onboarded: true,
    }

    const fingerprintUpdate: Partial<LearningFingerprint> = {
      visualStyle,
      grammarAnxiety,
      feedbackTone: feedback,
    }

    onComplete(updatedProfile, fingerprintUpdate)
    onClose()
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-card" ref={modalRef}>
        <header className="onboarding-header">
          <div className="onboarding-step-indicator">
            <span className="step-count">SCHRITT {step} VON 4</span>
            <div className="step-pills">
              {[1, 2, 3, 4].map((s) => (
                <i key={s} className={s <= step ? 'active' : ''} />
              ))}
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Schließen">
            <X size={20} />
          </button>
        </header>

        {step === 1 && (
          <div className="onboarding-body">
            <span className="eyebrow-pill"><Sparkles size={14} /> BLICK-KALIBRIERUNG</span>
            <h2 id="onboarding-title">Wie siehst du Sätze am liebsten?</h2>
            <p className="onboarding-desc">
              Visualisiere Grammatik so, wie dein Gehirn am schnellsten Muster erfasst.
            </p>

            <div className="visual-choice-grid">
              <button
                type="button"
                aria-pressed={visualStyle === 'blocks'}
                className={`visual-choice-card ${visualStyle === 'blocks' ? 'selected' : ''}`}
                onClick={() => setVisualStyle('blocks')}
              >
                <div className="choice-art blocks-art">
                  <span className="toy-block green">Ich</span>
                  <span className="toy-block coral">wohne</span>
                  <span className="toy-block blue">hier</span>
                </div>
                <div className="choice-info">
                  <strong>Farbige Bausteine</strong>
                  <p>Klare Farbrollen für Subjekt, Verb und Information.</p>
                </div>
                {visualStyle === 'blocks' && <span className="selection-badge"><Check size={16} /></span>}
              </button>

              <button
                type="button"
                aria-pressed={visualStyle === 'rails'}
                className={`visual-choice-card ${visualStyle === 'rails' ? 'selected' : ''}`}
                onClick={() => setVisualStyle('rails')}
              >
                <div className="choice-art rails-art">
                  <span className="rail-marker">1</span>
                  <span className="rail-engine">🚂 Gleis 2</span>
                  <span className="rail-marker">3</span>
                </div>
                <div className="choice-info">
                  <strong>Gleise & Verbmotor</strong>
                  <p>Wortstellungen als Schienen und feste Haltestellen.</p>
                </div>
                {visualStyle === 'rails' && <span className="selection-badge"><Check size={16} /></span>}
              </button>

              <button
                type="button"
                aria-pressed={visualStyle === 'metaphors'}
                className={`visual-choice-card ${visualStyle === 'metaphors' ? 'selected' : ''}`}
                onClick={() => setVisualStyle('metaphors')}
              >
                <div className="choice-art story-art">
                  <span>🌱 Frageschalter</span>
                  <span>🔒 Satzklammer</span>
                </div>
                <div className="choice-info">
                  <strong>Bilder & Metaphern</strong>
                  <p>Eselsbrücken und alltagsnahe Bildideen statt Grammatikjargon.</p>
                </div>
                {visualStyle === 'metaphors' && <span className="selection-badge"><Check size={16} /></span>}
              </button>
            </div>

            <div className="onboarding-footer">
              <div />
              <button type="button" className="primary-button" onClick={() => setStep(2)}>
                Weiter <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-body">
            <span className="eyebrow-pill"><Clock size={14} /> TAGES-RHYTHMUS</span>
            <h2 id="onboarding-title">Wie viel Zeit passt in deinen Alltag?</h2>
            <p className="onboarding-desc">
              Kurze tägliche Einheiten verankern visuelle Muster tiefer als stundenlanges Pauken.
            </p>

            <div className="time-budget-grid">
              <button
                type="button"
                aria-pressed={dailyMinutes === 5}
                className={`time-card ${dailyMinutes === 5 ? 'selected' : ''}`}
                onClick={() => setDailyMinutes(5)}
              >
                <span className="time-val">5 Min.</span>
                <strong>Der Espresso-Schluck</strong>
                <p>1 kurzes Muster + 1 schnelles Spiel. Ideal für zwischendurch.</p>
                {dailyMinutes === 5 && <span className="selection-badge"><Check size={16} /></span>}
              </button>

              <button
                type="button"
                aria-pressed={dailyMinutes === 10}
                className={`time-card recommended ${dailyMinutes === 10 ? 'selected' : ''}`}
                onClick={() => setDailyMinutes(10)}
              >
                <span className="rec-badge">EMPFOHLEN</span>
                <span className="time-val">10 Min.</span>
                <strong>Ausgewogene Gartenpflege</strong>
                <p>Warmup + Visual Lab + Spielrunde. Der ideale A1-Rhythmus.</p>
                {dailyMinutes === 10 && <span className="selection-badge"><Check size={16} /></span>}
              </button>

              <button
                type="button"
                aria-pressed={dailyMinutes === 15}
                className={`time-card ${dailyMinutes === 15 ? 'selected' : ''}`}
                onClick={() => setDailyMinutes(15)}
              >
                <span className="time-val">15 Min.</span>
                <strong>Der Tiefen-Fokus</strong>
                <p>Ganzes Kapitel inklusive Audio-Beispielen und Vertiefung.</p>
                {dailyMinutes === 15 && <span className="selection-badge"><Check size={16} /></span>}
              </button>
            </div>

            <div className="onboarding-footer">
              <button type="button" className="secondary-button" onClick={() => setStep(1)}>
                Zurück
              </button>
              <button type="button" className="primary-button" onClick={() => setStep(3)}>
                Weiter <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-body">
            <span className="eyebrow-pill"><ShieldCheck size={14} /> DEINE HÜRDE</span>
            <h2 id="onboarding-title">Was fühlt sich in Deutsch chaotisch an?</h2>
            <p className="onboarding-desc">
              Deine Auswahl bestimmt den ersten Spiel-Fokus; danach lernt der Plan aus deinen echten Antworten.
            </p>

            <div className="anxiety-choice-list">
              <button
                type="button"
                aria-pressed={grammarAnxiety === 'articles'}
                className={`anxiety-item ${grammarAnxiety === 'articles' ? 'selected' : ''}`}
                onClick={() => setGrammarAnxiety('articles')}
              >
                <span className="item-art">🎨</span>
                <div className="item-text">
                  <strong>Das „der / die / das“-Chaos</strong>
                  <p>Der Artikel-Garten kommt zuerst; Farben bleiben im ganzen Kurs konsistent.</p>
                </div>
                {grammarAnxiety === 'articles' && <Check size={18} className="item-check" />}
              </button>

              <button
                type="button"
                aria-pressed={grammarAnxiety === 'word_order'}
                className={`anxiety-item ${grammarAnxiety === 'word_order' ? 'selected' : ''}`}
                onClick={() => setGrammarAnxiety('word_order')}
              >
                <span className="item-art">🚂</span>
                <div className="item-text">
                  <strong>Wortstellung & Verb-Position</strong>
                  <p>Die Satz-Werkstatt und bewegte Gleise bekommen am Anfang Vorrang.</p>
                </div>
                {grammarAnxiety === 'word_order' && <Check size={18} className="item-check" />}
              </button>

              <button
                type="button"
                aria-pressed={grammarAnxiety === 'cases'}
                className={`anxiety-item ${grammarAnxiety === 'cases' ? 'selected' : ''}`}
                onClick={() => setGrammarAnxiety('cases')}
              >
                <span className="item-art">🧭</span>
                <div className="item-text">
                  <strong>Fälle (Akkusativ & Dativ)</strong>
                  <p>Fallfehler wandern automatisch in dein nächstes visuelles Warm-up.</p>
                </div>
                {grammarAnxiety === 'cases' && <Check size={18} className="item-check" />}
              </button>

              <button
                type="button"
                aria-pressed={grammarAnxiety === 'none'}
                className={`anxiety-item ${grammarAnxiety === 'none' ? 'selected' : ''}`}
                onClick={() => setGrammarAnxiety('none')}
              >
                <span className="item-art">🌱</span>
                <div className="item-text">
                  <strong>Ganz frisch dabei (Null Vorkenntnisse)</strong>
                  <p>Wir starten ruhig bei Kapitel 1 und erklären Fachwörter immer am Bild.</p>
                </div>
                {grammarAnxiety === 'none' && <Check size={18} className="item-check" />}
              </button>
            </div>

            <div className="onboarding-footer">
              <button type="button" className="secondary-button" onClick={() => setStep(2)}>
                Zurück
              </button>
              <button type="button" className="primary-button" onClick={() => setStep(4)}>
                Weiter <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="onboarding-body">
            <span className="eyebrow-pill"><Heart size={14} /> FEINSCHLIFF</span>
            <h2 id="onboarding-title">Wie darf dein Garten dich ansprechen?</h2>
            <p className="onboarding-desc">
              Gib deinem SatzGarten eine persönliche Note.
            </p>

            <div className="form-row">
              <label htmlFor="user-name-input">Dein Vorname oder Entdecker-Name (optional):</label>
              <input
                id="user-name-input"
                type="text"
                value={name}
                placeholder="z. B. Alex"
                onChange={(e) => setName(e.target.value)}
                className="styled-input"
              />
            </div>

            <div className="feedback-toggle-row">
              <span className="toggle-label">Feedback-Begleitung:</span>
              <div className="toggle-options">
                <button
                  type="button"
                  aria-pressed={feedback === 'gentle'}
                  className={`toggle-option ${feedback === 'gentle' ? 'active' : ''}`}
                  onClick={() => setFeedback('gentle')}
                >
                  <Heart size={16} />
                  <span>Sanft & Ermutigend</span>
                </button>
                <button
                  type="button"
                  aria-pressed={feedback === 'direct'}
                  className={`toggle-option ${feedback === 'direct' ? 'active' : ''}`}
                  onClick={() => setFeedback('direct')}
                >
                  <Zap size={16} />
                  <span>Klar & Direkt</span>
                </button>
              </div>
            </div>

            <div className="onboarding-summary-box">
              <span className="summary-sprout">✦</span>
              <div>
                <strong>Dein visueller Lern-Fingerabdruck ist bereit!</strong>
                <p>
                  {dailyMinutes} Min./Tag · {visualStyle === 'blocks' ? 'Bausteine' : visualStyle === 'rails' ? 'Gleise' : 'Metaphern'} · {feedback === 'gentle' ? 'Sanftes Feedback' : 'Direkte Formeln'}
                </p>
              </div>
            </div>

            <div className="onboarding-footer">
              <button type="button" className="secondary-button" onClick={() => setStep(3)}>
                Zurück
              </button>
              <button type="button" className="primary-button highlight" onClick={handleFinish}>
                Garten betreten <Sparkles size={17} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
