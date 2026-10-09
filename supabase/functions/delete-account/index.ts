// Deletes the signed-in user's account. The caller can only delete THEMSELVES (the id comes from the verified token).
// Removing the auth user cascades to profiles, payments and subscriptions (see schema.sql), so the person also disappears
// from the admin panel. Contact messages sent with the same email are removed too.
import { admin, cors, json, userFrom } from '../_shared/lib.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const user = await userFrom(req)
  if (!user) return json({ error: 'sign in first' }, 401)
  const body = await req.json().catch(() => ({}))
  if (body.confirm !== 'DELETE') return json({ error: 'confirmation missing' }, 400)
  const db = admin()
  const { data: me } = await db.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (me?.is_admin) return json({ error: 'Admin accounts cannot be deleted here. Remove the admin flag first.' }, 400)
  if (user.email) await db.from('contact_messages').delete().eq('email', user.email.toLowerCase())
  const { error } = await db.auth.admin.deleteUser(user.id)
  if (error) return json({ error: 'Could not delete the account. Please try again.' }, 500)
  return json({ ok: true })
})
