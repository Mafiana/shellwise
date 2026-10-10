// Starts a Paystack checkout for the signed-in user. The price comes from the `plans` table, never from the browser.
// A discount code (or the invited-friend discount) is checked and applied here, on the server.
import { admin, cors, json, paystack, REF_PERCENT, userFrom } from '../_shared/lib.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  const user = await userFrom(req)
  if (!user || !user.email) return json({ error: 'sign in first' }, 401)

  const { plan, interval, coupon } = await req.json().catch(() => ({}))
  if (!['learner', 'pro'].includes(plan) || !['monthly', 'yearly'].includes(interval)) return json({ error: 'bad plan' }, 400)

  const db = admin()
  const { data: p } = await db.from('plans').select('*').eq('id', plan).single()
  if (!p) return json({ error: 'bad plan' }, 400)
  const amount = interval === 'yearly' ? p.yearly_kobo : p.monthly_kobo
  const code = interval === 'yearly' ? p.paystack_yearly_code : p.paystack_monthly_code
  if (!amount) return json({ error: 'plan has no price' }, 400)

  // 1) a code the learner typed
  let pct = 0
  let couponCode: string | null = null
  const typed = typeof coupon === 'string' ? coupon.trim().toUpperCase().slice(0, 24) : ''
  if (typed) {
    const { data: c } = await db.from('coupons').select('*').eq('code', typed).maybeSingle()
    const ok = c && c.active && (!c.expires_at || new Date(c.expires_at) > new Date()) && (c.max_uses == null || c.uses < c.max_uses) && (!c.owner_id || c.owner_id === user.id)
    if (!ok) return json({ error: 'That discount code is not valid, has expired or has run out.' }, 400)
    const { count } = await db.from('payments').select('reference', { count: 'exact', head: true }).eq('user_id', user.id).eq('coupon', typed).eq('status', 'success')
    if (count) return json({ error: 'You have already used that discount code.' }, 400)
    pct = c.percent
    couponCode = typed
  }
  // 2) invited by a friend: a discount on the first paid plan (the better of the two applies)
  const { data: me } = await db.from('profiles').select('referred_by').eq('id', user.id).maybeSingle()
  if (me?.referred_by && REF_PERCENT > pct) {
    const { count: paidBefore } = await db.from('payments').select('reference', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'success')
    if (!paidBefore) { pct = REF_PERCENT; couponCode = 'REFERRAL' }
  }
  const listKobo = amount
  const payKobo = pct ? Math.max(100, Math.round((listKobo * (100 - pct)) / 100)) : listKobo

  const reference = `sw_${crypto.randomUUID().replace(/-/g, '')}`
  const { error: e1 } = await db.from('payments').insert({ user_id: user.id, reference, plan, interval, amount_kobo: payKobo, coupon: couponCode, discount_kobo: listKobo - payKobo })
  if (e1) return json({ error: 'could not start payment' }, 500)

  const site = Deno.env.get('SITE_URL') ?? new URL(req.url).origin
  const body: Record<string, unknown> = {
    email: user.email, amount: payKobo, currency: 'NGN', reference,
    callback_url: `${site}/billing/callback`,
    metadata: { user_id: user.id, plan, interval, coupon: couponCode },
  }
  // Optional: PAYSTACK_CHANNELS=card limits checkout to card only (handy in test mode, where bank/transfer screens can hang).
  const ch = (Deno.env.get('PAYSTACK_CHANNELS') ?? '').split(',').map((x) => x.trim()).filter((x) => ['card', 'bank', 'ussd', 'bank_transfer', 'qr', 'mobile_money', 'apple_pay'].includes(x))
  if (ch.length) body.channels = ch
  // A discounted payment is a one-time charge for that period (a Paystack plan code would override the discounted amount).
  if (code && !couponCode) body.plan = code // subscription: Paystack renews it automatically
  const r = await paystack('/transaction/initialize', { method: 'POST', body: JSON.stringify(body) })
  const out = await r.json().catch(() => null)
  if (!r.ok || !out?.status) {
    console.error('paystack init failed', r.status, JSON.stringify(out))
    const why = String(out?.message ?? (Deno.env.get('PAYSTACK_SECRET_KEY') ? `HTTP ${r.status}` : 'PAYSTACK_SECRET_KEY is not set'))
    return json({ error: `payment provider error: ${why}` }, 502)
  }
  return json({ authorization_url: out.data.authorization_url, reference })
})
