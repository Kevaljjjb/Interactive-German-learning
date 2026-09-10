import { ArrowLeft, ArrowRight, Check, Keyboard, Lightbulb, RotateCcw, Sparkles, Volume2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

function completedSentence(exercise: Exercise) {
  if (exercise.type === 'arrange') return exercise.answer.join(' ').replace(/\s+([?.!,])/g, '$1')
  return (exercise.sentence ?? '').replace('___', exercise.answer)
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
  const placedTokens = useMemo(() => placedIds.map(id => tokens.find(token => token.id === id)).filter((token): token is Token => Boolean(token)), [placedIds, tokens])
  const availableTokens = useMemo(() => tokens.filter(token => !placedIds.includes(token.id)), [placedIds, tokens])
  const canCheck = exercise.type === 'arrange' ? placedIds.length === tokens.length : selectedChoice !== ''

  const speakAnswer = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(completedSentence(exercise))
    utterance.lang = 'de-DE'
    utterance.rate = 0.78
    window.speechSynthesis.speak(utterance)
  }

  const checkAnswer = useCallback(() => {
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
  }, [answered, canCheck, exercise, onRecordAnswer, placedTokens, selectedChoice, unit.id])

  const nextQuestion = useCallback(() => {
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
  }, [confidence, exercise.prompt, isCorrect, onComplete, onRecordConfidence, questionIndex, score, unit.exercises.length, unit.id])

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

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (document.querySelector('[aria-modal="true"]')) return
      if (target?.closest('button, a, input, textarea, select, [role="button"]')) return
      const letterIndex = /^[a-d]$/i.test(event.key) ? event.key.toLocaleLowerCase('en').charCodeAt(0) - 97 : -1
      const numberIndex = /^[1-4]$/.test(event.key) ? Number(event.key) - 1 : -1
      if (!answered && exercise.type !== 'arrange' && (letterIndex >= 0 || numberIndex >= 0)) {
        const choice = exercise.choices[letterIndex >= 0 ? letterIndex : numberIndex]
        if (choice) { event.preventDefault(); setSelectedChoice(choice) }
      } else if (event.key === 'Enter') {
        if (answered) { event.preventDefault(); nextQuestion() }
        else if (canCheck) { event.preventDefault(); checkAnswer() }
      } else if (event.key === 'Escape' && !answered && placedIds.length) {
        setPlacedIds([])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [answered, canCheck, checkAnswer, exercise, nextQuestion, placedIds.length])

  if (finished) {
    const total = unit.exercises.length
    const message = score === total ? 'Wonderful!' : score >= Math.ceil(total / 2) ? 'Almost there!' : 'A good start!'
    return (
      <div className={compact ? 'practice-finish compact' : 'practice-finish'}>
        <div className="celebration" aria-hidden="true"><i>✦</i><i>●</i><i>◆</i><i>✦</i><i>●</i></div>
        <span className="finish-badge"><Sparkles size={28} /></span>
        <span className="finish-kicker">ROUND COMPLETED</span>
        <h2>{message}</h2>
        <p>You solved <strong>{score} of {total}</strong> exercises correctly.</p>
        <div className="score-seeds">
          {Array.from({ length: total }, (_, index) => <span key={index} className={index < score ? 'earned' : ''}>✦</span>)}
        </div>
        <div className="finish-actions">
          <button type="button" className="secondary-button" onClick={restart}><RotateCcw size={17} /> Try again</button>
          {onBackToLesson && <button type="button" className="primary-button" onClick={onBackToLesson}>Back to chapter <ArrowRight size={17} /></button>}
        </div>
      </div>
    )
  }

  return (
    <div className={compact ? 'practice-session compact' : 'practice-session'}>
      <div className="practice-progress-head">
        <div>
          <span>EXERCISE {questionIndex + 1} OF {unit.exercises.length}</span>
          <strong>{exercise.type === 'arrange' ? 'Sentence Puzzle' : exercise.type === 'fill' ? 'Fill the Blank' : 'Choose Pattern'}</strong>
        </div>
        <div className="practice-score"><span>{score}</span> correct</div>
      </div>
      <div className="question-dots">
        {unit.exercises.map((_, index) => (
          <i key={index} className={index < questionIndex ? 'done' : index === questionIndex ? 'active' : ''} />
        ))}
      </div>

      <div key={`${unit.id}-${questionIndex}`} className="question-area" lang="en">
        <div className="question-prompt">
          <span className="question-number">{String(questionIndex + 1).padStart(2, '0')}</span>
          <div><small>{exercise.prompt}</small></div>
        </div>

        {exercise.type === 'arrange' ? (
          <div className="builder-wrap">
            <div className={placedTokens.length ? 'sentence-dropzone has-tokens' : 'sentence-dropzone'}>
              {placedTokens.length === 0 && <span className="drop-hint">Tap words in the correct order</span>}
              {placedTokens.map((token, index) => (
                <button
                  key={token.id}
                  type="button"
                  className={answered ? (isCorrect ? 'word-token placed correct' : 'word-token placed wrong') : 'word-token placed'}
                  onClick={() => !answered && setPlacedIds((current) => current.filter((id) => id !== token.id))}
                  lang="de"
                  translate="no"
                >
                  <small>{index + 1}</small>{token.word}
                </button>
              ))}
            </div>
            <div className="token-pool">
              {availableTokens.map((token) => (
                <button key={token.id} type="button" className="word-token" lang="de" translate="no" disabled={answered} onClick={() => setPlacedIds((current) => [...current, token.id])}>
                  {token.word}
                </button>
              ))}
            </div>
            {placedIds.length > 0 && !answered && (
              <button className="clear-order" type="button" onClick={() => setPlacedIds([])}><RotateCcw size={14} /> Reset order</button>
            )}
          </div>
        ) : (
          <>
          <div className={selectedChoice ? 'assembled-sentence has-choice' : 'assembled-sentence'} aria-live="polite" lang="de" translate="no">
            {(exercise.sentence ?? '').split('___').map((part, index) => <span key={`${part}-${index}`}>{part}{index === 0 && <b>{selectedChoice || '___'}</b>}</span>)}
          </div>
          <div className="choice-grid">
            {exercise.choices.map((choice, index) => {
              let className = selectedChoice === choice ? 'choice-option selected' : 'choice-option'
              if (answered && choice === exercise.answer) className = 'choice-option correct'
              if (answered && selectedChoice === choice && choice !== exercise.answer) className = 'choice-option wrong'
              return (
                <button key={choice} type="button" className={className} disabled={answered} aria-pressed={selectedChoice === choice} onClick={() => setSelectedChoice(choice)}>
                  <span>{String.fromCharCode(65 + index)}</span><strong lang="de" translate="no">{choice}</strong>
                  {answered && choice === exercise.answer && <Check size={19} />}
                  {answered && selectedChoice === choice && choice !== exercise.answer && <X size={19} />}
                </button>
              )
            })}
          </div>
          </>
        )}
        <p className="practice-shortcuts"><Keyboard size={14} /> Keyboard: A–D or 1–4 choose · Enter checks or continues · Esc resets blocks</p>
      </div>

      {answered && (
        <div className={isCorrect ? 'answer-feedback correct' : 'answer-feedback wrong'} role="status">
          <span className="feedback-icon">{isCorrect ? <Check size={21} /> : <Lightbulb size={21} />}</span>
          <div>
            <strong>{isCorrect
              ? feedbackTone === 'direct' ? 'Correct.' : 'Spot on!'
              : feedbackTone === 'direct' ? 'Not quite. Here is the rule:' : 'Close – look at the pattern.'}</strong>
            <p>{exercise.explanation}</p>
            <button type="button" className="hear-answer" onClick={speakAnswer}><Volume2 size={15} /> Hear the complete German sentence</button>
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
          <button type="button" className="quiet-button" onClick={onBackToLesson}><ArrowLeft size={16} /> Back</button>
        ) : <span />}
        {answered ? (
          <button type="button" className="primary-button" onClick={nextQuestion}>
            {questionIndex === unit.exercises.length - 1 ? 'See results' : 'Next exercise'} <ArrowRight size={17} />
          </button>
        ) : (
          <button type="button" className="primary-button" disabled={!canCheck} onClick={checkAnswer}>Check <Check size={17} /></button>
        )}
      </div>
    </div>
  )
}
