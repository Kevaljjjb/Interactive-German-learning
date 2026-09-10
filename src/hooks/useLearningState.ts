import { useEffect, useState } from 'react'
import { curriculum } from '../data/curriculum'
import type {
  AnswerSignal,
  CognitivePillar,
  ConfidenceRating,
  DailyPlan,
  DailySlot,
  LearningFingerprint,
  LearningMode,
  LearnerProfile,
  PillarMastery,
  ProgressState,
  WobblyItem,
} from '../types'

const PROFILE_KEY = 'satzgarten-profile-v2'
const PROGRESS_KEY = 'satzgarten-progress-v2'
const FINGERPRINT_KEY = 'satzgarten-fingerprint-v2'

const today = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const defaultProfile: LearnerProfile = {
  name: '',
  dailyMinutes: 10,
  modes: ['visual', 'building'],
  feedback: 'gentle',
  visualStyle: 'blocks',
  grammarAnxiety: 'articles',
  onboarded: false,
}

const defaultPillars: Record<CognitivePillar, LearningFingerprint['pillars'][CognitivePillar]> = {
  verb_position: {
    score: 0,
    level: 'seed',
    label: 'Sentence Structure',
    germanName: 'Verb Engine (Position 2)',
    description: 'In a main statement, the conjugated verb always sits in Position 2.',
    icon: '🚂',
    wobblyCount: 0,
  },
  article_memory: {
    score: 0,
    level: 'seed',
    label: 'Articles',
    germanName: 'Article Memory (der / die / das)',
    description: 'Intuitive gender memory through consistent color coding.',
    icon: '🎨',
    wobblyCount: 0,
  },
  bracket_vision: {
    score: 0,
    level: 'seed',
    label: 'Sentence Bracket',
    germanName: 'Sentence Bracket',
    description: 'Separable prefixes and modal verbs bracket the sentence.',
    icon: '🪝',
    wobblyCount: 0,
  },
  case_compass: {
    score: 0,
    level: 'seed',
    label: 'Cases',
    germanName: 'Case Compass (Accusative & Dative)',
    description: 'Directional instinct for object changes (der → den / dem).',
    icon: '🧭',
    wobblyCount: 0,
  },
  pattern_switch: {
    score: 0,
    level: 'seed',
    label: 'Pattern Switch',
    germanName: 'Pattern Switch (Questions & Negation)',
    description: 'Quick shifts between statements, questions, and negation.',
    icon: '⚡',
    wobblyCount: 0,
  },
}

const defaultFingerprint: LearningFingerprint = {
  visualStyle: 'blocks',
  grammarAnxiety: 'articles',
  feedbackTone: 'gentle',
  pillars: defaultPillars,
}

const defaultProgress: ProgressState = {
  leaves: 0,
  streak: 0,
  completedUnits: [],
  unitScores: {},
  practiceAnswered: 0,
  correctAnswers: 0,
  lastVisit: '',
  wobblyItems: [],
  completedDailySlotIds: [],
  unitStats: {},
  modeSignals: { visual: 0, building: 0, listening: 0, examples: 0 },
  modeStats: {},
  recentMistakeUnitIds: [],
}

function loadValue<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? ({ ...fallback, ...JSON.parse(stored) } as T) : fallback
  } catch {
    return fallback
  }
}

function loadProfile(): LearnerProfile {
  const loaded = loadValue(PROFILE_KEY, defaultProfile)
  const allowedModes: LearningMode[] = ['visual', 'building', 'listening', 'examples']
  const modes = (Array.isArray(loaded.modes) ? loaded.modes : []).filter((mode): mode is LearningMode => allowedModes.includes(mode as LearningMode))
  return { ...defaultProfile, ...loaded, modes: modes.length ? modes : defaultProfile.modes }
}

function loadFingerprint(): LearningFingerprint {
  const loaded = loadValue(FINGERPRINT_KEY, defaultFingerprint)
  const pillars = { ...defaultPillars }
  for (const key of Object.keys(defaultPillars) as CognitivePillar[]) {
    pillars[key] = {
      ...defaultPillars[key], ...(loaded.pillars?.[key] ?? {}),
      label: defaultPillars[key].label,
      germanName: defaultPillars[key].germanName,
      description: defaultPillars[key].description,
    }
  }
  return { ...defaultFingerprint, ...loaded, pillars }
}

function loadProgress(): ProgressState {
  const loaded = loadValue(PROGRESS_KEY, defaultProgress)
  return {
    ...defaultProgress,
    ...loaded,
    unitStats: { ...(loaded.unitStats ?? {}) },
    modeSignals: { ...defaultProgress.modeSignals!, ...(loaded.modeSignals ?? {}) },
    modeStats: { ...(loaded.modeStats ?? {}) },
    wobblyItems: loaded.wobblyItems ?? [],
    completedDailySlotIds: loaded.completedDailySlotIds ?? [],
    recentMistakeUnitIds: loaded.recentMistakeUnitIds ?? [],
  }
}

function scoreToLevel(score: number): PillarMastery {
  if (score >= 85) return 'deep_root'
  if (score >= 60) return 'bloom'
  if (score >= 35) return 'sprout'
  return 'seed'
}

function mapUnitToPillars(unitId: string): CognitivePillar[] {
  switch (unitId) {
    case 'hallo-verbmotor':
      return ['verb_position']
    case 'menschen-fragen':
      return ['pattern_switch']
    case 'essen-artikel':
      return ['article_memory', 'case_compass']
    case 'zuhause-besitz':
      return ['pattern_switch']
    case 'alltag-satzklammer':
    case 'freizeit-modal':
    case 'gestern-perfekt':
      return ['bracket_vision']
    case 'stadt-dativ':
    case 'arbeit-pronomen':
    case 'reisen-wechsel':
      return ['case_compass']
    case 'shopping-vergleich':
    case 'gesund-imperativ':
      return ['pattern_switch']
    default:
      return ['verb_position']
  }
}

function dayDistance(from: string, to: string) {
  const oneDay = 86_400_000
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / oneDay)
}

function activateLearningDay(current: ProgressState): ProgressState {
  const date = today()
  if (current.lastVisit === date) return current
  const distance = current.lastVisit ? dayDistance(current.lastVisit, date) : 0
  return {
    ...current,
    lastVisit: date,
    streak: distance === 1 ? current.streak + 1 : 1,
    completedDailySlotIds: [],
  }
}

function buildDailyPlan(
  progress: ProgressState,
  profile: LearnerProfile,
): DailyPlan {
  const nextUnit = curriculum.find((unit) => !progress.completedUnits.includes(unit.id)) ?? curriculum[0]
  const completedSlots = progress.completedDailySlotIds ?? []
  const wobblyItems = progress.wobblyItems ?? []
  const measuredWeakId = Object.entries(progress.unitStats ?? {})
    .filter(([, stats]) => stats.attempts >= 2)
    .sort(([, a], [, b]) => {
      const aAgePenalty = Math.min(Math.max(0, dayDistance(a.lastPracticed || today(), today())) * 0.03, 0.3)
      const bAgePenalty = Math.min(Math.max(0, dayDistance(b.lastPracticed || today(), today())) * 0.03, 0.3)
      const aScore = a.correct / a.attempts - Math.min(a.totalResponseMs / a.attempts / 60_000, 0.25) - aAgePenalty
      const bScore = b.correct / b.attempts - Math.min(b.totalResponseMs / b.attempts / 60_000, 0.25) - bAgePenalty
      return aScore - bScore
    })[0]?.[0]
  const recentWeakId = wobblyItems[0]?.unitId ?? progress.recentMistakeUnitIds?.[0] ?? measuredWeakId
  const reviewUnit = curriculum.find((unit) => unit.id === recentWeakId)
  const warmupMinutes = profile.dailyMinutes <= 5 ? 1 : 2
  const playMinutes = profile.dailyMinutes >= 15 ? 3 : profile.dailyMinutes >= 10 ? 2 : 1
  const coreMinutes = Math.max(2, profile.dailyMinutes - warmupMinutes - playMinutes)
  const signals = progress.modeSignals ?? { visual: 0, building: 0, listening: 0, examples: 0 }
  const measuredMode = (Object.entries(signals) as [LearningMode, number][]).sort((a, b) => b[1] - a[1])[0]
  const effectiveMode = (Object.entries(progress.modeStats ?? {}) as [LearningMode, { attempts: number; correct: number; totalResponseMs: number }][])
    .filter(([, stats]) => stats.attempts >= 2)
    .sort(([, a], [, b]) => (b.correct / b.attempts) - (a.correct / a.attempts))[0]?.[0]
  const challengeMode: LearningMode = profile.grammarAnxiety === 'word_order'
    ? 'building'
    : profile.grammarAnxiety === 'cases'
      ? 'examples'
      : 'visual'
  const preferredMode = effectiveMode ?? (measuredMode && measuredMode[1] > 0
    ? measuredMode[0]
    : profile.grammarAnxiety && profile.grammarAnxiety !== 'none'
      ? challengeMode
      : (profile.modes[0] ?? 'visual'))
  const playTitle = preferredMode === 'building'
    ? 'Harvest: Sentence Workshop'
    : preferredMode === 'visual'
      ? 'Harvest: Article Garden'
      : 'Harvest: Quick Mix'
  const playSubtitle = preferredMode === 'building'
    ? 'Arrange word blocks – your strongest learning mode so far'
    : preferredMode === 'visual'
      ? 'Anchor articles with color and shape in memory'
      : 'Compare examples and spot patterns quickly'

  const slots: DailySlot[] = [
    {
      id: 'slot-warmup',
      type: 'warmup',
      title: reviewUnit ? `Warmup: ${reviewUnit.title}` : 'Garden Start: Color Check',
      subtitle: reviewUnit
        ? `Briefly and visually refresh ${wobblyItems.length || 1} unsure ${wobblyItems.length === 1 ? 'item' : 'items'}`
        : 'Anchor 3 quick nouns in the Article Garden',
      durationMinutes: warmupMinutes,
      unitId: reviewUnit?.id,
      action: reviewUnit ? 'warmup' : 'game',
      completed: completedSlots.includes('slot-warmup'),
    },
    {
      id: 'slot-core',
      type: 'core',
      title: `Core Branch: ${nextUnit.title}`,
      subtitle: `Chapter ${String(nextUnit.number).padStart(2, '0')} · ${nextUnit.rule.label}`,
      durationMinutes: coreMinutes,
      unitId: nextUnit.id,
      action: 'lesson',
      completed: completedSlots.includes('slot-core'),
    },
    {
      id: 'slot-play',
      type: 'play',
      title: playTitle,
      subtitle: playSubtitle,
      durationMinutes: playMinutes,
      action: 'game',
      completed: completedSlots.includes('slot-play'),
    },
  ]

  return {
    date: today(),
    totalMinutes: profile.dailyMinutes,
    slots,
  }
}

export function useLearningState() {
  const [profile, setProfile] = useState<LearnerProfile>(loadProfile)
  const [fingerprint, setFingerprint] = useState<LearningFingerprint>(loadFingerprint)
  const [progress, setProgress] = useState<ProgressState>(() => {
    const stored = loadProgress()
    const distance = stored.lastVisit ? dayDistance(stored.lastVisit, today()) : 0
    if (distance > 1) return { ...stored, streak: 0, completedDailySlotIds: [] }
    if (distance === 1) return { ...stored, completedDailySlotIds: [] }
    return stored
  })

  useEffect(() => {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    window.localStorage.setItem(FINGERPRINT_KEY, JSON.stringify(fingerprint))
  }, [fingerprint])

  useEffect(() => {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  }, [progress])

  const completeUnit = (unitId: string, score: number) => {
    setProgress((current) => {
      const previousBest = current.unitScores[unitId] ?? 0
      const isFirstCompletion = !current.completedUnits.includes(unitId)
      const firstAttempt = current.unitScores[unitId] === undefined
      const total = curriculum.find(unit => unit.id === unitId)?.exercises.length ?? 3
      const passed = score >= Math.ceil(total * 2 / 3)
      const improvement = Math.max(0, score - previousBest)
      const earnedLeaves = (firstAttempt ? 30 : 0) + improvement * 5

      return {
        ...current,
        leaves: current.leaves + earnedLeaves,
        completedUnits: isFirstCompletion && passed ? [...current.completedUnits, unitId] : current.completedUnits,
        unitScores: { ...current.unitScores, [unitId]: Math.max(previousBest, score) },
      }
    })

    // Confidence/answer events update the learning model; finishing a screen is not evidence of mastery.
  }

  const recordAnswer = (correct: boolean, signal?: AnswerSignal) => {
    setProgress((storedCurrent) => {
      const current = activateLearningDay(storedCurrent)
      const unitStats = { ...(current.unitStats ?? {}) }
      const modeSignals = {
        visual: current.modeSignals?.visual ?? 0,
        building: current.modeSignals?.building ?? 0,
        listening: current.modeSignals?.listening ?? 0,
        examples: current.modeSignals?.examples ?? 0,
      }
      const modeStats = { ...(current.modeStats ?? {}) }
      let recentMistakeUnitIds = current.recentMistakeUnitIds ?? []

      if (signal) {
        const previous = unitStats[signal.unitId] ?? {
          attempts: 0,
          correct: 0,
          totalResponseMs: 0,
          lastPracticed: today(),
        }
        unitStats[signal.unitId] = {
          attempts: previous.attempts + 1,
          correct: previous.correct + (correct ? 1 : 0),
          totalResponseMs: previous.totalResponseMs + Math.max(0, signal.responseMs),
          lastPracticed: today(),
        }
        const mode: LearningMode = signal.exerciseType === 'arrange'
          ? 'building'
          : signal.exerciseType === 'article'
            ? 'visual'
            : 'examples'
        modeSignals[mode] += 1
        const previousMode = modeStats[mode] ?? { attempts: 0, correct: 0, totalResponseMs: 0 }
        modeStats[mode] = {
          attempts: previousMode.attempts + 1,
          correct: previousMode.correct + (correct ? 1 : 0),
          totalResponseMs: previousMode.totalResponseMs + Math.max(0, signal.responseMs),
        }
        if (!correct) {
          recentMistakeUnitIds = [signal.unitId, ...recentMistakeUnitIds.filter((id) => id !== signal.unitId)].slice(0, 8)
        } else {
          const updated = unitStats[signal.unitId]
          if (updated.attempts >= 3 && updated.correct / updated.attempts >= 0.8) {
            recentMistakeUnitIds = recentMistakeUnitIds.filter((id) => id !== signal.unitId)
          }
        }
      }

      return {
        ...current,
        practiceAnswered: current.practiceAnswered + 1,
        correctAnswers: current.correctAnswers + (correct ? 1 : 0),
        leaves: current.leaves + (correct ? 3 : 0),
        unitStats,
        modeSignals,
        modeStats,
        recentMistakeUnitIds,
      }
    })

    if (signal?.source === 'arcade') {
      const targetMs = signal.exerciseType === 'arrange' ? 18_000 : signal.exerciseType === 'article' ? 4_000 : 9_000
      const fluencyBoost = signal.responseMs <= targetMs ? 1 : 0
      const delta = correct ? 1 + fluencyBoost : -2
      const pillars = signal.pillar ? [signal.pillar] : mapUnitToPillars(signal.unitId)
      setFingerprint((current) => {
        const updated = { ...current.pillars }
        for (const pillar of pillars) {
          const existing = updated[pillar]
          const newScore = Math.max(0, Math.min(100, existing.score + delta))
          updated[pillar] = { ...existing, score: newScore, level: scoreToLevel(newScore), lastTrained: today() }
        }
        return { ...current, pillars: updated }
      })
    }
  }

  const recordModeSignal = (mode: LearningMode) => {
    setProgress((current) => ({
      ...current,
      modeSignals: {
        visual: current.modeSignals?.visual ?? 0,
        building: current.modeSignals?.building ?? 0,
        listening: current.modeSignals?.listening ?? 0,
        examples: current.modeSignals?.examples ?? 0,
        [mode]: (current.modeSignals?.[mode] ?? 0) + 1,
      },
    }))
  }

  const recordConfidence = (
    unitId: string,
    prompt: string,
    confidence: ConfidenceRating,
    isCorrect: boolean,
  ) => {
    const pillars = mapUnitToPillars(unitId)

    setFingerprint((current) => {
      const updated = { ...current.pillars }
      for (const pillar of pillars) {
        const p = updated[pillar]
        let delta = 0
        let wobblyChange = 0

        if (isCorrect) {
          if (confidence === 'clear') { delta = 5; wobblyChange = -1 }
          else if (confidence === 'thinking') delta = 3
          else { delta = 1; wobblyChange = 1 }
        } else {
          delta = -4
          wobblyChange = 1
        }

        const newScore = Math.max(0, Math.min(100, p.score + delta))
        updated[pillar] = {
          ...p,
          score: newScore,
          level: scoreToLevel(newScore),
          lastTrained: today(),
          wobblyCount: Math.max(0, (p.wobblyCount ?? 0) + wobblyChange),
        }
      }
      return { ...current, pillars: updated }
    })

    setProgress((current) => {
      const existing = current.wobblyItems ?? []
      if (confidence === 'wobbly' || !isCorrect) {
        const wobblyItem: WobblyItem = {
          id: `${unitId}-${Date.now()}`,
          unitId,
          prompt,
          confidence,
          timestamp: today(),
        }
        return {
          ...current,
          wobblyItems: [wobblyItem, ...existing.filter((item) => item.unitId !== unitId || item.prompt !== prompt)].slice(0, 10),
        }
      }
      if (isCorrect && confidence === 'clear') {
        return {
          ...current,
          wobblyItems: existing.filter((item) => item.unitId !== unitId || item.prompt !== prompt),
        }
      }
      return current
    })
  }

  const completeDailySlot = (slotId: string) => {
    setProgress((current) => {
      const existing = current.completedDailySlotIds ?? []
      if (existing.includes(slotId)) return current
      return {
        ...current,
        leaves: current.leaves + 10,
        completedDailySlotIds: [...existing, slotId],
      }
    })
  }

  const clearWobblyItems = () => {
    setProgress((current) => ({ ...current, wobblyItems: [] }))
    setFingerprint((current) => {
      const pillars = { ...current.pillars }
      for (const key of Object.keys(pillars) as CognitivePillar[]) {
        pillars[key] = { ...pillars[key], wobblyCount: 0 }
      }
      return { ...current, pillars }
    })
  }

  const resetProgress = () => {
    setProgress({ ...defaultProgress })
    setFingerprint(defaultFingerprint)
  }

  const dailyPlan = buildDailyPlan(progress, profile)

  return {
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
    resetProgress,
  }
}
