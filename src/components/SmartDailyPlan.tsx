import { ArrowRight, Check, Clock3, Flame, Gamepad2, Sparkles, Sprout } from 'lucide-react'
import type { DailyPlan, DailySlot, GrammarUnit } from '../types'

type SmartDailyPlanProps = {
  dailyPlan: DailyPlan
  onStartSlot: (slot: DailySlot) => void
  onOpenUnit: (unitId: string) => void
  onOpenGame: () => void
  onWarmup: () => void
  currentUnit?: GrammarUnit
}

export function SmartDailyPlan({
  dailyPlan,
  onStartSlot,
  onOpenUnit,
  onOpenGame,
  onWarmup,
  currentUnit,
}: SmartDailyPlanProps) {
  const completedCount = dailyPlan.slots.filter((s) => s.completed).length
  const progressPercent = Math.round((completedCount / dailyPlan.slots.length) * 100)

  const handleSlotClick = (slot: DailySlot) => {
    onStartSlot(slot)
    if (slot.action === 'lesson' && slot.unitId) {
      onOpenUnit(slot.unitId)
    } else if (slot.action === 'game') {
      onOpenGame()
    } else if (slot.action === 'warmup') {
      if (slot.unitId) onOpenUnit(slot.unitId)
      else onWarmup()
    }
  }

  return (
    <section className="smart-daily-plan" aria-labelledby="daily-plan-heading">
      <div className="section-heading">
        <div>
          <span className="section-kicker"><Sparkles size={14} /> DEIN TAGESPFAD</span>
          <h2 id="daily-plan-heading">3 Schritte für heute</h2>
        </div>
        <div className="daily-plan-meta">
          <span className="time-chip"><Clock3 size={15} /> {dailyPlan.totalMinutes} Min.</span>
          <span className="plan-progress-tag">
            {completedCount} von {dailyPlan.slots.length} erledigt ({progressPercent}%)
          </span>
        </div>
      </div>

      <div className="daily-slots-grid">
        {dailyPlan.slots.map((slot, index) => {
          const isCore = slot.type === 'core'
          const isDone = slot.completed

          return (
            <div
              key={slot.id}
              className={`daily-slot-card ${slot.type} ${isDone ? 'done' : ''}`}
            >
              <div className="slot-step-header">
                <span className="slot-step-badge">
                  {isDone ? <Check size={14} /> : `SCHRITT ${index + 1}`}
                </span>
                <span className="slot-duration">
                  <Clock3 size={13} /> {slot.durationMinutes} Min.
                </span>
              </div>

              <div className="slot-content">
                <div className="slot-icon-row">
                  <span className="slot-glyph">
                    {slot.type === 'warmup' && <Sprout size={20} />}
                    {slot.type === 'core' && (currentUnit?.icon || '📖')}
                    {slot.type === 'play' && <Gamepad2 size={20} />}
                  </span>
                  <small className="slot-category">
                    {slot.type === 'warmup' && 'BODEN BEREITEN'}
                    {slot.type === 'core' && 'HAUPTAST · LERNEN'}
                    {slot.type === 'play' && 'ERNTE · SPIELEN'}
                  </small>
                </div>

                <h3>{slot.title}</h3>
                <p>{slot.subtitle}</p>
              </div>

              <button
                type="button"
                className={`slot-action-btn ${isDone ? 'btn-done' : isCore ? 'primary-button' : 'secondary-button'}`}
                aria-label={isDone ? `${slot.title} erledigt` : `${slot.title} starten`}
                onClick={() => handleSlotClick(slot)}
              >
                {isDone ? (
                  <>
                    <Check size={16} /> Erledigt
                  </>
                ) : (
                  <>
                    Starten <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {completedCount === dailyPlan.slots.length && (
        <div className="all-slots-celebration">
          <span className="celeb-flame"><Flame size={20} /></span>
          <div>
            <strong>Tagesziel erreicht! Dein Garten blüht.</strong>
            <p>Morgen wartet das nächste Beet auf dich. Du hast heute 30 Blätter verdient!</p>
          </div>
        </div>
      )}
    </section>
  )
}
