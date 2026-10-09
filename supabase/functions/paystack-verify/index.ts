// Called by the browser after Paystack redirects back. Re-checks the transaction with Paystack, then applies it.
import { admin, applySuccess, cors, json, paystack, userFrom } from '../_shared/lib.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const user = await userFrom(req)
  if (!user) return json({ error: 'sign in first' }, 401)
  const { reference } = await req.json().catch(() => ({}))
  if (typeof reference !== 'string' || !/^sw_[a-f0-9]{32}$/.test(reference)) return json({ error: 'bad reference' }, 400)

  // Only the person who started the payment can verify it.
  const { data: pay } = await admin().from('payments').select('user_id').eq('reference', reference).maybeSingle()
  if (!pay || pay.user_id !== user.id) return json({ error: 'not found' }, 404)

  const r = await paystack(`/transaction/verify/${reference}`)
  const out = await r.json().catch(() => null)
  if (!r.ok || !out?.status) return json({ status: 'error' }, 502)
  if (out.data.status === 'success') {
    const res = await applySuccess(out.data)
    return json({ status: res.ok ? 'success' : 'failed' })
  }
  if (['failed', 'abandoned', 'reversed'].includes(out.data.status)) await admin().from('payments').update({ status: 'failed' }).eq('reference', reference).eq('status', 'pending')
  return json({ status: out.data.status === 'abandoned' ? 'failed' : out.data.status })
})
