import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'
import { BACKEND } from '../lib/config.js'
import { supabase } from '../lib/supabase.js'

function goLetsTalk() {
  // Hard navigation so mobile always lands on homepage Let's talk
  try {
    window.location.assign(window.location.origin + '/#contact')
  } catch {
    window.location.href = '/#contact'
  }
}

/**
 * Suspension modal (desktop + mobile). Portaled to document.body so nothing clips it.
 * Chat with admin → homepage #contact (Let's talk).
 */
export default function SuspendedGuard() {
  const { user, signOut, ready } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const trigger = useCallback(() => {
    if (!user || user.guest || user.isAdmin) return
    setOpen(true)
  }, [user])

  useEffect(() => {
    if (user?.suspended) trigger()
  }, [user?.suspended, trigger])

  useEffect(() => {
    if (BACKEND !== 'supabase' || !ready || !user?.id || user.guest) return
    const channel = supabase
      .channel('suspend-' + user.id)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'id=eq.' + user.id },
        (payload) => {
          if (payload?.new?.suspended) trigger()
        }
      )
      .subscribe()
    return () => {
      try { supabase.removeChannel(channel) } catch { /* ignore */ }
    }
  }, [ready, user?.id, user?.guest, trigger])

  useEffect(() => {
    if (BACKEND !== 'supabase' || !user?.id || user.guest || open) return
    let stop = false
    const check = async () => {
      if (stop) return
      try {
        const { data } = await supabase.from('profiles').select('suspended').eq('id', user.id).maybeSingle()
        if (data?.suspended) trigger()
      } catch { /* ignore */ }
    }
    check()
    const t = setInterval(check, 10000)
    const onVis = () => { if (!document.hidden) check() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stop = true
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [user?.id, user?.guest, open, trigger])

  // Lock body scroll while modal is open (helps mobile)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const onClose = async () => {
    setBusy(true)
    try { await signOut() } catch { /* ignore */ }
    setOpen(false)
    setBusy(false)
    try { nav('/', { replace: true }) } catch { window.location.href = '/' }
  }

  const onChat = async () => {
    setBusy(true)
    setOpen(false)
    try { await signOut() } catch { /* ignore */ }
    goLetsTalk()
  }

  if (!open || typeof document === 'undefined') return null

  const modal = (
    <div className="sw-sus-ov" role="alertdialog" aria-modal="true" aria-labelledby="sw-sus-title" style={S.ov}>
      <div style={S.box}>
        <div style={S.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="#ff6b7a" strokeWidth="1.8" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#ff6b7a" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.4" fill="#ff6b7a" />
          </svg>
        </div>
        <h2 id="sw-sus-title" style={S.h}>Account suspended</h2>
        <p style={S.p}>
          An admin has suspended your account. Use the Let&apos;s talk box on the homepage to reach support, or Close to sign out.
        </p>
        <div style={S.row}>
          <button type="button" style={S.ghost} onClick={onClose} disabled={busy}>
            {busy ? 'Signing out…' : 'Close'}
          </button>
          <button type="button" style={S.pri} onClick={onChat} disabled={busy}>
            Chat with admin
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

const S = {
  ov: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    minHeight: '100dvh',
    zIndex: 2147483000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))',
    boxSizing: 'border-box',
    background: 'rgba(4,8,18,.88)',
    WebkitOverflowScrolling: 'touch',
    overflowY: 'auto',
    pointerEvents: 'auto',
  },
  box: {
    width: '100%',
    maxWidth: 400,
    margin: 'auto',
    borderRadius: 18,
    padding: '26px 22px 22px',
    border: '1px solid #ff6b7a55',
    background: 'linear-gradient(165deg,#1a0e14,#0b1220)',
    boxShadow: '0 28px 70px #000c, 0 0 40px #ff6b7a22',
    color: '#e8eefc',
    fontFamily: 'Inter, system-ui, sans-serif',
    textAlign: 'center',
    pointerEvents: 'auto',
  },
  icon: { display: 'grid', placeItems: 'center', marginBottom: 12 },
  h: { margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: '#ff8a96', letterSpacing: '.02em' },
  p: { margin: '0 0 18px', color: '#a8b6d4', fontSize: 14.5, lineHeight: 1.55 },
  row: { display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  ghost: {
    flex: 1, minWidth: 120, padding: '14px 14px', borderRadius: 11, cursor: 'pointer',
    border: '1px solid #ffffff28', background: '#ffffff12', color: '#e8eefc', fontWeight: 700, fontSize: 15,
    WebkitTapHighlightColor: 'transparent',
  },
  pri: {
    flex: 1, minWidth: 120, padding: '14px 14px', borderRadius: 11, cursor: 'pointer', border: 0,
    background: 'linear-gradient(135deg,#ff6b7a,#c62839)', color: '#fff', fontWeight: 700, fontSize: 15,
    WebkitTapHighlightColor: 'transparent',
  },
}
