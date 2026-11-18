import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { isEvening } from './lib/feed'
import Shell, { NotFound } from './components/Shell'
import { usePrefs } from './lib/prefs'
import Brief from './pages/Brief'
import Category from './pages/Category'
import Editor from './pages/Editor'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Saved from './pages/Saved'
import Settings from './pages/Settings'
import StoryPage from './pages/StoryPage'

// Loaded only when opened, so the home page stays light.
const How = lazy(() => import('./pages/How'))
const Company = lazy(() => import('./pages/Company'))
const Companies = lazy(() => import('./pages/Companies'))
const Figures = lazy(() => import('./pages/dev/Figures'))

export default function App() {
  const { prefs } = usePrefs()

  // Evening mode: Automatic follows the reader's clock (19:00-06:00), checked every minute.
  useEffect(() => {
    const apply = () => {
      const dark = prefs.theme === 'dark' || (prefs.theme === 'auto' && isEvening())
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#171815' : '#F2F0E8')
    }
    apply()
    const t = setInterval(apply, 60_000)
    return () => clearInterval(t)
  }, [prefs.theme])

  return (
    <Routes>
      <Route path="/welcome" element={<Onboarding />} />
      <Route path="/editor" element={<Editor />} />
      {import.meta.env.DEV && <Route path="/dev/figures" element={<Suspense fallback={null}><Figures /></Suspense>} />}
      {/* Open before onboarding too: the welcome screen links here. */}
      <Route element={<Shell />}>
        <Route path="/how" element={<Suspense fallback={null}><How /></Suspense>} />
        <Route path="/company/:id" element={<Suspense fallback={null}><Company /></Suspense>} />
        <Route path="/companies" element={<Suspense fallback={null}><Companies /></Suspense>} />
      </Route>
      <Route element={prefs.onboarded ? <Shell /> : <Navigate to="/welcome" replace />}>
        <Route path="/" element={<Home />} />
        <Route path="/story/:id" element={<StoryPage />} />
        <Route path="/c/:id" element={<Category />} />
        <Route path="/brief" element={<Brief />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
