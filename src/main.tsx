import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { PrefsProvider } from './lib/prefs'
import { loadLive } from './lib/stories'

loadLive()

// After an email sign-in link, return to the page that asked for it (e.g. the editor queue).
const after = localStorage.getItem('unhyped.afterLogin')
if (after && new URLSearchParams(window.location.search).has('code')) {
  localStorage.removeItem('unhyped.afterLogin')
  window.location.hash = '#' + after
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <PrefsProvider>
        <App />
      </PrefsProvider>
    </HashRouter>
  </StrictMode>,
)
