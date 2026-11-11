import { Navigate, Route, Routes } from 'react-router-dom'
import Shell from './components/Shell'
import { usePrefs } from './lib/prefs'
import Brief from './pages/Brief'
import Category from './pages/Category'
import Editor from './pages/Editor'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Saved from './pages/Saved'
import Settings from './pages/Settings'
import StoryPage from './pages/StoryPage'

export default function App() {
  const { prefs } = usePrefs()

  return (
    <Routes>
      <Route path="/welcome" element={<Onboarding />} />
      <Route path="/editor" element={<Editor />} />
      <Route element={prefs.onboarded ? <Shell /> : <Navigate to="/welcome" replace />}>
        <Route path="/" element={<Home />} />
        <Route path="/story/:id" element={<StoryPage />} />
        <Route path="/c/:id" element={<Category />} />
        <Route path="/brief" element={<Brief />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
