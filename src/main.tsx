import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ensureSupabaseSession } from './lib/supabase/client'
import './index.css'
import App from './App.tsx'

// No-op when Supabase isn't configured (local mock provider); otherwise
// waits for the anonymous session so the first data request isn't rejected
// by RLS. See lib/supabase/client.ts.
await ensureSupabaseSession()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
