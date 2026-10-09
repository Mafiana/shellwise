// The lab (public/lab) is a separate page that lives in an iframe on the same origin.
// It reads the signed-in user from localStorage ('kuser'), so we keep that key in sync with the React auth state.
const KEY = 'kuser'
export const AV = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]{1,79000}$/
export function syncLabUser(u) {
  try {
    if (!u) localStorage.removeItem(KEY)
    else if (u.guest) localStorage.setItem(KEY, JSON.stringify({ guest: true, since: u.since || Date.now() }))
    else localStorage.setItem(KEY, JSON.stringify({ name: u.name, user: u.user, email: u.email, plan: u.plan, since: u.since, avatar: u.avatar || '', location: u.location || '', bio: u.bio || '', gender: u.gender || '' }))
  } catch { /* storage blocked: the lab falls back to the guest chip */ }
}
export function readLabUser() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!o || typeof o !== 'object') return null
    if (o.guest) return null // guests no longer exist: an account is required
    return { guest: false, name: String(o.name || ''), user: String(o.user || ''), email: String(o.email || ''), plan: String(o.plan || 'free'), since: +o.since || 0, avatar: AV.test(o.avatar || '') ? o.avatar : '', location: String(o.location || '').slice(0, 60), bio: String(o.bio || '').slice(0, 200), gender: String(o.gender || '').slice(0, 12) }
  } catch { return null }
}
