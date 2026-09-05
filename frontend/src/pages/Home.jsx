import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import EditorialImage from '../components/EditorialImage.jsx'
import Faq from '../components/Faq.jsx'
import { portfolioApi, servicesApi } from '../services/api.js'
import { temporaryPhotosForCategory } from '../data/temporaryPortfolio.js'

export default function Home() {
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => {
    portfolioApi.categories().then((c) => setCategories(c.slice(0, 4))).catch(() => {})
    servicesApi.list().then((s) => setServices(s.slice(0, 4))).catch(() => {})
  }, [])

  useEffect(() => {
    const sectionId = location.hash.slice(1)
    if (!['about', 'faq'].includes(sectionId)) return
    requestAnimationFrame(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' }))
  }, [location.hash])

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

      <section id="about" className="section home-about">
        <div className="container home-about__inner">
          <div className="home-about__label">who we are</div>
          <div className="home-about__copy">
            Jonathan Photography is a local photo and video studio based in
            Sison, Pangasinan. We document people as they are—calmly,
            honestly, and with careful attention to the moments that make each
            celebration personal.
          </div>

          <div className="home-about__label">what we do</div>
          <div className="home-about__skills" aria-label="Photography services">
            {['Weddings', 'Engagements', 'Portraits', 'Birthdays', 'Christenings', 'Debuts', 'Events', 'Photo & Video'].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

          <p className="home-about__closing">
            From the first estimate to the finished photographs, every request
            is reviewed personally. <Link to="/contact">Talk with the studio.</Link>
          </p>
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
          <Link to="/booking" className="btn btn--dark">Estimate &amp; request a session</Link>
        </div>
      </section>

      <Faq />
    </>
  )
}
