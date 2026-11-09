import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bookmark, BookOpen, Home, Settings, User } from 'lucide-react'
import { useEffect } from 'react'
import { Logo } from './ui'
import { today } from '../lib/feed'

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/brief', label: 'Briefing', icon: BookOpen },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Shell() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  const isStory = pathname.startsWith('/story/')

  return (
    <div className="min-h-screen bg-sand">
      <header className={`sticky top-0 z-30 border-b border-sand-300/60 bg-sand/90 backdrop-blur ${isStory ? 'hidden sm:block' : ''}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-8">
          <NavLink to="/" aria-label="Unhyped home">
            <Logo />
          </NavLink>
          <nav className="mr-auto hidden gap-1 sm:flex">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-sand-200 text-charcoal' : 'text-charcoal-500 hover:text-charcoal'}`
                }
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-charcoal-400">{today()}</span>
            <NavLink to="/settings" aria-label="Your account" className="hidden h-9 w-9 place-items-center rounded-full border border-charcoal/70 text-charcoal sm:grid">
              <User className="h-5 w-5" />
            </NavLink>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl pb-28 sm:pb-16">
        <Outlet />
      </main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-sand-300/70 bg-sand-50/95 backdrop-blur sm:hidden">
        <div className="grid grid-cols-4">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 pt-2.5 text-[11px] font-medium ${isActive ? 'text-forest' : 'text-charcoal-400'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-7 w-9 place-items-center rounded-lg ${isActive ? 'bg-forest text-sand-50' : ''}`}>
                    <t.icon className="h-[18px] w-[18px]" />
                  </span>
                  {t.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
