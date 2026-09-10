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
            <span className="step-count">STEP {step} OF 4</span>
            <div className="step-pills">
              {[1, 2, 3, 4].map((s) => (
                <i key={s} className={s <= step ? 'active' : ''} />
              ))}
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        {step === 1 && (
          <div className="onboarding-body">
            <span className="eyebrow-pill"><Sparkles size={14} /> VISUAL CALIBRATION</span>
            <h2 id="onboarding-title">How do you prefer to see sentences?</h2>
            <p className="onboarding-desc">
              Visualize grammar the way your brain catches patterns fastest.
            </p>

            <div className="visual-choice-grid">
              <button
                type="button"
                aria-pressed={visualStyle === 'blocks'}
                className={`visual-choice-card ${visualStyle === 'blocks' ? 'selected' : ''}`}
                onClick={() => setVisualStyle('blocks')}
              >
                <div className="choice-art blocks-art">
                  <span className="toy-block green" lang="de" translate="no">Ich</span>
                  <span className="toy-block coral" lang="de" translate="no">wohne</span>
                  <span className="toy-block blue" lang="de" translate="no">hier</span>
                </div>
                <div className="choice-info">
                  <strong>Colored building blocks</strong>
                  <p>Clear color roles for subject, verb, and details.</p>
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
                  <span className="rail-engine">🚂 Track 2</span>
                  <span className="rail-marker">3</span>
                </div>
                <div className="choice-info">
                  <strong>Tracks & Verb Engine</strong>
                  <p>Word order visualized as train tracks and fixed stops.</p>
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
                  <span>🌱 Question switch</span>
                  <span>🔒 Sentence bracket</span>
                </div>
                <div className="choice-info">
                  <strong>Pictures & Metaphors</strong>
                  <p>Everyday visual metaphors and intuition over heavy linguistic jargon.</p>
                </div>
                {visualStyle === 'metaphors' && <span className="selection-badge"><Check size={16} /></span>}
              </button>
            </div>

            <div className="onboarding-footer">
              <div />
              <button type="button" className="primary-button" onClick={() => setStep(2)}>
                Next <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-body">
            <span className="eyebrow-pill"><Clock size={14} /> DAILY RHYTHM</span>
            <h2 id="onboarding-title">How much time fits into your day?</h2>
            <p className="onboarding-desc">
              Short daily sessions anchor visual patterns deeper than cramming for hours.
            </p>

            <div className="time-budget-grid">
              <button
                type="button"
                aria-pressed={dailyMinutes === 5}
                className={`time-card ${dailyMinutes === 5 ? 'selected' : ''}`}
                onClick={() => setDailyMinutes(5)}
              >
                <span className="time-val">5 min</span>
                <strong>The Espresso Shot</strong>
                <p>1 short pattern + 1 quick game. Perfect for a busy day.</p>
                {dailyMinutes === 5 && <span className="selection-badge"><Check size={16} /></span>}
              </button>

              <button
                type="button"
                aria-pressed={dailyMinutes === 10}
                className={`time-card recommended ${dailyMinutes === 10 ? 'selected' : ''}`}
                onClick={() => setDailyMinutes(10)}
              >
                <span className="rec-badge">RECOMMENDED</span>
                <span className="time-val">10 min</span>
                <strong>Balanced Garden Care</strong>
                <p>Warmup + Visual Lab + play round. The ideal A1 rhythm.</p>
                {dailyMinutes === 10 && <span className="selection-badge"><Check size={16} /></span>}
              </button>

              <button
                type="button"
                aria-pressed={dailyMinutes === 15}
                className={`time-card ${dailyMinutes === 15 ? 'selected' : ''}`}
                onClick={() => setDailyMinutes(15)}
              >
                <span className="time-val">15 min</span>
                <strong>Deep Focus</strong>
                <p>Full chapter including audio examples and deeper practice.</p>
                {dailyMinutes === 15 && <span className="selection-badge"><Check size={16} /></span>}
              </button>
            </div>

            <div className="onboarding-footer">
              <button type="button" className="secondary-button" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" className="primary-button" onClick={() => setStep(3)}>
                Next <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-body">
            <span className="eyebrow-pill"><ShieldCheck size={14} /> YOUR BIGGEST HURDLE</span>
            <h2 id="onboarding-title">What feels tricky about German?</h2>
            <p className="onboarding-desc">
              Your choice sets your first game focus; then the plan adapts based on your actual answers.
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
                  <strong>The “der / die / das” chaos</strong>
                  <p>Article Garden comes first; colors stay consistent throughout the course.</p>
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
                  <strong>Word order & verb position</strong>
                  <p>Sentence Workshop and moving train tracks take priority early on.</p>
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
                  <strong>Cases (Accusative & Dative)</strong>
                  <p>Case mistakes automatically flow into your next visual warm-up.</p>
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
                  <strong>Complete beginner (starting fresh)</strong>
                  <p>We start gently with Chapter 1 and always explain terms with pictures.</p>
                </div>
                {grammarAnxiety === 'none' && <Check size={18} className="item-check" />}
              </button>
            </div>

            <div className="onboarding-footer">
              <button type="button" className="secondary-button" onClick={() => setStep(2)}>
                Back
              </button>
              <button type="button" className="primary-button" onClick={() => setStep(4)}>
                Next <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="onboarding-body">
            <span className="eyebrow-pill"><Heart size={14} /> FINISHING TOUCHES</span>
            <h2 id="onboarding-title">How should SatzGarten speak to you?</h2>
            <p className="onboarding-desc">
              Give your SatzGarten a personal touch.
            </p>

            <div className="form-row">
              <label htmlFor="user-name-input">Your name or explorer nickname (optional):</label>
              <input
                id="user-name-input"
                type="text"
                value={name}
                placeholder="e.g. Alex"
                onChange={(e) => setName(e.target.value)}
                className="styled-input"
              />
            </div>

            <div className="feedback-toggle-row">
              <span className="toggle-label">Feedback style:</span>
              <div className="toggle-options">
                <button
                  type="button"
                  aria-pressed={feedback === 'gentle'}
                  className={`toggle-option ${feedback === 'gentle' ? 'active' : ''}`}
                  onClick={() => setFeedback('gentle')}
                >
                  <Heart size={16} />
                  <span>Gentle & Encouraging</span>
                </button>
                <button
                  type="button"
                  aria-pressed={feedback === 'direct'}
                  className={`toggle-option ${feedback === 'direct' ? 'active' : ''}`}
                  onClick={() => setFeedback('direct')}
                >
                  <Zap size={16} />
                  <span>Direct & Clear</span>
                </button>
              </div>
            </div>

            <div className="onboarding-summary-box">
              <span className="summary-sprout">✦</span>
              <div>
                <strong>Your visual learning fingerprint is ready!</strong>
                <p>
                  {dailyMinutes} min/day · {visualStyle === 'blocks' ? 'Building blocks' : visualStyle === 'rails' ? 'Tracks' : 'Metaphors'} · {feedback === 'gentle' ? 'Gentle feedback' : 'Direct formulas'}
                </p>
              </div>
            </div>

            <div className="onboarding-footer">
              <button type="button" className="secondary-button" onClick={() => setStep(3)}>
                Back
              </button>
              <button type="button" className="primary-button highlight" onClick={handleFinish}>
                Enter garden <Sparkles size={17} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
