import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'
import { claimProgress, pullProgress, pushProgress } from '../lib/progress.js'
import { BACKEND } from '../lib/config.js'
import { supabase } from '../lib/supabase.js'
import { setCoupon } from '../lib/pay.js'

// The lab (public/lab) runs unchanged inside an iframe on the same origin.
// It talks back with postMessage: { shellwise: 'home' | 'signup' | 'login' | 'signout' }.
export default function Lab() {
  const nav = useNavigate()
  const { user, ready, signOut, setAvatar, saveProfile, deleteAccount, changePassword } = useAuth()

  const [synced, setSynced] = useState(false)
  const uref = useRef(user)
  uref.current = user

  // The lab needs an account: anyone who is not signed in is sent to create one.
  useEffect(() => { if (ready && (!user || user.guest)) nav('/auth?mode=signup', { replace: true }) }, [ready, user, nav])

  // Paid plans: fetch saved progress before the lab opens, then save changes every 15 s and when leaving.
  useEffect(() => {
    if (!ready || !user) return
    let off = false
    claimProgress(user)
    pullProgress(user).catch(() => {}).finally(() => { if (!off) setSynced(true) })
    const t = setInterval(() => pushProgress(uref.current).catch(() => {}), 15000)
    const bye = () => pushProgress(uref.current).catch(() => {})
    window.addEventListener('pagehide', bye)
    return () => { off = true; clearInterval(t); window.removeEventListener('pagehide', bye); bye() }
  }, [ready, user?.id, user?.plan]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const on = (e) => {
      if (e.origin !== window.location.origin) return
      const frame = document.getElementById('lab-frame')
      if (!frame || e.source !== frame.contentWindow) return
      const a = e.data && e.data.shellwise
      if (a === 'home') nav('/')
      else if (a === 'signup') nav('/auth?mode=signup')
      else if (a === 'login') nav('/auth?mode=login')
      else if (a === 'plans') nav('/', { state: { sc: 'plans' } })
      else if (a === 'avatar') setAvatar(e.data.data)
      else if (a === 'profile') saveProfile(e.data.data || {})
      else if (a === 'signout') signOut().then(() => nav('/'))
      else if (a === 'password') {
        const d = e.data.data || {}
        const reply = (r) => { try { frame.contentWindow.postMessage({ shellwiseReply: 'password', ...r }, window.location.origin) } catch { /* frame gone */ } }
        changePassword(String(d.current || '').slice(0, 128), String(d.next || '').slice(0, 128)).then(() => reply({ ok: true }), (x) => reply({ ok: false, message: x.message || 'Could not change your password.' }))
      } else if (a === 'referral') {
        const reply = (data) => { try { frame.contentWindow.postMessage({ shellwiseReply: 'referral', data }, window.location.origin) } catch { /* frame gone */ } }
        if (BACKEND !== 'supabase') reply(null)
        else supabase.rpc('my_referral').then(({ data, error }) => reply(error ? null : data), () => reply(null))
      } else if (a === 'inbox' || a === 'inboxread' || a === 'rewards' || a === 'redeem') {
        const reply = (name, data) => { try { frame.contentWindow.postMessage({ shellwiseReply: name, data }, window.location.origin) } catch { /* frame gone */ } }
        const me = uref.current
        const signed = BACKEND === 'supabase' && me && !me.guest
        if (a === 'inbox') {
          // Live announcements (anyone) and this learner's private messages (signed in only).
          if (BACKEND !== 'supabase') return reply('inbox', null)
          Promise.all([
            supabase.from('announcements').select('id,message,tone,snooze_hours,created_at').eq('active', true).or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).order('created_at', { ascending: false }).limit(20),
            signed ? supabase.from('user_messages').select('id,subject,body,read,created_at').eq('user_id', me.id).order('created_at', { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
          ]).then(([an, ms]) => reply('inbox', an.error ? null : { ann: an.data || [], msgs: ms.data || [] }), () => reply('inbox', null))
        } else if (a === 'inboxread') {
          const ids = (Array.isArray(e.data.data) ? e.data.data : []).map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 50)
          if (signed && ids.length) supabase.from('user_messages').update({ read: true }).in('id', ids).eq('user_id', me.id).then(() => {}, () => {})
        } else if (a === 'rewards') {
          if (!signed) reply('rewards', [])
          else supabase.rpc('my_rewards').then(({ data, error }) => reply('rewards', error || !Array.isArray(data) ? [] : data), () => reply('rewards', []))
        } else {
          // Redeem: remember the code, then open the Plans section. Checkout applies it on the server.
          const code = String((e.data.data && e.data.data.code) || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24)
          if (code.length >= 3) { setCoupon(code); nav('/', { state: { sc: 'plans' } }) }
        }
      } else if (a === 'delete') {
        const reply = (m) => { try { frame.contentWindow.postMessage({ shellwiseReply: 'delete-failed', message: m }, window.location.origin) } catch { /* frame gone */ } }
        deleteAccount().then(() => nav('/', { state: { deleted: true } }), (x) => reply(x.message || 'Could not delete your account.'))
      }
    }
    window.addEventListener('message', on)
    return () => window.removeEventListener('message', on)
  }, [nav, signOut, setAvatar, saveProfile, deleteAccount, changePassword])

  if (!ready || !user || user.guest || !synced) return <div className="lab-wait" role="status">Loading</div>
  return <iframe id="lab-frame" className="lab-frame" title="Shellwise lab" src="/lab/index.html?app" onLoad={() => setTimeout(() => window.dispatchEvent(new Event('sw-lab-ready')), 250)} />
}
