import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { Capacitor } from '@capacitor/core'

try {
  if (Capacitor.isNativePlatform()) {
    document.documentElement.classList.add('cb-capacitor-app')
    document.body.classList.add('cb-capacitor-app')
  }
} catch (e) {
  // web environment or Capacitor bridge not present
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
