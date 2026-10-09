import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { verifyPayment } from '../lib/pay.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { useEnter } from '../components/EnterOverlay.jsx'

// Paystack sends the browser back here with ?reference=... . We ask the server to verify it; the server (not this page)
// is what upgrades the plan.
export default function BillingCallback() {
  const [q] = useSearchParams()
  const ref = q.get('reference') || q.get('trxref')
  const [st, setSt] = useState(ref ? 'checking' : 'none')
  const { refresh } = useAuth()
  const enter = useEnter()
  const nav = useNavigate()
  useEffect(() => {
    if (!ref) return
    let off = false
    ;(async () => {
      try {
        const r = await verifyPayment(ref)
        await refresh()
        if (!off) setSt(r && r.status === 'success' ? 'ok' : 'failed')
        if (!off && r && r.status === 'success') setTimeout(() => { if (!off) enter('Opening your paid lab') }, 2200)
      } catch { if (!off) setSt('error') }
    })()
    return () => { off = true }
  }, [ref, refresh])
  const msg = {
    checking: ['Confirming your payment', 'This takes a few seconds. Please do not close this page.'],
    ok: ['Payment received', 'Your plan is active. Taking you to your lab...'],
    failed: ['Payment not completed', 'No money was taken, or the bank declined it. You can try again from the plans section.'],
    error: ['We could not confirm it yet', 'If you were charged, your plan will update shortly. Otherwise try again, or contact us.'],
    none: ['Nothing to confirm', 'This page is only used after a Paystack payment.'],
  }[st]
  return (
    <div className="bill-cb"><div className="box">
      <h1>{msg[0]}</h1><p>{msg[1]}</p>
      {st === 'ok' && <button className="plan-btn" onClick={() => enter('Opening your lab')}><span>Open the lab</span></button>}
      {st !== 'checking' && st !== 'ok' && <Link className="plan-btn" to="/" onClick={() => nav('/')}><span>Back to the home page</span></Link>}
    </div></div>
  )
}
