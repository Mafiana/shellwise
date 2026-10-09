// Admin actions: change a user's plan, set a temporary password, suspend or restore an account, delete an account.
// The caller must be signed in AND have profiles.is_admin = true. The check happens here on the server every time.
import { admin, cors, json, userFrom } from '../_shared/lib.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const caller = await userFrom(req)
  if (!caller) return json({ error: 'sign in first' }, 401)
  const db = admin()
  const { data: me } = await db.from('profiles').select('is_admin, username, email').eq('id', caller.id).maybeSingle()
  if (!me?.is_admin) return json({ error: 'not allowed' }, 403)

  const body = await req.json().catch(() => ({}))
  const { action, user_id } = body
  if (typeof user_id !== 'string' || !UUID.test(user_id)) return json({ error: 'bad user' }, 400)
  const { data: target } = await db.from('profiles').select('id, is_admin, plan, username, email').eq('id', user_id).maybeSingle()
  if (!target) return json({ error: 'user not found' }, 404)

  // Writes one line to the audit log. Only this function can write there, so the history cannot be edited from the browser.
  const log = (act: string, detail = '') => db.from('audit_log').insert({
    actor_id: caller.id, actor_name: me.username || me.email || 'admin', action: act,
    target_id: user_id, target_name: target.username || target.email || '', detail: detail.slice(0, 200),
  })

  if (action === 'set_plan') {
    if (!['free', 'learner', 'pro'].includes(body.plan)) return json({ error: 'bad plan' }, 400)
    const { error } = await db.from('profiles').update({ plan: body.plan }).eq('id', user_id)
    if (!error && body.plan !== target.plan) await log('plan_changed', `${target.plan} to ${body.plan}`)
    return error ? json({ error: 'could not update' }, 500) : json({ ok: true })
  }
  if (action === 'set_password') {
    const pw = body.password
    if (typeof pw !== 'string' || pw.length < 8 || pw.length > 128) return json({ error: 'Use 8 to 128 characters for the password.' }, 400)
    if (target.is_admin || user_id === caller.id) return json({ error: 'Admins change their own password in the lab (Settings > Security).' }, 400)
    // Only accounts whose email was verified. This can never be used to let an unverified (possibly fake) address in.
    const { data: au, error: ge } = await db.auth.admin.getUserById(user_id)
    if (ge || !au?.user) return json({ error: 'user not found' }, 404)
    if (!au.user.email_confirmed_at) return json({ error: 'This email address was never verified, so the password cannot be set by hand. Ask the learner to verify their email first.' }, 400)
    const { error } = await db.auth.admin.updateUserById(user_id, { password: pw })
    if (error) return json({ error: /weak|pwned|easy|guess/i.test(error.message) ? 'That password is too easy to guess. Try another one.' : 'could not update' }, 400)
    await log('password_reset') // the password itself is never written to the log
    return json({ ok: true })
  }
  if (action === 'set_suspended') {
    if (typeof body.suspended !== 'boolean') return json({ error: 'bad value' }, 400)
    if (target.is_admin || user_id === caller.id) return json({ error: 'admins cannot be suspended' }, 400)
    const { error } = await db.from('profiles').update({ suspended: body.suspended }).eq('id', user_id)
    // Also lock (or unlock) the login itself in Supabase Auth, so a suspended person cannot log in or refresh their session.
    if (!error) await db.auth.admin.updateUserById(user_id, { ban_duration: body.suspended ? '876000h' : 'none' }).catch(() => null)
    if (!error) await log(body.suspended ? 'suspended' : 'restored')
    return error ? json({ error: 'could not update' }, 500) : json({ ok: true })
  }
  if (action === 'delete_user') {
    if (target.is_admin || user_id === caller.id) return json({ error: 'admin accounts cannot be deleted here' }, 400)
    const { data: prof } = await db.from('profiles').select('email').eq('id', user_id).maybeSingle()
    if (prof?.email) await db.from('contact_messages').delete().eq('email', prof.email)
    const { error } = await db.auth.admin.deleteUser(user_id)
    if (!error) await log('deleted', prof?.email ? 'Email ' + prof.email : '')
    return error ? json({ error: 'could not delete the account' }, 500) : json({ ok: true })
  }
  return json({ error: 'unknown action' }, 400)
}

Deno.serve(async (req) => {
  try { return await handle(req) } catch (e) { return json({ error: 'Server error: ' + String((e as Error)?.message ?? e).slice(0, 160) }, 500) }
})
