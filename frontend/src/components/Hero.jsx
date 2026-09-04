import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__stage">
        <img
          className="hero__image"
          src="/demo/portfolio/weddings/01.jpg"
          alt="Newlyweds standing together in a mountain landscape"
        />
        <div className="hero__veil" />
        <div className="hero__content">
          <span className="hero__eyebrow">Digital photo + video coverage</span>
          <h1 className="hero__title">
            Stories worth<br />keeping.
          </h1>
          <p className="hero__subtitle">
            Honest photographs of weddings, portraits, and the people at the center of them.
          </p>
          <div className="hero__actions">
            <Link to="/portfolio" className="btn btn--primary">Explore the work</Link>
            <Link to="/booking" className="hero__text-link">Start a booking ↗</Link>
          </div>
        </div>
      </div>
      <div className="hero__footer">
        <span>Based in Pangasinan</span>
        <span>Available for stories everywhere</span>
        <span aria-hidden="true">Scroll ↓</span>
      </div>
    </section>
  )
}
