import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PLANS, planById } from '../data/plans.js'
import { CheckIcon, ArrowIcon, EyeIcon } from '../components/Icon.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { useEnter } from '../components/EnterOverlay.jsx'
import { useShell } from '../components/shell.jsx'
import { BACKEND, PAYMENTS_ENABLED } from '../lib/config.js'
import { supabase } from '../lib/supabase.js'
import { startCheckout } from '../lib/pay.js'
import { UNAME, EMAIL_RE, lockLeft } from '../lib/localAuth.js'
import { priceLine } from '../lib/money.js'

const REF_KEY = 'kref'
const UN_KEY = 'kgun' // username chosen before going to Google
const cleanRef = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
// A friend's invite link (?ref=CODE) is remembered in this browser until the account is created.
const initRef = (q) => { const r = cleanRef(q.get('ref')); try { if (r) localStorage.setItem(REF_KEY, r); return r || cleanRef(localStorage.getItem(REF_KEY)) } catch { return r } }

const strength = (v) => {
  let s = 0
  if (v.length >= 8) s++
  if (v.length >= 12) s++
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++
  if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++
  return v ? s : 0
}

// "Forgot password" pop-up: asks for the account email, sends the reset link, shows progress, and after 2 minutes points to the admin.
function ForgotModal({ start, onClose }) {
  // A reset requested in the last 2 minutes is remembered, so closing and reopening the pop-up keeps the same progress screen.
  const saved = (() => { try { const v = JSON.parse(localStorage.getItem('kfp') || 'null'); if (v && v.e && Date.now() - v.t < 120000) return v } catch (x) { /* no storage */ } return null })()
  const [email, setEmail] = useState(saved ? saved.e : (start || ''))
  const [stage, setStage] = useState(saved ? 'progress' : 'form') // 'form' | 'progress'
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [left, setLeft] = useState(saved ? Math.max(0, 120 - Math.floor((Date.now() - saved.t) / 1000)) : 120)
  const sentTo = useRef(saved ? saved.e : '')
  const t0 = useRef(saved ? saved.t : Date.now())
  const nav = useNavigate()
  // Go to the home page and scroll to the "Let's talk" section (the router does not scroll to #anchors by itself).
  const goTalk = (e) => {
    e.preventDefault(); onClose(); nav('/')
    let n = 0
    const t = setInterval(() => {
      const el = document.getElementById('contact')
      if (el) { clearInterval(t); el.scrollIntoView({ behavior: 'smooth', block: 'start' }) } else if (++n > 40) clearInterval(t)
    }, 100)
  }
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  useEffect(() => {
    if (stage !== 'progress') return
    const tick = () => setLeft(Math.max(0, 120 - Math.floor((Date.now() - t0.current) / 1000)))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [stage])
  const submit = async (e) => {
    e.preventDefault()
    const em = email.trim().toLowerCase()
    setErr('')
    if (BACKEND !== 'supabase') return setErr('Password reset needs the server. It works once Supabase is connected.')
    if (!EMAIL_RE.test(em)) return setErr('Enter the email address you used for your account.')
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo: window.location.origin + '/auth?mode=reset' })
    setBusy(false)
    if (error && /rate|too many|seconds/i.test(error.message)) return setErr('Too many attempts. Please wait a minute and try again.')
    sentTo.current = em
    t0.current = Date.now()
    try { localStorage.setItem('kfp', JSON.stringify({ e: em, t: t0.current })) } catch (x) { /* no storage */ }
    setStage('progress')
  }
  const mm = String(Math.floor(left / 60)) + ':' + String(left % 60).padStart(2, '0')
  const S = {
    ov: { position: 'fixed', inset: 0, zIndex: 300, display: 'grid', placeItems: 'center', padding: 16, background: 'rgba(5,10,22,.78)', backdropFilter: 'blur(3px)' },
    box: { position: 'relative', width: 'min(420px,100%)', boxSizing: 'border-box', padding: '26px 22px 22px', borderRadius: 18, border: '1px solid #2f6fe055', background: '#0b1226', color: '#e8eefc', boxShadow: '0 24px 60px #000a, 0 0 24px #2f8cff22', fontFamily: 'Inter,system-ui,sans-serif' },
    x: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 10, border: '1px solid #ffffff22', background: '#ffffff0d', color: '#fff', fontSize: 22, lineHeight: 1, cursor: 'pointer' },
    h: { margin: '0 0 6px', fontSize: 18, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' },
    p: { margin: '0 0 16px', color: '#8fa0c4', fontSize: 14, lineHeight: 1.5 },
    inp: { display: 'block', width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: '1px solid #ffffff2e', background: '#0a1226', color: '#fff', fontSize: 15, fontFamily: 'inherit', outline: 'none', marginBottom: 12 },
    btn: { width: '100%', height: 46, border: 0, borderRadius: 12, background: 'linear-gradient(135deg,#2f8cff,#1f6fe0)', color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer' },
    err: { margin: '0 0 12px', color: '#ff8a96', fontSize: 14 },
    prog: { display: 'flex', gap: 12, alignItems: 'center', padding: '14px', borderRadius: 12, background: '#2f8cff14', border: '1px solid #2f8cff44', marginBottom: 12 },
    warn: { padding: '14px', borderRadius: 12, background: '#ffb4541a', border: '1px solid #ffb45455', color: '#ffd9a0', fontSize: 14, lineHeight: 1.5, marginBottom: 12 },
  }
  return (
    <div style={S.ov} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={S.box} role="dialog" aria-modal="true" aria-labelledby="fp-h">
        <button type="button" style={S.x} aria-label="Close" onClick={onClose}>&times;</button>
        <h2 id="fp-h" style={S.h}>Forgot password</h2>
        {stage === 'form' ? (
          <form onSubmit={submit} noValidate>
            <p style={S.p}>Enter the email you used to create your account and we will send you a reset link.</p>
            <input style={S.inp} type="email" autoComplete="email" autoFocus placeholder="Account email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Account email" />
            {err && <p style={S.err} role="alert">{err}</p>}
            <button type="submit" style={{ ...S.btn, opacity: busy ? 0.7 : 1 }} disabled={busy}>{busy ? 'Please wait...' : 'Reset password'}</button>
            <p style={{ margin: '14px 0 0', textAlign: 'center', color: '#8fa0c4', fontSize: 13 }}>Didn&apos;t get the email? <a href="/#contact" onClick={goTalk} style={{ color: '#7db8ff', fontWeight: 700, textDecoration: 'underline' }}>Contact us</a></p>
          </form>
        ) : (
          <div role="status" aria-live="polite">
            <div style={S.prog}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', border: '3px solid #2f8cff55', borderTopColor: '#2f8cff', animation: 'fpspin .9s linear infinite', flex: 'none' }} />
              <div><b>Reset in progress</b><div style={{ color: '#8fa0c4', fontSize: 13, marginTop: 2 }}>We are sending a reset link to {sentTo.current}. Check your inbox and your spam folder, then open the link on this device.</div></div>
            </div>
            {left > 0
              ? <p style={S.p}>This usually takes under 2 minutes. Time left: <b style={{ color: '#fff' }}>{mm}</b></p>
              : <div style={S.warn}>This is taking longer than expected. Kindly contact the admin and we will help you get back in. <a href="/#contact" onClick={goTalk} style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>Contact us</a></div>}
            <button type="button" style={{ ...S.btn, background: '#ffffff12', border: '1px solid #ffffff22' }} onClick={onClose}>Close</button>
          </div>
        )}
        <style>{'@keyframes fpspin{to{transform:rotate(360deg)}}'}</style>
      </div>
    </div>
  )
}

export default function Auth() {
  const [q] = useSearchParams()
  const nav = useNavigate()
  const enter = useEnter()
  const { scrollToId } = useShell()
  const { user, signUp, signIn, signInWithGoogle, checkUsername, verifyCode, resendCode, resetPassword, refresh } = useAuth()
  const [mode, setMode] = useState(q.get('mode') === 'login' ? 'login' : 'signup')
  // The plan is chosen on this page (or arrives from the Plans section). Nobody can sign up without picking one.
  const [planId, setPlanId] = useState(() => (PLANS.some((p) => p.id === q.get('plan')) ? q.get('plan') : ''))
  const plan = useMemo(() => planById(planId || 'free'), [planId])
  const bp = q.get('bp') === 'y' ? 'y' : 'm'
  const [f, setF] = useState(() => ({ name: '', user: '', email: '', pw: '', ref: initRef(q) }))
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [agree, setAgree] = useState(false)
  const [lock, setLock] = useState(lockLeft())
  const errRef = useRef(null)
  const [step, setStep] = useState(q.get('mode') === 'reset' ? 'reset' : 'form') // 'form' | 'verify' | 'reset'
  const [rp, setRp] = useState({ a: '', b: '' })
  const [waited, setWaited] = useState(false)
  const [okMsg, setOkMsg] = useState('')
  const [fpOpen, setFpOpen] = useState(false)
  const [code, setCode] = useState('')
  const [cool, setCool] = useState(0)
  const [uAvail, setUAvail] = useState(null) // null unknown, 'checking', true free, false taken
  const interval = bp === 'y' ? 'yearly' : 'monthly'
  // Go on after the email is verified: paid plan -> Paystack, otherwise straight into the lab.
  const proceed = async () => {
    if (plan.price && PAYMENTS_ENABLED) { await startCheckout({ plan: plan.id, interval }); return }
    enter('Opening your lab')
  }
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))
  const signup = mode === 'signup'

  useEffect(() => { setMode(q.get('mode') === 'login' ? 'login' : 'signup') }, [q])
  useEffect(() => { setErr(''); setInfo('') }, [mode])
  // Back from the "reset password" email link: show the new-password form. Give Supabase a moment to sign the person in.
  useEffect(() => { if (q.get('mode') === 'reset') setStep('reset') }, [q])
  useEffect(() => { if (step !== 'reset') return; const t = setTimeout(() => setWaited(true), 4000); return () => clearTimeout(t) }, [step])
  // Live username check (waits half a second after typing stops)
  useEffect(() => {
    const u = f.user.trim().toLowerCase()
    if (!signup || !UNAME.test(u)) { setUAvail(null); return }
    setUAvail('checking')
    const t = setTimeout(() => { checkUsername(u).then((ok) => setUAvail(ok), () => setUAvail(null)) }, 500)
    return () => clearTimeout(t)
  }, [f.user, signup, checkUsername])
  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool((c) => c - 1), 1000); return () => clearTimeout(t) }, [cool])
  // Came back from the confirmation link in the email (the session is created by Supabase), so carry on.
  useEffect(() => {
    if (q.get('verified') === '1' && user && !user.guest) claimUname().then(claimRef).finally(() => proceed().catch((x) => bad(x.message)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])
  // A friend's invite code typed before choosing Google is attached to the new account (only works for brand-new accounts).
  const claimRef = async () => {
    try { const r = cleanRef(localStorage.getItem(REF_KEY)); if (r) { await supabase.rpc('claim_referral', { code: r }); localStorage.removeItem(REF_KEY) } } catch { /* ignore */ }
  }
  // A new Google account gets the username chosen on the sign-up form (only works for brand-new accounts).
  const claimUname = async () => {
    try {
      const u = localStorage.getItem(UN_KEY)
      if (u) { localStorage.removeItem(UN_KEY); const { data } = await supabase.rpc('claim_username', { p_name: u }); if (data) await refresh() }
    } catch { /* ignore */ }
  }
  const gDone = useRef(false)
  // Back from Google on the "Log in" tab: go to the lab (or the admin panel). The sign-up return is handled by verified=1 above.
  useEffect(() => {
    if (q.get('google') !== '1' || !user || user.guest || gDone.current) return
    gDone.current = true
    claimRef().finally(() => { const adm = user.isAdmin && q.get('next') === '/admin'; enter(adm ? 'Opening the admin panel' : 'Welcome back, ' + (user.name || user.user).split(' ')[0], adm ? '/admin' : '/lab') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])
  useEffect(() => {
    if (!lock) return
    const t = setInterval(() => setLock(lockLeft()), 500)
    return () => clearInterval(t)
  }, [lock])
  const bad = (m) => { setErr(m); const n = errRef.current; if (n) { n.classList.remove('shake'); void n.offsetWidth; n.classList.add('shake') } }

  const sub = signup
    ? (!planId ? 'Pick a plan, then create your account. You can start free and upgrade any time.' : plan.price ? `You chose ${plan.name}.${PAYMENTS_ENABLED ? ' You will pay securely with Paystack after you create your account.' : ' No payment is taken yet.'}` : 'Save your progress and pick up where you left off.')
    : 'Log in to pick up where you left off.'

  const forgot = async () => {
    setInfo('')
    const email = f.email.trim().toLowerCase()
    if (BACKEND !== 'supabase') return bad('Password reset needs the server. It works once Supabase is connected.')
    if (!EMAIL_RE.test(email)) return bad('Enter your email above first, then press Forgot password.')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth?mode=reset' })
    if (error && /rate|too many|seconds/i.test(error.message)) return bad('Too many attempts. Please wait a minute and try again.')
    setErr(''); setInfo('If that email has an account, a reset link is on its way. Open it on this device to choose a new password.')
  }

  const google = async () => {
    setErr(''); setInfo('')
    if (BACKEND !== 'supabase') return bad('Google sign-in needs the server. It works once Supabase is connected.')
    if (signup && !planId) return bad('Choose a plan to continue. You can start with Free.')
    if (signup && !agree) return bad('Tick the box to accept the Terms and Conditions and the Privacy Policy.')
    if (signup) {
      const un = f.user.trim().toLowerCase()
      if (!un) return bad('Choose a username first. It is required, even when you sign up with Google.')
      if (!UNAME.test(un)) return bad('Choose a username of 3 to 20 characters. Start with a letter, then use letters, numbers or underscores.')
      if (uAvail === false) return bad('That username is taken. Try another one.')
      if (uAvail === 'checking') return bad('Checking that username. Try again in a moment.')
      try { localStorage.setItem(UN_KEY, un) } catch { /* ignore */ }
    }
    setBusy(true)
    try {
      const r = cleanRef(f.ref); if (signup && r) { try { localStorage.setItem(REF_KEY, r) } catch { /* ignore */ } }
      await signInWithGoogle(signup ? { plan: plan.id, bp } : { next: q.get('next') || '' })
    } catch (x) { bad(x.message || 'Could not start Google sign-in.'); setBusy(false) }
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setInfo('')
    const name = f.name.trim().slice(0, 60), username = f.user.trim().toLowerCase(), email = f.email.trim().toLowerCase(), password = f.pw.slice(0, 128)
    if (!signup && lockLeft()) { setLock(lockLeft()); return }
    setOkMsg('')
    if (signup && !name) return bad('Enter your name.')
    if (signup && uAvail === false) return bad('That username is taken. Try another one.')
    if (signup && !UNAME.test(username)) return bad('Choose a username of 3 to 20 characters. Start with a letter, then use letters, numbers or underscores.')
    if (!EMAIL_RE.test(email)) return bad('Enter a valid email address.')
    if (signup && password.length < 8) return bad('Use at least 8 characters for your password.')
    if (!password) return bad('Enter your password.')
    if (signup && !planId) return bad('Choose a plan to continue. You can start with Free.')
    if (signup && !agree) return bad('Tick the box to accept the Terms and Conditions and the Privacy Policy.')
    setBusy(true)
    try {
      if (signup) {
        const r = await signUp({ name, user: username, email, password, plan: plan.id, bp, ref: f.ref })
        try { localStorage.removeItem(REF_KEY) } catch { /* ignore */ }
        if (r.needsConfirm) { setStep('verify'); setCode(''); setCool(60); return }
        await proceed()
      } else {
        const r = await signIn({ email, password })
        enter(r.user.isAdmin && q.get('next') === '/admin' ? 'Opening the admin panel' : 'Welcome back, ' + (r.user.name || r.user.user).split(' ')[0], r.user.isAdmin && q.get('next') === '/admin' ? '/admin' : '/lab')
      }
    } catch (x) {
      if (!signup && lockLeft()) setLock(lockLeft())
      bad(x.message || 'Something went wrong. Please try again.')
    } finally { setBusy(false) }
  }

  const doVerify = async (e) => {
    e.preventDefault(); setErr(''); setInfo('')
    if (!/^\d{6,8}$/.test(code.trim())) return bad('Enter the code from your email, or click the link in it.')
    setBusy(true)
    try { await verifyCode({ email: f.email.trim().toLowerCase(), code }); await proceed() }
    catch (x) { bad(x.message || 'That code did not work.') } finally { setBusy(false) }
  }
  const doReset = async (e) => {
    e.preventDefault(); setErr('')
    if (rp.a.length < 8) return bad('Use at least 8 characters for your password.')
    if (rp.a !== rp.b) return bad('The two passwords do not match.')
    setBusy(true)
    try {
      await resetPassword(rp.a)
      setRp({ a: '', b: '' }); setOkMsg('Password updated. Log in with your new password.'); setStep('form'); setMode('login')
      nav('/auth?mode=login', { replace: true })
    } catch (x) { bad(x.message || 'Could not update your password.') } finally { setBusy(false) }
  }
  const doResend = async () => {
    if (cool > 0) return
    setErr(''); setInfo('')
    try { await resendCode(f.email.trim().toLowerCase()); setInfo('A new code is on its way.'); setCool(60) } catch (x) { bad(x.message) }
  }
  const s = strength(f.pw)
  return (
    <section className="lp-view on" id="v-auth">
      <div className="au"><div className="wrap au-grid">
        <aside className="au-side">
          <button className="au-back" onClick={() => scrollToId('plans')} aria-label="Back to plans">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>Back to plans
          </button>
          {(planId || !signup) && <div className="au-badge"><b>{plan.name}</b><span>{priceLine(plan, bp)}</span></div>}
          <h2>{signup ? 'Create your account' : 'Welcome back'}</h2>
          <p>{sub}</p>
          {(planId || !signup) && <ul>{plan.f.map((x) => Array.isArray(x)
            ? <li key={x[0]}><CheckIcon /><span>{x[0]} <em>Soon</em></span></li>
            : <li key={x}><CheckIcon /><span>{x}</span></li>)}</ul>}
        </aside>
        <div className="au-card">
          {step !== 'reset' && <div className="au-tabs" role="tablist" data-m={mode}>
            <button role="tab" className={signup ? 'on' : ''} onClick={() => setMode('signup')}>Create account</button>
            <button role="tab" className={!signup ? 'on' : ''} onClick={() => setMode('login')}>Log in</button><i />
          </div>}
          {step === 'reset' ? (
          <form id="rsform" onSubmit={doReset} noValidate>
            <h3 className="au-vt">Set a new password</h3>
            {!(user && !user.guest) ? (waited
              ? <p className="au-err" role="alert">This reset link is invalid or has expired. <button type="button" className="lnk" onClick={() => { setStep('form'); setMode('login'); nav('/auth?mode=login', { replace: true }) }}>Back to log in</button>, then press Forgot password to get a new link.</p>
              : <p className="au-vp" role="status">Checking your reset link...</p>) : (
              <>
                <p className="au-vp">Choose a new password for <b>{user.email}</b>.</p>
                <label><span>New password</span><div className="pw"><input type={show ? 'text' : 'password'} value={rp.a} onChange={(e) => setRp((v) => ({ ...v, a: e.target.value.slice(0, 128) }))} autoComplete="new-password" placeholder="At least 8 characters" maxLength={128} required />
                  <button type="button" className={show ? 'on' : ''} onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}><EyeIcon /></button></div></label>
                <div className="meter" aria-hidden="true" data-s={strength(rp.a)}><i /><i /><i /><i /></div>
                <label><span>Confirm new password</span><input type={show ? 'text' : 'password'} value={rp.b} onChange={(e) => setRp((v) => ({ ...v, b: e.target.value.slice(0, 128) }))} autoComplete="new-password" placeholder="Type it again" maxLength={128} required /></label>
                <p className="au-err" ref={errRef} role="alert">{err}</p>
                <button className="plan-btn au-go" type="submit" disabled={busy}><span>{busy ? 'Please wait' : 'Save new password'}</span><ArrowIcon /></button>
              </>)}
          </form>
          ) : step === 'verify' ? (
          <form id="verform" onSubmit={doVerify} noValidate>
            <h3 className="au-vt">Verify your email</h3>
            <p className="au-vp">We sent a confirmation email to <b>{f.email.trim().toLowerCase()}</b>. <b>Click the link in it</b> to verify and continue. If the email also shows a 6-digit code, enter it below instead.</p>
            <label><span>Verification code</span><input className="au-otp" name="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Code (if your email has one)" maxLength={8} /></label>
            <p className="au-err" ref={errRef} role="alert">{err}</p>
            {info && <p className="au-info" role="status">{info}</p>}
            <button className="plan-btn au-go" type="submit" disabled={busy}><span>{busy ? 'Please wait' : 'Verify and continue'}</span><ArrowIcon /></button>
            <p className="au-sw"><button type="button" onClick={doResend} disabled={cool > 0}>{cool > 0 ? `Resend code in ${cool}s` : 'Resend code'}</button> · <button type="button" onClick={() => { setStep('form'); setErr(''); setInfo('') }}>Change email</button></p>
          </form>
          ) : (
          <form id="auform" onSubmit={submit} noValidate>
            {signup && <div className="au-plans" role="radiogroup" aria-label="Choose your plan">
              <span>Choose your plan</span>
              <div>{PLANS.map((p) => (
                <button type="button" key={p.id} role="radio" aria-checked={planId === p.id} className={planId === p.id ? 'on' : ''} style={{ '--pc': p.col }} onClick={() => { setPlanId(p.id); setErr('') }}>
                  <b>{p.name}</b><small>{p.price ? priceLine(p, bp) : 'Free forever'}</small>
                </button>))}</div>
            </div>}
            {signup && <>
              <label className="f-name"><span>Full name</span><input name="name" value={f.name} onChange={set('name')} autoComplete="name" placeholder="Your name" maxLength={60} /></label>
              <label className="f-name"><span>Username</span><input name="user" value={f.user} onChange={set('user')} autoComplete="username" placeholder="for example, rootkit_rita" maxLength={20} spellCheck="false" autoCapitalize="none" /><small className="hint">3 to 20 letters, numbers or underscores. This is what shows on your profile.</small>{uAvail === 'checking' && <small className="hint">Checking...</small>}{uAvail === true && <small className="hint u-ok">✔ @{f.user.trim().toLowerCase()} is available</small>}{uAvail === false && <small className="hint u-bad">✖ That username is taken. Try another one.</small>}</label>
            </>}
            <label><span>Email</span><input name="email" type="email" value={f.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" maxLength={254} required /></label>
            <label><span>Password</span><div className="pw"><input name="pw" type={show ? 'text' : 'password'} value={f.pw} onChange={set('pw')} autoComplete={signup ? 'new-password' : 'current-password'} placeholder="At least 8 characters" maxLength={128} required />
              <button type="button" className={show ? 'on' : ''} onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}><EyeIcon /></button></div></label>
            {signup && <div className="meter f-name" aria-hidden="true" data-s={s}><i /><i /><i /><i /></div>}
            {signup && <label className="f-name"><span>Referral code <em>(optional)</em></span><input name="ref" value={f.ref} onChange={(e) => setF((v) => ({ ...v, ref: cleanRef(e.target.value) }))} placeholder="A friend's code" maxLength={12} autoComplete="off" spellCheck="false" />{f.ref && <small className="hint">If the code is valid, your first paid plan gets a discount.</small>}</label>}
            <p className="au-err" ref={errRef} role="alert">{lock ? `Too many failed attempts. Try again in ${lock} s.` : err}</p>
            {info && <p className="au-info" role="status">{info}</p>}
            {okMsg && !signup && <p className="au-info" role="status">{okMsg}</p>}
            {signup && <label className={`au-agree${agree ? ' on' : ''}`}>
              <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); if (e.target.checked) setErr('') }} />
              <i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></i>
              <span>By continuing you agree to the <Link className="lnk" to="/terms" target="_blank">Terms and Conditions</Link> and the <Link className="lnk" to="/privacy" target="_blank">Privacy Policy</Link>.</span>
            </label>}
            <button className="plan-btn au-go" type="submit" disabled={busy || (!signup && !!lock)}><span>{busy ? 'Please wait' : signup ? 'Create account' : 'Log in'}</span><ArrowIcon /></button>
            {BACKEND === 'supabase' && <>
              <div className="au-or" aria-hidden="true"><span>or</span></div>
              <button type="button" className="au-g" onClick={google} disabled={busy}><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg><span>Continue with Google</span></button>
            </>}
            <p className="au-sw">{signup
              ? <>Already have an account? <button type="button" onClick={() => setMode('login')}>Log in</button></>
              : <>New here? <button type="button" onClick={() => setMode('signup')}>Create an account</button> · <button type="button" onClick={() => setFpOpen(true)}>Forgot password?</button></>}</p>
          </form>
          )}
        </div>
      </div></div>
      {fpOpen && <ForgotModal start={f.email} onClose={() => setFpOpen(false)} />}
    </section>
  )
}
