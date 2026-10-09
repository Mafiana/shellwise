import { useEffect, useState } from 'react'
import { TM } from '../data/testimonials.js'

export default function Testimonials() {
  const [i, setI] = useState(0)
  const [nonce, setNonce] = useState(0) // restarts the timer after a manual pick
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) setI((v) => (v + 1) % TM.length) }, 7000)
    return () => clearInterval(t)
  }, [nonce])
  return (
    <section className="sec lp-band" id="voices"><div className="wrap">
      <h2 className="reveal">What learners say</h2>
      <p className="sub reveal">Practice beats reading. Here is how it feels to learn this way.</p>
      <div className="tm reveal" id="tm">
        {TM.map((t, k) => (
          <figure className={`tm-slide${k === i ? ' on' : ''}`} style={{ margin: 0 }} key={k}>
            <blockquote>{t[0]}</blockquote>
            <cite><img src={t[3]} alt="" width="56" height="56" loading="lazy" /><span><b>{t[1]}</b>{t[2]}</span></cite>
          </figure>
        ))}
        <div className="tm-dots" role="tablist" aria-label="Choose a quote">
          {TM.map((_, k) => <button key={k} role="tab" aria-label={`Quote ${k + 1}`} className={k === i ? 'on' : ''} onClick={() => { setI(k); setNonce((n) => n + 1) }} />)}
        </div>
      </div>
    </div></section>
  )
}
