// Admin only. Asks Paystack about payments that are still "pending" here and applies the ones that really succeeded.
// This is the safety net for a missed webhook or a learner who closed the tab before returning to the site.
import { admin, applySuccess, cors, json, paystack, userFrom } from '../_shared/lib.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const caller = await userFrom(req)
  if (!caller) return json({ error: 'sign in first' }, 401)
  const db = admin()
  const { data: me } = await db.from('profiles').select('is_admin, username, email').eq('id', caller.id).maybeSingle()
  if (!me?.is_admin) return json({ error: 'not allowed' }, 403)

  const body = await req.json().catch(() => ({}))
  let refs: string[] = []
  if (typeof body.reference === 'string') {
    if (!/^sw_[a-f0-9]{32}$/.test(body.reference)) return json({ error: 'bad reference' }, 400)
    refs = [body.reference]
  } else {
    // Everything still pending after 2 minutes (a normal payment finishes well before that).
    const { data } = await db.from('payments').select('reference').eq('status', 'pending').lt('created_at', new Date(Date.now() - 120000).toISOString()).order('created_at', { ascending: false }).limit(40)
    refs = (data ?? []).map((r: any) => r.reference)
  }

  let fixed = 0, failed = 0, still = 0
  const notes: string[] = []
  for (const reference of refs) {
    const { data: pay } = await db.from('payments').select('user_id, status, created_at').eq('reference', reference).maybeSingle()
    if (!pay || pay.status === 'success') continue
    const r = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`)
    const out = await r.json().catch(() => null)
    if (!r.ok || !out?.status) { still++; continue }
    const st = out.data?.status
    if (st === 'success') {
      const res = await applySuccess(out.data)
      if (res.ok) {
        fixed++
        const { data: who } = await db.from('profiles').select('username').eq('id', pay.user_id).maybeSingle()
        await db.from('audit_log').insert({ actor_id: caller.id, actor_name: me.username || me.email || 'admin', action: 'payment_verified', target_id: pay.user_id, target_name: who?.username || '', detail: reference })
      } else { still++; notes.push(`${reference}: ${res.reason}`) }
    } else if (st === 'failed' || st === 'reversed' || (st === 'abandoned' && Date.now() - new Date(pay.created_at).getTime() > 86400000)) {
      await db.from('payments').update({ status: 'failed' }).eq('reference', reference).eq('status', 'pending')
      failed++
    } else still++
  }
  return json({ checked: refs.length, fixed, failed, still, notes })
})
