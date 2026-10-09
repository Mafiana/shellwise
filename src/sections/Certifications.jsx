import { useEffect, useRef, useState } from 'react'
import { CERTS } from '../data/certs.js'
import { RM } from '../components/shell.jsx'

function Drawer({ index, onClose, onMove }) {
  const c = CERTS[index]
  const [on, setOn] = useState(false)
  const panel = useRef(null)
  const closeBtn = useRef(null)
  useEffect(() => { const r = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(r) }, [])
  useEffect(() => { closeBtn.current && closeBtn.current.focus(); panel.current && (panel.current.scrollTop = 0) }, [index])
  const close = () => { setOn(false); setTimeout(onClose, RM ? 0 : 280) }
  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close() }
      if (e.key === 'Tab') {
        const f = [...panel.current.querySelectorAll('button')], i = f.indexOf(document.activeElement)
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus() }
        else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus() }
      }
    }
    document.addEventListener('keydown', key, true)
    return () => document.removeEventListener('keydown', key, true)
  })
  return (
    <aside className={`cdr${on ? ' on' : ''}`} role="dialog" aria-modal="true" aria-labelledby="cdt">
      <div className="cdr-scrim" onClick={close} />
      <div className="cdr-p" ref={panel}>
        <button className="cdr-x" ref={closeBtn} onClick={close} aria-label="Close">&times;</button>
        <div id="cdb">
          <img className="cd-img" src={`/assets/certs/${c.id}.svg`} alt={`${c.name} badge illustration`} width="240" height="290" />
          <p className="cd-org">{c.org} · {c.level}</p>
          <h3 id="cdt">{c.name}</h3>
          <dl>
            <dt>Who it is for</dt><dd>{c.who}</dd>
            <dt>What it covers</dt><dd>{c.what}</dd>
            <dt>The exam</dt><dd>{c.exam}</dd>
            <dt>Why it matters</dt><dd>{c.next}</dd>
            <dt>Prepare in this lab</dt><dd>{c.lab}</dd>
          </dl>
          <div className="cd-nav">
            <button onClick={() => onMove(-1)}>Previous</button>
            <button onClick={() => onMove(1)}>Next</button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function Certifications() {
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(null)
  const from = useRef(null)
  const show = (i, e) => { if (e) from.current = e.currentTarget; setIdx((i + CERTS.length) % CERTS.length) }
  const hide = () => { setIdx(null); from.current && from.current.focus && from.current.focus() }
  return (
    <section className="certs" id="certs"><div className="wrap">
      <header className="ct-head reveal"><h2>Cybersecurity certification</h2><p className="sub">The exams employers ask for most. Select a badge to see who it is for, what it covers and how this lab helps you prepare.</p></header>
      <ul className={`shelf${open ? ' open' : ''}`} id="shelf">
        {CERTS.map((c, i) => (
          <li key={c.id} className={`${i > 3 ? 'more ' : ''}reveal${open && i > 3 ? ' vis' : ''}`}>
            <button className="bdg" onClick={(e) => show(i, e)} aria-haspopup="dialog">
              <img src={`/assets/certs/${c.id}.svg`} alt="" width="240" height="290" loading="lazy" />
              <span className="bn">{c.name}</span><span className="bl">{c.level}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="ct-foot">
        <button className="ct-more" aria-expanded={open} aria-controls="shelf" onClick={() => setOpen((v) => !v)}><i aria-hidden="true" /><span>{open ? 'Show fewer' : 'View more certifications'}</span></button>
      </div>
      {idx !== null && <Drawer index={idx} onClose={hide} onMove={(d) => setIdx((v) => (v + d + CERTS.length) % CERTS.length)} />}
    </div></section>
  )
}
