import { Leaf, Sprout, TreeDeciduous } from 'lucide-react'
import type { ConfidenceRating } from '../types'

type ConfidenceBarometerProps = {
  selected?: ConfidenceRating
  onSelect: (rating: ConfidenceRating) => void
  disabled?: boolean
  showAhaTip?: boolean
}

export function ConfidenceBarometer({
  selected,
  onSelect,
  disabled = false,
  showAhaTip = false,
}: ConfidenceBarometerProps) {
  return (
    <div className="confidence-barometer" role="group" aria-label="How confident do you feel?">
      <div className="confidence-header">
        <span className="confidence-eyebrow">YOUR GUT FEELING</span>
        <span className="confidence-hint">
          {selected === 'wobbly' && '🌱 No problem! We will reinforce this pattern automatically tomorrow.'}
          {selected === 'thinking' && '🌿 Great – locked in with a bit of thought.'}
          {selected === 'clear' && '🌳 Crystal clear! This pattern is firmly anchored.'}
          {!selected && 'Tap how easy this answer felt:'}
        </span>
      </div>

      <div className="confidence-pills">
        <button
          type="button"
          aria-pressed={selected === 'wobbly'}
          className={`confidence-pill wobbly ${selected === 'wobbly' ? 'active' : ''}`}
          onClick={() => onSelect('wobbly')}
          disabled={disabled}
        >
          <span className="sprout-icon"><Sprout size={16} /></span>
          <span className="pill-text">
            <strong>Unsure</strong>
            <small>Mostly guessed</small>
          </span>
        </button>

        <button
          type="button"
          aria-pressed={selected === 'thinking'}
          className={`confidence-pill thinking ${selected === 'thinking' ? 'active' : ''}`}
          onClick={() => onSelect('thinking')}
          disabled={disabled}
        >
          <span className="sprout-icon"><Leaf size={16} /></span>
          <span className="pill-text">
            <strong>Thinking</strong>
            <small>Needed thought</small>
          </span>
        </button>

        <button
          type="button"
          aria-pressed={selected === 'clear'}
          className={`confidence-pill clear ${selected === 'clear' ? 'active' : ''}`}
          onClick={() => onSelect('clear')}
          disabled={disabled}
        >
          <span className="sprout-icon"><TreeDeciduous size={16} /></span>
          <span className="pill-text">
            <strong>Crystal clear</strong>
            <small>Spotted right away</small>
          </span>
        </button>
      </div>

      {showAhaTip && selected === 'wobbly' && (
        <div className="wobbly-micro-hint">
          <span>💡</span>
          <p>Tip: Look at the colored blocks — orange is always your verb anchor!</p>
        </div>
      )}
    </div>
  )
}
