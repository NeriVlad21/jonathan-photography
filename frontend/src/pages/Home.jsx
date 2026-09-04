import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import EditorialImage from '../components/EditorialImage.jsx'
import { portfolioApi, servicesApi } from '../services/api.js'
import { temporaryPhotosForCategory } from '../data/temporaryPortfolio.js'

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
          <p className="intro__statement">
            The day moves quickly.<br /><em>The photographs should not.</em>
          </p>
          <div className="intro__body">
            <p>
              A photograph is the part of a day that gets to happen twice—once
              when it is lived, and again whenever someone returns to it.
            </p>
            <p>
              We photograph weddings, portraits, and everything in between with
              a calm approach, honest color, and attention to the people who make
              the moment matter.
            </p>
            <Link to="/portfolio" className="text-link">See the Work →</Link>
          </div>
        </div>
      </section>

      {/* Portfolio preview */}
      <section id="selected-work" className="section section--tight">
        <div className="container">
          <SectionHeader
            eyebrow="Selected Work"
            title="Selected work"
            desc="A few moments from recent celebrations, portraits, and events."
            action={<Link to="/portfolio" className="text-link">View All →</Link>}
          />
        </div>
        <div className="container">
          <div className="preview-strip">
            {categories.map((c) => (
              <Link key={c.id} to={`/portfolio/${c.slug}`} className="preview-strip__item">
                <EditorialImage
                  src={temporaryPhotosForCategory(c.slug, c.name)[0].image_path}
                  alt={c.name}
                  caption={c.name}
                  style={{ height: '100%' }}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services teaser */}
      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="What we offer"
            title="Simple coverage, thoughtfully made."
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
      <section className="home-estimator-cta">
        <div className="container">
          <span className="eyebrow">Build your package</span>
          <h2>
            Get a clear starting price<br />before the conversation.
          </h2>
          <Link to="/estimator" className="btn btn--dark">Build my estimate</Link>
        </div>
      </section>
    </>
  )
}
