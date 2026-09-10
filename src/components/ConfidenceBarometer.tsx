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
    <div className="confidence-barometer" role="group" aria-label="Wie sicher bist du dir?">
      <div className="confidence-header">
        <span className="confidence-eyebrow">DEIN BAUCHGEFÜHL</span>
        <span className="confidence-hint">
          {selected === 'wobbly' && '🌱 Kein Problem! Wir festigen dieses Muster morgen automatisch.'}
          {selected === 'thinking' && '🌿 Super – mit etwas Nachdenken richtig eingeklickt.'}
          {selected === 'clear' && '🌳 Glasklar! Dieses Muster sitzt fest im Gedächtnis.'}
          {!selected && 'Tippe, wie leicht dir die Antwort fiel:'}
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
            <strong>Wackelig</strong>
            <small>Fast geraten</small>
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
            <strong>Geht so</strong>
            <small>Mit Überlegen</small>
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
            <strong>Glasklar</strong>
            <small>Sofort gesehen</small>
          </span>
        </button>
      </div>

      {showAhaTip && selected === 'wobbly' && (
        <div className="wobbly-micro-hint">
          <span>💡</span>
          <p>Tipp: Schau auf die Farbbausteine — Orange ist immer dein Verbanker!</p>
        </div>
      )}
    </div>
  )
}
