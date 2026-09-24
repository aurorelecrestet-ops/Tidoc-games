/** Keep the application fitted when browser chrome, the keyboard or orientation changes. */
export function installAppViewport() {
  const viewport = window.visualViewport
  const root = document.documentElement
  let frame = 0

  const update = () => {
    frame = 0
    // Pinch zoom must not resize the game's coordinate system.
    if (viewport && viewport.scale !== 1) return
    const height = viewport?.height ?? window.innerHeight
    if (height > 0) root.style.setProperty('--app-height', `${height}px`)
  }
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(update)
  }

  update()
  window.addEventListener('resize', schedule)
  window.addEventListener('pageshow', schedule)
  window.addEventListener('orientationchange', schedule)
  document.addEventListener('fullscreenchange', schedule)
  viewport?.addEventListener('resize', schedule)

  return () => {
    window.cancelAnimationFrame(frame)
    window.removeEventListener('resize', schedule)
    window.removeEventListener('pageshow', schedule)
    window.removeEventListener('orientationchange', schedule)
    document.removeEventListener('fullscreenchange', schedule)
    viewport?.removeEventListener('resize', schedule)
    root.style.removeProperty('--app-height')
  }
}
