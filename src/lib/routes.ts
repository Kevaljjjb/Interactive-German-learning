import { useCallback, useEffect, useState } from 'react'
import type { GameMode, LessonTab, View } from '../types'

export type AppRoute =
  | { kind: 'view'; view: Exclude<View, 'practice'> }
  | { kind: 'practice'; game: GameMode }
  | { kind: 'lesson'; unitId: string; tab: LessonTab; topic?: string }

const lessonTabs: LessonTab[] = ['discover', 'examples', 'practice']
const games: GameMode[] = ['menu', 'articles', 'quick', 'sentences']

export function topicSlug(topic: string) {
  return topic.toLocaleLowerCase('en').normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function lessonHref(unitId: string, tab: LessonTab = 'discover', topic?: string) {
  return `#/learn/${encodeURIComponent(unitId)}/${tab}${topic ? `/${topicSlug(topic)}` : ''}`
}

export function practiceHref(game: GameMode = 'menu') {
  return `#/practice${game === 'menu' ? '' : `/${game}`}`
}

export function viewHref(view: Exclude<View, 'practice'>) {
  return view === 'home' ? '#/' : `#/${view}`
}

export function parseHash(hash: string): AppRoute {
  const segments = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  if (segments[0] === 'learn' && segments[1]) {
    const tab = lessonTabs.includes(segments[2] as LessonTab) ? segments[2] as LessonTab : 'discover'
    return { kind: 'lesson', unitId: segments[1], tab, topic: segments[3] }
  }
  if (segments[0] === 'practice') {
    const game = games.includes(segments[1] as GameMode) ? segments[1] as GameMode : 'menu'
    return { kind: 'practice', game }
  }
  if (segments[0] === 'path' || segments[0] === 'progress') return { kind: 'view', view: segments[0] }
  return { kind: 'view', view: 'home' }
}

export function useHashRoute() {
  const [route, setRoute] = useState<AppRoute>(() => parseHash(window.location.hash))
  useEffect(() => {
    const update = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  const navigate = useCallback((href: string) => {
    const hash = href.startsWith('#') ? href : `#${href}`
    if (window.location.hash === hash) setRoute(parseHash(hash))
    else window.location.hash = hash.slice(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  return { route, navigate }
}
