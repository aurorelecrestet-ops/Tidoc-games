window.addEventListener('error', (event) => {
  document.body.insertAdjacentHTML(
    'beforeend',
    `<pre style="
      position:fixed;
      inset:20px;
      z-index:999999;
      padding:20px;
      overflow:auto;
      color:white;
      background:#7f1024;
      white-space:pre-wrap;
    ">${event.message}</pre>`,
  )
})

window.addEventListener('unhandledrejection', (event) => {
  document.body.insertAdjacentHTML(
    'beforeend',
    `<pre style="
      position:fixed;
      inset:20px;
      z-index:999999;
      padding:20px;
      overflow:auto;
      color:white;
      background:#7f1024;
      white-space:pre-wrap;
    ">${String(event.reason)}</pre>`,
  )
})

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import './menu-system.css'
import './mobile-layout.css'
import './design-system.css'
import { installAppViewport } from './lib/appViewport'

const disposeViewport = installAppViewport()
if (import.meta.hot) import.meta.hot.dispose(disposeViewport)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
