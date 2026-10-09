import Hero from '../sections/Hero.jsx'
import Ledger from '../sections/Ledger.jsx'
import Features from '../sections/Features.jsx'
import DidYouKnow from '../sections/DidYouKnow.jsx'
import HowItWorks from '../sections/HowItWorks.jsx'
import Testimonials from '../sections/Testimonials.jsx'
import Plans from '../sections/Plans.jsx'
import Certifications from '../sections/Certifications.jsx'
import Contact from '../sections/Contact.jsx'

export default function Home() {
  return (
    <section className="lp-view on" id="v-home">
      <Hero /><Ledger /><Features /><DidYouKnow /><HowItWorks /><Testimonials /><Plans /><Certifications /><Contact />
    </section>
  )
}
