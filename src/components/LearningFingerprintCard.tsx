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
  seed: { label: 'Seed', icon: '🌱', tone: 'seed' },
  sprout: { label: 'Sprout', icon: '🌿', tone: 'sprout' },
  bloom: { label: 'Bloom', icon: '🌸', tone: 'bloom' },
  deep_root: { label: 'Deep Root', icon: '🌳', tone: 'root' },
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
    visual: 'Colors & Visuals',
    building: 'Sentence Building',
    listening: 'Listening',
    examples: 'Comparing Examples',
  }
  const weakestPillar = [...pillars].sort((a, b) => a[1].score - b[1].score)[0]?.[1]

  return (
    <section className="fingerprint-card" aria-labelledby="fingerprint-title">
      <div className="fingerprint-header">
        <div className="fingerprint-title-wrap">
          <span className="section-kicker"><Sparkles size={14} /> YOUR LEARNING FINGERPRINT</span>
          <h2 id="fingerprint-title">How your language garden grows</h2>
          <p>
            Grammar as living roots rather than rigid grades. Each plant represents a core pattern.
          </p>
        </div>

        <div className="fingerprint-total-badge">
          <div className="total-circle">
            <span className="total-num">{totalScore}%</span>
            <small>Vitality</small>
          </div>
          <button type="button" className="text-button adjust-btn" onClick={onRecalibrate}>
            <RotateCcw size={14} /> Recalibrate
          </button>
        </div>
      </div>

      <div className="adaptive-insight-grid">
        <article className="coach-insight-card">
          <div className="coach-card-top"><span><BrainCircuit size={18} /> ADAPTIVE COACH</span><small><ShieldCheck size={13} /> local & private</small></div>
          <h3>{measuredAttempts === 0
            ? 'Learning alongside your very first round.'
            : wobblyItems.length
              ? 'Your marked pattern will get extra light next.'
              : `${weakestPillar?.label ?? 'A pattern'} will get extra light next.`}</h3>
          <p>{measuredAttempts === 0
            ? 'Solve a few exercises and mark your gut feeling. I will then adjust sequence, repetitions, and game formats.'
            : wobblyItems.length
              ? `You marked ${wobblyItems.length} unsure ${wobblyItems.length === 1 ? 'item' : 'items'}. They will automatically appear in your next warmup.`
              : `Your strongest learning channel is currently “${modeLabels[dominantMode]}”. I weight matching activities a bit higher.`}</p>
          <div className="coach-reason"><Sparkles size={15} /><span>Recommendations are shaped by your accuracy, response time, and confidence ratings.</span></div>
        </article>
        <article className="signal-summary-card">
          <div className="signal-title"><Gauge size={18} /><span>YOUR LEARNING SIGNALS</span></div>
          <div className="signal-metrics">
            <div><strong>{measuredAttempts}</strong><small>tracked answers</small></div>
            <div><strong>{measuredAttempts ? `${measuredAccuracy}%` : '–'}</strong><small>accuracy</small></div>
            <div><strong>{measuredAttempts ? `${averageSeconds}s` : '–'}</strong><small>avg. speed</small></div>
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
                  <small>{pillar.score}% vitality</small>
                  {pillar.wobblyCount > 0 && (
                    <small className="wobbly-flag">
                      <AlertCircle size={12} /> {pillar.wobblyCount} unsure
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
                <strong>Soil care: {wobblyItems.length} {wobblyItems.length === 1 ? 'pattern needs' : 'patterns need'} some water</strong>
                <p>Items where you hesitated or guessed recently. We'll strengthen these first.</p>
              </div>
            </div>
            {onClearWobbly && (
              <button type="button" className="secondary-button watering-btn" onClick={onClearWobbly}>
                <Droplets size={16} /> Mark list as completed
              </button>
            )}
          </div>

          <div className="wobbly-list">
            {wobblyItems.slice(0, 3).map((item) => (
              <div key={item.id} className="wobbly-item-row">
                <span className="wobbly-bullet">✦</span>
                <span className="wobbly-prompt" lang="de" translate="no">{item.prompt}</span>
                {onPracticeWobbly && (
                  <button
                    type="button"
                    className="wobbly-action"
                    aria-label={`Practice unsure pattern: ${item.prompt}`}
                    onClick={() => onPracticeWobbly(item.unitId)}
                  >
                    Practice
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
          <strong>The SatzGarten philosophy:</strong>
          <p>
            Mistakes aren't deductions — they're signposts for new growth. The more you explore a pattern
            playfully, the deeper its roots grow.
          </p>
        </div>
      </div>
    </section>
  )
}
