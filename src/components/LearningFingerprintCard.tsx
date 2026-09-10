import { AlertCircle, BrainCircuit, Droplets, Gauge, RotateCcw, ShieldCheck, Sparkles, TreeDeciduous } from 'lucide-react'
import type { CognitivePillar, LearningFingerprint, ProgressState } from '../types'

type LearningFingerprintCardProps = {
  fingerprint: LearningFingerprint
  progress: ProgressState
  onRecalibrate: () => void
  onClearWobbly?: () => void
  onPracticeWobbly?: (unitId: string) => void
}

const levelLabels: Record<string, { label: string; icon: string; tone: string }> = {
  seed: { label: 'Saat', icon: '🌱', tone: 'seed' },
  sprout: { label: 'Keimling', icon: '🌿', tone: 'sprout' },
  bloom: { label: 'Blüte', icon: '🌸', tone: 'bloom' },
  deep_root: { label: 'Verwurzelt', icon: '🌳', tone: 'root' },
}

export function LearningFingerprintCard({
  fingerprint,
  progress,
  onRecalibrate,
  onClearWobbly,
  onPracticeWobbly,
}: LearningFingerprintCardProps) {
  const pillars = Object.entries(fingerprint.pillars) as [
    CognitivePillar,
    LearningFingerprint['pillars'][CognitivePillar],
  ][]

  const totalScore = Math.round(
    pillars.reduce((sum, [, p]) => sum + p.score, 0) / pillars.length,
  )

  const wobblyItems = progress.wobblyItems ?? []
  const unitStats = Object.values(progress.unitStats ?? {})
  const measuredAttempts = unitStats.reduce((sum, stat) => sum + stat.attempts, 0)
  const measuredCorrect = unitStats.reduce((sum, stat) => sum + stat.correct, 0)
  const measuredTime = unitStats.reduce((sum, stat) => sum + stat.totalResponseMs, 0)
  const measuredAccuracy = measuredAttempts ? Math.round((measuredCorrect / measuredAttempts) * 100) : 0
  const averageSeconds = measuredAttempts ? Math.round(measuredTime / measuredAttempts / 100) / 10 : 0
  const modeSignals = progress.modeSignals ?? { visual: 0, building: 0, listening: 0, examples: 0 }
  const measuredModes = (Object.entries(progress.modeStats ?? {}) as [keyof typeof modeSignals, { attempts: number; correct: number }][])
    .filter(([, stats]) => stats.attempts >= 2)
    .sort(([, a], [, b]) => (b.correct / b.attempts) - (a.correct / a.attempts))
  const dominantMode = measuredModes[0]?.[0] ?? (Object.entries(modeSignals) as [keyof typeof modeSignals, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'visual'
  const modeLabels = {
    visual: 'Farben & Bilder',
    building: 'Wörter bauen',
    listening: 'Hören',
    examples: 'Beispiele vergleichen',
  }
  const weakestPillar = [...pillars].sort((a, b) => a[1].score - b[1].score)[0]?.[1]

  return (
    <section className="fingerprint-card" aria-labelledby="fingerprint-title">
      <div className="fingerprint-header">
        <div className="fingerprint-title-wrap">
          <span className="section-kicker"><Sparkles size={14} /> DEIN LERN-FINGERABDRUCK</span>
          <h2 id="fingerprint-title">Wie dein Sprachgarten wächst</h2>
          <p>
            Grammatik als lebendige Wurzeln statt starre Noten. Jede Pflanze repräsentiert ein Kernmuster.
          </p>
        </div>

        <div className="fingerprint-total-badge">
          <div className="total-circle">
            <span className="total-num">{totalScore}%</span>
            <small>Vitalität</small>
          </div>
          <button type="button" className="text-button adjust-btn" onClick={onRecalibrate}>
            <RotateCcw size={14} /> Kalibrierung
          </button>
        </div>
      </div>

      <div className="adaptive-insight-grid">
        <article className="coach-insight-card">
          <div className="coach-card-top"><span><BrainCircuit size={18} /> ADAPTIVER COACH</span><small><ShieldCheck size={13} /> lokal & privat</small></div>
          <h3>{measuredAttempts === 0
            ? 'Ich lerne mit deiner ersten Runde.'
            : wobblyItems.length
              ? 'Dein markiertes Muster bekommt als Nächstes extra Licht.'
              : `${weakestPillar?.label ?? 'Ein Muster'} bekommt als Nächstes extra Licht.`}</h3>
          <p>{measuredAttempts === 0
            ? 'Löse ein paar Aufgaben und markiere dein Bauchgefühl. Danach passe ich Reihenfolge, Wiederholungen und Spielform an.'
            : wobblyItems.length
              ? `Du hast ${wobblyItems.length} wackelige ${wobblyItems.length === 1 ? 'Stelle' : 'Stellen'} markiert. Sie kommen automatisch in dein nächstes Warm-up.`
              : `Deine sicherste Lernspur ist aktuell „${modeLabels[dominantMode]}“. Ich gewichte passende Aktivitäten etwas stärker.`}</p>
          <div className="coach-reason"><Sparkles size={15} /><span>Empfehlungen entstehen aus Trefferquote, Antwortzeit und deinem Sicherheitsgefühl.</span></div>
        </article>
        <article className="signal-summary-card">
          <div className="signal-title"><Gauge size={18} /><span>DEINE LERNSIGNALE</span></div>
          <div className="signal-metrics">
            <div><strong>{measuredAttempts}</strong><small>gemessene Antworten</small></div>
            <div><strong>{measuredAttempts ? `${measuredAccuracy}%` : '–'}</strong><small>Trefferquote</small></div>
            <div><strong>{measuredAttempts ? `${averageSeconds}s` : '–'}</strong><small>Ø Denkzeit</small></div>
          </div>
          <div className="mode-signal-list">
            {(Object.entries(modeSignals) as [keyof typeof modeSignals, number][]).map(([mode, value]) => {
              const max = Math.max(1, ...Object.values(modeSignals))
              return <div key={mode}><span>{modeLabels[mode]}</span><i><b style={{ width: `${Math.max(6, (value / max) * 100)}%` }} /></i><small>{value}</small></div>
            })}
          </div>
        </article>
      </div>

      <div className="pillars-grid">
        {pillars.map(([key, pillar]) => {
          const meta = levelLabels[pillar.level] || levelLabels.seed
          return (
            <div key={key} className={`pillar-card tone-${meta.tone}`}>
              <div className="pillar-head">
                <span className="pillar-icon">{pillar.icon}</span>
                <span className={`pillar-level-badge ${meta.tone}`}>
                  {meta.icon} {meta.label}
                </span>
              </div>

              <div className="pillar-body">
                <strong>{pillar.germanName}</strong>
                <p>{pillar.description}</p>
              </div>

              <div className="pillar-progress-wrap">
                <div className="pillar-bar">
                  <span style={{ width: `${pillar.score}%` }} />
                </div>
                <div className="pillar-meta">
                  <small>{pillar.score}% Vitalität</small>
                  {pillar.wobblyCount > 0 && (
                    <small className="wobbly-flag">
                      <AlertCircle size={12} /> {pillar.wobblyCount} wackelig
                    </small>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {wobblyItems.length > 0 && (
        <div className="wobbly-section">
          <div className="wobbly-header">
            <div className="wobbly-title">
              <span className="wobbly-icon">🌱</span>
              <div>
                <strong>Bodenpflege: {wobblyItems.length} Muster brauchen etwas Wasser</strong>
                <p>Hier hast du zuletzt gezögert oder geraten. Diese Sätze festigen wir zuerst.</p>
              </div>
            </div>
            {onClearWobbly && (
              <button type="button" className="secondary-button watering-btn" onClick={onClearWobbly}>
                <Droplets size={16} /> Liste als erledigt markieren
              </button>
            )}
          </div>

          <div className="wobbly-list">
            {wobblyItems.slice(0, 3).map((item) => (
              <div key={item.id} className="wobbly-item-row">
                <span className="wobbly-bullet">✦</span>
                <span className="wobbly-prompt">{item.prompt}</span>
                {onPracticeWobbly && (
                  <button
                    type="button"
                    className="wobbly-action"
                    aria-label={`Unsicheres Muster üben: ${item.prompt}`}
                    onClick={() => onPracticeWobbly(item.unitId)}
                  >
                    Üben
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="garden-principles-note">
        <span className="note-sprout"><TreeDeciduous size={20} /></span>
        <div className="note-text">
          <strong>Das Gärtner-Prinzip von SatzGarten:</strong>
          <p>
            Fehler sind keine Minuspunkte, sondern Wegweiser für neues Wachstum. Je öfter du ein Muster
            spielerisch anwendest, desto tiefer wurzelt es.
          </p>
        </div>
      </div>
    </section>
  )
}
