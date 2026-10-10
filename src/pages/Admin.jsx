import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'
import { BACKEND } from '../lib/config.js'
import { supabase } from '../lib/supabase.js'
import '../styles/admin.css'

// Turns a failed Edge Function call into a readable message: the function's own error text when it sent one.
async function fnMsg(error, data, fallback) {
  if (data && data.error) return String(data.error)
  try { const j = await error?.context?.json?.(); const m = j && (j.error || j.message); if (m) return String(m) } catch { /* ignore */ }
  if (error && (error.name === 'FunctionsFetchError' || /failed to send|networkerror|failed to fetch/i.test(String(error.message || '')))) return 'Could not reach the server function. Check that it is deployed (and redeploy it if you just changed it), then try again.'
  return fallback
}
const ngn = (kobo) => '₦' + Math.round((+kobo || 0) / 100).toLocaleString('en-NG')
const ONLINE_MS = 2 * 60 * 1000
const ago = (t) => {
  if (!t) return 'never'
  const s = Math.max(0, (Date.now() - new Date(t).getTime()) / 1000)
  if (s < 90) return 'just now'
  if (s < 3600) return Math.round(s / 60) + ' min ago'
  if (s < 86400) return Math.round(s / 3600) + ' h ago'
  return Math.round(s / 86400) + ' d ago'
}
const day = (t) => (t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
const isOnline = (t) => !!t && Date.now() - new Date(t).getTime() < ONLINE_MS
const TABS = [['overview', 'Dashboard'], ['users', 'Users'], ['payments', 'Payments'], ['messages', 'Messages'], ['announcements', 'Announcements'], ['coupons', 'Coupons'], ['audit', 'Audit log']]
const svg = (d) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
const ICON = {
  overview: svg(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></>),
  users: svg(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.7a3.5 3.5 0 0 1 0 6.6" /><path d="M18 14.3c2 .7 3.5 2.6 3.5 5.7" /></>),
  payments: svg(<><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /><path d="M6 15h4" /></>),
  messages: svg(<><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="m3 7 9 6.5L21 7" /></>),
  announcements: svg(<><path d="m3 11 15-6v14L3 13z" /><path d="M7 13.5V18a2 2 0 0 0 2 2h1" /><path d="M21 9v6" /></>),
  coupons: svg(<><path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" /><path d="M14 5v14" strokeDasharray="2 3" /></>),
  audit: svg(<><path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></>),
  lab: svg(<><rect x="2.5" y="4" width="19" height="16" rx="2.5" /><path d="m7 9 3 3-3 3" /><path d="M13 15h4" /></>),
}
const PLAN_COL = { free: '#2fd37a', learner: '#2f8cff', pro: '#ffb454' }


// ---- Confirmation box (replaces the browser's plain OK / Cancel popup) ----
const ConfirmCtx = createContext(() => Promise.resolve(false))
const useConfirm = () => useContext(ConfirmCtx)
const PLAN_NAME = { free: 'Free', learner: 'Learner', pro: 'Pro' }
const planAsk = (u, to) => ({ title: 'Change plan?', message: 'The change is saved to your database straight away and recorded in the audit log. The learner sees the new plan the next time they open the lab.', ok: 'Change plan', tone: 'primary', icon: 'swap', who: '@' + u.username, from: PLAN_NAME[u.plan], to: PLAN_NAME[to] })
const suspendAsk = (u) => (u.suspended ? null : { title: 'Suspend this account?', message: `@${u.username} will be signed out and will not be able to log in until you restore the account. The change is saved to your database and recorded in the audit log.`, ok: 'Suspend account', tone: 'danger', icon: 'warn', who: '@' + u.username })
const delAsk = (title, message) => ({ title, message, ok: 'Delete', tone: 'danger', icon: 'warn' })
const CF_ICON = {
  warn: svg(<><path d="M12 3 2.5 20h19z" /><path d="M12 10v4" /><path d="M12 17.2v.1" /></>),
  swap: svg(<><path d="M7 4 3 8l4 4" /><path d="M3 8h14" /><path d="m17 20 4-4-4-4" /><path d="M21 16H7" /></>),
}
function ConfirmHost({ children }) {
  const [st, setSt] = useState(null)
  const okRef = useRef(null)
  const noRef = useRef(null)
  const ask = useCallback((o) => new Promise((res) => setSt({ ...o, res })), [])
  const done = useCallback((v) => { setSt((cur) => { if (cur) cur.res(v); return null }) }, [])
  useEffect(() => {
    if (!st) return
    const prev = document.activeElement
    ;(st.tone === 'danger' ? noRef : okRef).current?.focus()
    const key = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); done(false) }
      else if (e.key === 'Tab') { // keep focus inside the box
        const a = noRef.current, b = okRef.current
        if (!a || !b) return
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus() }
        else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); try { prev && prev.focus && prev.focus() } catch (e) { /* ignore */ } }
  }, [st, done])
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      {st && (
        <div className="pnl-cf" onMouseDown={(e) => { if (e.target === e.currentTarget) done(false) }}>
          <div className={`pnl-cf-box ${st.tone || 'primary'}`} role="alertdialog" aria-modal="true" aria-labelledby="cf-t" aria-describedby="cf-m">
            <span className="pnl-cf-ic">{CF_ICON[st.icon] || CF_ICON.warn}</span>
            <h3 id="cf-t">{st.title}</h3>
            {st.from && st.to && (
              <div className="pnl-cf-chg"><b>{st.who}</b><span><em>{st.from}</em><i aria-hidden="true">&rarr;</i><em className="to">{st.to}</em></span></div>
            )}
            {!st.from && st.who && <div className="pnl-cf-chg"><b>{st.who}</b></div>}
            <p id="cf-m">{st.message}</p>
            <div className="pnl-cf-act">
              <button type="button" className="pnl-btn" ref={noRef} onClick={() => done(false)}>Cancel</button>
              <button type="button" className={`pnl-btn pnl-cf-ok ${st.tone === 'danger' ? 'dn' : ''}`} ref={okRef} onClick={() => done(true)}>{st.ok || 'OK'}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  )
}

// ---- Pagination ----
const SIZES = [10, 25, 50]
function usePager(items, key = '') {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  useEffect(() => { setPage(0) }, [key, size])
  const total = items ? items.length : 0
  const p = Math.min(page, Math.max(0, Math.ceil(total / size) - 1))
  return { rows: items ? items.slice(p * size, p * size + size) : [], props: { page: p, size, total, onPage: setPage, onSize: setSize } }
}
function Pager({ page, size, total, onPage, onSize }) {
  if (!total) return null
  const pages = Math.max(1, Math.ceil(total / size))
  const from = page * size + 1, to = Math.min(total, (page + 1) * size)
  const nums = []
  for (let i = 0; i < pages; i++) {
    if (i === 0 || i === pages - 1 || Math.abs(i - page) <= 1) nums.push(i)
    else if (nums[nums.length - 1] !== '...') nums.push('...')
  }
  return (
    <nav className="pnl-pg-bar" aria-label="Pages">
      <span className="pnl-pg-info">Showing <b>{from}-{to}</b> of <b>{total}</b></span>
      {pages > 1 && (
        <div className="pnl-pg-btns">
          <button type="button" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous page">&lsaquo;</button>
          {nums.map((n, i) => (n === '...' ? <span key={'e' + i} className="pnl-pg-dots">...</span>
            : <button type="button" key={n} className={n === page ? 'on' : ''} aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)}>{n + 1}</button>))}
          <button type="button" disabled={page >= pages - 1} onClick={() => onPage(page + 1)} aria-label="Next page">&rsaquo;</button>
        </div>
      )}
      <label className="pnl-pg-size"><span>Rows</span><select value={size} onChange={(e) => onSize(+e.target.value)}>{SIZES.map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
    </nav>
  )
}

function AdLoader() {
  return (
    <main className="pnl-load" role="status" aria-live="polite">
      <div className="pnl-wait">
        <div className="pnl-ring"><i /><img src="/assets/kali-logo-white.svg" alt="" width="26" height="26" /></div>
        <h2>Shellwise <em>admin</em></h2>
        <p>Checking your access and loading the dashboard</p>
        <div className="pnl-bar"><i /></div>
      </div>
    </main>
  )
}

function Stat({ label, value, sub, tone }) {
  return <div className={`pnl-stat${tone ? ' ' + tone : ''}`}><span>{label}</span><b>{value}</b>{sub && <small>{sub}</small>}</div>
}

const GENDER = { male: 'Male', female: 'Female', other: 'Other', prefer_not: 'Prefer not to say' }
const USER_COLS = 'id,username,full_name,email,plan,created_at,last_seen,suspended,is_admin,avatar,location,bio,gender,progress'

function UserDrawer({ id, me, onClose, onChanged, onDeleted }) {
  const confirm = useConfirm()
  const [u, setU] = useState(null)
  const [pays, setPays] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [typed, setTyped] = useState('')
  const [pwOpen, setPwOpen] = useState(false)
  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      supabase.from('profiles').select(USER_COLS).eq('id', id).maybeSingle(),
      supabase.from('payments').select('reference,plan,interval,amount_kobo,status,created_at,paid_at').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
    ])
    if (a.error || !a.data) return setErr('Could not load this user.')
    setU(a.data); setPays(b.data || [])
  }, [id])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  const act = async (body, ask) => {
    if (ask && !(await confirm(ask))) return
    setBusy(true); setErr('')
    const { data, error } = await supabase.functions.invoke('admin-action', { body: { user_id: id, ...body } })
    setBusy(false)
    if (error || data?.error) return setErr(await fnMsg(error, data, 'That action failed.'))
    onChanged()
    if (body.action === 'delete_user') { onClose(); if (onDeleted) onDeleted() } else load()  }
  const pr = u?.progress || {}, st = pr.kstate || {}
  const modules = Array.isArray(pr.kdone) ? pr.kdone.filter(Boolean).length : 0
  const hasProg = !!(pr.kstate || pr.kdone)
  const paid = pays.filter((p) => p.status === 'success').reduce((a, p) => a + (+p.amount_kobo || 0), 0)
  const locked = !u || u.is_admin || u.id === me
  return (
    <div className="pnl-ov" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <aside className="pnl-dr" role="dialog" aria-modal="true" aria-label="User details">
        <header className="pnl-drh"><b>User details</b><button className="pnl-x" onClick={onClose} aria-label="Close">×</button></header>
        {err && <p className="pnl-err">{err}</p>}
        {!u ? (!err && <p className="pnl-dim">Loading...</p>) : (
          <>
            <div className="pnl-dru">
              <span className="pnl-av big">{u.avatar ? <img src={u.avatar} alt="" /> : (u.username || '?').slice(0, 1).toUpperCase()}</span>
              <div>
                <h3>{u.full_name || u.username}</h3>
                <p className="pnl-dim">@{u.username} · {u.email}</p>
                <div className="pnl-tags">{u.is_admin && <em>admin</em>}{u.suspended && <em className="s">suspended</em>}{isOnline(u.last_seen) && <em className="g">online</em>}</div>
              </div>
            </div>
            <dl className="pnl-kv">
              <div><dt>Joined</dt><dd>{day(u.created_at)}</dd></div>
              <div><dt>Last seen</dt><dd>{isOnline(u.last_seen) ? 'Online now' : ago(u.last_seen)}</dd></div>
              <div><dt>Location</dt><dd>{u.location || '-'}</dd></div>
              <div><dt>Gender</dt><dd>{GENDER[u.gender] || '-'}</dd></div>
            </dl>
            {u.bio && <p className="pnl-bio">{u.bio}</p>}

            <h4>Plan</h4>
            <select value={u.plan} disabled={busy} onChange={(e) => act({ action: 'set_plan', plan: e.target.value }, planAsk(u, e.target.value))} aria-label="Plan">
              <option value="free">Free</option><option value="learner">Learner</option><option value="pro">Pro</option>
            </select>

            <h4>Progress</h4>
            {hasProg ? (
              <div className="pnl-pg">
                <div><b>{modules}</b><small>modules done</small></div>
                <div><b>{st.xp || 0}</b><small>XP</small></div>
                <div><b>{st.gw || 0}</b><small>games won</small></div>
                <div><b>{Object.keys(st.gwon || {}).length}</b><small>different games</small></div>
                <div><b>{st.qc || 0}</b><small>quiz answers right</small></div>
                <div><b>{(st.b || []).length}</b><small>badges</small></div>
              </div>
            ) : <p className="pnl-dim">No saved progress. Progress is stored online only for Learner and Pro plans; on the Free plan it stays on the learner&apos;s own device.</p>}

            <h4>Payments{pays.length ? ` · ${ngn(paid)} paid` : ''}</h4>
            {!pays.length ? <p className="pnl-dim">No payments yet.</p> : (
              <div className="pnl-pays">
                {pays.map((p) => (
                  <div key={p.reference}>
                    <span>{p.plan} · {p.interval}<small>{day(p.paid_at || p.created_at)}</small></span>
                    <span>{ngn(p.amount_kobo)}</span>
                    <b className={`pnl-pill ${p.status}`}>{p.status}</b>
                  </div>
                ))}
              </div>
            )}

            <h4>Account</h4>
            {locked ? <p className="pnl-dim">{u.id === me ? 'This is your own account.' : 'Admin accounts cannot be suspended or deleted here.'}</p> : (
              <>
                <div className="pnl-acts l"><button className="pnl-btn" disabled={busy} onClick={() => setPwOpen(true)}>Reset password</button>
                <button className={`pnl-btn${u.suspended ? '' : ' warn'}`} disabled={busy} onClick={() => act({ action: 'set_suspended', suspended: !u.suspended }, suspendAsk(u))}>{u.suspended ? 'Restore account' : 'Suspend account'}</button></div>
                <div className="pnl-danger">
                  <p>Delete this account for good, with its payments record and messages. This cannot be undone. Type <b>{u.username}</b> to confirm.</p>
                  <div>
                    <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={u.username} aria-label="Type the username to confirm" autoComplete="off" />
                    <button className="pnl-btn warn" disabled={busy || typed !== u.username} onClick={() => act({ action: 'delete_user' })}>Delete account</button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </aside>
      {pwOpen && u && <PwModal u={u} onClose={() => setPwOpen(false)} />}
    </div>
  )
}

const niceTop = (m) => { const e = Math.pow(10, Math.floor(Math.log10(Math.max(1, m)))); const f = m / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e }
const compact = (n) => (n >= 1e6 ? +(n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? +(n / 1e3).toFixed(1) + 'k' : String(Math.round(n)))
const monY = (d) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
const big = (d, n = 36) => <svg viewBox="0 0 24 24" width={n} height={n} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
const KI = {
  money: big(<><path d="M9.2 3.5h5.6l-1.4 3h-2.8z" /><path d="M8 6.5C4.6 9.2 3 12.4 3 15.6 3 19 5.4 21 9 21h6c3.6 0 6-2 6-5.4 0-3.2-1.6-6.4-5-9.1" /><text x="12" y="18" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="currentColor" stroke="none">₦</text></>, 44),
  paid: big(<><circle cx="9" cy="8" r="3.4" /><path d="M2.5 20c0-3.5 2.9-5.8 6.5-5.8s6.5 2.3 6.5 5.8" /><circle cx="17.2" cy="9" r="2.6" /><path d="M17.5 14.4c2.3.3 4 2 4 4.6" /></>, 44),
  free: big(<><circle cx="9" cy="8" r="3.4" /><path d="M2.5 20c0-3.5 2.9-5.8 6.5-5.8s6.5 2.3 6.5 5.8" /><circle cx="17.2" cy="9" r="2.6" /><path d="M17.5 14.4c2.3.3 4 2 4 4.6" /></>, 44),
  userSm: big(<><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20.5c0-4 3.3-6.4 7.5-6.4s7.5 2.4 7.5 6.4" /></>, 26),
  usersSm: big(<><circle cx="9" cy="8" r="3.4" /><path d="M2.5 20c0-3.5 2.9-5.8 6.5-5.8s6.5 2.3 6.5 5.8" /><circle cx="17.2" cy="9" r="2.6" /><path d="M17.5 14.4c2.3.3 4 2 4 4.6" /></>, 26),
  bars: big(<><path d="M6 20v-6M12 20V8M18 20v-9" /></>, 24),
  pie: big(<><path d="M12 3v9h9" /><path d="M20.5 15A9 9 0 1 1 9 3.5" /></>, 24),
  line: big(<><path d="M3 17l5-6 4 3 8-9" /><path d="M3 21h18" /></>, 24),
  cal: big(<><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>, 20),
  chev: big(<path d="m6 9 6 6 6-6" />, 18),
}

// Revenue per month: tall bars, a Naira scale on the left, the amount above each bar and the month underneath.
// Measures the box a chart sits in, so the chart is drawn at its real width and a fixed, short height (no tall scaled-up SVG).
function useBoxW(def) {
  const ref = useRef(null)
  const [w, setW] = useState(def)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const f = () => setW(Math.round(el.clientWidth) || def)
    f()
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }
    const ro = new ResizeObserver(f); ro.observe(el)
    return () => ro.disconnect()
  }, [def])
  return [ref, w]
}

function RevenueChart({ rows }) {
  const n = Math.max(1, rows.length)
  const [bx0, bw0] = useBoxW(640)
  const W = Math.max(bw0, 360), H = 232, XL = 60, XR = W - 8, YT = 26, YB = 192
  const top = niceTop(Math.max(1, ...rows.map((x) => (+x.n || 0) / 100)))
  const slot = (XR - XL) / n, bw = Math.min(64, slot * 0.72)
  const peak = rows.reduce((b, x, i) => ((+x.n || 0) > (+rows[b].n || 0) ? i : b), 0)
  return (
    <div className="pnl-revw" ref={bx0}>
      <svg className="pnl-revsvg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Revenue per month">
        <defs><linearGradient id="adg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5af3a4" /><stop offset="1" stopColor="#12b765" /></linearGradient></defs>
        {[0, 1, 2, 3, 4].map((i) => {
          const y = Math.round(YB - (i / 4) * (YB - YT)) + 0.5
          return (
            <g key={i}>
              <line className={i ? 'pnl-gd' : 'pnl-gb'} shapeRendering="crispEdges" x1={XL - 8} x2={XR} y1={y} y2={y} />
              <text className="pnl-rv-t" x={XL - 16} y={y + 4.5} textAnchor="end">{'₦' + compact((top * i) / 4)}</text>
            </g>
          )
        })}
        {rows.map((x, i) => {
          const v = (+x.n || 0) / 100
          const h = v ? Math.max(10, Math.round((v / top) * (YB - YT))) : 4
          const bx = XL + i * slot + (slot - bw) / 2, by = YB - h, r = Math.min(8, h / 2)
          return (
            <g key={x.m}>
              <path d={`M${bx} ${YB}V${by + r}Q${bx} ${by} ${bx + r} ${by}H${bx + bw - r}Q${bx + bw} ${by} ${bx + bw} ${by + r}V${YB}Z`} fill="url(#adg)" className={v && i === peak ? 'pnl-glow' : ''}><title>{`${monY(x.m)}: ${ngn(x.n)}`}</title></path>
              <text className={'pnl-rv-v' + (v ? '' : ' z')} x={bx + bw / 2} y={by - 10} textAnchor="middle">{ngn(x.n)}</text>
              <text className="pnl-rv-m" x={bx + bw / 2} y={YB + 24} textAnchor="middle">{monY(x.m)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Donut({ free, paid, learner, pro, suspended }) {
  const tot = Math.max(1, free + paid), R = 76, CI = 2 * Math.PI * R, pct = Math.round((paid / tot) * 100)
  return (
    <div className="pnl-dn">
      <svg className="pnl-dnsvg" viewBox="0 0 220 220" role="img" aria-label={`${paid} paid users and ${free} free users`}>
        <defs><linearGradient id="adp1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd84d" /><stop offset="1" stopColor="#ff9a1f" /></linearGradient></defs>
        <circle cx="110" cy="110" r={R} fill="none" stroke="#2fd37a" strokeWidth="28" />
        {paid > 0 && <circle cx="110" cy="110" r={R} fill="none" stroke="url(#adp1)" strokeWidth="28" strokeDasharray={`${(paid / tot) * CI} ${CI}`} transform="rotate(-90 110 110)" />}
        <text className="pnl-dn-p" x="110" y="116" textAnchor="middle">{pct}%</text>
        <text className="pnl-dn-s" x="110" y="142" textAnchor="middle">paying</text>
      </svg>
      <div className="pnl-dnl">
        <div><i style={{ background: '#2fd37a' }} /><span>Free</span><b>{free}</b></div>
        <div><i style={{ background: '#ffb020' }} /><span>Paid</span><b>{paid}</b></div>
        <hr />
        <p>Learner {learner} · Pro {pro}</p>
        {suspended > 0 && <p>{suspended} suspended</p>}
      </div>
    </div>
  )
}

function SignupsChart({ sg, signTotal }) {
  const [bx, bw] = useBoxW(600)
  const W = Math.max(bw, 280), H = 118, P = 8, TOP = 16
  const smx = Math.max(1, ...sg.map((x) => +x.n || 0))
  const ph = H - P - TOP
  const pt = sg.map((x, i) => [P + (i * (W - 2 * P)) / Math.max(1, sg.length - 1), H - P - ((+x.n || 0) / smx) * ph])
  const line = pt.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const dm = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return (
    <div className="pnl-sgw" ref={bx}>
      <svg className="pnl-svg" width={W} height={H + 20} viewBox={`0 0 ${W} ${H + 20}`} role="img" aria-label={`Signups per day for the last 30 days, ${signTotal} in total`}>
        <line x1={P} x2={W - P} y1={H - P} y2={H - P} stroke="#ffffff1a" />
        <line x1={P} x2={W - P} y1={TOP} y2={TOP} stroke="#ffffff0d" strokeDasharray="3 4" />
        {pt.length > 1 && <path d={`${line} L${pt[pt.length - 1][0]} ${H - P} L${pt[0][0]} ${H - P} Z`} fill="#2f8cff22" />}
        <path d={line} fill="none" stroke="#2f8cff" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {pt.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.6" fill="#2f8cff"><title>{`${dm(sg[i].d)}: ${sg[i].n}`}</title></circle>)}
        <text className="pnl-ax" x={P} y={H + 13}>{sg[0] && dm(sg[0].d)}</text>
        <text className="pnl-ax" x={W / 2} y={H + 13} textAnchor="middle">{sg[15] && dm(sg[15].d)}</text>
        <text className="pnl-ax" x={W - P} y={H + 13} textAnchor="end">{sg.length && dm(sg[sg.length - 1].d)}</text>
        <text className="pnl-ax" x={P} y="10">{smx}</text>
      </svg>
    </div>
  )
}

function Charts({ data, c, err, range }) {
  const by = data.byPlan || {}
  const free = +by.free || 0, paid = (+by.learner || 0) + (+by.pro || 0)
  const sg = c?.signups || [], rv = (c?.revenue || []).slice(-range)
  const signTotal = sg.reduce((a, x) => a + (+x.n || 0), 0)
  const rvTotal = rv.reduce((a, x) => a + (+x.n || 0), 0)
  return (
    <div className="pnl-ch2">
      <section className="pnl-card pnl-rvc">
        <header className="pnl-chh"><span className="pnl-chi g">{KI.bars}</span><div><h3>Revenue per month</h3><p>Last {range} months{c ? ` · ${ngn(rvTotal)} total` : ''}</p></div></header>
        {err ? <p className="pnl-err">{err}</p> : !c ? <p className="pnl-dim">Loading chart...</p> : <RevenueChart rows={rv} />}
      </section>
      <section className="pnl-card pnl-fpc">
        <header className="pnl-chh"><span className="pnl-chi v">{KI.pie}</span><div><h3>Free vs paid</h3><p>All users</p></div></header>
        <Donut free={free} paid={paid} learner={by.learner || 0} pro={by.pro || 0} suspended={+data.suspended || 0} />
      </section>
      <section className="pnl-card pnl-sgc">
        <header className="pnl-chh"><span className="pnl-chi b">{KI.line}</span><div><h3>Signups per day</h3><p>Last 30 days{c ? ` · ${signTotal} total` : ''}</p></div></header>
        {err ? <p className="pnl-err">{err}</p> : !c ? <p className="pnl-dim">Loading chart...</p> : <SignupsChart sg={sg} signTotal={signTotal} />}
      </section>
    </div>
  )
}

function Overview({ data, err, range }) {
  const [c, setC] = useState(null)
  const [cerr, setCerr] = useState('')
  useEffect(() => {
    supabase.rpc('admin_charts').then(({ data: d, error }) => (error ? setCerr('The charts need one more SQL step. Run supabase/upgrade-admin-charts.sql in the Supabase SQL Editor.') : setC(d)))
  }, [])
  if (err) return <p className="pnl-err">{err}</p>
  if (!data) return <p className="pnl-dim">Loading numbers...</p>
  const by = data.byPlan || {}
  const free = +by.free || 0, paid = (+by.learner || 0) + (+by.pro || 0)
  const all = c?.revenue || []
  const total = all.slice(-range).reduce((a, x) => a + (+x.n || 0), 0)
  const cur = +all[all.length - 1]?.n || 0, prev = +all[all.length - 2]?.n || 0
  const g = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0
  return (
    <>
      <div className="pnl-kpis">
        <div className="pnl-kpi rev">
          <span className="ic">{KI.money}</span>
          <div className="tx"><span className="lb">Total Revenue</span><b>{c ? ngn(total) : '...'}</b>
            <div className="sb"><small>Last {range} months</small><em className={`tr ${g > 0 ? 'up' : g < 0 ? 'dn' : ''}`} title="This month compared with last month">{g > 0 ? '↗' : g < 0 ? '↘' : '–'} {Math.abs(g)}%</em></div></div>
        </div>
        <div className="pnl-kpi paid">
          <span className="ic">{KI.paid}</span><span className="gh">{KI.usersSm}</span>
          <div className="tx"><span className="lb">Paid Users</span><b>{paid}</b><div className="sb"><small>All users</small></div></div>
        </div>
        <div className="pnl-kpi free">
          <span className="ic">{KI.free}</span><span className="gh">{KI.userSm}</span>
          <div className="tx"><span className="lb">Free Users</span><b>{free}</b><div className="sb"><small>All users</small></div></div>
        </div>
      </div>
      <div className="pnl-stats pnl-mini">
        <Stat label="Online now" value={data.online} sub="seen in the last 2 minutes" tone="live" />
        <Stat label="Active today" value={data.today} sub="seen in the last 24 hours" />
        <Stat label="Total users" value={data.total} sub={`${data.new7} new in 7 days`} />
        <Stat label="Revenue this month" value={ngn(data.revenueMonth)} sub={`${ngn(data.revenueTotal)} all time`} />
      </div>
      <Charts data={data} c={c} err={cerr} range={range} />
    </>
  )
}

// ---- Set a temporary password for a learner who is locked out ----
const tempPw = () => {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const v = new Uint32Array(12); crypto.getRandomValues(v)
  const c = Array.from(v, (n) => A[n % A.length]).join('')
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`
}
function PwModal({ u, onClose }) {
  const [pw, setPw] = useState(tempPw)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    document.addEventListener('keydown', k, true)
    return () => document.removeEventListener('keydown', k, true)
  }, [onClose])
  const copy = async () => { try { await navigator.clipboard.writeText(pw); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ } }
  const save = async () => {
    if (pw.length < 8) return setErr('Use at least 8 characters.')
    setBusy(true); setErr('')
    const { data, error } = await supabase.functions.invoke('admin-action', { body: { action: 'set_password', user_id: u.id, password: pw } })
    setBusy(false)
    if (!error && !data?.error) return setDone(true)
    setErr(await fnMsg(error, data, 'Could not set the password. Please try again.'))
  }
  return (
    <div className="pnl-ov pnl-ovc" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="pnl-pwm" role="dialog" aria-modal="true" aria-label="Reset password">
        <h3>{done ? 'Password set' : 'Reset password'}</h3>
        <p className="who">@{u.username} · {u.email}</p>
        {done ? (
          <>
            <p>Send this password to the learner privately (WhatsApp or a call, not a public chat). After they log in, they should change it in <b>Settings &gt; Security</b>.</p>
            <div className="row"><input readOnly value={pw} aria-label="Temporary password" onFocus={(e) => e.target.select()} /><button type="button" className="pnl-btn" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button></div>
            <div className="act"><button type="button" className="pnl-btn pnl-pri" onClick={onClose}>Done</button></div>
          </>
        ) : (
          <>
            <p>This replaces their current password straight away and is recorded in the audit log. Use the one below or type your own.</p>
            <div className="row"><input value={pw} onChange={(e) => setPw(e.target.value.slice(0, 128))} aria-label="New temporary password" autoComplete="off" spellCheck="false" /><button type="button" className="pnl-btn" onClick={() => { setPw(tempPw()); setErr('') }}>New</button></div>
            {err && <p className="pnl-err">{err}</p>}
            <div className="act"><button type="button" className="pnl-btn" onClick={onClose}>Cancel</button><button type="button" className="pnl-btn pnl-pri" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Set password'}</button></div>
          </>
        )}
      </div>
    </div>
  )
}

function Users({ me }) {
  const confirm = useConfirm()
    const [ok, setOk] = useState('')
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')
  const [sel, setSel] = useState(null)
  const [pwFor, setPwFor] = useState(null)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  useEffect(() => { setPage(0) }, [q, filter, size])
  const load = useCallback(async () => {
    let req = supabase.from('profiles').select('id,username,full_name,email,plan,created_at,last_seen,suspended,is_admin', { count: 'exact' }).order('created_at', { ascending: false }).range(page * size, page * size + size - 1)
    const term = q.trim().replace(/[%,()*\\]/g, '').slice(0, 60)
    if (term) req = req.or(`username.ilike.%${term}%,email.ilike.%${term}%,full_name.ilike.%${term}%`)
    if (['free', 'learner', 'pro'].includes(filter)) req = req.eq('plan', filter)
    if (filter === 'suspended') req = req.eq('suspended', true)
    if (filter === 'online') req = req.gt('last_seen', new Date(Date.now() - ONLINE_MS).toISOString())
    const { data, error, count } = await req
    if (error) setErr('Could not load users.'); else { setErr(''); setRows(data); setTotal(count || 0) }
  }, [q, filter, page, size])
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t) }, [load])
  const act = async (id, body, ask) => {
    if (ask && !(await confirm(ask))) return
    setBusy(id); setErr('')
    const { data, error } = await supabase.functions.invoke('admin-action', { body: { user_id: id, ...body } })
    setBusy('')
    if (error || data?.error) setErr(await fnMsg(error, data, 'That action failed.')); else load()
  }
  return (
    <>
      <div className="pnl-tools">
        <input type="search" placeholder="Search name, username or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
        <div className="pnl-chips" role="group" aria-label="Filter">
          {[['all', 'All'], ['online', 'Online'], ['free', 'Free'], ['learner', 'Learner'], ['pro', 'Pro'], ['suspended', 'Suspended']].map(([v, t]) => <button key={v} className={filter === v ? 'on' : ''} onClick={() => setFilter(v)}>{t}</button>)}
        </div>
      </div>
      {sel && <UserDrawer id={sel} me={me} onClose={() => setSel(null)} onChanged={load} onDeleted={() => {
  setOk('Selected account and its data were deleted.')
  setTimeout(() => setOk(''), 8000)
}} />}
{pwFor && <PwModal u={pwFor} onClose={() => setPwFor(null)} />}
{ok && (
  <div className="pnl-note" role="status">
    <span>{ok}</span>
    <button type="button" onClick={() => setOk('')} aria-label="Dismiss">✕</button>
  </div>
)}{err && <p className="pnl-err">{err}</p>}
      {!rows ? <p className="pnl-dim">Loading users...</p> : !rows.length ? <p className="pnl-dim">No users match.</p> : (
        <div className="pnl-tw"><table className="pnl-tbl">
          <thead><tr><th>User</th><th>Email</th><th>Plan</th><th>Joined</th><th>Last seen</th><th className="r">Actions</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr className={u.suspended ? 'sus' : ''} key={u.id}>
                <td><span className="pnl-un"><i className={isOnline(u.last_seen) ? 'on' : ''} title={isOnline(u.last_seen) ? 'Online' : 'Offline'} /><span><button type="button" className="pnl-link" onClick={() => setSel(u.id)}>{u.full_name || u.username}</button><small>@{u.username}</small></span></span>{u.is_admin && <em className="pnl-tag">admin</em>}{u.suspended && <em className="pnl-tag s">suspended</em>}</td>
                <td className="mut">{u.email}</td>
                <td><select value={u.plan} disabled={busy === u.id} onChange={(e) => act(u.id, { action: 'set_plan', plan: e.target.value }, planAsk(u, e.target.value))} aria-label={`Plan for ${u.username}`}>
                  <option value="free">Free</option><option value="learner">Learner</option><option value="pro">Pro</option></select></td>
                <td>{day(u.created_at)}</td>
                <td>{isOnline(u.last_seen) ? <b className="pnl-live">online</b> : ago(u.last_seen)}</td>
                <td className="r">{u.is_admin || u.id === me ? <small className="pnl-dim">-</small>
                  : <span className="pnl-acts"><button className="pnl-btn" disabled={busy === u.id} onClick={() => setPwFor(u)}>Reset password</button><button className={`pnl-btn${u.suspended ? '' : ' warn'}`} disabled={busy === u.id} onClick={() => act(u.id, { action: 'set_suspended', suspended: !u.suspended }, suspendAsk(u))}>{u.suspended ? 'Restore' : 'Suspend'}</button></span>}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Pager page={page} size={size} total={total} onPage={setPage} onSize={setSize} />
    </>
  )
}

const CHANNEL = { card: 'Card', bank: 'Bank', ussd: 'USSD', bank_transfer: 'Bank transfer', qr: 'QR', mobile_money: 'Mobile money', apple_pay: 'Apple Pay', eft: 'EFT' }
const chName = (c) => (c ? CHANNEL[c] || String(c).replace(/_/g, ' ') : '-')
const PAY_STATUS = [['all', 'All statuses'], ['success', 'Success'], ['pending', 'Pending'], ['failed', 'Failed']]
const PAY_RANGE = [['all', 'All time'], ['today', 'Today'], ['week', 'Last 7 days'], ['month', 'This month'], ['custom', 'Custom']]
const sod = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const csvCell = (v) => { let t = String(v ?? ''); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"' }

function Payments() {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const [status, setStatus] = useState('all')
  const [range, setRange] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [chan, setChan] = useState('all')
  const [copied, setCopied] = useState('')
  const [chk, setChk] = useState('') // '' | 'all' | a reference being rechecked
  const [note, setNote] = useState('')
  const load = useCallback(async () => {
    {
      const { data, error } = await supabase.from('payments').select('reference,user_id,plan,interval,amount_kobo,status,created_at,paid_at,channel,coupon').order('created_at', { ascending: false }).limit(1000)
      if (error) return setErr('Could not load payments.')
      const ids = [...new Set((data || []).map((p) => p.user_id))]
      const names = {}
      if (ids.length) { const { data: ps } = await supabase.from('profiles').select('id,username,email').in('id', ids); (ps || []).forEach((p) => { names[p.id] = p }) }
      setRows((data || []).map((p) => ({ ...p, who: names[p.user_id] })))
    }
  }, [])
  // Asks Paystack about pending payments (one reference, or all that are older than 2 minutes) and updates them here.
  const recheck = useCallback(async (reference, quiet) => {
    setChk(reference || 'all'); if (!quiet) setNote('')
    const { data, error } = await supabase.functions.invoke('paystack-reconcile', { body: reference ? { reference } : {} })
    setChk('')
    if (error || data?.error) { if (!quiet) setNote(await fnMsg(error, data, 'Could not check with Paystack. Please try again.')); return }
    if (data.fixed || !quiet) setNote(data.fixed ? `${data.fixed} payment${data.fixed > 1 ? 's' : ''} confirmed by Paystack and applied.` : data.notes && data.notes.length ? 'Paystack says it succeeded but it was not applied: ' + data.notes[0] : data.still ? 'Paystack has not confirmed it as paid yet.' : 'Nothing to update.')
    load()
  }, [load])
  const swept = useRef(false)
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [load])
  // Once per visit: if anything has been pending for more than 2 minutes, check it with Paystack automatically.
  useEffect(() => {
    if (!rows || swept.current) return
    swept.current = true
    if (rows.some((p) => p.status === 'pending' && Date.now() - new Date(p.created_at).getTime() > 120000)) recheck(null, true)
  }, [rows, recheck])
  const shown = useMemo(() => {
    if (!rows) return []
    const now = new Date()
    let lo = null, hi = null
    if (range === 'today') lo = sod(now)
    else if (range === 'week') { lo = sod(now); lo.setDate(lo.getDate() - 6) }
    else if (range === 'month') lo = new Date(now.getFullYear(), now.getMonth(), 1)
    else if (range === 'custom') { if (from) lo = sod(from); if (to) { hi = sod(to); hi.setDate(hi.getDate() + 1) } }
    return rows.filter((p) => {
      if (status !== 'all' && p.status !== status) return false
      if (chan !== 'all' && (p.channel || 'none') !== chan) return false
      const t = new Date(p.paid_at || p.created_at)
      if (lo && t < lo) return false
      if (hi && t >= hi) return false
      return true
    })
  }, [rows, status, range, from, to, chan])
  const filtered = status !== 'all' || range !== 'all' || chan !== 'all'
  const reset = () => { setStatus('all'); setRange('all'); setFrom(''); setTo(''); setChan('all') }
  const channels = useMemo(() => [...new Set((rows || []).map((p) => p.channel || 'none'))], [rows])
  const pg = usePager(shown, status + range + from + to + chan)
  const copyRef = (r) => { try { navigator.clipboard.writeText(r); setCopied(r); setTimeout(() => setCopied(''), 1500) } catch (e) { try { const t = document.createElement('textarea'); t.value = r; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); setCopied(r); setTimeout(() => setCopied(''), 1500) } catch (e2) { /* clipboard not available */ } } }
  const total = shown.filter((p) => p.status === 'success').reduce((a, p) => a + (+p.amount_kobo || 0), 0)
  const exportCsv = () => {
    const head = ['Reference', 'Username', 'Email', 'Plan', 'Billing', 'Amount (NGN)', 'Channel', 'Status', 'Date']
    const lines = shown.map((p) => [p.reference, p.who?.username || '', p.who?.email || '', p.plan, p.interval, Math.round((+p.amount_kobo || 0) / 100), chName(p.channel), p.status, new Date(p.paid_at || p.created_at).toISOString()].map(csvCell).join(','))
    const blob = new Blob(['\ufeff' + [head.map(csvCell).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `shellwise-payments-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  if (err) return <p className="pnl-err">{err}</p>
  if (!rows) return <p className="pnl-dim">Loading payments...</p>
  return (
    <>
      <div className="pnl-filters">
        <label><span>Filter by status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>{PAY_STATUS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
        <label><span>Payment channel</span>
          <select value={chan} onChange={(e) => setChan(e.target.value)}><option value="all">All channels</option>{channels.map((c) => <option key={c} value={c}>{c === 'none' ? 'Not recorded' : chName(c)}</option>)}</select></label>
        <label><span>Date range</span>
          <select value={range} onChange={(e) => setRange(e.target.value)}>{PAY_RANGE.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
        {range === 'custom' && <>
          <label><span>From</span><input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
          <label><span>To</span><input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
        </>}
        <div className="pnl-fact">
          <button type="button" className="pnl-btn" onClick={reset} disabled={!filtered && !from && !to}>Reset filter</button>
          <button type="button" className="pnl-btn pnl-csv" onClick={exportCsv} disabled={!shown.length}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
            Export CSV
          </button>
        </div>
      </div>
      <p className="pnl-dim pnl-sum">{shown.length} {shown.length === 1 ? 'payment' : 'payments'} · {ngn(total)} received
{rows.some((p) => p.status === 'pending') && <button type="button" className="pnl-btn pnl-rc warn" onClick={() => recheck(null)} disabled={!!chk}>{chk === 'all' ? 'Checking...' : 'Recheck pending with Paystack'}</button>}      </p>
      {note && <p className="pnl-ok" role="status">{note}</p>}
      {!shown.length ? <p className="pnl-dim">{rows.length ? 'No payments match these filters.' : 'No payments yet.'}</p> : (
        <div className="pnl-tw"><table className="pnl-tbl">
          <thead><tr><th>User</th><th>Reference</th><th>Plan</th><th className="r">Amount</th><th>Channel</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {pg.rows.map((p) => (
              <tr key={p.reference}>
<td>
  <b>{p.who?.username || (p.user_id ? 'unknown' : 'deleted user')}</b>
  <small>{p.who?.email || (p.user_id ? '' : 'account removed')}</small>
</td>                <td><span className="pnl-ref"><code title={p.reference}>{p.reference.slice(0, 11)}...</code><button type="button" className="pnl-cp" onClick={() => copyRef(p.reference)} aria-label={`Copy reference ${p.reference}`}>{copied === p.reference ? 'Copied' : 'Copy'}</button></span></td>
                <td className="cap">{p.plan} · {p.interval}</td>
                <td className="r"><b>{ngn(p.amount_kobo)}</b>{p.coupon && <small>code {p.coupon}</small>}</td>
                <td>{chName(p.channel)}</td>
                <td><b className={`pnl-pill ${p.status}`}>{p.status}</b>{p.status === 'pending' && <button type="button" className="pnl-cp pnl-rk" onClick={() => recheck(p.reference)} disabled={!!chk}>{chk === p.reference ? 'Checking...' : 'Recheck'}</button>}</td>
                <td>{day(p.paid_at || p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Pager {...pg.props} />
    </>
  )
}

const TOPIC = { general: 'General', billing: 'Billing', bug: 'Bug', feedback: 'Feedback', partnership: 'Partnership' }
function Messages() {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    supabase.from('contact_messages').select('id,name,email,topic,message,created_at').order('created_at', { ascending: false }).limit(500)
      .then(({ data, error }) => (error ? setErr('Could not load messages.') : setRows(data)))
  }, [])
  const pg = usePager(rows)
  if (err) return <p className="pnl-err">{err}</p>
  if (!rows) return <p className="pnl-dim">Loading messages...</p>
  if (!rows.length) return <p className="pnl-dim">No messages yet.</p>
  return (
    <>
    <div className="pnl-tw"><table className="pnl-tbl">
      <thead><tr><th>Date</th><th>From</th><th>Topic</th><th>Message</th><th className="r">Reply</th></tr></thead>
      <tbody>
        {pg.rows.map((m) => (
          <tr key={m.id}>
            <td className="nw">{day(m.created_at)}<small>{ago(m.created_at)}</small></td>
            <td><b>{m.name}</b><small>{m.email}</small></td>
            <td><span className="pnl-pill">{TOPIC[m.topic] || m.topic}</span></td>
            <td className="msg">{m.message}</td>
            <td className="r"><a className="pnl-btn" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to Shellwise')}`}>Reply</a></td>
          </tr>
        ))}
      </tbody>
    </table></div>
    <Pager {...pg.props} />
    </>
  )
}

const SEEN_KEY = 'kadminseen'
const SND_KEY = 'kadminsound'
const ding = () => {
  try {
    const C = window.AudioContext || window.webkitAudioContext
    const c = new C(), o = c.createOscillator(), g = c.createGain(), n = c.currentTime
    o.type = 'sine'; o.frequency.setValueAtTime(880, n); o.frequency.setValueAtTime(1320, n + 0.12)
    g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.25, n + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.45)
    o.connect(g); g.connect(c.destination); o.start(); o.stop(n + 0.5)
    setTimeout(() => c.close(), 800)
  } catch (e) { /* sound is optional */ }
}
function Bell({ onGo }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(() => { try { return +localStorage.getItem(SEEN_KEY) || 0 } catch (e) { return 0 } })
  const [sound, setSound] = useState(() => { try { return localStorage.getItem(SND_KEY) !== '0' } catch (e) { return true } })
  const [perm, setPerm] = useState(() => (typeof Notification === 'undefined' ? 'none' : Notification.permission))
  const box = useRef(null)
  const known = useRef(null)
  const live = useRef({})
  live.current = { sound, onGo }
    const load = useCallback(async () => {
    const [p, m, u] = await Promise.all([
      supabase.from('payments').select('reference,plan,amount_kobo,status,created_at,paid_at').in('status', ['success', 'failed']).order('created_at', { ascending: false }).limit(15),
      supabase.from('contact_messages').select('id,name,topic,created_at').order('created_at', { ascending: false }).limit(15),
      supabase.from('profiles').select('id,username,full_name,email,created_at').order('created_at', { ascending: false }).limit(15),
    ])
    const list = [
      ...(p.data || []).map((x) => ({ k: 'p' + x.reference, tab: 'payments', ok: x.status === 'success', t: x.paid_at || x.created_at, text: (x.status === 'success' ? 'Payment received' : 'Payment failed') + ' · ' + ngn(x.amount_kobo) + ' · ' + (x.plan || '') })),
      ...(m.data || []).map((x) => ({ k: 'm' + x.id, tab: 'messages', ok: true, t: x.created_at, text: 'New message from ' + x.name + ' · ' + (TOPIC[x.topic] || x.topic) })),
      ...(u.data || []).map((x) => ({ k: 'u' + x.id, tab: 'users', ok: true, t: x.created_at, text: 'New user · @' + (x.username || 'unknown') + (x.full_name ? ' · ' + x.full_name : '') })),
    ].sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 20)
    const fresh = known.current ? list.filter((i) => !known.current.has(i.k)) : []
    known.current = new Set(list.map((i) => i.k))
    setItems(list)
    if (!fresh.length) return
    if (live.current.sound) ding()
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && (document.hidden || !document.hasFocus())) {
      fresh.slice(0, 3).forEach((i) => {
        try {
          const n = new Notification('Shellwise admin', { body: i.text, tag: i.k })
          n.onclick = () => { window.focus(); live.current.onGo(i.tab); n.close() }
        } catch (e) { /* ignore */ }
      })
    }
  }, [])
  useEffect(() => {
    load()
    const t = setInterval(load, 30000) // backup in case the live connection drops
        const ch = supabase.channel('admin-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, load)
      .subscribe()
    return () => { clearInterval(t); supabase.removeChannel(ch) }
  }, [load])
  useEffect(() => {
    if (!open) return
    const out = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', out); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc) }
  }, [open])
  const isNew = (i) => new Date(i.t).getTime() > seen
  const unread = items.filter(isNew).length
  useEffect(() => { document.title = (unread ? '(' + unread + ') ' : '') + 'Admin · Shellwise' }, [unread])
  const markAll = () => {
    if (!items.length) return
    const t = Math.max(...items.map((i) => new Date(i.t).getTime()))
    setSeen(t); try { localStorage.setItem(SEEN_KEY, String(t)) } catch (e) { /* ignore */ }
  }
  const toggleSound = () => {
    const v = !sound; setSound(v)
    try { localStorage.setItem(SND_KEY, v ? '1' : '0') } catch (e) { /* ignore */ }
    if (v) ding()
  }
  const askPerm = async () => { try { setPerm(await Notification.requestPermission()) } catch (e) { /* ignore */ } }
  return (
    <div className="pnl-bell" ref={box}>
      <button className="pnl-bellbtn" aria-label={unread ? unread + ' new notifications' : 'Notifications'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8.5 3 8.5H3S6 15 6 8" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
        {unread > 0 && <span className="pnl-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="pnl-pop" role="dialog" aria-label="Notifications">
          <div className="pnl-pophd"><b>Notifications</b>{unread > 0 && <button onClick={markAll}>Mark all read</button>}</div>
          <div className="pnl-alr">
            <button onClick={toggleSound}>Sound: {sound ? 'on' : 'off'}</button>
            {perm === 'default' && <button onClick={askPerm}>Enable browser alerts</button>}
            {perm === 'granted' && <span>Browser alerts on</span>}
            {perm === 'denied' && <span>Browser alerts blocked in this browser</span>}
          </div>
          {items.length ? items.map((i) => (
            <button key={i.k} className={'pnl-it' + (isNew(i) ? ' new' : '')} onClick={() => { markAll(); setOpen(false); onGo(i.tab) }}>
              <span className={'pnl-ic ' + (i.ok ? i.tab : 'bad')}>{ICON[i.tab]}</span>
              <span className="pnl-ittx"><b>{i.text}</b><small>{ago(i.t)}</small></span>
            </button>
)) : <p className="pnl-dim pnl-popempty">Nothing yet. New users, payments and messages will show up here.</p>}        </div>
      )}
    </div>
  )
}

const TONES = [['info', 'Info (blue)'], ['success', 'Good news (green)'], ['warning', 'Warning (amber)']]
// How soon a learner is reminded again after opening an announcement. 0 = only once.
const SNOOZE = [[0, 'Never (tell them once)'], [3, 'Every 3 hours'], [7, 'Every 7 hours'], [24, 'Daily']]
const snoozeName = (h) => (SNOOZE.find(([v]) => v === +h) || SNOOZE[0])[1]
const when = (t) => new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function Announcements() {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [tone, setTone] = useState('info')
  const [snooze, setSnooze] = useState(0)
  const [busy, setBusy] = useState(false)
  const [edit, setEdit] = useState(null) // { id, message, tone, snooze_hours }
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('announcements').select('id,message,tone,active,expires_at,created_at,snooze_hours').order('created_at', { ascending: false }).limit(200)
    if (error) setErr('Could not load announcements. Did you run supabase/upgrade-growth.sql and upgrade-growth2.sql?'); else { setErr(''); setRows(data) }
  }, [])
  useEffect(() => { load() }, [load])
  const post = async (e) => {
    e.preventDefault()
    const m = msg.trim()
    if (m.length < 3) return setErr('Write at least 3 characters.')
    setBusy(true); setErr('')
    const { error } = await supabase.from('announcements').insert({ message: m.slice(0, 240), tone, snooze_hours: +snooze })
    setBusy(false)
    if (error) return setErr('Could not post it. Please try again.')
    setMsg(''); load()
  }
  const toggle = async (a) => { await supabase.from('announcements').update({ active: !a.active }).eq('id', a.id); load() }
  const confirm = useConfirm()
  const del = async (a) => { if (!(await confirm(delAsk('Delete this announcement?', 'Learners will no longer see it. This cannot be undone.')))) return; await supabase.from('announcements').delete().eq('id', a.id); load() }
  const saveEdit = async () => {
    const m = edit.message.trim()
    if (m.length < 3) return setErr('Write at least 3 characters.')
    setBusy(true); setErr('')
    const { error } = await supabase.from('announcements').update({ message: m.slice(0, 240), tone: edit.tone, snooze_hours: +edit.snooze_hours }).eq('id', edit.id)
    setBusy(false)
    if (error) return setErr('Could not save the change. Please try again.')
    setEdit(null); load()
  }
  const state = (a) => (!a.active ? 'hidden' : a.expires_at && new Date(a.expires_at) < new Date() ? 'expired' : 'live')
  const pg = usePager(rows)
  return (
    <>
      <form className="pnl-card pnl-form" onSubmit={post}>
        <h3>New announcement</h3>
        <label className="pnl-fld"><span>Message <small>{msg.length}/240</small></span>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value.slice(0, 240))} rows={3} placeholder="For example: New game added this week. Try Secret Hunter!" /></label>
        <div className="pnl-row">
          <label className="pnl-fld"><span>Colour</span><select value={tone} onChange={(e) => setTone(e.target.value)}>{TONES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
          <label className="pnl-fld"><span>Snooze (remind again)</span><select value={snooze} onChange={(e) => setSnooze(+e.target.value)}>{SNOOZE.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
          <button className="pnl-btn pnl-go" type="submit" disabled={busy || msg.trim().length < 3}>{busy ? 'Posting...' : 'Post announcement'}</button>
        </div>
        {msg.trim() && <div className={`pnl-prev ${tone}`}>{msg.trim()}</div>}
        <p className="pnl-dim">Learners see announcements under the message icon on their profile page. After a learner opens it, the icon lights up again after the snooze time. Choose Never to tell them only once.</p>
      </form>
      {err && <p className="pnl-err">{err}</p>}
      {!rows ? <p className="pnl-dim">Loading...</p> : !rows.length ? <p className="pnl-dim">No announcements yet.</p> : (
        <>
          <div className="pnl-tw"><table className="pnl-tbl">
            <thead><tr><th>Message</th><th>Colour</th><th>Snooze</th><th>Status</th><th>Posted</th><th className="r">Actions</th></tr></thead>
            <tbody>
              {pg.rows.map((a) => (edit && edit.id === a.id ? (
                <tr className="pnl-editrow" key={a.id}><td colSpan={6}>
                  <div className="pnl-edit">
                    <label className="pnl-fld"><span>Edit message <small>{edit.message.length}/240</small></span>
                      <textarea value={edit.message} rows={3} autoFocus onChange={(e) => setEdit({ ...edit, message: e.target.value.slice(0, 240) })} /></label>
                    <div className="pnl-row">
                      <label className="pnl-fld"><span>Colour</span><select value={edit.tone} onChange={(e) => setEdit({ ...edit, tone: e.target.value })}>{TONES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
                      <label className="pnl-fld"><span>Snooze</span><select value={edit.snooze_hours} onChange={(e) => setEdit({ ...edit, snooze_hours: +e.target.value })}>{SNOOZE.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
                      <button type="button" className="pnl-btn pnl-go" disabled={busy || edit.message.trim().length < 3} onClick={saveEdit}>{busy ? 'Saving...' : 'Save changes'}</button>
                      <button type="button" className="pnl-btn" onClick={() => setEdit(null)}>Cancel</button>
                    </div>
                  </div>
                </td></tr>
              ) : (
                <tr key={a.id}>
                  <td className="msg">{a.message}</td>
                  <td className="cap"><span className={`pnl-dotc ${a.tone}`} />{a.tone}</td>
                  <td className="nw">{snoozeName(a.snooze_hours)}</td>
                  <td><b className={`pnl-pill ${state(a) === 'live' ? 'success' : state(a) === 'expired' ? 'failed' : ''}`}>{state(a)}</b></td>
                  <td className="nw">{day(a.created_at)}<small>{ago(a.created_at)}</small></td>
                  <td className="r"><span className="pnl-acts">
                    <button className="pnl-btn" onClick={() => { setErr(''); setEdit({ id: a.id, message: a.message, tone: a.tone, snooze_hours: a.snooze_hours || 0 }) }}>Edit</button>
                    <button className="pnl-btn" onClick={() => toggle(a)}>{a.active ? 'Hide' : 'Show'}</button>
                    <button className="pnl-btn warn" onClick={() => del(a)}>Delete</button>
                  </span></td>
                </tr>
              )))}
            </tbody>
          </table></div>
          <Pager {...pg.props} />
        </>
      )}
      <PrivateMessages />
    </>
  )
}

// Send a private message to one learner. It shows in the message icon on that learner's profile page.
function PrivateMessages() {
  const [q, setQ] = useState('')
  const [found, setFound] = useState([])
  const [to, setTo] = useState(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [rows, setRows] = useState(null)
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('user_messages').select('id,user_id,subject,body,read,created_at').order('created_at', { ascending: false }).limit(300)
    if (error) { setRows([]); return setErr('Private messages need upgrade-growth2.sql. Run it in the Supabase SQL Editor.') }
    const ids = [...new Set((data || []).map((m) => m.user_id))]
    const names = {}
    if (ids.length) { const { data: ps } = await supabase.from('profiles').select('id,username').in('id', ids); (ps || []).forEach((p) => { names[p.id] = p.username }) }
    setRows((data || []).map((m) => ({ ...m, who: names[m.user_id] || 'deleted user' })))
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const term = q.trim().replace(/[%,()*\\]/g, '').slice(0, 60)
    if (to || term.length < 2) { setFound([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id,username,full_name,email').or(`username.ilike.%${term}%,email.ilike.%${term}%,full_name.ilike.%${term}%`).limit(6)
      setFound(data || [])
    }, 250)
    return () => clearTimeout(t)
  }, [q, to])
  const send = async (e) => {
    e.preventDefault()
    if (!to) return setErr('Choose who to send it to.')
    if (!body.trim()) return setErr('Write your message.')
    setBusy(true); setErr(''); setOk('')
    const { error } = await supabase.from('user_messages').insert({ user_id: to.id, subject: subject.trim().slice(0, 80), body: body.trim().slice(0, 1000) })
    setBusy(false)
    if (error) return setErr('Could not send it. Please try again.')
    setOk(`Sent to @${to.username}. They will see it under the message icon on their profile.`)
    setBody(''); setSubject(''); setTo(null); setQ(''); load()
  }
  const confirm = useConfirm()
  const del = async (m) => { if (!(await confirm(delAsk('Delete this message?', 'The learner will no longer see it. This cannot be undone.')))) return; await supabase.from('user_messages').delete().eq('id', m.id); load() }
  const pg = usePager(rows)
  return (
    <>
      <form className="pnl-card pnl-form pnl-pm" onSubmit={send}>
        <h3>Message a learner privately</h3>
        {to ? (
          <div className="pnl-to"><span>To <b>@{to.username}</b> <small className="pnl-dim">{to.email}</small></span><button type="button" className="pnl-btn" onClick={() => { setTo(null); setQ('') }}>Change</button></div>
        ) : (
          <div className="pnl-find">
            <label className="pnl-fld"><span>Find the learner</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a username, name or email" autoComplete="off" /></label>
            {found.length > 0 && <ul className="pnl-found">{found.map((u) => <li key={u.id}><button type="button" onClick={() => { setTo(u); setFound([]) }}><b>@{u.username}</b><small>{u.full_name ? u.full_name + ' · ' : ''}{u.email}</small></button></li>)}</ul>}
          </div>
        )}
        <label className="pnl-fld"><span>Subject (optional)</span><input value={subject} maxLength={80} onChange={(e) => setSubject(e.target.value)} placeholder="Your payment, a reply, a tip..." /></label>
        <label className="pnl-fld"><span>Message <small>{body.length}/1000</small></span><textarea rows={4} value={body} onChange={(e) => setBody(e.target.value.slice(0, 1000))} placeholder="Write your message" /></label>
        <div className="pnl-row"><button className="pnl-btn pnl-go" type="submit" disabled={busy || !to || !body.trim()}>{busy ? 'Sending...' : 'Send message'}</button></div>
        {ok && <p className="pnl-ok">{ok}</p>}
      </form>
      {rows && rows.length > 0 && (
        <>
          <h3 className="pnl-sub">Sent messages</h3>
          <div className="pnl-tw"><table className="pnl-tbl">
            <thead><tr><th>To</th><th>Subject</th><th>Message</th><th>Sent</th><th>Status</th><th className="r">Actions</th></tr></thead>
            <tbody>
              {pg.rows.map((m) => (
                <tr key={m.id}>
                  <td><b>@{m.who}</b></td>
                  <td>{m.subject || '-'}</td>
                  <td className="msg">{m.body}</td>
                  <td className="nw">{when(m.created_at)}</td>
                  <td><b className={`pnl-pill ${m.read ? 'success' : 'pending'}`}>{m.read ? 'read' : 'not read yet'}</b></td>
                  <td className="r"><button className="pnl-btn warn" onClick={() => del(m)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <Pager {...pg.props} />
        </>
      )}
    </>
  )
}

function Coupons() {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const [f, setF] = useState({ code: '', percent: '20', max: '', end: '', note: '' })
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('coupons').select('code,percent,max_uses,uses,expires_at,active,owner_id,note,created_at').order('created_at', { ascending: false }).limit(200)
    if (error) setErr('Could not load coupons. Did you run supabase/upgrade-growth.sql?'); else { setErr(''); setRows(data) }
  }, [])
  useEffect(() => { load() }, [load])
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: k === 'code' ? e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24) : e.target.value }))
  const add = async (e) => {
    e.preventDefault()
    const pc = Math.floor(+f.percent), mx = f.max ? Math.floor(+f.max) : null
    if (!/^[A-Z0-9_-]{3,24}$/.test(f.code)) return setErr('The code needs 3 to 24 letters, numbers, - or _.')
    if (!(pc >= 1 && pc <= 90)) return setErr('Percent off must be between 1 and 90.')
    if (mx !== null && !(mx >= 1)) return setErr('Max uses must be 1 or more, or empty for unlimited.')
    setBusy(true); setErr('')
    const { error } = await supabase.from('coupons').insert({ code: f.code, percent: pc, max_uses: mx, expires_at: f.end ? new Date(f.end + 'T23:59:59').toISOString() : null, note: f.note.trim().slice(0, 80) })
    setBusy(false)
    if (error) return setErr(error.code === '23505' ? 'That code already exists.' : 'Could not create the code.')
    setF({ code: '', percent: '20', max: '', end: '', note: '' }); load()
  }
  const toggle = async (c) => { await supabase.from('coupons').update({ active: !c.active }).eq('code', c.code); load() }
  const confirm = useConfirm()
  const del = async (c) => { if (!(await confirm(delAsk(`Delete ${c.code}?`, 'The code stops working straight away. This cannot be undone.')))) return; await supabase.from('coupons').delete().eq('code', c.code); load() }
  const pg = usePager(rows)
  const state = (c) => (!c.active ? 'off' : c.expires_at && new Date(c.expires_at) < new Date() ? 'expired' : c.max_uses != null && c.uses >= c.max_uses ? 'used up' : 'live')
  return (
    <>
      <form className="pnl-card pnl-form" onSubmit={add}>
        <h3>New discount code</h3>
        <div className="pnl-row">
          <label className="pnl-fld"><span>Code</span><input value={f.code} onChange={set('code')} placeholder="LAUNCH20" autoComplete="off" /></label>
          <label className="pnl-fld"><span>Percent off</span><input type="number" min="1" max="90" value={f.percent} onChange={set('percent')} /></label>
          <label className="pnl-fld"><span>Max uses (empty = unlimited)</span><input type="number" min="1" value={f.max} onChange={set('max')} placeholder="Unlimited" /></label>
          <label className="pnl-fld"><span>Last day (optional)</span><input type="date" value={f.end} onChange={set('end')} /></label>
        </div>
        <div className="pnl-row">
          <label className="pnl-fld grow"><span>Note for yourself (optional)</span><input value={f.note} onChange={set('note')} maxLength={80} placeholder="Launch week promo" /></label>
          <button className="pnl-btn pnl-go" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Create code'}</button>
        </div>
        <p className="pnl-dim">Each person can use a code once. A discounted payment is a one-time charge for that period, so the learner renews at full price. Invite-a-friend rewards appear below as FRIEND-XXXXXX codes.</p>
      </form>
      {err && <p className="pnl-err">{err}</p>}
      {!rows ? <p className="pnl-dim">Loading...</p> : !rows.length ? <p className="pnl-dim">No codes yet.</p> : (
        <div className="pnl-tw"><table className="pnl-tbl">
          <thead><tr><th>Code</th><th>Off</th><th>Used</th><th>Ends</th><th>Status</th><th className="r">Actions</th></tr></thead>
          <tbody>
            {pg.rows.map((c) => (
              <tr key={c.code}>
                <td><b className="mono">{c.code}</b>{c.owner_id && <em className="pnl-tag">reward</em>}{c.note && <small>{c.note}</small>}</td>
                <td>{c.percent}%</td>
                <td>{c.uses}{c.max_uses != null ? ` / ${c.max_uses}` : ''}</td>
                <td>{c.expires_at ? day(c.expires_at) : '-'}</td>
                <td><b className={`pnl-pill ${state(c) === 'live' ? 'success' : 'failed'}`}>{state(c)}</b></td>
                <td className="r"><span className="pnl-acts"><button className="pnl-btn" onClick={() => toggle(c)}>{c.active ? 'Turn off' : 'Turn on'}</button><button className="pnl-btn warn" onClick={() => del(c)}>Delete</button></span></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Pager {...pg.props} />
    </>
  )
}

const AUDIT_ACT = { plan_changed: ['Plan changed', ''], suspended: ['Suspended', 'failed'], restored: ['Restored', 'success'], deleted: ['Deleted', 'failed'], plan_expired: ['Plan ended', 'pending'], payment_verified: ['Payment confirmed', 'success'], password_reset: ['Password reset', 'pending'] }
const AUDIT_FILTER = [['all', 'All'], ['plan_changed', 'Plan changed'], ['suspended', 'Suspended'], ['restored', 'Restored'], ['deleted', 'Deleted'], ['plan_expired', 'Plan ended'], ['payment_verified', 'Payment confirmed'], ['password_reset', 'Password reset']]
function Audit() {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  useEffect(() => { setPage(0) }, [filter, size])
  const load = useCallback(async () => {
    let req = supabase.from('audit_log').select('id,actor_name,action,target_name,detail,created_at', { count: 'exact' }).order('created_at', { ascending: false }).range(page * size, page * size + size - 1)
    if (filter !== 'all') req = req.eq('action', filter)
    const { data, error, count } = await req
    if (error) setErr('Could not load the audit log. Did you run supabase/upgrade-growth2.sql?'); else { setErr(''); setRows(data); setTotal(count || 0) }
  }, [filter, page, size])
  useEffect(() => { load() }, [load])
  return (
    <>
      <div className="pnl-tools">
        <div className="pnl-chips" role="group" aria-label="Filter">{AUDIT_FILTER.map(([v, t]) => <button key={v} className={filter === v ? 'on' : ''} onClick={() => setFilter(v)}>{t}</button>)}</div>
      </div>
      <p className="pnl-dim pnl-sum">A permanent record of who suspended, restored or deleted an account or changed a plan, and when. It cannot be edited.</p>
      {err && <p className="pnl-err">{err}</p>}
      {!rows ? (!err && <p className="pnl-dim">Loading...</p>) : !rows.length ? <p className="pnl-dim">Nothing recorded yet. Entries appear here when you suspend, restore or delete a user, or change a plan.</p> : (
        <div className="pnl-tw"><table className="pnl-tbl">
          <thead><tr><th>When</th><th>Done by</th><th>Action</th><th>User</th><th>Details</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const [label, tone] = AUDIT_ACT[r.action] || [r.action, '']
              return (
                <tr key={r.id}>
                  <td className="nw">{when(r.created_at)}<small>{ago(r.created_at)}</small></td>
                  <td><b>{r.actor_name === 'system' ? 'System' : '@' + r.actor_name}</b></td>
                  <td><b className={`pnl-pill ${tone}`}>{label}</b></td>
                  <td>{r.target_name ? '@' + r.target_name : '-'}</td>
                  <td className="mut">{r.detail || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table></div>
      )}
      <Pager page={page} size={size} total={total} onPage={setPage} onSize={setSize} />
    </>
  )
}

export default function Admin() {
  const { user, ready } = useAuth()
  const [tab, setTab] = useState('overview')
  const [ov, setOv] = useState(null)
  const [ovErr, setOvErr] = useState('')
  const allowed = BACKEND === 'supabase' && !!user && !user.guest && user.isAdmin
  useEffect(() => { document.title = 'Admin · Shellwise' }, [])
  const loadOv = useCallback(async () => {
    try { await supabase.rpc('expire_plans') } catch (e) { /* optional */ }
    const { data, error } = await supabase.rpc('admin_overview')
    if (error) setOvErr('Could not load the overview. Did you run supabase/admin.sql?'); else { setOvErr(''); setOv(data) }
  }, [])
  useEffect(() => {
    if (!allowed) return
    loadOv(); const t = setInterval(loadOv, 30000); return () => clearInterval(t)
  }, [allowed, loadOv])
  // Phone menu: the sidebar becomes a drawer that slides in from the left.
  const [range, setRange] = useState(6) // months shown on the Dashboard
  const [menu, setMenu] = useState(false)
  useEffect(() => {
    if (!menu) return
    const k = (e) => { if (e.key === 'Escape') setMenu(false) }
    document.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [menu])
  useEffect(() => {
    const m = window.matchMedia('(min-width:901px)')
    const f = () => { if (m.matches) setMenu(false) }
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  const title = useMemo(() => TABS.find((t) => t[0] === tab)[1], [tab])

  if (BACKEND !== 'supabase') return <main className="pnl-gate"><h1>Admin panel</h1><p>The admin panel needs the real backend. Connect Supabase (see the README), run <code>supabase/admin.sql</code>, then open this page again.</p><Link to="/">Back to the site</Link></main>
  if (!ready) return <AdLoader />
  // Not signed in: go to the login page and come back here. Signed in but not an admin: back to the site.
  if (!allowed) return <Navigate to={user && !user.guest ? '/' : '/auth?mode=login&next=%2Fadmin'} replace />
  return (
    <ConfirmHost>
    <div className="pnl">
      <header className="pnl-mbar">
        <button type="button" className="pnl-burger" aria-label="Open menu" aria-expanded={menu} aria-controls="pnl-drawer" onClick={() => setMenu(true)}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <span className="pnl-mtitle">Shellwise <em>admin</em></span>
        <span className="pnl-av">{user.avatar ? <img src={user.avatar} alt="" /> : (user.user || '?').slice(0, 1).toUpperCase()}</span>
      </header>
      <div className={`pnl-scrim${menu ? ' on' : ''}`} onClick={() => setMenu(false)} aria-hidden="true" />
      <aside className={`pnl-side${menu ? ' open' : ''}`} id="pnl-drawer" aria-label="Menu">
        <button type="button" className="pnl-sclose" aria-label="Close menu" onClick={() => setMenu(false)}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" /></svg>
        </button>
        <Link className="pnl-brand" to="/"><img src="/assets/kali-logo-white.svg" alt="" width="18" height="18" /><span>Shellwise <em>admin</em></span></Link>
        <nav aria-label="Admin sections">{TABS.map(([v, t]) => <button key={v} className={tab === v ? 'on' : ''} onClick={() => { setTab(v); setMenu(false) }}><span className="pnl-nl">{ICON[v]}{t}</span>{v === 'overview' && ov ? <i>{ov.online} online</i> : null}</button>)}</nav>
        <Link className="pnl-out" to="/lab">{ICON.lab}Open the lab</Link>
        <div className="pnl-me">
          <span className="pnl-av">{user.avatar ? <img src={user.avatar} alt="" /> : (user.user || '?').slice(0, 1).toUpperCase()}</span>
          <span className="pnl-meinfo"><b>{user.user}</b><small>Administrator</small></span>
        </div>
      </aside>
      <main className="pnl-main">
        <header className="pnl-head">
          <div>
            {tab === 'overview'
              ? <><h1>Good day, {(user.name || user.user || 'there').trim().split(/\s+/)[0]} <span className="pnl-wave" aria-hidden="true">👋</span></h1><p className="pnl-dim">Here&apos;s an overview of your platform performance.</p></>
              : <><h1>{title}</h1><p className="pnl-dim">Signed in as {user.email}</p></>}
          </div>
          <div className="pnl-act">
            {tab === 'overview' && (
              <label className="pnl-range">{KI.cal}
                <select value={range} onChange={(e) => setRange(+e.target.value)} aria-label="Date range"><option value={3}>Last 3 months</option><option value={6}>Last 6 months</option></select>
                {KI.chev}
              </label>
            )}
            <Bell onGo={setTab} /><Link className="pnl-btn" to="/">View site</Link>
          </div>
        </header>
        {tab === 'overview' && <Overview data={ov} err={ovErr} range={range} />}
        {tab === 'users' && <Users me={user.id} />}
        {tab === 'payments' && <Payments />}
        {tab === 'messages' && <Messages />}
        {tab === 'announcements' && <Announcements />}
        {tab === 'coupons' && <Coupons />}
        {tab === 'audit' && <Audit />}
      </main>
    </div>
    </ConfirmHost>
  )
}
