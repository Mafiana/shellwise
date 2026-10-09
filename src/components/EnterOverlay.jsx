import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RM } from './shell.jsx'

const Ctx = createContext(null)
export const useEnter = () => useContext(Ctx)

// The "Starting your lab" loader. enter('Welcome back') shows it, then opens the lab.
export function EnterProvider({ children }) {
  const nav = useNavigate()
  const [st, setSt] = useState(null) // {title, pct, msg, fade}
  const busy = useRef(false)

  const enter = useCallback((title = 'Starting your lab', to = '/lab') => {
    if (busy.current) return
    busy.current = true
    const T = RM ? 600 : 2300, t0 = performance.now()
    setSt({ fade: false })
    const f = (t) => {
      const p = Math.min(1, (t - t0) / T)
      if (p < 1) return requestAnimationFrame(f)
      nav(to)
      // Keep the logo up until the lab has actually painted, so nothing flashes in between (4 s safety limit).
      let shown = false
      const reveal = () => {
        if (shown) return
        shown = true
        window.removeEventListener('sw-lab-ready', reveal)
        setSt((s) => s && { ...s, fade: true })
        setTimeout(() => { setSt(null); busy.current = false }, RM ? 50 : 650)
      }
      window.addEventListener('sw-lab-ready', reveal)
      setTimeout(reveal, 4000)
    }
    requestAnimationFrame(f)
  }, [nav])

  return (
    <Ctx.Provider value={enter}>
      {children}
      {st && (
        <div id="lpl" role="status" aria-label="Loading" className={`on logo-only${st.fade ? ' fade' : ''}`}>
          <img className="lglyph" src="/assets/kali-logo-blue.svg" alt="" width="104" height="104" />
        </div>
      )}
    </Ctx.Provider>
  )
}
