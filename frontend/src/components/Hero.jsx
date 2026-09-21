import { Link } from 'react-router-dom'
import { assetUrl } from '../services/api.js'
import { useSiteContent } from '../context/SiteContentContext.jsx'

export default function Hero() {
  const { hero } = useSiteContent()
  return (
    <section className="hero">
      <div className="hero__stage">
        <img
          className="hero__image"
          src={assetUrl(hero.image)}
          alt={hero.imageAlt}
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero__veil" />
        <div className="hero__content">
          <span className="hero__eyebrow">{hero.eyebrow}</span>
          <h1 className="hero__title" style={{ whiteSpace: 'pre-line' }}>{hero.title}</h1>
          <p className="hero__subtitle">{hero.subtitle}</p>
          <div className="hero__actions">
            <Link to="/portfolio" className="btn btn--primary">{hero.primaryLabel}</Link>
            <Link to="/booking" className="hero__text-link">{hero.secondaryLabel}</Link>
          </div>
        </div>
      </div>
      <div className="hero__footer">
        <span>{hero.location}</span>
        <span>{hero.availability}</span>
        <span aria-hidden="true">Scroll ↓</span>
      </div>
    </section>
  )
}
