import { useEffect, useState } from 'react'
import { RM, useShell } from '../components/shell.jsx'
import { ArrowIcon } from '../components/Icon.jsx'
import { useNavigate } from 'react-router-dom'
import { STATS } from '../data/site.js'

const SCRIPT = [
  ['whoami', 'kali'],
  ['ls', 'Desktop  Documents  notes.txt  tools'],
  ['cat notes.txt', 'today: learn pipes, then try the quiz'],
  ['ping -c 2 localhost', '2 packets transmitted, 2 received, 0% packet loss'],
  ['sudo apt update', 'Reading package lists... Done'],
]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function Prompt() {
  return <><span className="pp">kali@lab</span><span className="dm">:</span><span className="bl">~</span><span className="dm">$ </span></>
}

// The looping typing animation in the hero.
function TerminalDemo() {
  const [done, setDone] = useState(RM ? SCRIPT : [])
  const [typing, setTyping] = useState(null)
  useEffect(() => {
    if (RM) return
    let alive = true
    ;(async () => {
      while (alive) {
        setDone([])
        for (const [c, o] of SCRIPT) {
          let t = ''
          setTyping('')
          for (const ch of c) { if (!alive) return; t += ch; setTyping(t); await sleep(55 + Math.random() * 60) }
          await sleep(320)
          if (!alive) return
          setTyping(null); setDone((d) => [...d, [c, o]])
          await sleep(900)
        }
        await sleep(2200)
      }
    })()
    return () => { alive = false }
  }, [])
  return (
    <pre id="demo" aria-hidden="true">
      {done.map(([c, o], i) => <span key={i}><Prompt /><span className="cm">{c}</span>{'\n'}<span className="dm">{o}</span>{'\n'}</span>)}
      {typing !== null && <><Prompt /><span className="cm">{typing}</span></>}
      {typing === null && <Prompt />}
      <span className="cur" />
    </pre>
  )
}

export default function Hero() {
  const { scrollToId } = useShell()
  const nav = useNavigate()
  return (
    <div className="hero"><div className="wrap">
      <div>
        <h1 className="in">Learn the Linux terminal by using it.<span>No install. No risk.</span></h1>
        <p className="lede in">Shellwise is a practice terminal in your browser, with {STATS.modules} guided modules, quizzes and {STATS.games} games. Type real commands, break things safely, and see what happens.</p>
        <div className="cta-row in">
          <button className="lp-guest" onClick={() => nav('/auth?mode=signup')}><span>Start learning free</span><ArrowIcon /></button>
          <button className="lp-guest ghost" onClick={() => scrollToId('features')}>Explore the lab</button>
        </div>
      </div>
      <div className="demo" aria-label="Animated example of the terminal">
        <div className="demo-bar"><b /><b /><b /><span>kali@lab: ~</span></div>
        <TerminalDemo />
      </div>
    </div></div>
  )
}
