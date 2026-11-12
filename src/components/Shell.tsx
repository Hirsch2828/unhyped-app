import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bookmark, BookOpen, Home, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <div className="min-h-screen bg-sand">
      <header
        className={`sticky top-0 z-30 border-b transition-colors ${scrolled ? 'border-rule bg-sand/85 backdrop-blur-md' : 'border-transparent bg-sand'} ${isStory ? 'hidden sm:block' : ''}`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-6 sm:h-16 sm:px-8">
          <NavLink to="/" aria-label="Unhyped home" className="py-2">
            <Logo />
          </NavLink>
          <nav className="mr-auto hidden gap-1 sm:flex">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end
                className={({ isActive }) =>
                  `t-meta inline-flex h-11 items-center px-3 transition ${isActive ? 'text-charcoal underline decoration-forest decoration-2 underline-offset-[6px]' : 'text-charcoal-400 hover:text-charcoal'}`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
          <span className="t-meta text-charcoal-400">{today()}</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl pb-28 sm:pb-16">
        <Outlet />
      </main>

      <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-sand sm:hidden">
        <div className="grid grid-cols-4">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) =>
                `press flex min-h-[52px] flex-col items-center justify-center gap-1 pt-2 text-[11px] font-medium tracking-[0.02em] ${isActive ? 'text-forest' : 'text-charcoal-400'}`
              }
            >
              {({ isActive }) => (
                <>
                  <t.icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
                  {t.label}
                  <span className={`h-[2px] w-4 rounded-full ${isActive ? 'bg-forest' : 'bg-transparent'}`} />
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
