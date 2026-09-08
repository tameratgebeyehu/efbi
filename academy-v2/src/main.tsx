import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SiteApp from './SiteApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteApp />
  </StrictMode>,
)
