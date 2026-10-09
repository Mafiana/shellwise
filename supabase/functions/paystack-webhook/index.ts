// Paystack calls this URL when something happens (payment, renewal, cancellation). Deploy with --no-verify-jwt.
// Every request is checked against Paystack's signature before anything is trusted.
import { admin, applySuccess, paystack } from '../_shared/lib.ts'

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')
const same = (a: string, b: string) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0 }

async function signature(raw: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(Deno.env.get('PAYSTACK_SECRET_KEY')!), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)))
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method', { status: 405 })
  const raw = await req.text()
  const sig = req.headers.get('x-paystack-signature') ?? ''
  if (!same(await signature(raw), sig)) return new Response('bad signature', { status: 401 })

  let ev: any
  try { ev = JSON.parse(raw) } catch { return new Response('bad json', { status: 400 }) }
  const db = admin()
  const d = ev.data ?? {}

  if (ev.event === 'charge.success' && d.reference) {
    // Do not trust the body alone: ask Paystack again.
    const r = await paystack(`/transaction/verify/${encodeURIComponent(d.reference)}`)
    const out = await r.json().catch(() => null)
    if (r.ok && out?.status) await applySuccess(out.data)
  } else if (['subscription.disable', 'subscription.not_renew', 'invoice.payment_failed'].includes(ev.event)) {
    const email = String(d.customer?.email ?? '').toLowerCase()
    if (email) {
      const now = new Date().toISOString()
      if (ev.event === 'invoice.payment_failed') {
        await db.from('subscriptions').update({ status: 'past_due', updated_at: now }).eq('paystack_email', email)
      } else {
        const { data: sub } = await db.from('subscriptions').update({ status: 'cancelled', updated_at: now }).eq('paystack_email', email).select('user_id').maybeSingle()
        // "disable" means the subscription has ended: drop the user back to Free.
        if (sub && ev.event === 'subscription.disable') await db.from('profiles').update({ plan: 'free' }).eq('id', sub.user_id)
      }
    }
  }
  return new Response('ok', { status: 200 })
})
