export type View = 'home' | 'path' | 'practice' | 'progress'

export type Tone = 'green' | 'coral' | 'blue' | 'yellow' | 'violet' | 'neutral'

export type VisualBlock = {
  text: string
  sub?: string
  tone: Tone
  wide?: boolean
}

export type VisualState = {
  label: string
  title: string
  caption: string
  blocks: VisualBlock[]
}

export type Exercise =
  | {
      type: 'choice' | 'fill'
      prompt: string
      sentence?: string
      choices: string[]
      answer: string
      explanation: string
    }
  | {
      type: 'arrange'
      prompt: string
      tokens: string[]
      answer: string[]
      explanation: string
    }

export type GrammarUnit = {
  id: string
  number: number
  title: string
  theme: string
  icon: string
  color: string
  softColor: string
  description: string
  duration: number
  topics: string[]
  goals: string[]
  rule: {
    label: string
    title: string
    formula: string
    body: string
    tip: string
  }
  visual: {
    metaphor: string
    states: VisualState[]
  }
  examples: {
    de: string
    en: string
    focus: string
    note: string
  }[]
  exercises: Exercise[]
}

export type LearningMode = 'visual' | 'building' | 'listening' | 'examples'

export type LearnerProfile = {
  name: string
  dailyMinutes: number
  modes: LearningMode[]
  feedback: 'gentle' | 'direct'
  visualStyle?: VisualStyle
  grammarAnxiety?: GrammarAnxiety
  onboarded?: boolean
}

export type UnitLearningStats = {
  attempts: number
  correct: number
  totalResponseMs: number
  lastPracticed: string
}

export type ModalityStats = {
  attempts: number
  correct: number
  totalResponseMs: number
}

export type AnswerSignal = {
  unitId: string
  exerciseType: Exercise['type'] | 'article'
  responseMs: number
  source: 'lesson' | 'arcade'
  pillar?: CognitivePillar
}

export type ProgressState = {
  leaves: number
  streak: number
  completedUnits: string[]
  unitScores: Record<string, number>
  practiceAnswered: number
  correctAnswers: number
  lastVisit: string
  wobblyItems?: WobblyItem[]
  completedDailySlotIds?: string[]
  unitStats?: Record<string, UnitLearningStats>
  modeSignals?: Record<LearningMode, number>
  modeStats?: Partial<Record<LearningMode, ModalityStats>>
  recentMistakeUnitIds?: string[]
}

// --- Adaptive & Personalization UX Types ---

export type VisualStyle = 'blocks' | 'rails' | 'metaphors'
export type FeedbackTone = 'gentle' | 'direct'
export type GrammarAnxiety = 'articles' | 'word_order' | 'cases' | 'none'

export type ConfidenceRating = 'wobbly' | 'thinking' | 'clear' // 🌱 | 🌿 | 🌳

export type CognitivePillar =
  | 'verb_position'   // Verbmotor (Position 2)
  | 'article_memory'  // Farb-Gedächtnis (der/die/das)
  | 'bracket_vision'  // Klammer-Blick (Trennbare Verben, Satzklammer)
  | 'case_compass'    // Fälle-Kompass (Akkusativ/Dativ)
  | 'pattern_switch'  // Muster-Schalter (Fragen, Negation)

export type PillarMastery = 'seed' | 'sprout' | 'bloom' | 'deep_root'

export type PillarState = {
  score: number // 0 - 100
  level: PillarMastery
  label: string
  germanName: string
  description: string
  icon: string
  lastTrained?: string
  wobblyCount: number
}

export type LearningFingerprint = {
  visualStyle: VisualStyle
  grammarAnxiety: GrammarAnxiety
  feedbackTone: FeedbackTone
  pillars: Record<CognitivePillar, PillarState>
}

export type DailySlotType = 'warmup' | 'core' | 'play'

export type DailySlot = {
  id: string
  type: DailySlotType
  title: string
  subtitle: string
  durationMinutes: number
  unitId?: string
  action: 'lesson' | 'game' | 'warmup'
  completed: boolean
}

export type DailyPlan = {
  date: string
  totalMinutes: number
  slots: DailySlot[]
}

export type WobblyItem = {
  id: string
  unitId: string
  prompt: string
  confidence: ConfidenceRating
  timestamp: string
}
