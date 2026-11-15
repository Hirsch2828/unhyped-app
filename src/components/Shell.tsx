import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Bookmark, Clock, Newspaper, Settings } from 'lucide-react'
import { Logo } from './ui'
import { feedFor, issueDate, issueNo, todayIssue } from '../lib/feed'
import { usePrefs } from '../lib/prefs'
import { useStories } from '../lib/stories'

const tabs = [
  { to: '/', label: 'Today', icon: Newspaper },
  { to: '/brief', label: 'Briefing', icon: Clock },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/settings', label: 'Settings', icon: Settings },
]

// "193 → 5": the articles we read in the last day, struck through, and the stories that made the issue.
export function Stamp({ className = '' }: { className?: string }) {
  const { prefs } = usePrefs()
  const { articles24h } = useStories()
  const { issue } = todayIssue(feedFor(prefs.topics, prefs.depth))
  return (
    <span
      className={`t-meta inline-flex h-8 items-center gap-1.5 border-[1.5px] border-ink px-2 font-semibold text-ink ${className}`}
      aria-label={articles24h !== null ? `${articles24h} articles read, ${issue.length} stories in the issue` : `${issue.length} stories in the issue`}
    >
      {articles24h !== null && (
        <>
          <s className="text-ink-faint">{articles24h}</s>
          <span aria-hidden>→</span>
        </>
      )}
      <span className="bg-lime px-1 text-lime-ink">{issue.length} stories</span>
    </span>
  )
}

export default function Shell() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  const isStory = pathname.startsWith('/story/')
  const isBrief = pathname === '/brief'

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Masthead: word mark, sections, issue number and the noise-to-signal stamp */}
      <header className={`bg-paper ${isStory || isBrief ? 'hidden sm:block' : ''}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex h-[60px] items-center justify-between gap-4 border-b-2 border-ink sm:h-[72px]">
            <div className="flex items-center gap-10">
              <NavLink to="/" aria-label="Unhyped, today's issue" className="flex min-h-[44px] items-center">
                <Logo className="sm:text-[28px]" />
              </NavLink>
              <nav aria-label="Sections" className="hidden items-center gap-1 sm:flex">
                {tabs.slice(0, 3).map((t) => (
                  <NavLink
                    key={t.to}
                    to={t.to}
                    end
                    className={({ isActive }) =>
                      `inline-flex h-11 items-center px-3 text-[16px] font-medium ${isActive ? 'text-ink' : 'text-ink-soft hover:text-ink'}`
                    }
                  >
                    {({ isActive }) => <span className={isActive ? 'border-b-[3px] border-lime pb-0.5' : ''}>{t.label}</span>}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
              <span className="t-meta hidden text-ink-soft md:inline">
                No. {issueNo()} · {issueDate()}
              </span>
              <Stamp />
              <NavLink
                to="/settings"
                aria-label="Settings"
                className={({ isActive }) => `hidden h-11 w-11 place-items-center sm:grid ${isActive ? 'text-ink' : 'text-ink-soft hover:text-ink'}`}
              >
                <Settings className="h-5 w-5" strokeWidth={1.8} />
              </NavLink>
            </div>
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
                `press flex min-h-[56px] flex-col items-center justify-center gap-1 text-[12px] ${isActive ? 'font-bold text-ink' : 'font-medium text-ink-soft'}`
              }
            >
              {({ isActive }) => (
                <>
                  <t.icon className="h-[21px] w-[21px]" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className={isActive ? 'border-b-[3px] border-lime leading-[14px]' : 'leading-[14px]'}>{t.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
