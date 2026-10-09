import Icon, { LinkedInIcon, TagIcon } from '../components/Icon.jsx'
import { useShell } from '../components/shell.jsx'
import { FOUNDER_NAME, FOUNDER_IMG, FOUNDER_BIO, LINKEDIN } from '../data/site.js'

export default function About() {
  const { scrollToId } = useShell()
  return (
    <section className="lp-view on" id="v-about">
      <div className="ab-hero"><div className="wrap"><h1>I built the practice room I wished I had.</h1><p>Shellwise exists so anyone can learn the command line and the basics of cybersecurity safely, on any device, without installing anything.</p></div></div>
      <section className="sec paper"><div className="wrap">
        <div className="ab-grid" style={{ marginBottom: 64 }}>
          <div><h3>Our story</h3><p>Learning Linux usually means setting up a virtual machine before you type a single command. That stops many people before they start.</p><p>So we put the terminal in the browser. It runs a simulated system with a real-feeling filesystem, users and logs, which means a mistake costs nothing.</p></div>
          <div><h3>What we focus on</h3><p>Defensive skills and understanding. You learn how systems work, how to read logs, and how to spot trouble.</p><p>The lab only simulates diagnostic tools, and scanning only ever targets the lab's own machine.</p></div>
        </div>
        <h2 className="reveal" style={{ fontSize: 36 }}>What we believe</h2><br />
        <div className="vals">
          <div className="val reveal"><div className="ic" style={{ marginBottom: 4 }}><Icon name="wrench" /></div><h3>Learn by doing</h3><p>Every concept comes with something to run, not just read.</p></div>
          <div className="val reveal"><div className="ic" style={{ marginBottom: 4 }}><Icon name="shield-check" /></div><h3>Safe by design</h3><p>Nothing here touches your computer or any real network.</p></div>
          <div className="val reveal"><div className="ic" style={{ marginBottom: 4 }}><Icon name="earth" /></div><h3>Open to everyone</h3><p>Free to try and it works on phones.</p></div>
        </div>
      </div></section>
      <section className="sec lp-band"><div className="wrap">
        <h2 className="reveal">Meet the founder</h2>
        <div className="founder reveal">
          <img className="fo-img" src={FOUNDER_IMG} alt={`Portrait of ${FOUNDER_NAME}`} width="260" height="260" />
          <div>
            <h3>{FOUNDER_NAME}</h3><p className="fo-role">The Founder</p>
            <p>{FOUNDER_BIO}</p>
            <a className="fo-in" href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label={`${FOUNDER_NAME} on LinkedIn`}><LinkedInIcon /><span>Connect on LinkedIn</span></a>
          </div>
        </div>
      </div></section>
      <section className="sec paper faq"><div className="wrap" style={{ maxWidth: 820 }}>
        <h2 className="reveal">Common questions</h2><br />
        <details><summary>Do I need to install anything?</summary><p>No. Everything runs in your browser. Open the page and select a plan.</p></details>
        <details><summary>Will it change files on my computer?</summary><p>No. The terminal works on a simulated filesystem inside the page. Your real files are never touched.</p></details>
        <details><summary>Where is my progress saved?</summary><p>Your account details and plan are stored securely online, so they follow you to any device when you log in. On the Learner and Pro plans your lab progress (XP, badges, completed missions and your certificate) is saved to your account and syncs across devices. On the Free plan your progress stays in this browser on this device, so clearing your browser data removes it. Upgrade at any time to keep it safe online.</p></details>
        <details><summary>What is the sudo password?</summary><p>kali. The lab uses it for sudo and su.</p></details>
        <details><summary>Can I use Shellwise on my phone?</summary><p>Yes. The site works on phones and tablets, but the terminal is easier to use with a keyboard on a laptop or desktop.</p></details>
        <details><summary>How do I pay?</summary><p>Paid plans are paid through Paystack with a card or bank transfer. You enter your details on Paystack's page, not ours.</p></details>
      </div></section>
      <section className="final final-bg"><div className="wrap"><h2 className="reveal">Ready to try it?</h2><p className="fb-sub reveal">Pick a plan, create your account and start practising in under a minute.</p><div className="reveal"><button className="lp-guest" onClick={() => scrollToId('plans')}><TagIcon /><span>Select plan</span></button></div></div></section>
    </section>
  )
}
