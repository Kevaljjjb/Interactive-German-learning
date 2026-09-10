import { BarChart3, Flame, Gamepad2, Home, Leaf, Map, Settings2, Sprout } from 'lucide-react'
import type { ProgressState, View } from '../types'

type SidebarProps = {
  view: View
  progress: ProgressState
  onNavigate: (view: View) => void
  onPersonalize: () => void
}

const navItems = [
  { id: 'home' as const, label: 'Today', icon: Home },
  { id: 'path' as const, label: 'Learning Path', icon: Map },
  { id: 'practice' as const, label: 'Playground', icon: Gamepad2 },
  { id: 'progress' as const, label: 'Progress', icon: BarChart3 },
]

export function Sidebar({ view, progress, onNavigate, onPersonalize }: SidebarProps) {
  return (
    <>
      <aside className="sidebar">
        <button className="brand" type="button" onClick={() => onNavigate('home')} aria-label="SatzGarten Home">
          <span className="brand-mark"><Sprout size={21} strokeWidth={2.4} /></span>
          <span>
            <strong>SatzGarten</strong>
            <small>German made visible</small>
          </span>
        </button>

        <nav className="side-nav" aria-label="Main navigation">
          <span className="nav-caption">Your Space</span>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={view === item.id ? 'nav-item active' : 'nav-item'}
                type="button"
                aria-current={view === item.id ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={20} strokeWidth={2} />
                <span>{item.label}</span>
                {item.id === 'practice' && <span className="nav-new">GAME</span>}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-stats">
          <div className="tiny-stat">
            <span className="tiny-stat-icon fire"><Flame size={17} /></span>
            <span><strong>{progress.streak}</strong><small>{progress.streak === 1 ? 'Day' : 'Days'}</small></span>
          </div>
          <div className="tiny-stat">
            <span className="tiny-stat-icon leaf"><Leaf size={17} /></span>
            <span><strong>{progress.leaves}</strong><small>{progress.leaves === 1 ? 'Leaf' : 'Leaves'}</small></span>
          </div>
        </div>

        <button className="profile-button" type="button" onClick={onPersonalize}>
          <span className="avatar">YOU</span>
          <span><strong>My Learning Style</strong><small>Personalize</small></span>
          <Settings2 size={17} />
        </button>
      </aside>

      <nav className="mobile-nav" aria-label="Mobile main navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={view === item.id ? 'active' : ''}
              type="button"
              aria-current={view === item.id ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={21} />
              <span>{item.label}</span>
            </button>
          )
        })}
        <button
          type="button"
          aria-label="Personalize my learning style"
          onClick={onPersonalize}
        >
          <Settings2 size={21} />
          <span>Profile</span>
        </button>
      </nav>
    </>
  )
}
