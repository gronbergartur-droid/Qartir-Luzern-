import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthGate } from './features/auth/AuthGate'
import { AuthProvider } from './lib/auth/AuthContext'
import './index.css'
import App from './App.tsx'

// HashRouter (not BrowserRouter): GitHub Pages serves static files with no
// server-side rewrite, so a deep link like /historie/abc would 404 without
// it - the hash portion never leaves the browser.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
