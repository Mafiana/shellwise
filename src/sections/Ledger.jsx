import Icon from '../components/Icon.jsx'
import { CountUp } from '../components/shell.jsx'
import { STATS } from '../data/site.js'

const ROWS = [
  { icon: 'book-open', c: '#2f8cff', n: STATS.modules, t: 'Guided modules', d: 'From ls and cd to permissions, logs and shell scripting. Each lesson sets a task and checks your answer.', chips: ['Linux basics', 'Permissions', 'Logs'] },
  { icon: 'terminal', c: '#22c37a', n: STATS.commands, plus: 1, t: 'Working commands', d: 'Pipes, sudo, cron, systemctl and more, running in a safe simulated system.', chips: ['grep', 'sudo', 'cron'] },
  { icon: 'gamepad-2', c: '#ffb454', n: STATS.games, t: 'Games', d: 'Ciphers, phishing spotting, log reading and timed command races.', chips: ['Ciphers', 'Phishing', 'Races'] },
  { icon: 'brain', c: '#a78bfa', n: STATS.quizzes, t: 'Quizzes', d: 'One per module, plus topic quizzes and a mixed review of what you missed.', chips: ['Per module', 'Topics', 'Review'] },
]

export default function Ledger() {
  return (
    <div className="ix"><div className="wrap">
      <header className="ix-head reveal"><span className="ix-k">The lab</span><h2>What is inside the lab</h2><p>Four things, one place. Start anywhere and work up at your own pace.</p></header>
      <div className="ix-grid">
        {ROWS.map((r) => (
          <article className="ix-card reveal" key={r.t} style={{ '--c': r.c }}>
            <div className="ix-ic"><Icon name={r.icon} /></div>
            <b className="ix-n"><CountUp n={r.n} plus={r.plus} /></b>
            <h3>{r.t}</h3>
            <p>{r.d}</p>
            <ul>{r.chips.map((x) => <li key={x}>{x}</li>)}</ul>
          </article>
        ))}
      </div>
    </div></div>
  )
}
