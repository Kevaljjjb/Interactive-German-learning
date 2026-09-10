import { BarChart3, Flame, Gamepad2, Home, Leaf, Map, Settings2, Sprout } from 'lucide-react'
import type { ProgressState, View } from '../types'

type SidebarProps = {
  view: View
  progress: ProgressState
  onNavigate: (view: View) => void
  onPersonalize: () => void
}

const navItems = [
  { id: 'home' as const, label: 'Heute', icon: Home },
  { id: 'path' as const, label: 'Lernpfad', icon: Map },
  { id: 'practice' as const, label: 'Spielplatz', icon: Gamepad2 },
  { id: 'progress' as const, label: 'Fortschritt', icon: BarChart3 },
]

export function Sidebar({ view, progress, onNavigate, onPersonalize }: SidebarProps) {
  return (
    <>
      <aside className="sidebar">
        <button className="brand" type="button" onClick={() => onNavigate('home')} aria-label="SatzGarten Startseite">
          <span className="brand-mark"><Sprout size={21} strokeWidth={2.4} /></span>
          <span>
            <strong>SatzGarten</strong>
            <small>Deutsch wird sichtbar</small>
          </span>
        </button>

        <nav className="side-nav" aria-label="Hauptnavigation">
          <span className="nav-caption">Dein Raum</span>
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
                {item.id === 'practice' && <span className="nav-new">SPIEL</span>}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-stats">
          <div className="tiny-stat">
            <span className="tiny-stat-icon fire"><Flame size={17} /></span>
            <span><strong>{progress.streak}</strong><small>{progress.streak === 1 ? 'Tag' : 'Tage'}</small></span>
          </div>
          <div className="tiny-stat">
            <span className="tiny-stat-icon leaf"><Leaf size={17} /></span>
            <span><strong>{progress.leaves}</strong><small>Blätter</small></span>
          </div>
        </div>

        <button className="profile-button" type="button" onClick={onPersonalize}>
          <span className="avatar">DU</span>
          <span><strong>Mein Lernstil</strong><small>Personalisieren</small></span>
          <Settings2 size={17} />
        </button>
      </aside>

      <nav className="mobile-nav" aria-label="Mobile Hauptnavigation">
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
          aria-label="Mein Lernstil personalisieren"
          onClick={onPersonalize}
        >
          <Settings2 size={21} />
          <span>Profil</span>
        </button>
      </nav>
    </>
  )
}
