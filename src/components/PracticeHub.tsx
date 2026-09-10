import { ArrowLeft, ArrowRight, Check, Clock3, Leaf, RotateCcw, Sparkles, Timer, Trophy, X, Zap } from 'lucide-react'
import { useRef, useState } from 'react'
import { articleDeck, curriculum, quickQuestions } from '../data/curriculum'
import type { AnswerSignal, Exercise, ProgressState } from '../types'
import { learningClock } from '../lib/learningClock'

type GameMode = 'menu' | 'articles' | 'quick' | 'sentences'

type PracticeHubProps = {
  progress: ProgressState
  onRecordAnswer: (correct: boolean, signal?: AnswerSignal) => void
  onGameComplete?: () => void
  initialGame?: GameMode
}

export function PracticeHub({ progress, onRecordAnswer, onGameComplete, initialGame = 'menu' }: PracticeHubProps) {
  const [mode, setMode] = useState<GameMode>(initialGame)
  const accuracy = progress.practiceAnswered ? Math.round((progress.correctAnswers / progress.practiceAnswered) * 100) : 0

  if (mode !== 'menu') {
    return (
      <div className="page practice-page game-open">
        <button className="back-button game-back" type="button" onClick={() => setMode('menu')}><ArrowLeft size={18} /> Spielplatz</button>
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
          <span className="section-kicker">GRAMMATIK-SPIELPLATZ</span>
          <h1>Kurz spielen. Viel merken.</h1>
          <p>Keine langen Tests – nur kleine Runden mit direktem Aha-Feedback.</p>
        </div>
        <div className="practice-mascot" aria-hidden="true">
          <span>Los!</span>
          <div><i>•</i><i>•</i><b>⌣</b></div>
        </div>
      </header>

      <div className="arcade-stats">
        <div><span className="stat-icon coral"><Zap size={20} /></span><p><strong>{progress.practiceAnswered}</strong><small>Antworten</small></p></div>
        <div><span className="stat-icon green"><Trophy size={20} /></span><p><strong>{accuracy}%</strong><small>Trefferquote</small></p></div>
        <div><span className="stat-icon yellow"><Leaf size={20} /></span><p><strong>{progress.leaves}</strong><small>Blätter</small></p></div>
      </div>

      <section className="game-section">
        <div className="section-heading">
          <div><span className="section-kicker">WÄHLE EIN SPIEL</span><h2>Womit willst du anfangen?</h2></div>
          <span className="time-chip"><Clock3 size={15} /> 2–5 Min.</span>
        </div>
        <div className="game-card-grid">
          <button className="game-card article-game-card" type="button" onClick={() => setMode('articles')}>
            <div className="game-art article-art">
              <span className="article-chip der">der</span><span className="noun-chip">Apfel</span>
              <span className="article-chip die">die</span><span className="noun-chip small">Lampe</span>
              <i>?</i>
            </div>
            <div className="game-copy"><span className="game-label">FARB-SPIEL · 6 KARTEN</span><strong className="game-card-title">Artikel-Garten</strong><p>Ordne Nomen blitzschnell zu der, die oder das.</p><span className="play-game">Spielen <ArrowRight size={17} /></span></div>
          </button>
          <button className="game-card quick-game-card" type="button" onClick={() => setMode('quick')}>
            <div className="game-art quick-art"><span>A</span><span>B</span><span>C</span><i><Timer size={29} /></i></div>
            <div className="game-copy"><span className="game-label">MIX · 5 FRAGEN</span><strong className="game-card-title">Blitz-Mix</strong><p>Fünf Muster quer durch deinen ganzen A1-Weg.</p><span className="play-game">Spielen <ArrowRight size={17} /></span></div>
          </button>
          <button className="game-card sentence-game-card" type="button" onClick={() => setMode('sentences')}>
            <div className="game-art sentence-art"><span>Heute</span><span>lerne</span><span>ich</span><span>Deutsch</span><i>1 → 2 → 3 → 4</i></div>
            <div className="game-copy"><span className="game-label">PUZZLE · 5 SÄTZE</span><strong className="game-card-title">Satz-Werkstatt</strong><p>Setze Wortbausteine in die richtige Spur.</p><span className="play-game">Spielen <ArrowRight size={17} /></span></div>
          </button>
        </div>
      </section>

      <section className="practice-tip-banner">
        <span><Sparkles size={21} /></span>
        <div><strong>So bleibt mehr hängen</strong><p>Spiele lieber jeden Tag eine 3-Minuten-Runde als einmal pro Woche 30 Minuten.</p></div>
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

  if (finished) return <GameResult title="Artikel-Garten" score={score} total={cards.length} onRestart={restart} />

  return (
    <GameBoard kicker="ARTIKEL-GARTEN" title="Welches Etikett gehört zum Nomen?" progress={index + 1} total={cards.length} score={score}>
      <div className="noun-stage">
        <span className="noun-emoji">{card.emoji}</span>
        <small>{card.hint.toUpperCase()}</small>
        <h2>___ {card.noun}</h2>
        <p>Tippe auf die richtige Farbe.</p>
      </div>
      <div className="article-options">
        {['der', 'die', 'das'].map((article) => {
          let className = `article-option ${article}`
          if (answered && article === card.article) className += ' correct'
          if (answered && article === selected && article !== card.article) className += ' wrong'
          return <button key={article} className={className} type="button" disabled={answered} aria-pressed={selected === article} onClick={() => choose(article)}><span>{article}</span><small>{article === 'der' ? 'MASKULIN' : article === 'die' ? 'FEMININ' : 'NEUTRAL'}</small>{answered && article === card.article && <Check size={19} />}{answered && article === selected && article !== card.article && <X size={19} />}</button>
        })}
      </div>
      {answered && <div className={selected === card.article ? 'game-feedback correct' : 'game-feedback wrong'} role="status" aria-live="polite"><strong>{selected === card.article ? 'Genau!' : `Es heißt ${card.article} ${card.noun}.`}</strong><p>Merk dir Wort und Artikel als einen einzigen farbigen Block.</p><button type="button" onClick={next}>{index === cards.length - 1 ? 'Ergebnis' : 'Nächste Karte'} <ArrowRight size={16} /></button></div>}
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

  if (finished) return <GameResult title="Blitz-Mix" score={score} total={questions.length} onRestart={restart} />

  return (
    <GameBoard kicker={`KAPITEL ${curriculum.find((unit) => unit.id === question.unitId)?.number ?? ''} · BLITZ-MIX`} title={question.prompt} progress={index + 1} total={questions.length} score={score}>
      <div className="quick-question">
        <small>{question.unitTitle}</small>
        <h2>{question.sentence ?? question.prompt}</h2>
      </div>
      <div className="quick-options">
        {question.choices.map((choice, choiceIndex) => {
          let className = selected === choice ? 'selected' : ''
          if (answered && choice === question.answer) className = 'correct'
          if (answered && selected === choice && choice !== question.answer) className = 'wrong'
          return <button key={choice} className={className} type="button" disabled={answered} aria-pressed={selected === choice} onClick={() => choose(choice)}><span>{String.fromCharCode(65 + choiceIndex)}</span><strong>{choice}</strong>{answered && choice === question.answer && <Check size={18} />}</button>
        })}
      </div>
      {answered && <div className={selected === question.answer ? 'game-feedback correct' : 'game-feedback wrong'} role="status" aria-live="polite"><strong>{selected === question.answer ? 'Muster erkannt!' : 'Guter Versuch.'}</strong><p>{question.explanation}</p><button type="button" onClick={next}>{index === questions.length - 1 ? 'Ergebnis' : 'Weiter'} <ArrowRight size={16} /></button></div>}
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

  if (finished) return <GameResult title="Satz-Werkstatt" score={score} total={puzzles.length} onRestart={restart} />

  return (
    <GameBoard kicker={`KAPITEL ${puzzle.unit.number} · SATZ-WERKSTATT`} title={puzzle.exercise.prompt} progress={index + 1} total={puzzles.length} score={score}>
      <div className="arcade-builder">
        <div className="builder-rail"><span>START</span><i /><i /><i /><span>ZIEL</span></div>
        <div className="arcade-dropzone">
          {placed.length === 0 && <p>Tippe unten auf den ersten Baustein</p>}
          {placed.map((token, tokenIndex) => <button type="button" key={token.id} className={answered ? (correct ? 'correct' : 'wrong') : ''} disabled={answered} onClick={() => setOrder((current) => current.filter((id) => id !== token.id))}><small>{tokenIndex + 1}</small>{token.word}</button>)}
        </div>
        <div className="arcade-token-pool">{available.map((token) => <button type="button" key={token.id} disabled={answered} onClick={() => setOrder((current) => [...current, token.id])}>{token.word}</button>)}</div>
      </div>
      {answered ? <div className={correct ? 'game-feedback correct' : 'game-feedback wrong'} role="status" aria-live="polite"><strong>{correct ? 'Der Satz fährt!' : 'Die Spur braucht noch Ordnung.'}</strong><p>{puzzle.exercise.explanation}</p><button type="button" onClick={next}>{index === puzzles.length - 1 ? 'Ergebnis' : 'Nächster Satz'} <ArrowRight size={16} /></button></div> : <div className="game-check-row"><button type="button" className="secondary-button" disabled={!order.length} onClick={() => setOrder([])}><RotateCcw size={16} /> Leeren</button><button type="button" className="primary-button" disabled={order.length !== tokens.length} onClick={check}>Satz prüfen <Check size={17} /></button></div>}
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
    <section className="game-board">
      <header className="game-board-head">
        <div><span>{kicker}</span><h1>{title}</h1></div>
        <div className="board-score"><Trophy size={17} /><strong>{score}</strong><small>Punkte</small></div>
      </header>
      <div className="game-progress"><span>{progress}/{total}</span><div>{Array.from({ length: total }, (_, index) => <i key={index} className={index < progress ? 'active' : ''} />)}</div></div>
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
      <small>{title.toUpperCase()} · GESCHAFFT</small>
      <h1>{score === total ? 'Perfekte Runde!' : score >= total / 2 ? 'Schön gespielt!' : 'Muster wachsen langsam.'}</h1>
      <p><strong>{score} von {total}</strong> richtig – und jede Antwort hat deinen Garten ein Stück wachsen lassen.</p>
      <div className="result-bar"><span style={{ width: `${(score / total) * 100}%` }} /></div>
      <button type="button" className="primary-button" onClick={onRestart}><RotateCcw size={17} /> Noch eine Runde</button>
    </section>
  )
}
