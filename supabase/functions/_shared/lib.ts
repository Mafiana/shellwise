import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Any website may call these functions from the browser. That is safe here: every call must carry a signed-in user's token
// (checked on the server), and no cookies are used. Locking this to one address broke the admin buttons whenever the site was
// opened from a different address (for example localhost while testing).
export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// Service-role client: bypasses RLS. Only ever used inside these functions, never in the browser.
export const admin = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

// Percent off for an invited friend's first paid plan, and for the inviter's reward code. Keep in step with my_referral() in upgrade-growth.sql.
export const REF_PERCENT = 15

export const PAYSTACK = 'https://api.paystack.co'
export const paystack = (path: string, init: RequestInit = {}) =>
  fetch(PAYSTACK + path, {
    ...init,
    headers: { Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })

// Finds the signed-in user from the Authorization header.
export async function userFrom(req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await admin().auth.getUser(token)
  return error ? null : data.user
}

// Marks a verified Paystack transaction as paid and upgrades the plan. Safe to call twice (idempotent).
export async function applySuccess(tx: any) {
  const db = admin()
  const ref = String(tx.reference)
  const { data: pay } = await db.from('payments').select('*').eq('reference', ref).maybeSingle()
  if (!pay) return { ok: false, reason: 'unknown reference' }
  if (tx.status !== 'success') return { ok: false, reason: 'not successful' }
  if (Number(tx.amount) !== Number(pay.amount_kobo) || String(tx.currency ?? 'NGN') !== 'NGN') return { ok: false, reason: 'amount mismatch' }
  // Flip pending -> success exactly once (the webhook and the browser can both arrive); only the first one counts coupons and rewards.
  const { data: flipped } = await db.from('payments').update({ status: 'success', paid_at: new Date().toISOString(), channel: String(tx.channel ?? '').slice(0, 30) || null }).eq('reference', ref).neq('status', 'success').select('reference')
  if (flipped && flipped.length && pay.coupon) {
    if (pay.coupon === 'REFERRAL') {
      // The invited friend paid: give whoever invited them a one-time reward code.
      const { data: me } = await db.from('profiles').select('referred_by').eq('id', pay.user_id).maybeSingle()
      if (me?.referred_by) {
        const code = 'FRIEND-' + crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
        await db.from('coupons').insert({ code, percent: REF_PERCENT, max_uses: 1, owner_id: me.referred_by, note: 'Thanks for inviting a friend' })
      }
    } else {
      await db.rpc('bump_coupon', { c: pay.coupon })
    }
  }
  const days = pay.interval === 'yearly' ? 366 : 31
  await db.from('profiles').update({ plan: pay.plan }).eq('id', pay.user_id)
  await db.from('subscriptions').upsert({
    user_id: pay.user_id, plan: pay.plan, interval: pay.interval, status: 'active',
    paystack_code: tx.plan?.plan_code ?? null, paystack_email: String(tx.customer?.email ?? '').toLowerCase() || null,
    current_period_end: new Date(Date.now() + days * 86400000).toISOString(), updated_at: new Date().toISOString(),
  })
  return { ok: true }
}
