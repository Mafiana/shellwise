import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useShell } from './shell.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { SunIcon, MoonIcon, UserIcon } from './Icon.jsx'

export default function Nav({ light, setLight }) {
  const { scrollToId } = useShell()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const signedIn = user && !user.guest
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    if (!open) return
    const k = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [open])

  const go = (fn) => () => { setOpen(false); fn() }
  const HIDE_DESKTOP = ['Features', 'How it works', 'Did you know', 'Plans'] // still shown in the mobile menu
  const links = [
    ['Home', () => nav('/'), pathname === '/'],
    ['Features', () => scrollToId('features')],
    ['How it works', () => scrollToId('how')],
    ['Did you know', () => scrollToId('dyk')],
    ['Plans', () => scrollToId('plans')],
    ['About', () => nav('/about'), pathname === '/about'],
    ['Contact', () => scrollToId('contact')],
  ]
  return (
    <header className={`lp-nav${open ? ' menu-open' : ''}`}>
      <div className="wrap">
        <button className="lp-brand" onClick={() => nav('/')} aria-label="Shellwise home">
          <i><img src="/assets/kali-logo-white.svg" alt="" width="18" height="18" /></i><span>Shellwise</span>
        </button>
        <nav className="lp-links" aria-label="Site">
          {links.filter(([t]) => !HIDE_DESKTOP.includes(t)).map(([t, fn, on]) => <button key={t} className={on ? 'on' : ''} onClick={fn}>{t}</button>)}
        </nav>
        <div className="lp-tools">
          <button className="lp-theme" onClick={() => setLight((v) => !v)} aria-label="Switch colour theme" title="Switch colour theme">
            <SunIcon /><MoonIcon />
          </button>
          {signedIn ? (
            <button className="lp-login" onClick={() => nav('/lab')} aria-label="Open the lab">{user.avatar ? <img className="nav-av" src={user.avatar} alt="" /> : <UserIcon />}<span>{user.user}</span></button>
          ) : (
            <button className="lp-login" onClick={() => nav('/auth?mode=login')}><UserIcon /><span>Log in</span></button>
          )}
          <button className="lp-burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="lp-mnav" onClick={() => setOpen((v) => !v)}>
            <i /><i /><i />
          </button>
        </div>
      </div>
      <div className="lp-mnav" id="lp-mnav" hidden={!open}>
        {links.map(([t, fn, on]) => <button key={t} className={on ? 'on' : ''} onClick={go(fn)}>{t}</button>)}
      </div>
    </header>
  )
}
