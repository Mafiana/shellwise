import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { BACKEND } from '../lib/config.js'
import { EMAIL_RE } from '../lib/localAuth.js'

const TOPICS = [['general', 'General question'], ['password', 'Password reset'], ['billing', 'Plans and billing'], ['bug', 'Report a bug'], ['feedback', 'Feedback'], ['partnership', 'Partnership']]
const MAX = 1500

const Send = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg>

export default function Contact() {
  const [f, setF] = useState({ name: '', email: '', topic: 'general', message: '', site: '' })
  const [st, setSt] = useState({ kind: '', text: '' })
  const [busy, setBusy] = useState(false)
  const errRef = useRef(null)
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))
  const fail = (text) => { setSt({ kind: 'err', text }); const n = errRef.current; if (n) { n.classList.remove('shake'); void n.offsetWidth; n.classList.add('shake') } }

  const submit = async (e) => {
    e.preventDefault()
    if (f.site) return // hidden field: only bots fill it
    const name = f.name.trim(), email = f.email.trim().toLowerCase(), message = f.message.trim()
    if (!name) return fail('Enter your name.')
    if (!EMAIL_RE.test(email)) return fail('Enter a valid email address so we can reply.')
    if (message.length < 10) return fail('Write a little more, at least 10 characters.')
    try { if (Date.now() - (+sessionStorage.getItem('kcn') || 0) < 30000) return fail('Please wait a few seconds before sending another message.') } catch { /* storage blocked */ }
    setBusy(true); setSt({ kind: '', text: '' })
    try {
      if (BACKEND === 'supabase') {
        const { error } = await supabase.from('contact_messages').insert({ name: name.slice(0, 80), email: email.slice(0, 254), topic: f.topic, message: message.slice(0, MAX) })
        if (error) throw error
        setSt({ kind: 'ok', text: 'Thank you. Your message was sent and we will reply by email.' })
      } else {
        // Preview mode (no server yet): keep it in this browser so nothing is lost, and say so.
        const old = JSON.parse(localStorage.getItem('kcontact') || '[]')
        old.push({ name, email, topic: f.topic, message, at: Date.now() })
        localStorage.setItem('kcontact', JSON.stringify(old.slice(-20)))
        setSt({ kind: 'ok', text: 'Preview mode: nothing was sent because no server is connected yet. Your message was saved in this browser.' })
      }
      try { sessionStorage.setItem('kcn', String(Date.now())) } catch { /* ignore */ }
      setF({ name: '', email: '', topic: 'general', message: '', site: '' })
    } catch { fail('Could not send your message. Please try again in a moment.') }
    finally { setBusy(false) }
  }

  const done = st.kind === 'ok'
  return (
    <section className="sec cn" id="contact"><div className="wrap">
      <div className="cn-shell reveal">
        <aside className="cn-hero">
          <span className="cn-k">Contact</span>
          <h2>Let&apos;s talk</h2>
          <p>A question about the lab, a problem with a payment, or an idea to make it better. Tell us and we will reply by email.</p>
          <p className="cn-fine">Password reset? Include the email you signed up with. As a New Password will be sent to that mail.</p>        </aside>
        {done ? (
          <div className="cn-form cn-ok" role="status">
            <div className="cn-tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg></div>
            <h3>Message sent</h3><p>{st.text}</p>
            <button type="button" className="plan-btn cn-go" onClick={() => setSt({ kind: '', text: '' })}><span>Send another</span></button>
          </div>
        ) : (
        <form className="cn-form" onSubmit={submit} noValidate>
          <label className="cn-sel"><span>What is it about?</span>
            <select value={f.topic} onChange={set('topic')}>{TOPICS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
          <div className="cn-row">
            <label><span>Your name</span><input value={f.name} onChange={set('name')} autoComplete="name" maxLength={80} placeholder="Ada Lovelace" /></label>
            <label><span>Email</span><input type="email" value={f.email} onChange={set('email')} autoComplete="email" maxLength={254} placeholder="you@example.com" /></label>
          </div>
          <label><span>Message</span><textarea value={f.message} onChange={set('message')} maxLength={MAX} rows={6} placeholder="Tell us what you need" /><small className="cn-count">{f.message.length} / {MAX}</small></label>
          <input className="cn-hp" name="site" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.site} onChange={set('site')} />
          <p className={`cn-msg ${st.kind}`} ref={errRef} role="alert">{st.text}</p>
          <button className="plan-btn cn-go" type="submit" disabled={busy}><span>{busy ? 'Sending' : 'Send message'}</span><Send /></button>
        </form>
        )}
      </div>
    </div></section>
  )
}
