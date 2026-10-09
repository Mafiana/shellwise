import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LEGAL, LEGAL_DATE } from '../data/legal.js'
import '../styles/legal.css'

export default function Legal({ kind }) {
  const d = LEGAL[kind]
  const other = kind === 'privacy' ? 'terms' : 'privacy'
  const [cur, setCur] = useState(0)
  useEffect(() => {
    document.title = `${d.title} · Shellwise`
    setCur(0); window.scrollTo(0, 0)
    const els = [...document.querySelectorAll('.lx-clause')]
    if (!('IntersectionObserver' in window) || !els.length) return
    const seen = new Map()
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => seen.set(e.target.dataset.i, e.isIntersecting ? e.boundingClientRect.top : null))
      const vis = [...seen.entries()].filter(([, v]) => v !== null).sort((a, b) => a[1] - b[1])
      if (vis.length) setCur(+vis[0][0])
    }, { rootMargin: '-90px 0px -60% 0px' })
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [kind, d.title])
  return (
    <section className="lp-view on lx-view" id={`v-${kind}`}><div className="wrap lx">
      <header className="lx-head">
        <p className="lx-k">Legal <span>/</span> {d.label}</p>
        <h1>{d.title}</h1>
        <p className="lx-lede">{d.lede}</p>
        <dl className="lx-meta">
          <div><dt>Last updated</dt><dd>{LEGAL_DATE}</dd></div>
          <div><dt>Applies to</dt><dd>Shellwise and its accounts</dd></div>
          <div><dt>Read also</dt><dd><Link to={`/${other}`}>{LEGAL[other].title}</Link></dd></div>
        </dl>
      </header>
      <div className="lx-body">
        <nav className="lx-toc" aria-label="On this page">
          <p>On this page</p>
          <ol>{d.secs.map((s, i) => <li key={s[0]}><a href={`#c${i + 1}`} className={cur === i ? 'on' : ''} onClick={(e) => { e.preventDefault(); document.getElementById(`c${i + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}><b>{String(i + 1).padStart(2, '0')}</b>{s[0]}</a></li>)}</ol>
          <button type="button" className="lx-print" onClick={() => window.print()}>Print this page</button>
        </nav>
        <article className="lx-doc">
          <aside className="lx-short"><h2>In short</h2><ul>{d.short.map((t) => <li key={t}>{t}</li>)}</ul><p>The full text below is what applies.</p></aside>
          {d.secs.map((s, i) => (
            <section className="lx-clause" id={`c${i + 1}`} data-i={i} key={s[0]}>
              <h2><span>{i + 1}.</span>{s[0]}</h2>
              {/* trusted static strings from data/legal.js, no user input */}
              <div dangerouslySetInnerHTML={{ __html: s[1] }} />
            </section>
          ))}
          <p className="lx-foot">This page is a plain-language template and is not legal advice. Have a lawyer review it before you launch with real users.</p>
        </article>
      </div>
    </div></section>
  )
}
