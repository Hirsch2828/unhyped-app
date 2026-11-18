import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Bookmark, Boxes, Clock, Newspaper, Settings } from 'lucide-react'
import { Logo } from './ui'
import { loadLive, useStories } from '../lib/stories'

const tabs = [
  { to: '/', label: 'Today', icon: Newspaper },
  { to: '/brief', label: '60s scan', icon: Clock },
  { to: '/companies', label: 'Companies', icon: Boxes },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/settings', label: 'Settings', icon: Settings },
]

// While the issue loads: a quiet skeleton in the shape of the page. If it can't load: say so, offer a retry.
function FeedGate() {
  const { mode } = useStories()
  if (mode === 'loading')
    return (
      <div className="px-4 pt-6 sm:px-8" role="status" aria-label="Loading today’s issue">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="skeleton aspect-[16/10] lg:col-span-8" />
          <div className="flex flex-col gap-3 lg:col-span-4">
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-10 w-4/5" />
            <div className="skeleton mt-3 h-4 w-full" />
            <div className="skeleton h-4 w-11/12" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    )
  if (mode === 'error')
    return (
      <div className="px-4 pt-14 sm:px-8">
        <p className="t-meta uppercase text-ink-soft">Today’s stories · not loaded</p>
        <h1 className="mt-3 max-w-2xl text-[34px] font-bold leading-[36px] tracking-[-0.035em] sm:text-[46px] sm:leading-[47px]">
          We couldn’t load today’s issue.
        </h1>
        <p className="mt-4 max-w-xl text-[18px] leading-[27px] text-ink">Check your connection and try again. Nothing you saved is lost.</p>
        <button onClick={() => loadLive()} className="press mt-6 inline-flex min-h-[48px] items-center bg-ink px-6 text-[15px] font-semibold text-paper">
          Try again
        </button>
      </div>
    )
  return <Outlet />
}

export function NotFound() {
  return (
    <div className="px-4 pt-14 sm:px-8">
      <p className="t-meta uppercase text-ink-soft">Error 404 · page not printed</p>
      <h1 className="mt-3 max-w-3xl text-[38px] font-bold leading-[40px] tracking-[-0.04em] sm:text-[56px] sm:leading-[56px]">
        This page isn’t in <span className="mark">any issue</span>.
      </h1>
      <p className="mt-4 max-w-xl text-[18px] leading-[27px] text-ink">The link may be old, or the story was taken down after review.</p>
      <NavLink to="/" className="press mt-6 inline-flex min-h-[48px] items-center bg-ink px-6 text-[15px] font-semibold text-paper">
        Go to today’s issue
      </NavLink>
    </div>
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
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
          <div className="flex h-[60px] items-center justify-between gap-4 border-b-2 border-ink sm:h-[72px]">
            <div className="flex items-center gap-10">
              <NavLink to="/" aria-label="Unhyped, today's issue" className="flex min-h-[44px] items-center">
                <Logo className="sm:text-[28px]" />
              </NavLink>
              <nav aria-label="Sections" className="hidden items-center gap-1 sm:flex">
                {tabs.slice(0, 4).map((t) => (
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

      <nav aria-label="Skip link"><a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }} className="sr-only z-50 bg-ink px-4 py-3 text-paper focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a></nav>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1440px] pb-28 outline-none sm:pb-16">
        {pathname === '/settings' ? <Outlet /> : <FeedGate />}
      </main>

      <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper sm:hidden">
        <div className="grid grid-cols-5">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) =>
                `press flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] ${isActive ? 'font-bold text-ink' : 'font-medium text-ink-soft'}`
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
