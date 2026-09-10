import { useMemo, useState } from 'react'
import { Check, GripVertical, RotateCcw, Shuffle, Volume2 } from 'lucide-react'
import type { VisualBlock } from '../types'

type Props = {
  blocks: VisualBlock[]
  onInteract?: () => void
  onSpeak?: (text: string) => void
}

export function InteractiveSentenceLab({ blocks, onInteract, onSpeak }: Props) {
  const naturalOrder = useMemo(() => blocks.map((_, index) => index), [blocks])
  const [order, setOrder] = useState(naturalOrder)
  const [selected, setSelected] = useState<number | null>(null)
  const [dragged, setDragged] = useState<number | null>(null)
  const isCorrect = order.every((value, index) => value === naturalOrder[index])

  const move = (from: number, to: number) => {
    if (from === to) return
    setOrder(current => {
      const next = [...current]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
    setSelected(null)
    onInteract?.()
  }

  const swap = (first: number, second: number) => {
    setOrder(current => {
      const next = [...current]
      ;[next[first], next[second]] = [next[second], next[first]]
      return next
    })
    setSelected(null)
    onInteract?.()
  }

  const select = (index: number) => {
    if (selected === null) setSelected(index)
    else if (selected === index) setSelected(null)
    else swap(selected, index)
  }

  const mix = () => {
    setOrder(current => current.length > 1 ? [...current.slice(1), current[0]] : current)
    setSelected(null)
    onInteract?.()
  }

  const reset = () => {
    setOrder(naturalOrder)
    setSelected(null)
    onInteract?.()
  }

  const sentence = order.map(index => blocks[index].text).join(' ').replace(/\s+([?.!,])/g, '$1')

  return (
    <div className="kinetic-lab">
      <div className="kinetic-toolbar">
        <div><strong>Build it yourself</strong><small>Drag blocks, or tap two blocks to swap them.</small></div>
        <div>
          <button type="button" onClick={mix}><Shuffle size={15} /> Mix</button>
          <button type="button" onClick={reset} disabled={isCorrect}><RotateCcw size={15} /> Reset</button>
          <button type="button" onClick={() => onSpeak?.(sentence)}><Volume2 size={15} /> Hear it</button>
        </div>
      </div>
      <div className="block-track kinetic-track">
        {order.map((blockIndex, position) => {
          const block = blocks[blockIndex]
          return (
            <button
              type="button"
              draggable
              key={`${block.text}-${blockIndex}`}
              className={`visual-block kinetic-block tone-${block.tone}${block.wide ? ' wide' : ''}${selected === position ? ' selected' : ''}`}
              aria-label={`${block.text}, position ${position + 1}. ${selected === null ? 'Select to move' : 'Swap with selected block'}`}
              aria-pressed={selected === position}
              onClick={() => select(position)}
              onDragStart={() => setDragged(position)}
              onDragOver={event => event.preventDefault()}
              onDrop={() => { if (dragged !== null) move(dragged, position); setDragged(null) }}
              onDragEnd={() => setDragged(null)}
            >
              <GripVertical className="block-grip" size={15} aria-hidden="true" />
              <i>{position + 1}</i>
              <span lang="de" translate="no">{block.text}</span>
              {block.sub && <small>{isCorrect ? block.sub : block.sub.replace(/(position|track)\s*\d/gi, 'moving')}</small>}
            </button>
          )
        })}
      </div>
      <div className={isCorrect ? 'syntax-signal correct' : 'syntax-signal exploring'} role="status" aria-live="polite">
        {isCorrect ? <><Check size={16} /> Pattern locked. Now say the sentence aloud.</> : <>Keep experimenting — look for the pattern described below.</>}
      </div>
    </div>
  )
}
