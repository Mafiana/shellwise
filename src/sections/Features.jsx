import Icon from '../components/Icon.jsx'
import { STATS } from '../data/site.js'

export default function Features() {
  return (
    <section className="sec" id="features"><div className="wrap">
      <h2 className="reveal">Everything you need to get comfortable on the command line</h2>
      <p className="sub reveal">Start with the basics and work up to logs, permissions and scripting, all in one place.</p>
      <div className="bento">
        <article className="bx k1 reveal"><div className="ic"><Icon name="terminal" /></div><h3>A terminal that behaves like one</h3>
          <p>Pipes, permissions, sudo, history, loops and a text editor all work. When you get it wrong, you see the same errors a real system gives.</p>
          <code><i>kali@lab:~$</i> cat /var/log/auth.log | grep Failed<br /><i>kali@lab:~$</i> sudo systemctl status ssh</code></article>
        <article className="bx k2 reveal"><div className="ic"><Icon name="book-open" /></div><h3>{STATS.modules} guided modules</h3><p>Each lesson gives you a task to run yourself, then checks the result.</p></article>
        <article className="bx k3 reveal"><div className="ic"><Icon name="brain" /></div><h3>Quizzes that teach</h3><p>Streaks, scores, and a review of every question you missed.</p></article>
        <article className="bx k4 reveal"><div className="ic"><Icon name="gamepad-2" /></div><h3>{STATS.games} games</h3><p>Wordle-style puzzles, cipher breaking, phishing spotting and timed command races.</p></article>
        <article className="bx k5 reveal"><div className="ic"><Icon name="trophy" /></div><h3>Progress and badges</h3><p>Earn XP, level up and see your module map fill in.</p></article>
        <article className="bx k6 reveal"><div className="ic"><Icon name="briefcase" /></div><h3>Career paths</h3><p>Explore 23 cybersecurity roles and what each one needs.</p></article>
      </div>
    </div></section>
  )
}
