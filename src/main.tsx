import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Order matters: faces, then tokens, then base (which declares the cascade layers).
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import { App } from './App'
import { ArtSheet } from './art'

const view = new URLSearchParams(location.search).get('view')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{view === 'art' ? <ArtSheet /> : <App />}</StrictMode>,
)
