import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import EditorialImage from '../components/EditorialImage.jsx'
import { portfolioApi, servicesApi } from '../services/api.js'

export default function Home() {
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => {
    portfolioApi.categories().then((c) => setCategories(c.slice(0, 4))).catch(() => {})
    servicesApi.list().then((s) => setServices(s.slice(0, 4))).catch(() => {})
  }, [])

  return (
    <>
      <Hero />

      {/* Editorial introduction */}
      <section className="section">
        <div className="container intro">
          <p className="display intro__statement">
            "NOT JUST<br /><em>A PHOTO.</em>"
          </p>
          <div className="intro__body">
            <p>
              A photograph is the only part of a day that gets to happen twice —
              once when it's lived, and again every time someone looks at it.
              We treat that second time as seriously as the first.
            </p>
            <p>
              Jonathan Photography covers weddings, portraits, and the occasions
              in between with the same editorial attention: real light, real
              moments, and an edit that holds up years later.
            </p>
            <Link to="/portfolio" className="text-link">See the Work →</Link>
          </div>
        </div>
      </section>

      {/* Portfolio preview */}
      <section className="section section--tight">
        <div className="container">
          <SectionHeader
            eyebrow="Selected Work"
            title="The Portfolio"
            desc="Four categories, built one story at a time."
            action={<Link to="/portfolio" className="text-link">View All →</Link>}
          />
        </div>
        <div className="container">
          <div className="preview-strip">
            {categories.map((c) => (
              <Link key={c.id} to={`/portfolio/${c.slug}`} className="preview-strip__item">
                <EditorialImage src={c.cover_image} alt={c.name} caption={c.name} style={{ height: '100%' }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services teaser */}
      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="What We Offer"
            title="Services"
            action={<Link to="/services" className="text-link">See All Services →</Link>}
          />
          <div className="service-list">
            {services.map((s, i) => (
              <div className="service-row" key={s.id}>
                <span className="service-row__num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="display service-row__name">{s.name}</div>
                </div>
                <div className="service-row__price">
                  {s.starting_price ? `From ₱${Number(s.starting_price).toLocaleString()}` : 'Inquire'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estimator CTA */}
      <section className="section--dark">
        <div className="container" style={{ textAlign: 'center', padding: '20px 0' }}>
          <span className="eyebrow eyebrow--on-dark">Build Your Package</span>
          <h2 className="display" style={{ fontSize: 'var(--fluid-h2)', color: '#F7F7F5', margin: '16px 0 28px' }}>
            Get a real number,<br /><em style={{ color: '#F5D000', fontStyle: 'italic' }}>before the conversation.</em>
          </h2>
          <Link to="/estimator" className="btn btn--primary">Build My Estimate</Link>
        </div>
      </section>
    </>
  )
}
