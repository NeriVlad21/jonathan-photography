import { Link } from 'react-router-dom'
import { ArrowDown } from 'lucide-react'

export default function Hero() {
  return (
    <section className="hero">
      <div
        className="hero__bg"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1974&auto=format&fit=crop')" }}
        role="img"
        aria-label="Black and white wedding photograph"
      />
      <div className="hero__content">
        <span className="eyebrow hero__eyebrow" style={{ color: '#F5D000' }}>Digital Photo &amp; Video Coverage</span>
        <h1 className="display hero__title">
          JONATHAN<br /><em>Photography</em>
        </h1>
        <p className="hero__subtitle">
          An editorial studio for weddings, portraits, and the occasions
          people actually want to remember properly.
        </p>
        <div className="hero__actions">
          <Link to="/portfolio" className="btn btn--primary">View the Work</Link>
          <Link to="/booking" className="btn btn--ghost-dark">Book a Session</Link>
        </div>
      </div>
      <div className="hero__scroll-cue">
        <span>Scroll</span>
        <span />
      </div>
    </section>
  )
}
