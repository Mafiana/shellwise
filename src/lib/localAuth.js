// Browser-only demo accounts, used when Supabase is not configured.
// Passwords are never stored in plain text: salted PBKDF2-SHA256 (WebCrypto, 210k iterations, random 16-byte salt).
// This is a UI demo, not real security: anyone can edit their own localStorage. Use Supabase for real accounts.
export const UNAME = /^[a-z][a-z0-9_]{2,19}$/
export const EMAIL_RE = /^[^@\s]{1,64}@[^@\s]+\.[^@\s]+$/
const KA = 'kaccts', PB_IT = 210000, MAXE = 254
const PLAN_IDS = ['free', 'learner', 'pro']

const b2h = (u) => Array.from(u, (b) => b.toString(16).padStart(2, '0')).join('')
const h2b = (h) => new Uint8Array((String(h).match(/../g) || []).map((x) => parseInt(x, 16) || 0))
const same = (x, y) => { x = String(x); y = String(y); let d = x.length ^ y.length; for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0); return d === 0 }
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, n)
async function pbk(pw, salt, it) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits'])
  return b2h(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: it }, k, 256)))
}
function loadAccts() {
  const o = Object.create(null)
  try {
    const r = JSON.parse(localStorage.getItem(KA) || 'null')
    if (r && typeof r === 'object' && !Array.isArray(r))
      Object.keys(r).slice(0, 500).forEach((k) => {
        const a = r[k]
        if (k.length <= MAXE && EMAIL_RE.test(k) && a && typeof a === 'object' && /^[0-9a-f]{1,128}$/i.test(a.salt || '') && /^[0-9a-f]{1,128}$/i.test(a.h || ''))
          o[k] = { name: clean(a.name, 60), user: UNAME.test(String(a.user || '')) ? String(a.user) : '', since: Number.isFinite(+a.since) ? +a.since : 0, salt: a.salt, h: a.h, plan: PLAN_IDS.includes(a.plan) ? a.plan : 'free', it: Number.isInteger(a.it) && a.it >= 100000 && a.it <= 2000000 ? a.it : PB_IT }
      })
  } catch { /* ignore corrupt storage */ }
  return o
}
const save = (a) => { try { localStorage.setItem(KA, JSON.stringify(a)) } catch { /* ignore */ } }
const toUser = (email, a) => ({ guest: false, id: email, name: a.name, user: a.user || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^[^a-z]+/, 'u').slice(0, 20), email, plan: a.plan, since: a.since || Date.now() })

// brute-force throttle: 5 failures -> 30 s lock, remembered for the tab session
const THR = {
  get() { try { const o = JSON.parse(sessionStorage.getItem('kthr') || '{}'); return { n: Math.max(0, Math.min(99, +o.n || 0)), until: Math.max(0, +o.until || 0) } } catch { return { n: 0, until: 0 } } },
  set(o) { try { sessionStorage.setItem('kthr', JSON.stringify(o)) } catch { /* ignore */ } },
}
export const lockLeft = () => Math.max(0, Math.ceil((THR.get().until - Date.now()) / 1000))

export async function signUp({ name, user, email, password, plan }) {
  email = clean(email, MAXE).toLowerCase(); user = clean(user, 20).toLowerCase()
  if (!window.crypto?.subtle) throw new Error('Your browser needs a secure (HTTPS) connection to sign in.')
  const accts = loadAccts()
  if (accts[email]) throw new Error('An account with this email already exists. Log in instead.')
  if (Object.keys(accts).some((k) => accts[k].user === user)) throw new Error('That username is taken. Try another one.')
  const salt = crypto.getRandomValues(new Uint8Array(16)), since = Date.now()
  accts[email] = { name: clean(name, 60), user, since, salt: b2h(salt), h: await pbk(password, salt, PB_IT), it: PB_IT, plan: PLAN_IDS.includes(plan) ? plan : 'free' }
  save(accts)
  return { user: toUser(email, accts[email]) }
}
export async function signIn({ email, password }) {
  email = clean(email, MAXE).toLowerCase()
  if (lockLeft()) throw new Error(`Too many attempts. Try again in ${lockLeft()} seconds.`)
  if (!window.crypto?.subtle) throw new Error('Your browser needs a secure (HTTPS) connection to sign in.')
  const accts = loadAccts(), a = accts[email]
  let ok = false
  if (a) ok = same(await pbk(password, h2b(a.salt), a.it), a.h)
  else await pbk(password, new Uint8Array(16), PB_IT) // same cost for unknown emails
  if (!ok) {
    const t = THR.get(), n = t.n + 1
    if (n >= 5) { THR.set({ n: 0, until: Date.now() + 30000 }); throw new Error('Too many attempts. Try again in 30 seconds.') }
    THR.set({ n, until: 0 })
    throw new Error('Email or password is incorrect.')
  }
  THR.set({ n: 0, until: 0 })
  return { user: toUser(email, a) }
}
export const usernameTaken = (u) => { const a = loadAccts(); return Object.keys(a).some((k) => a[k].user === u) }

// Demo mode: remove an account from this browser.
export function deleteAccount(email) {
  const a = loadAccts(); const k = String(email || '').toLowerCase()
  if (k in a) { delete a[k]; save(a) }
}
