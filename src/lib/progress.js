import { supabase } from './supabase.js'

// Lab progress lives in localStorage ('kstate' = scores/xp, 'kdone' = finished modules).
// Paid plans copy it to profiles.progress so it follows the learner to another device.
export const SYNC_PLANS = ['learner', 'pro', 'team']
export const canSync = (u) => !!(u && !u.guest && u.id && supabase && SYNC_PLANS.includes(u.plan))

const KEYS = ['kstate', 'kdone', 'kdaily', 'kexam', 'kcert', 'kctf', 'kpath']
const MAX = 200000
const readLocal = () => {
  const o = {}
  try { for (const k of KEYS) { const r = localStorage.getItem(k); if (r && r.length < MAX) o[k] = JSON.parse(r) } } catch { /* ignore */ }
  return o
}
// "How far along" score, used to pick the better copy when both exist.
const score = (o) => (Array.isArray(o?.kdone) ? o.kdone.filter(Boolean).length * 1000 : 0) + JSON.stringify(o?.kstate ?? '').length
let last = ''

// Lab progress belongs to ONE account. localStorage is per browser, so without this a new account on the same browser
// would open with the previous person's XP, level and badges. 'kowner' remembers whose data is in the lab keys; when a
// different account (or a guest) opens the lab, the old data is stashed under 'kprog:<id>' and this account's own copy
// (or an empty start) is put in its place. Call before the lab loads.
const OWNER = 'kowner'
export function claimProgress(u) {
  try {
    const who = u && !u.guest && u.id ? String(u.id) : 'guest'
    const was = localStorage.getItem(OWNER)
    if (was === who) return
    const stash = (id) => { const snap = {}; for (const k of KEYS) { const r = localStorage.getItem(k); if (r != null) snap[k] = r }; localStorage.setItem('kprog:' + id, JSON.stringify(snap)) }
    if (was) stash(was)
    else if (who === 'guest' || Date.now() - (+u.since || 0) >= 3600000) { localStorage.setItem(OWNER, who); return } // unknown owner: keep what is there
    else stash('legacy') // unknown owner + a brand-new account: the new account starts clean
    for (const k of KEYS) localStorage.removeItem(k)
    const mine = JSON.parse(localStorage.getItem('kprog:' + who) || 'null')
    if (mine && typeof mine === 'object') for (const k of KEYS) if (typeof mine[k] === 'string') localStorage.setItem(k, mine[k])
    localStorage.setItem(OWNER, who)
  } catch { /* storage blocked */ }
}

// Call before the lab loads: brings the saved copy down if it is further along than this device.
export async function pullProgress(u) {
  if (!canSync(u)) return
  const { data } = await supabase.from('profiles').select('progress').eq('id', u.id).maybeSingle()
  const remote = data?.progress || {}, local = readLocal()
  if (score(remote) > score(local)) {
    try { for (const k of KEYS) if (remote[k] !== undefined) localStorage.setItem(k, JSON.stringify(remote[k])) } catch { /* ignore */ }
  }
  last = JSON.stringify(readLocal())
}

export async function pushProgress(u) {
  if (!canSync(u)) return
  const cur = readLocal(), s = JSON.stringify(cur)
  if (s === last || s.length > MAX) return
  const { error } = await supabase.from('profiles').update({ progress: cur }).eq('id', u.id)
  if (!error) last = s
}