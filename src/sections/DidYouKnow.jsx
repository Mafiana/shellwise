import { useEffect, useState } from 'react'
import { DYK } from '../data/dyk.js'
import { RM } from '../components/shell.jsx'

const ART = {
  Linux: '<path d="M4 17l6-5-6-5"/><path d="M12 19h8"/>',
  Pentesting: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5"/>',
  Cybersecurity: '<path d="M12 3l8 3v6c0 4.8-3.3 8.2-8 9.5C7.3 20.2 4 16.8 4 12V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
}

// Rotates by itself. The text only changes after the old fact has fully faded out.
export default function DidYouKnow() {
  const [i, setI] = useState(() => Math.floor(Math.random() * DYK.length))
  const [fading, setFading] = useState(false)
  useEffect(() => {
    let t1, t2
    const tick = () => {
      if (RM) { setI((v) => (v + 1) % DYK.length); t1 = setTimeout(tick, 6500); return }
      setFading(true)
      t2 = setTimeout(() => { setI((v) => (v + 1) % DYK.length); setFading(false) }, 520)
      t1 = setTimeout(tick, 6500)
    }
    t1 = setTimeout(tick, 6500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  const [cat] = DYK[i]
  return (
    <section className="sec lp-band" id="dyk"><div className="wrap dk-wrap">
      <header className="dk-head reveal"><h2>Did you know?</h2><p className="sub">Short facts from Linux, penetration testing and security.</p></header>
      <div className="dk-stage reveal">
        <figure className={`dk${fading ? ' sw' : ''}`} id="dykc" data-cat={cat}>
          <svg className="dk-art" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth=".7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ART[cat] || '' }} />
          <figcaption className="dk-cat"><i /><span>{cat}</span></figcaption>
          <blockquote>
            {/* every fact is stacked in one grid cell, so the tallest one sets the height and the section never jumps */}
            <span className="dk-stack">{DYK.map((d, k) => <span key={k} className={k === i ? 'cur' : ''} aria-hidden={k !== i}>{d[1]}</span>)}</span>
          </blockquote>
        </figure>
      </div>
    </div></section>
  )
}
