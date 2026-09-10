import { ArrowLeft, ArrowRight, Check, Clock3, Leaf, RotateCcw, Sparkles, Timer, Trophy, X, Zap } from 'lucide-react'
import { useRef, useState } from 'react'
import { articleDeck, curriculum, quickQuestions } from '../data/curriculum'
import type { AnswerSignal, Exercise, GameMode, ProgressState } from '../types'
import { learningClock } from '../lib/learningClock'

type PracticeHubProps = {
  progress: ProgressState
  onRecordAnswer: (correct: boolean, signal?: AnswerSignal) => void
  onGameComplete?: () => void
  initialGame?: GameMode
  onModeChange?: (mode: GameMode) => void
}

export function PracticeHub({ progress, onRecordAnswer, onGameComplete, initialGame = 'menu', onModeChange }: PracticeHubProps) {
  const [mode, setMode] = useState<GameMode>(initialGame)
  const changeMode = (next: GameMode) => { setMode(next); onModeChange?.(next) }
  const accuracy = progress.practiceAnswered ? Math.round((progress.correctAnswers / progress.practiceAnswered) * 100) : 0

  if (mode !== 'menu') {
    return (
      <div className="page practice-page game-open">
        <button className="back-button game-back" type="button" onClick={() => changeMode('menu')}><ArrowLeft size={18} /> Playground</button>
        {mode === 'articles' && <ArticleGame onRecord={onRecordAnswer} onComplete={onGameComplete} />}
        {mode === 'quick' && <QuickGame onRecord={onRecordAnswer} onComplete={onGameComplete} />}
        {mode === 'sentences' && <SentenceGame onRecord={onRecordAnswer} onComplete={onGameComplete} />}
      </div>
    )
  }

  return (
    <div className="page practice-page">
      <header className="practice-hub-header">
        <div>
          <span className="section-kicker">GRAMMAR PLAYGROUND</span>
          <h1>Play briefly. Remember deeply.</h1>
          <p>No lengthy tests – just quick rounds with immediate aha feedback.</p>
        </div>
        <div className="practice-mascot" aria-hidden="true">
          <span>Go!</span>
          <div><i>•</i><i>•</i><b>⌣</b></div>
        </div>
      </header>

      <div className="arcade-stats">
        <div><span className="stat-icon coral"><Zap size={20} /></span><p><strong>{progress.practiceAnswered}</strong><small>Answers</small></p></div>
        <div><span className="stat-icon green"><Trophy size={20} /></span><p><strong>{accuracy}%</strong><small>Accuracy</small></p></div>
        <div><span className="stat-icon yellow"><Leaf size={20} /></span><p><strong>{progress.leaves}</strong><small>Leaves</small></p></div>
      </div>

      <section className="game-section">
        <div className="section-heading">
          <div><span className="section-kicker">CHOOSE A GAME</span><h2>Where would you like to start?</h2></div>
          <span className="time-chip"><Clock3 size={15} /> 2–5 min</span>
        </div>
        <div className="game-card-grid">
          <button className="game-card article-game-card" type="button" onClick={() => changeMode('articles')}>
            <div className="game-art article-art">
              <span className="article-chip der" lang="de" translate="no">der</span><span className="noun-chip" lang="de" translate="no">Apfel</span>
              <span className="article-chip die" lang="de" translate="no">die</span><span className="noun-chip small" lang="de" translate="no">Lampe</span>
              <i>?</i>
            </div>
            <div className="game-copy"><span className="game-label">COLOR GAME · 6 CARDS</span><strong className="game-card-title">Article Garden</strong><p>Match nouns to der, die, or das in a flash.</p><span className="play-game">Play <ArrowRight size={17} /></span></div>
          </button>
          <button className="game-card quick-game-card" type="button" onClick={() => changeMode('quick')}>
            <div className="game-art quick-art"><span>A</span><span>B</span><span>C</span><i><Timer size={29} /></i></div>
            <div className="game-copy"><span className="game-label">MIX · 5 QUESTIONS</span><strong className="game-card-title">Quick Mix</strong><p>Five patterns across your entire A1 journey.</p><span className="play-game">Play <ArrowRight size={17} /></span></div>
          </button>
          <button className="game-card sentence-game-card" type="button" onClick={() => changeMode('sentences')}>
            <div className="game-art sentence-art"><span lang="de" translate="no">Heute</span><span lang="de" translate="no">lerne</span><span lang="de" translate="no">ich</span><span lang="de" translate="no">Deutsch</span><i>1 → 2 → 3 → 4</i></div>
            <div className="game-copy"><span className="game-label">PUZZLE · 5 SENTENCES</span><strong className="game-card-title">Sentence Workshop</strong><p>Snap word blocks into the right order.</p><span className="play-game">Play <ArrowRight size={17} /></span></div>
          </button>
        </div>
      </section>

      <section className="practice-tip-banner">
        <span><Sparkles size={21} /></span>
        <div><strong>How to make it stick</strong><p>A 3-minute round every day is far better than 30 minutes once a week.</p></div>
      </section>
    </div>
  )
}

type RecordProps = {
  onRecord: (correct: boolean, signal?: AnswerSignal) => void
  onComplete?: () => void
}

function shuffle<T>(items: readonly T[]): T[] {
  const array = [...items]
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

function ArticleGame({ onRecord, onComplete }: RecordProps) {
  const [cards, setCards] = useState(() => shuffle(articleDeck).slice(0, 6))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const startedAt = useRef(learningClock())
  const card = cards[index]
  const answered = selected !== ''

  const choose = (article: string) => {
    if (answered) return
    setSelected(article)
    const correct = article === card.article
    if (correct) setScore((value) => value + 1)
    onRecord(correct, {
      unitId: 'essen-artikel',
      exerciseType: 'article',
      responseMs: Math.round(learningClock() - startedAt.current),
      source: 'arcade',
      pillar: 'article_memory',
    })
  }

  const next = () => {
    if (index === cards.length - 1) { setFinished(true); onComplete?.() }
    else { setIndex((value) => value + 1); setSelected(''); startedAt.current = learningClock() }
  }

  const restart = () => {
    setCards(shuffle(articleDeck).slice(0, 6))
    setIndex(0)
    setSelected('')
    setScore(0)
    setFinished(false)
    startedAt.current = learningClock()
  }

  if (finished) return <GameResult title="Article Garden" score={score} total={cards.length} onRestart={restart} />

  return (
    <GameBoard key={`${index}-${card.noun}`} kicker="ARTICLE GARDEN" title="Which article belongs to this noun?" progress={index + 1} total={cards.length} score={score}>
      <div className="noun-stage">
        <span className="noun-emoji">{card.emoji}</span>
        <small>{card.hint.toUpperCase()}</small>
        <h2 lang="de" translate="no">{`___ ${card.noun}`}</h2>
        <p>Tap the correct color.</p>
      </div>
      <div className="article-options">
        {['der', 'die', 'das'].map((article) => {
          let className = `article-option ${article}`
          if (answered && article === card.article) className += ' correct'
          if (answered && article === selected && article !== card.article) className += ' wrong'
          return <button key={article} className={className} type="button" disabled={answered} aria-pressed={selected === article} onClick={() => choose(article)}><span lang="de" translate="no">{article}</span><small>{article === 'der' ? 'MASCULINE' : article === 'die' ? 'FEMININE' : 'NEUTER'}</small>{answered && article === card.article && <Check size={19} />}{answered && article === selected && article !== card.article && <X size={19} />}</button>
        })}
      </div>
      {answered && <div className={selected === card.article ? 'game-feedback correct' : 'game-feedback wrong'} role="status" aria-live="polite"><strong>{selected === card.article ? 'Spot on!' : <span>It's <span lang="de" translate="no">{card.article} {card.noun}</span>.</span>}</strong><p>Remember the word and article as one single colored block.</p><button type="button" onClick={next}>{index === cards.length - 1 ? 'See results' : 'Next card'} <ArrowRight size={16} /></button></div>}
    </GameBoard>
  )
}

function QuickGame({ onRecord, onComplete }: RecordProps) {
  const [questions, setQuestions] = useState(() => shuffle(quickQuestions).slice(0, 5))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const startedAt = useRef(learningClock())
  const question = questions[index]
  const answered = selected !== ''

  const choose = (answer: string) => {
    if (answered) return
    setSelected(answer)
    const correct = answer === question.answer
    if (correct) setScore((value) => value + 1)
    onRecord(correct, {
      unitId: question.unitId,
      exerciseType: question.type,
      responseMs: Math.round(learningClock() - startedAt.current),
      source: 'arcade',
    })
  }

  const next = () => {
    if (index === questions.length - 1) { setFinished(true); onComplete?.() }
    else { setIndex((value) => value + 1); setSelected(''); startedAt.current = learningClock() }
  }

  const restart = () => {
    setQuestions(shuffle(quickQuestions).slice(0, 5))
    setIndex(0)
    setSelected('')
    setScore(0)
    setFinished(false)
    startedAt.current = learningClock()
  }

  if (finished) return <GameResult title="Quick Mix" score={score} total={questions.length} onRestart={restart} />

  return (
    <GameBoard key={`${index}-${question.unitId}`} kicker={`CHAPTER ${curriculum.find((unit) => unit.id === question.unitId)?.number ?? ''} · QUICK MIX`} title={question.prompt} progress={index + 1} total={questions.length} score={score}>
      <div className="quick-question">
        <small>{question.unitTitle}</small>
        <h2 lang="de" translate="no">{question.sentence ?? question.prompt}</h2>
      </div>
      <div className="quick-options">
        {question.choices.map((choice, choiceIndex) => {
          let className = selected === choice ? 'selected' : ''
          if (answered && choice === question.answer) className = 'correct'
          if (answered && selected === choice && choice !== question.answer) className = 'wrong'
          return <button key={choice} className={className} type="button" disabled={answered} aria-pressed={selected === choice} onClick={() => choose(choice)}><span>{String.fromCharCode(65 + choiceIndex)}</span><strong lang="de" translate="no">{choice}</strong>{answered && choice === question.answer && <Check size={18} />}</button>
        })}
      </div>
      {answered && <div className={selected === question.answer ? 'game-feedback correct' : 'game-feedback wrong'} role="status" aria-live="polite"><strong>{selected === question.answer ? 'Pattern spotted!' : 'Good try!'}</strong><p>{question.explanation}</p><button type="button" onClick={next}>{index === questions.length - 1 ? 'See results' : 'Continue'} <ArrowRight size={16} /></button></div>}
    </GameBoard>
  )
}

const arrangePuzzles = curriculum.flatMap((unit) => {
  const exercise = unit.exercises.find((e): e is Extract<Exercise, { type: 'arrange' }> => e.type === 'arrange')
  return exercise ? [{ unit, exercise }] : []
})

function SentenceGame({ onRecord, onComplete }: RecordProps) {
  const [puzzles, setPuzzles] = useState(() => shuffle(arrangePuzzles).slice(0, 5))
  const [index, setIndex] = useState(0)
  const [order, setOrder] = useState<number[]>([])
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const startedAt = useRef(learningClock())
  const puzzle = puzzles[index]
  const tokens = puzzle.exercise.tokens.map((word, id) => ({ word, id }))
  const placed = order.map((id) => tokens.find((token) => token.id === id)!).filter(Boolean)
  const available = tokens.filter((token) => !order.includes(token.id))

  const check = () => {
    const isCorrect = placed.map((token) => token.word).join('|') === puzzle.exercise.answer.join('|')
    setCorrect(isCorrect)
    setAnswered(true)
    if (isCorrect) setScore((value) => value + 1)
    onRecord(isCorrect, {
      unitId: puzzle.unit.id,
      exerciseType: 'arrange',
      responseMs: Math.round(learningClock() - startedAt.current),
      source: 'arcade',
    })
  }

  const next = () => {
    if (index === puzzles.length - 1) { setFinished(true); onComplete?.() }
    else { setIndex((value) => value + 1); setOrder([]); setAnswered(false); setCorrect(false); startedAt.current = learningClock() }
  }

  const restart = () => {
    setPuzzles(shuffle(arrangePuzzles).slice(0, 5))
    setIndex(0)
    setOrder([])
    setAnswered(false)
    setCorrect(false)
    setScore(0)
    setFinished(false)
    startedAt.current = learningClock()
  }

  if (finished) return <GameResult title="Sentence Workshop" score={score} total={puzzles.length} onRestart={restart} />

  return (
    <GameBoard key={`${index}-${puzzle.unit.id}`} kicker={`CHAPTER ${puzzle.unit.number} · SENTENCE WORKSHOP`} title={puzzle.exercise.prompt} progress={index + 1} total={puzzles.length} score={score}>
      <div className="arcade-builder">
        <div className="builder-rail"><span>START</span><i /><i /><i /><span>FINISH</span></div>
        <div className="arcade-dropzone">
          {placed.length === 0 && <p>Tap the first block below</p>}
          {placed.map((token, tokenIndex) => <button type="button" key={token.id} className={answered ? (correct ? 'correct' : 'wrong') : ''} disabled={answered} onClick={() => setOrder((current) => current.filter((id) => id !== token.id))} lang="de" translate="no"><small>{tokenIndex + 1}</small>{token.word}</button>)}
        </div>
        <div className="arcade-token-pool">{available.map((token) => <button type="button" key={token.id} disabled={answered} onClick={() => setOrder((current) => [...current, token.id])} lang="de" translate="no">{token.word}</button>)}</div>
      </div>
      {answered ? <div className={correct ? 'game-feedback correct' : 'game-feedback wrong'} role="status" aria-live="polite"><strong>{correct ? 'The sentence rolls smoothly!' : 'The track still needs work.'}</strong><p>{puzzle.exercise.explanation}</p><button type="button" onClick={next}>{index === puzzles.length - 1 ? 'See results' : 'Next sentence'} <ArrowRight size={16} /></button></div> : <div className="game-check-row"><button type="button" className="secondary-button" disabled={!order.length} onClick={() => setOrder([])}><RotateCcw size={16} /> Reset</button><button type="button" className="primary-button" disabled={order.length !== tokens.length} onClick={check}>Check sentence <Check size={17} /></button></div>}
    </GameBoard>
  )
}

type GameBoardProps = {
  kicker: string
  title: string
  progress: number
  total: number
  score: number
  children: React.ReactNode
}

function GameBoard({ kicker, title, progress, total, score, children }: GameBoardProps) {
  return (
    <section className="game-board" lang="en">
      <header className="game-board-head">
        <div><span>{kicker}</span><h1>{title}</h1></div>
        <div className="board-score"><Trophy size={17} /><strong>{score}</strong><small>points</small></div>
      </header>
      <div className="game-progress"><span>{`${progress}/${total}`}</span><div>{Array.from({ length: total }, (_, index) => <i key={index} className={index < progress ? 'active' : ''} />)}</div></div>
      {children}
    </section>
  )
}

type GameResultProps = { title: string; score: number; total: number; onRestart: () => void }

function GameResult({ title, score, total, onRestart }: GameResultProps) {
  return (
    <section className="game-result">
      <div className="result-rays" aria-hidden="true">✦</div>
      <span className="result-cup"><Trophy size={36} /></span>
      <small>{title.toUpperCase()} · COMPLETED</small>
      <h1>{score === total ? 'Perfect round!' : score >= total / 2 ? 'Great job!' : 'Patterns take time to grow.'}</h1>
      <p><strong>{score} of {total}</strong> correct – and every answer helps your garden grow.</p>
      <div className="result-bar"><span style={{ width: `${(score / total) * 100}%` }} /></div>
      <button type="button" className="primary-button" onClick={onRestart}><RotateCcw size={17} /> Play another round</button>
    </section>
  )
}
