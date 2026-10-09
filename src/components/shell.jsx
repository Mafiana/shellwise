import { createContext, useContext, useEffect, useRef, useState } from 'react'

export const ShellCtx = createContext(null)
export const useShell = () => useContext(ShellCtx)
export const RM = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

// Fades elements with class "reveal" in as they scroll into view. The scroll container is the #lp overlay.
export function useReveal(rootRef, dep) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('vis'); io.unobserve(x.target) } }), { root, threshold: 0.15 })
    root.querySelectorAll('.reveal:not(.vis)').forEach((n, i) => { n.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(n) })
    return () => io.disconnect()
  }, [rootRef, dep])
}

// Counts up once when scrolled into view.
export function CountUp({ n, plus }) {
  const ref = useRef(null)
  const { rootRef } = useShell()
  const [v, setV] = useState(RM ? n : 0)
  useEffect(() => {
    if (RM) return
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const f = (t) => { const p = Math.min(1, (t - t0) / 1100); setV(Math.round(n * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(f) }
      requestAnimationFrame(f)
    }, { root: rootRef.current, threshold: 0.6 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [n, rootRef])
  return <span ref={ref}>{v}{plus ? '+' : ''}</span>
}
