import { useState } from 'react'
import { BrainCircuit } from 'lucide-react'
import { curriculum } from './data/curriculum'
import { useLearningState } from './hooks/useLearningState'
import { lessonHref, practiceHref, useHashRoute, viewHref } from './lib/routes'
import type { GameMode, GrammarUnit, LessonTab, View } from './types'
import { Sidebar } from './components/Sidebar'
import { Home } from './components/Home'
import { LearningPath } from './components/LearningPath'
import { LessonView } from './components/LessonView'
import { PracticeHub } from './components/PracticeHub'
import { LearningFingerprintCard } from './components/LearningFingerprintCard'
import { OnboardingModal } from './components/OnboardingModal'
import { AILearningGuide } from './components/AILearningGuide'
import './App.css'
import './polish.css'
import './tutor.css'
import './redesign.css'

export default function App() {
  const {
    profile, fingerprint, progress, dailyPlan, setProfile, setFingerprint, completeUnit,
    recordAnswer, recordModeSignal, recordConfidence, completeDailySlot, clearWobblyItems,
  } = useLearningState()
  const { route, navigate } = useHashRoute()
  const [activeDailySlotId, setActiveDailySlotId] = useState<string | null>(null)
  const [onboardingOpen, setOnboardingOpen] = useState(!profile.onboarded)
  const [guideOpen, setGuideOpen] = useState(false)
  const [guideSeed, setGuideSeed] = useState('')

  const selectedUnit = route.kind === 'lesson' ? curriculum.find(unit => unit.id === route.unitId) ?? null : null
  const view: View = route.kind === 'lesson' ? 'path' : route.kind === 'practice' ? 'practice' : route.view
  const openGuide = (question = '') => { setGuideSeed(question); setGuideOpen(true) }

  const handleNavigate = (newView: View) => {
    setActiveDailySlotId(null)
    navigate(newView === 'practice' ? practiceHref() : viewHref(newView))
  }
  const handleOpenUnit = (unit: GrammarUnit, tab: LessonTab = 'discover', topic?: string) => navigate(lessonHref(unit.id, tab, topic))
  const handleOpenPractice = (game: GameMode = 'menu') => navigate(practiceHref(game))

  const dailyGame = () => {
    if (activeDailySlotId === 'slot-warmup') return 'articles' as const
    if (activeDailySlotId !== 'slot-play') return 'menu' as const
    const title = dailyPlan.slots.find(slot => slot.type === 'play')?.title ?? ''
    if (title.includes('Sentence Workshop')) return 'sentences' as const
    if (title.includes('Article Garden')) return 'articles' as const
    return 'quick' as const
  }

  return (
    <div className="app-shell">
      <Sidebar view={view} progress={progress} onNavigate={handleNavigate} onPersonalize={() => setOnboardingOpen(true)} onOpenGuide={() => openGuide()} />

      <main className="app-main">
        {selectedUnit ? (
          <LessonView
            key={`${selectedUnit.id}-${route.kind === 'lesson' ? route.topic ?? '' : ''}`}
            unit={selectedUnit}
            progress={progress}
            onBack={() => { setActiveDailySlotId(null); navigate(viewHref('path')) }}
            onComplete={(score) => {
              completeUnit(selectedUnit.id, score)
              const plannedCoreId = dailyPlan.slots.find(slot => slot.type === 'core')?.unitId
              const completedSlotId = activeDailySlotId ?? (plannedCoreId === selectedUnit.id ? 'slot-core' : null)
              if (completedSlotId) completeDailySlot(completedSlotId)
              setActiveDailySlotId(null)
            }}
            onRecordAnswer={recordAnswer}
            onRecordConfidence={recordConfidence}
            onModeSignal={recordModeSignal}
            initialTab={route.kind === 'lesson' ? route.tab : 'discover'}
            focusTopic={route.kind === 'lesson' ? route.topic : undefined}
            onTabChange={tab => navigate(lessonHref(selectedUnit.id, tab, route.kind === 'lesson' ? route.topic : undefined))}
            visualStyle={profile.visualStyle}
            feedbackTone={profile.feedback}
          />
        ) : view === 'home' ? (
          <Home
            profile={profile} fingerprint={fingerprint} progress={progress} dailyPlan={dailyPlan}
            onOpenUnit={handleOpenUnit}
            onOpenPath={() => navigate(viewHref('path'))}
            onPractice={game => handleOpenPractice(game)}
            onOpenGuide={openGuide}
            onPersonalize={() => setOnboardingOpen(true)}
            onStartDailySlot={slot => setActiveDailySlotId(slot.id)}
            onClearWobbly={clearWobblyItems}
            onPracticeWobbly={unitId => {
              const unit = curriculum.find(item => item.id === unitId)
              if (unit) { setActiveDailySlotId('slot-warmup'); handleOpenUnit(unit, 'practice') }
            }}
          />
        ) : view === 'path' ? (
          <LearningPath progress={progress} onOpenUnit={handleOpenUnit} onOpenTopic={(unit, topic) => handleOpenUnit(unit, 'discover', topic)} />
        ) : view === 'practice' ? (
          <PracticeHub
            key={route.kind === 'practice' ? route.game : dailyGame()}
            progress={progress}
            initialGame={route.kind === 'practice' && route.game !== 'menu' ? route.game : dailyGame()}
            onModeChange={game => navigate(practiceHref(game))}
            onRecordAnswer={recordAnswer}
            onGameComplete={() => { if (activeDailySlotId) completeDailySlot(activeDailySlotId); setActiveDailySlotId(null) }}
          />
        ) : view === 'progress' ? (
          <div className="page progress-page">
            <LearningFingerprintCard
              fingerprint={fingerprint} progress={progress}
              onRecalibrate={() => setOnboardingOpen(true)} onClearWobbly={clearWobblyItems}
              onPracticeWobbly={unitId => {
                const unit = curriculum.find(item => item.id === unitId)
                if (unit) { setActiveDailySlotId('slot-warmup'); handleOpenUnit(unit, 'practice') }
              }}
            />
          </div>
        ) : <LearningPath progress={progress} onOpenUnit={handleOpenUnit} onOpenTopic={(unit, topic) => handleOpenUnit(unit, 'discover', topic)} />}
      </main>

      {view !== 'home' && <button type="button" className="ai-guide-fab" onClick={() => openGuide()} aria-label="Open AI learning guide"><BrainCircuit size={21} /><span>Ask AI</span></button>}
      {guideOpen && <AILearningGuide key={guideSeed} open initialQuestion={guideSeed} progress={progress} onClose={() => setGuideOpen(false)} />}

      {onboardingOpen && <OnboardingModal
        isOpen profile={profile} onClose={() => setOnboardingOpen(false)}
        onComplete={(newProfile, fpUpdate) => {
          setProfile(newProfile)
          if (fpUpdate) setFingerprint(previous => ({ ...previous, ...fpUpdate }))
        }}
      />}
    </div>
  )
}
