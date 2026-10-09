const STEPS = [
  ['Select a plan', 'Sign up and go straight to the terminal.'],
  ['Pick a module', 'Start with the basics or jump to a topic you need.'],
  ['Run the task', 'Type the command. The lab checks it and explains the result.'],
  ['Test yourself', 'Take a quiz or play a game to lock it in.'],
]
export default function HowItWorks() {
  return (
    <section className="sec paper" id="how"><div className="wrap">
      <h2 className="reveal">From first command to confident in four steps</h2>
      <p className="sub reveal">There is nothing to set up. Open the app and start typing.</p>
      <div className="steps">{STEPS.map(([h, p]) => <div className="step reveal" key={h}><h3>{h}</h3><p>{p}</p></div>)}</div>
    </div></section>
  )
}
