import { Link, useNavigate } from 'react-router-dom'
import { useShell } from './shell.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { useEnter } from './EnterOverlay.jsx'
import { WHATSAPP } from '../data/site.js'

export default function Footer() {
  const { scrollToId } = useShell()
  const nav = useNavigate()
  const { user } = useAuth()
  const enter = useEnter()
  return (
    <footer className="lp-foot">
      <div className="wrap">
        <div className="ft">
          <div>
            <button className="lp-brand" onClick={() => nav('/')} style={{ color: '#fff' }}>
              <i><img src="/assets/kali-logo-white.svg" alt="" width="18" height="18" /></i><span>Shellwise</span>
            </button>
            <p>A safe place to practise the Linux command line and cybersecurity basics.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><button onClick={() => scrollToId('how')}>How it works</button></li>
              <li><button onClick={() => scrollToId('dyk')}>Did you know</button></li>
              <li><button onClick={() => scrollToId('plans')}>Plans</button></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About us</Link></li>
              <li><Link to="/about">FAQ</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms and Conditions</Link></li>
            </ul>
          </div>
          <div>
            <h4>Community</h4>
            <ul>
              <li><a href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp group</a></li>
              {user && !user.guest && <li><button onClick={() => enter('Starting your lab')}>Open the lab</button></li>}
            </ul>
          </div>
        </div>
        <div className="ft-bot">
          <span>© {new Date().getFullYear()} Shellwise. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
