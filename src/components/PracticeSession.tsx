import { ArrowLeft, ArrowRight, Check, Lightbulb, RotateCcw, Sparkles, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { AnswerSignal, ConfidenceRating, Exercise, GrammarUnit } from '../types'
import { learningClock } from '../lib/learningClock'
import { ConfidenceBarometer } from './ConfidenceBarometer'

type PracticeSessionProps = {
  unit: GrammarUnit
  onComplete: (score: number) => void
  onRecordAnswer: (correct: boolean, signal?: AnswerSignal) => void
  onRecordConfidence?: (unitId: string, prompt: string, confidence: ConfidenceRating, isCorrect: boolean) => void
  onBackToLesson?: () => void
  feedbackTone?: 'gentle' | 'direct'
  compact?: boolean
}

type Token = { id: number; word: string }

function makeTokens(exercise: Exercise): Token[] {
  if (exercise.type !== 'arrange') return []
  return exercise.tokens.map((word, id) => ({ id, word }))
}

export function PracticeSession({
  unit,
  onComplete,
  onRecordAnswer,
  onRecordConfidence,
  onBackToLesson,
  feedbackTone = 'gentle',
  compact = false,
}: PracticeSessionProps) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState('')
  const [placedIds, setPlacedIds] = useState<number[]>([])
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [confidence, setConfidence] = useState<ConfidenceRating>()
  const [score, setScore] = useState(0)
  const startedAt = useRef(learningClock())
  const [finished, setFinished] = useState(false)
  const exercise = unit.exercises[questionIndex]
  const tokens = useMemo(() => makeTokens(exercise), [exercise])
  const placedTokens = placedIds.map((id) => tokens.find((token) => token.id === id)).filter((token): token is Token => Boolean(token))
  const availableTokens = tokens.filter((token) => !placedIds.includes(token.id))
  const canCheck = exercise.type === 'arrange' ? placedIds.length === tokens.length : selectedChoice !== ''

  const checkAnswer = () => {
    if (!canCheck || answered) return
    const correct = exercise.type === 'arrange'
      ? placedTokens.map((token) => token.word).join('|') === exercise.answer.join('|')
      : selectedChoice === exercise.answer
    setIsCorrect(correct)
    setAnswered(true)
    setScore((current) => current + (correct ? 1 : 0))
    onRecordAnswer(correct, {
      unitId: unit.id,
      exerciseType: exercise.type,
      responseMs: Math.round(learningClock() - startedAt.current),
      source: 'lesson',
    })
  }

  const nextQuestion = () => {
    if (!confidence) onRecordConfidence?.(unit.id, exercise.prompt, 'thinking', isCorrect)
    if (questionIndex === unit.exercises.length - 1) {
      const finalScore = score
      setFinished(true)
      onComplete(finalScore)
      return
    }
    setQuestionIndex((current) => current + 1)
    setSelectedChoice('')
    setPlacedIds([])
    setAnswered(false)
    setIsCorrect(false)
    setConfidence(undefined)
    startedAt.current = learningClock()
  }

  const restart = () => {
    setQuestionIndex(0)
    setSelectedChoice('')
    setPlacedIds([])
    setAnswered(false)
    setIsCorrect(false)
    setConfidence(undefined)
    setScore(0)
    startedAt.current = learningClock()
    setFinished(false)
  }

  if (finished) {
    const total = unit.exercises.length
    const message = score === total ? 'Wunderbar!' : score >= Math.ceil(total / 2) ? 'Fast gemeistert!' : 'Ein guter Anfang!'
    return (
      <div className={compact ? 'practice-finish compact' : 'practice-finish'}>
        <div className="celebration" aria-hidden="true"><i>✦</i><i>●</i><i>◆</i><i>✦</i><i>●</i></div>
        <span className="finish-badge"><Sparkles size={28} /></span>
        <span className="finish-kicker">RUNDE BEENDET</span>
        <h2>{message}</h2>
        <p>Du hast <strong>{score} von {total}</strong> Aufgaben richtig gelöst.</p>
        <div className="score-seeds">
          {Array.from({ length: total }, (_, index) => <span key={index} className={index < score ? 'earned' : ''}>✦</span>)}
        </div>
        <div className="finish-actions">
          <button type="button" className="secondary-button" onClick={restart}><RotateCcw size={17} /> Noch einmal</button>
          {onBackToLesson && <button type="button" className="primary-button" onClick={onBackToLesson}>Zum Kapitel <ArrowRight size={17} /></button>}
        </div>
      </div>
    )
  }

  return (
    <div className={compact ? 'practice-session compact' : 'practice-session'}>
      <div className="practice-progress-head">
        <div>
          <span>AUFGABE {questionIndex + 1} VON {unit.exercises.length}</span>
          <strong>{exercise.type === 'arrange' ? 'Satz-Puzzle' : exercise.type === 'fill' ? 'Lücke füllen' : 'Muster wählen'}</strong>
        </div>
        <div className="practice-score"><span>{score}</span> richtig</div>
      </div>
      <div className="question-dots">
        {unit.exercises.map((_, index) => (
          <i key={index} className={index < questionIndex ? 'done' : index === questionIndex ? 'active' : ''} />
        ))}
      </div>

      <div key={`${unit.id}-${questionIndex}`} className="question-area notranslate" translate="no" lang="de">
        <div className="question-prompt">
          <span className="question-number">{String(questionIndex + 1).padStart(2, '0')}</span>
          <div><small>{exercise.prompt}</small>{exercise.type !== 'arrange' && <h3>{exercise.sentence}</h3>}</div>
        </div>

        {exercise.type === 'arrange' ? (
          <div className="builder-wrap">
            <div className={placedTokens.length ? 'sentence-dropzone has-tokens' : 'sentence-dropzone'}>
              {placedTokens.length === 0 && <span className="drop-hint">Tippe die Wörter in der richtigen Reihenfolge an</span>}
              {placedTokens.map((token, index) => (
                <button
                  key={token.id}
                  type="button"
                  className={answered ? (isCorrect ? 'word-token placed correct' : 'word-token placed wrong') : 'word-token placed'}
                  onClick={() => !answered && setPlacedIds((current) => current.filter((id) => id !== token.id))}
                >
                  <small>{index + 1}</small>{token.word}
                </button>
              ))}
            </div>
            <div className="token-pool">
              {availableTokens.map((token) => (
                <button key={token.id} type="button" className="word-token" disabled={answered} onClick={() => setPlacedIds((current) => [...current, token.id])}>
                  {token.word}
                </button>
              ))}
            </div>
            {placedIds.length > 0 && !answered && (
              <button className="clear-order" type="button" onClick={() => setPlacedIds([])}><RotateCcw size={14} /> Neu ordnen</button>
            )}
          </div>
        ) : (
          <div className="choice-grid">
            {exercise.choices.map((choice, index) => {
              let className = selectedChoice === choice ? 'choice-option selected' : 'choice-option'
              if (answered && choice === exercise.answer) className = 'choice-option correct'
              if (answered && selectedChoice === choice && choice !== exercise.answer) className = 'choice-option wrong'
              return (
                <button key={choice} type="button" className={className} disabled={answered} aria-pressed={selectedChoice === choice} onClick={() => setSelectedChoice(choice)}>
                  <span>{String.fromCharCode(65 + index)}</span><strong>{choice}</strong>
                  {answered && choice === exercise.answer && <Check size={19} />}
                  {answered && selectedChoice === choice && choice !== exercise.answer && <X size={19} />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {answered && (
        <div className={isCorrect ? 'answer-feedback correct notranslate' : 'answer-feedback wrong notranslate'} role="status" translate="no" lang="de">
          <span className="feedback-icon">{isCorrect ? <Check size={21} /> : <Lightbulb size={21} />}</span>
          <div>
            <strong>{isCorrect
              ? feedbackTone === 'direct' ? 'Richtig.' : 'Genau so!'
              : feedbackTone === 'direct' ? 'Noch nicht. Hier ist die Regel:' : 'Fast – schau auf das Muster.'}</strong>
            <p>{exercise.explanation}</p>
          </div>
        </div>
      )}

      {answered && (
        <ConfidenceBarometer
          selected={confidence}
          onSelect={(val) => {
            setConfidence(val)
            onRecordConfidence?.(unit.id, exercise.prompt, val, isCorrect)
          }}
          disabled={confidence !== undefined}
          showAhaTip={!isCorrect}
        />
      )}

      <div className="practice-actions">
        {onBackToLesson ? (
          <button type="button" className="quiet-button" onClick={onBackToLesson}><ArrowLeft size={16} /> Zurück</button>
        ) : <span />}
        {answered ? (
          <button type="button" className="primary-button" onClick={nextQuestion}>
            {questionIndex === unit.exercises.length - 1 ? 'Ergebnis' : 'Nächste Aufgabe'} <ArrowRight size={17} />
          </button>
        ) : (
          <button type="button" className="primary-button" disabled={!canCheck} onClick={checkAnswer}>Prüfen <Check size={17} /></button>
        )}
      </div>
    </div>
  )
}
