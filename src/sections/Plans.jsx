import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PLANS, CURRENCY } from '../data/plans.js'
import { useShell } from '../components/shell.jsx'
import { CheckIcon, ArrowIcon } from '../components/Icon.jsx'
import { money, monthlyPrice } from '../lib/money.js'
import { PAYMENTS_ENABLED } from '../lib/config.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { startCheckout, getCoupon, setCoupon } from '../lib/pay.js'
import { supabase } from '../lib/supabase.js'

const CODE_RE = /^[A-Z0-9_-]{3,24}$/

export default function Plans() {
  const { bp, setBp } = useShell()
  const nav = useNavigate()
  const { user } = useAuth()
  const [cp, setCp] = useState(getCoupon())
  const [cpMsg, setCpMsg] = useState(() => (getCoupon() ? 'Code saved. It is checked again at checkout.' : ''))
  const applyCp = async () => {
    const c = cp.trim().toUpperCase()
    if (!CODE_RE.test(c)) { setCpMsg('Enter a valid code, for example LAUNCH20.'); return }
    setCp(c)
    if (!user || user.guest || !supabase) { setCoupon(c); setCpMsg('Code saved. Log in or create an account and it is applied at checkout.'); return }
    const { data, error } = await supabase.rpc('check_coupon', { c })
    if (error || !data || !data.ok) { setCoupon(''); setCpMsg(data && data.used ? 'You have already used that code.' : 'That code is not valid, has expired, or has run out.'); return }
    setCoupon(c); setCpMsg(`${data.percent}% off will be taken off at checkout.`)
  }
  // A code that is already saved (for example after pressing Redeem in the lab) is checked at once, so the percent shows.
  useEffect(() => { if (getCoupon() && user && !user.guest) applyCp() }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const [payErr, setPayErr] = useState('')
  const clearCp = () => { setCoupon(''); setCp(''); setCpMsg('') }
  const pick = (id) => {
    const p = PLANS.find((x) => x.id === id)
    // Already signed in and choosing a paid plan: go straight to Paystack.
    if (user && !user.guest && p && p.price && PAYMENTS_ENABLED && user.plan !== id) {
      startCheckout({ plan: id, interval: bp === 'y' ? 'yearly' : 'monthly' }).catch((x) => setPayErr(x.message || 'Could not start the payment. Please try again.'))
      return
    }
    if (user && !user.guest) { nav('/lab'); return }
    nav(`/auth?mode=signup&plan=${id}&bp=${bp}`)
  }
  return (
    <section className="sec plans-sec" id="plans"><div className="wrap">
      <h2 className="reveal">Pick the plan that fits how you learn</h2>
      <p className="sub reveal">Start free. Upgrade when you want more. Pro opens everything.</p>
      <div className="bill-tog reveal" role="group" aria-label="Billing period">
        <button className={bp === 'm' ? 'on' : ''} onClick={() => setBp('m')}>Monthly</button>
        <button className={bp === 'y' ? 'on' : ''} onClick={() => setBp('y')}>Yearly <em>Save more</em></button>
      </div>
      <div className="plans">
        {PLANS.map((p) => (
          <article key={p.id} className={`plan reveal${p.pop ? ' pop' : ''}`} style={{ '--pc': p.col, '--pc2': p.col2 }}>
            {p.pop && <span className="ribbon">Most popular</span>}
            <h3>{p.name}</h3><p className="ptag">{p.tag}</p>
            <div className="price"><span className="cur">{CURRENCY.symbol}</span><b>{money(monthlyPrice(p, bp))}</b><span className="per">{p.price ? '/ month' : 'forever'}</span></div>
            <p className="bill">{p.price ? <><span className="bm">Billed monthly</span><span className="by">Billed yearly, cheaper per month</span></> : 'No card needed'}</p>
            <div className="p-lim" aria-label="What is open">{p.lim.map(([n, l]) => <span key={l}><b>{n}</b>{l}</span>)}</div>
            <p className="p-inc">{p.inc}</p>
            <ul>{p.f.map((x) => Array.isArray(x)
              ? <li key={x[0]} className="soon"><CheckIcon /><span>{x[0]} <em>Soon</em></span></li>
              : <li key={x}><CheckIcon /><span>{x}</span></li>)}</ul>
            <button className="plan-btn" onClick={() => pick(p.id)}><span>{p.cta}</span><ArrowIcon /></button>
          </article>
        ))}
      </div>
      {PAYMENTS_ENABLED && (
        <div className="cp reveal">
          <label htmlFor="cp-in">Have a discount code?</label>
          <div className="cp-row">
            <input id="cp-in" value={cp} onChange={(e) => setCp(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24))} onKeyDown={(e) => { if (e.key === 'Enter') applyCp() }} placeholder="Enter code" autoComplete="off" spellCheck="false" />
            <button type="button" onClick={applyCp}>Apply</button>
            {getCoupon() && <button type="button" className="ghost" onClick={clearCp}>Remove</button>}
          </div>
          <p role="status">{cpMsg}</p>
        </div>
      )}
      {payErr && <p className="plan-note" role="alert" style={{ color: '#e5484d' }}>{payErr}</p>}
      {!PAYMENTS_ENABLED && <p className="plan-note reveal">Payments are not switched on yet, so no money is taken. Choosing a plan takes you to sign up or log in.</p>}
    </div></section>
  )
}
