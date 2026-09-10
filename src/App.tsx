import { useState } from 'react'
import { curriculum } from './data/curriculum'
import { useLearningState } from './hooks/useLearningState'
import type { GrammarUnit, View } from './types'
import { Sidebar } from './components/Sidebar'
import { Home } from './components/Home'
import { LearningPath } from './components/LearningPath'
import { LessonView } from './components/LessonView'
import { PracticeHub } from './components/PracticeHub'
import { LearningFingerprintCard } from './components/LearningFingerprintCard'
import { OnboardingModal } from './components/OnboardingModal'
import './App.css'
import './polish.css'
import './tutor.css'

export default function App() {
  const {
    profile,
    fingerprint,
    progress,
    dailyPlan,
    setProfile,
    setFingerprint,
    completeUnit,
    recordAnswer,
    recordModeSignal,
    recordConfidence,
    completeDailySlot,
    clearWobblyItems,
  } = useLearningState()

  const [view, setView] = useState<View>('home')
  const [selectedUnit, setSelectedUnit] = useState<GrammarUnit | null>(null)
  const [activeDailySlotId, setActiveDailySlotId] = useState<string | null>(null)
  const [onboardingOpen, setOnboardingOpen] = useState(!profile.onboarded)

  const handleNavigate = (newView: View) => {
    setSelectedUnit(null)
    setActiveDailySlotId(null)
    setView(newView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenUnit = (unit: GrammarUnit) => {
    setSelectedUnit(unit)
  }

  const handleCloseLesson = () => {
    setSelectedUnit(null)
    setActiveDailySlotId(null)
    setView('path')
  }

  const handleOpenPath = () => {
    setSelectedUnit(null)
    setActiveDailySlotId(null)
    setView('path')
  }

  const handleOpenPractice = () => {
    setSelectedUnit(null)
    setView('practice')
  }

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        progress={progress}
        onNavigate={handleNavigate}
        onPersonalize={() => setOnboardingOpen(true)}
      />

      <main className="app-main">
        {selectedUnit ? (
          <LessonView
            key={selectedUnit.id}
            unit={selectedUnit}
            progress={progress}
            onBack={handleCloseLesson}
            onComplete={(score) => {
              completeUnit(selectedUnit.id, score)
              const plannedCoreId = dailyPlan.slots.find((slot) => slot.type === 'core')?.unitId
              const completedSlotId = activeDailySlotId ?? (plannedCoreId === selectedUnit.id ? 'slot-core' : null)
              if (completedSlotId) completeDailySlot(completedSlotId)
              setActiveDailySlotId(null)
            }}
            onRecordAnswer={recordAnswer}
            onRecordConfidence={recordConfidence}
            onModeSignal={recordModeSignal}
            initialTab={activeDailySlotId === 'slot-warmup' ? 'practice' : 'discover'}
            visualStyle={profile.visualStyle}
            feedbackTone={profile.feedback}
          />
        ) : view === 'home' ? (
          <Home
            profile={profile}
            fingerprint={fingerprint}
            progress={progress}
            dailyPlan={dailyPlan}
            onOpenUnit={handleOpenUnit}
            onOpenPath={handleOpenPath}
            onPractice={handleOpenPractice}
            onPersonalize={() => setOnboardingOpen(true)}
            onStartDailySlot={(slot) => setActiveDailySlotId(slot.id)}
            onClearWobbly={clearWobblyItems}
            onPracticeWobbly={(unitId) => {
              const unit = curriculum.find((item) => item.id === unitId)
              if (unit) {
                setActiveDailySlotId('slot-warmup')
                handleOpenUnit(unit)
              }
            }}
          />
        ) : view === 'path' ? (
          <LearningPath progress={progress} onOpenUnit={handleOpenUnit} />
        ) : view === 'practice' ? (
          <PracticeHub
            progress={progress}
            initialGame={activeDailySlotId === 'slot-warmup' ? 'articles' : activeDailySlotId === 'slot-play'
              ? dailyPlan.slots.find(slot => slot.type === 'play')?.title.includes('Satz-Werkstatt') ? 'sentences'
                : dailyPlan.slots.find(slot => slot.type === 'play')?.title.includes('Artikel-Garten') ? 'articles' : 'quick'
              : 'menu'}
            onRecordAnswer={recordAnswer}
            onGameComplete={() => {
              completeDailySlot(activeDailySlotId ?? 'slot-play')
              setActiveDailySlotId(null)
            }}
          />
        ) : view === 'progress' ? (
          <div className="page progress-page">
            <LearningFingerprintCard
              fingerprint={fingerprint}
              progress={progress}
              onRecalibrate={() => setOnboardingOpen(true)}
              onClearWobbly={clearWobblyItems}
              onPracticeWobbly={(unitId) => {
                const unit = curriculum.find((item) => item.id === unitId)
                if (unit) {
                  setActiveDailySlotId('slot-warmup')
                  handleOpenUnit(unit)
                }
              }}
            />
          </div>
        ) : null}
      </main>

      {onboardingOpen && <OnboardingModal
        isOpen
        profile={profile}
        onClose={() => setOnboardingOpen(false)}
        onComplete={(newProfile, fpUpdate) => {
          setProfile(newProfile)
          if (fpUpdate) {
            setFingerprint((prev) => ({
              ...prev,
              ...fpUpdate,
            }))
          }
        }}
      />}
    </div>
  )
}
