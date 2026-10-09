import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { BACKEND } from './config.js'
import { supabase } from './supabase.js'
import * as local from './localAuth.js'
import { syncLabUser, readLabUser, AV } from './labBridge.js'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

const friendly = (m = '') => {
  const s = String(m).toLowerCase()
  if (s.includes('invalid login')) return 'Email or password is incorrect.'
  if (s.includes('database error saving') || s.includes('duplicate key') || s.includes('unique')) return 'That username is taken. Try another one.'
  if (s.includes('token') && (s.includes('expired') || s.includes('invalid'))) return 'That code is wrong or has expired. Check the latest email, or send a new code.'
  if (s.includes('already registered') || s.includes('already been registered')) return 'An account with this email already exists. Log in instead.'
  if (s.includes('rate limit') || s.includes('too many')) return 'Too many attempts. Please wait a moment and try again.'
  if (s.includes('different from the old')) return 'Your new password must be different from the old one.'
  if (s.includes('weak') || s.includes('pwned') || s.includes('easy to guess')) return 'That password is too easy to guess. Try a longer, less common one.'
  if (s.includes('session') || s.includes('not authenticated') || s.includes('jwt')) return 'Your reset link has expired. Request a new one and try again.'
  if (s.includes('password')) return 'Use at least 8 characters for your password.'
  if (s.includes('email not confirmed')) return 'Confirm your email first. Check your inbox for the link.'
  return 'Something went wrong. Please try again.'
}

const withAv = (u) => {
  try {
    let v = u
    const a = localStorage.getItem('kavatar:' + u.email); if (a && AV.test(a)) v = { ...v, avatar: a }
    const p = JSON.parse(localStorage.getItem('kprofile:' + u.email) || 'null'); if (p && typeof p === 'object') v = { ...v, name: String(p.name || v.name).slice(0, 60), location: String(p.location || '').slice(0, 60), bio: String(p.bio || '').slice(0, 200), gender: String(p.gender || '').slice(0, 12) }
    return v
  } catch { return u }
}

async function loadProfile(session) {
  const u = session.user
  // Learners whose paid period has ended go back to Free (a no-op for everyone else). Fails quietly if the SQL step has not been run.
  try { await supabase.rpc('expire_plans') } catch { /* ignore */ }
  const { data, error } = await supabase.from('profiles').select('username, full_name, plan, created_at, avatar, suspended, is_admin, location, bio, gender').eq('id', u.id).maybeSingle()
  // Offline or the server did not answer: keep the profile already on this device instead of guessing a name from the email.
  if (error || (!data && typeof navigator !== 'undefined' && navigator.onLine === false)) {
    const c = readLabUser()
    if (c && c.email && c.email === (u.email || '') && !c.guest) return { ...c, id: u.id, isAdmin: false }
    throw new Error('offline')
  }
  if (data?.suspended) { await supabase.auth.signOut(); throw new Error('This account has been suspended. Contact support if you think this is a mistake.') }
  return {
    guest: false, id: u.id, isAdmin: !!data?.is_admin, location: data?.location || '', bio: data?.bio || '', gender: data?.gender || '', email: u.email || '',
    name: data?.full_name || u.user_metadata?.full_name || '',
    user: data?.username || u.user_metadata?.username || (u.email || 'learner').split('@')[0],
    avatar: AV.test(data?.avatar || '') ? data.avatar : '', plan: data?.plan || 'free', since: new Date(data?.created_at || u.created_at || Date.now()).getTime(),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (BACKEND === 'local' ? readLabUser() : null))
  const [ready, setReady] = useState(BACKEND === 'local')

  // Do not wipe the saved lab user while the first session check is still running (needed so the profile survives being offline).
  useEffect(() => { if (ready) syncLabUser(user) }, [user, ready])

  useEffect(() => {
    if (BACKEND !== 'supabase') return
    let off = false
    const apply = async (session) => {
      if (session) { try { const p = await loadProfile(session); if (!off) setUser(p) } catch (e) { if (!off && !/offline/.test(String(e?.message))) setUser(null) } }
      else if (!off) setUser(null)
      if (!off) setReady(true)
    }
    supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { setTimeout(() => apply(session), 0) })
    return () => { off = true; sub.subscription.unsubscribe() }
  }, [])

  // "Who is online": a light heartbeat once a minute while a signed-in person has the site open and visible.
  useEffect(() => {
    if (BACKEND !== 'supabase' || !user || user.guest) return
    const ping = () => { if (!document.hidden) supabase.rpc('touch_seen').then(() => {}, () => {}) }
    ping()
    const t = setInterval(ping, 60000)
    document.addEventListener('visibilitychange', ping)
    // Every 5 minutes: end expired plans and pick up a plan change (for example back to Free) without a reload.
    const pl = setInterval(async () => {
      if (document.hidden) return
      try {
        await supabase.rpc('expire_plans')
        const { data } = await supabase.from('profiles').select('plan, suspended').eq('id', user.id).maybeSingle()
        if (data?.suspended) { await supabase.auth.signOut(); setUser(null); return }
        if (data?.plan) setUser((cur) => (cur && cur.id === user.id && cur.plan !== data.plan ? { ...cur, plan: data.plan } : cur))
      } catch { /* ignore */ }
    }, 300000)
    return () => { clearInterval(t); clearInterval(pl); document.removeEventListener('visibilitychange', ping) }
  }, [user?.id, user?.guest])


  const signUp = useCallback(async ({ name, user: username, email, password, plan, bp, ref }) => {
    if (BACKEND === 'local') { const r = await local.signUp({ name, user: username, email, password, plan }); const lu = withAv(r.user); setUser(lu); return { user: lu } }
    const { data: free, error: e1 } = await supabase.rpc('username_available', { u: username })
    if (e1) throw new Error('Something went wrong. Please try again.')
    if (!free) throw new Error('That username is taken. Try another one.')
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username, full_name: name, plan_intent: plan, ref: String(ref || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) }, emailRedirectTo: window.location.origin + `/auth?verified=1&plan=${encodeURIComponent(plan || 'free')}&bp=${bp === 'y' ? 'y' : 'm'}` } })
    if (error) throw new Error(friendly(error.message))
    if (!data.session) return { needsConfirm: true }
    return { user: await loadProfile(data.session) }
  }, [])

  // Live username check for the sign-up form. true = free, false = taken, null = could not check.
  const checkUsername = useCallback(async (u) => {
    if (BACKEND === 'local') return !local.usernameTaken(u)
    const { data, error } = await supabase.rpc('username_available', { u })
    return error ? null : !!data
  }, [])

  // Email verification by 6-digit code (the same email also carries a confirmation link).
  const verifyCode = useCallback(async ({ email, code }) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: String(code).trim(), type: 'signup' })
    if (error) throw new Error(friendly(error.message))
    if (!data.session) throw new Error('Could not sign you in. Try logging in.')
    const u = await loadProfile(data.session); setUser(u); return { user: u }
  }, [])
  const resendCode = useCallback(async (email) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw new Error(friendly(error.message))
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    if (BACKEND === 'local') { const r = await local.signIn({ email, password }); const lu = withAv(r.user); setUser(lu); return { user: lu } }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(friendly(error.message))
    return { user: await loadProfile(data.session) }
  }, [])

  // "Continue with Google". Supabase sends the person to Google, Google sends them back here, and the session starts.
  // plan is set when they are creating an account (the Auth page then carries on to payment for a paid plan).
  const signInWithGoogle = useCallback(async ({ plan, bp, next } = {}) => {
    if (BACKEND !== 'supabase') throw new Error('Google sign-in needs the server. It works once Supabase is connected.')
    const back = plan
      ? `/auth?verified=1&plan=${encodeURIComponent(plan)}&bp=${bp === 'y' ? 'y' : 'm'}`
      : `/auth?google=1${next === '/admin' ? '&next=%2Fadmin' : ''}`
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + back, queryParams: { prompt: 'select_account' } } })
    if (error) throw new Error('Could not start Google sign-in. Please try again.')
  }, [])

  const signOut = useCallback(async () => {
    if (BACKEND === 'supabase') await supabase.auth.signOut()
    setUser(null)
  }, [])

  // Profile photo: a small JPEG data URL made by the lab. Saved on the account (Supabase) or in this browser (demo).
  const setAvatar = useCallback(async (data) => {
    if (!AV.test(data || '')) return
    setUser((u) => (u && !u.guest ? { ...u, avatar: data } : u))
    if (BACKEND === 'supabase') {
      const { data: s } = await supabase.auth.getSession()
      if (s.session) await supabase.from('profiles').update({ avatar: data }).eq('id', s.session.user.id)
    } else {
      try { const u = readLabUser(); if (u && u.email) localStorage.setItem('kavatar:' + u.email, data) } catch { /* ignore */ }
    }
  }, [])

  // Edit profile: full name, location and bio. Supabase: saved on the profile row. Demo: kept in this browser (kuser + kprofile:<email>).
  const saveProfile = useCallback(async (p) => {
    const name = String(p.name || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 60)
    const location = String(p.location || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 60)
    const gender = ['male', 'female', 'other', 'prefer_not'].includes(p.gender) ? p.gender : ''
    const bio = String(p.bio || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 200)
    if (!name) return
    setUser((u) => (u && !u.guest ? { ...u, name, location, bio, gender } : u))
    if (BACKEND === 'supabase') {
      const { data: s } = await supabase.auth.getSession()
      if (s.session) await supabase.from('profiles').update({ full_name: name, location, bio, gender }).eq('id', s.session.user.id)
    } else {
      try { const u = readLabUser(); if (u && u.email) localStorage.setItem('kprofile:' + u.email, JSON.stringify({ name, location, bio, gender })) } catch { /* ignore */ }
    }
  }, [])

  // Forgot-password step 2: the person came back from the reset link (Supabase signed them in with a short recovery session).
  const resetPassword = useCallback(async (password) => {
    if (BACKEND !== 'supabase') throw new Error('Password reset needs the server. It works once Supabase is connected.')
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw new Error('Use 8 to 128 characters for your password.')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(friendly(error.message))
    await supabase.auth.signOut() // make them log in with the new password
  }, [])

  // Change password while signed in (lab > Settings > Security). Checks the current password first, then updates it in
  // Supabase Auth and signs every other device out.
  const changePassword = useCallback(async (current, next) => {
    if (BACKEND !== 'supabase') throw new Error('Changing your password needs the online account. It works once Supabase is connected.')
    if (!user || user.guest || !user.email) throw new Error('Log in first.')
    if (typeof next !== 'string' || next.length < 8 || next.length > 128) throw new Error('Use 8 to 128 characters for your new password.')
    if (!current) throw new Error('Enter your current password.')
    if (next === current) throw new Error('Your new password must be different from the old one.')
    const { error: e1 } = await supabase.auth.signInWithPassword({ email: user.email, password: current })
    if (e1) throw new Error(/invalid login/i.test(e1.message) ? 'Your current password is not correct.' : friendly(e1.message))
    const { error } = await supabase.auth.updateUser({ password: next })
    if (error) throw new Error(friendly(error.message))
    try { await supabase.auth.signOut({ scope: 'others' }) } catch { /* the password is already changed */ }
  }, [user])

  // Delete the signed-in account. Supabase: a server function removes the auth user, which cascades to the profile,
  // payments and subscription rows (so it also disappears from the admin panel). Demo mode: removes it from this browser.
  const deleteAccount = useCallback(async () => {
    const email = (user && user.email) || ''
    if (BACKEND === 'supabase') {
      const { data, error } = await supabase.functions.invoke('delete-account', { body: { confirm: 'DELETE' } })
      if (error || data?.error) throw new Error(data?.error || 'Could not delete your account. Please try again.')
      try { await supabase.auth.signOut({ scope: 'local' }) } catch { /* the session is already gone */ }
    } else local.deleteAccount(email)
    try {
      ;['kuser', 'kstate', 'kdone', 'kdaily', 'kexam', 'kcert', 'kctf', 'kpath', 'kcontact', 'kowner'].forEach((k) => localStorage.removeItem(k))
      if (user && user.id) localStorage.removeItem('kprog:' + user.id)
      if (email) localStorage.removeItem('kavatar:' + email)
    } catch { /* ignore */ }
    setUser(null)
  }, [user])

  const refresh = useCallback(async () => {
    if (BACKEND !== 'supabase') return
    const { data } = await supabase.auth.getSession()
    if (data.session) { try { setUser(await loadProfile(data.session)) } catch (e) { if (!/offline/.test(String(e?.message))) throw e } }
  }, [])

  const value = useMemo(() => ({ user, ready, signUp, signIn, signInWithGoogle, signOut, refresh, setAvatar, saveProfile, checkUsername, verifyCode, resendCode, deleteAccount, resetPassword, changePassword }), [user, ready, signUp, signIn, signInWithGoogle, signOut, refresh, setAvatar, saveProfile, checkUsername, verifyCode, resendCode, deleteAccount, resetPassword, changePassword])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
