import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ShellCtx, useReveal, RM } from './shell.jsx'
import Nav from './Nav.jsx'
import Footer from './Footer.jsx'

const THEME_KEY = 'shellwise.theme'

// The public site: a full-screen scrolling overlay with the nav, the current page and the footer.
export default function SiteShell() {
  const rootRef = useRef(null)
  const loc = useLocation()
  const nav = useNavigate()
  const [bp, setBp] = useState('m') // billing period: m = monthly, y = yearly (the CSS reads it from data-bp)
  const [light, setLight] = useState(() => { try { return localStorage.getItem(THEME_KEY) === 'light' } catch { return false } })
  useEffect(() => { try { localStorage.setItem(THEME_KEY, light ? 'light' : 'dark') } catch { /* storage blocked */ } }, [light])

  const scrollNow = useCallback((id) => {
    const root = rootRef.current, t = root && root.querySelector('#' + id)
    if (t) root.scrollTo({ top: t.offsetTop - 68, behavior: RM ? 'auto' : 'smooth' })
  }, [])
  const scrollToId = useCallback((id) => {
    if (window.location.pathname !== '/') nav('/', { state: { sc: id } })
    else scrollNow(id)
  }, [nav, scrollNow])

  useEffect(() => {
    const sc = loc.state && loc.state.sc
    if (sc) setTimeout(() => scrollNow(sc), 60)
    else rootRef.current && rootRef.current.scrollTo({ top: 0, behavior: 'auto' })
  }, [loc.pathname, loc.key, loc.state, scrollNow])

   const [note, setNote] = useState(false)
  useEffect(() => {
    if (!(loc.state && loc.state.deleted)) return
    setNote(true)
    const t = setTimeout(() => setNote(false), 8000) // hide after 8 seconds
    return () => clearTimeout(t)
  }, [loc.key, loc.state])
  useReveal(rootRef, loc.key)
  const value = useMemo(() => ({ rootRef, scrollToId, light, bp, setBp }), [scrollToId, light, bp])
  return (
    <ShellCtx.Provider value={value}>
      <div id="lp" className={light ? 'lt' : ''} data-bp={bp} ref={rootRef}>
        <Nav light={light} setLight={setLight} />
        {note && <div className="lp-note" role="status"><span>Your account and its data were deleted.</span><button onClick={() => setNote(false)} aria-label="Dismiss">✕</button></div>}
        <main><Outlet /></main>
        <Footer />
      </div>
    </ShellCtx.Provider>
  )
}
