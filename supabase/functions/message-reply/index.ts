// Sends an admin's reply to a contact-form message by email and records it.
// The caller must be signed in AND be an admin (checked here, on the server, every time).
// Email goes out through the Mailjet account you already use for SMTP, using its HTTPS API (same API key + secret key).
// Secrets to set (see the instructions in chat): MAILJET_API_KEY, MAILJET_SECRET_KEY, MAIL_FROM, optional MAIL_FROM_NAME, MAIL_REPLY_TO.
import { admin, cors, json, userFrom } from '../_shared/lib.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const caller = await userFrom(req)
  if (!caller) return json({ error: 'sign in first' }, 401)
  const db = admin()
  const { data: me } = await db.from('profiles').select('is_admin, username, email').eq('id', caller.id).maybeSingle()
  if (!me?.is_admin) return json({ error: 'not allowed' }, 403)

  const b = await req.json().catch(() => ({}))
  const id = Number(b.id)
  const text = String(b.body ?? '').trim().slice(0, 4000)
  if (!Number.isInteger(id) || id < 1) return json({ error: 'bad message' }, 400)
  if (text.length < 2) return json({ error: 'Write a reply first.' }, 400)

  const { data: msg } = await db.from('contact_messages').select('id, name, email, message').eq('id', id).maybeSingle()
  if (!msg) return json({ error: 'message not found' }, 404)

  const key = Deno.env.get('MAILJET_API_KEY'), secret = Deno.env.get('MAILJET_SECRET_KEY'), from = Deno.env.get('MAIL_FROM')
  if (!key || !secret || !from) return json({ error: 'Email is not set up yet. Add MAILJET_API_KEY, MAILJET_SECRET_KEY and MAIL_FROM as Supabase secrets, then try again.' }, 500)

  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
  const first = String(msg.name || '').split(/\s+/)[0] || 'there'
  const plain = `Hi ${first},\n\n${text}\n\n— Shellwise support\n\n-----\nYour message:\n${msg.message}`
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">
<p>Hi ${esc(first)},</p><p style="white-space:pre-wrap">${esc(text)}</p><p>— Shellwise support</p>
<hr style="border:none;border-top:1px solid #ddd;margin:20px 0"><p style="color:#666;font-size:13px">Your message:</p>
<p style="color:#666;font-size:13px;white-space:pre-wrap">${esc(String(msg.message))}</p></div>`

  const replyTo = Deno.env.get('MAIL_REPLY_TO')
  let delivered = false, why = ''
  try {
    const r = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(`${key}:${secret}`) },
      body: JSON.stringify({ Messages: [{
        From: { Email: from, Name: Deno.env.get('MAIL_FROM_NAME') || 'Shellwise support' },
        To: [{ Email: msg.email, Name: msg.name }],
        ...(replyTo ? { ReplyTo: { Email: replyTo } } : {}),
        Subject: 'Re: your message to Shellwise',
        TextPart: plain, HTMLPart: html,
      }] }),
    })
    const out = await r.json().catch(() => ({}))
    delivered = r.ok && out?.Messages?.[0]?.Status === 'success'
    if (!delivered) why = out?.Messages?.[0]?.Errors?.[0]?.ErrorMessage || out?.ErrorMessage || `mail provider said ${r.status}`
  } catch (e) { why = 'could not reach the mail provider' }
  if (!delivered) return json({ error: 'The email was not sent: ' + why }, 502)

  await db.from('contact_replies').insert({ message_id: id, body: text, sent_by: caller.id, sent_by_name: me.username || me.email || 'admin', to_email: msg.email })
  await db.from('contact_messages').update({ status: 'replied', replied_at: new Date().toISOString() }).eq('id', id)
  await db.from('audit_log').insert({ actor_id: caller.id, actor_name: me.username || me.email || 'admin', action: 'message_replied', target_id: null, target_name: msg.email, detail: 'Replied to contact message #' + id })
  return json({ ok: true })
})
