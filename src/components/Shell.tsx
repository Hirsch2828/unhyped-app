import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Logo } from './ui'
import { issueDate, issueNo } from '../lib/feed'

const tabs = [
  { to: '/', label: 'Issue' },
  { to: '/brief', label: 'Briefing' },
  { to: '/saved', label: 'Saved' },
  { to: '/settings', label: 'Settings' },
]

export default function Shell() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  const isStory = pathname.startsWith('/story/')
  const isBrief = pathname === '/brief'
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Masthead: word mark, issue number and date, on a 2px rule */}
      <header className={`sticky top-0 z-30 bg-paper ${isStory || isBrief ? 'hidden sm:block' : ''}`}>
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className={`flex h-14 items-center justify-between gap-6 border-b-2 border-ink sm:h-16 ${scrolled ? '' : ''}`}>
            <NavLink to="/" aria-label="Unhyped, today's issue" className="flex min-h-[44px] items-center">
              <Logo />
            </NavLink>
            <nav className="mr-auto hidden gap-1 sm:flex">
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end
                  className={({ isActive }) =>
                    `t-eyebrow inline-flex h-11 items-center px-3 ${isActive ? 'text-ink underline decoration-2 underline-offset-[6px]' : 'text-ink-soft hover:text-ink'}`
                  }
                >
                  {t.label}
                </NavLink>
              ))}
            </nav>
            <span className="t-meta text-right text-ink-soft">
              No. {issueNo()}
              <span className="block sm:ml-2 sm:inline">{issueDate()}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl pb-28 sm:pb-16">
        <Outlet />
      </main>

      <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper sm:hidden">
        <div className="grid grid-cols-4">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) =>
                `press relative flex min-h-[52px] items-center justify-center t-eyebrow ${isActive ? 'text-ink' : 'text-ink-soft'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'mark' : ''}>{t.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
