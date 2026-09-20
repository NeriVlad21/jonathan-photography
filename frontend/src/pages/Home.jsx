import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Play } from 'lucide-react'
import Hero from '../components/Hero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import EditorialImage from '../components/EditorialImage.jsx'
import Faq from '../components/Faq.jsx'
import { portfolioApi, servicesApi } from '../services/api.js'
import { temporaryPhotosForCategory } from '../data/temporaryPortfolio.js'
import { useMusicPlayer } from '../context/MusicPlayerContext.jsx'
import { useSiteContent } from '../context/SiteContentContext.jsx'

const FALLBACK_CATEGORIES = [
  { id: 'fallback-weddings', name: 'Weddings', slug: 'weddings' },
  { id: 'fallback-engagement', name: 'Engagement', slug: 'engagement' },
  { id: 'fallback-portraits', name: 'Portraits', slug: 'portraits' },
  { id: 'fallback-events', name: 'Events', slug: 'events' }
]

export default function Home() {
  const location = useLocation()
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES)
  const [services, setServices] = useState([])
  const { songs, selectedSong, selectSong, openPlayer } = useMusicPlayer()
  const content = useSiteContent()

  useEffect(() => {
    portfolioApi.categories().then((c) => {
      const selected = content.selectedWork.categorySlugs || []
      const ordered = selected.length ? selected.map((slug) => c.find((item) => item.slug === slug)).filter(Boolean) : c
      setCategories(ordered.slice(0, 4))
    }).catch(() => {})
    servicesApi.list().then((s) => setServices(s.slice(0, 4))).catch(() => {})
  }, [content.selectedWork.categorySlugs])

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
            {content.introduction.statement}<br /><em>{content.introduction.emphasis}</em>
          </p>
          <div className="intro__body">
            {content.introduction.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <Link to="/portfolio" className="text-link">{content.introduction.linkLabel}</Link>
          </div>
        </div>
      </section>

      <section id="about" className="section home-about">
        <div className="container home-about__inner">
          <div className="home-about__music-intro">
            <span className="eyebrow">{content.music.eyebrow}</span>
            <h2 className="display">{content.music.title}</h2>
            <p>{content.music.description}</p>
          </div>

          <div className="about-player">
            <button type="button" className="about-player__now" onClick={openPlayer}>
              <span className="about-player__mark"><Play size={19} aria-hidden="true" /></span>
              <span className="about-player__now-copy">
                <small>Selected soundtrack</small>
                <strong>{selectedSong.title}</strong>
                <small>{selectedSong.artist} · play soundtrack</small>
              </span>
              <span className="about-player__count">{songs.length} tracks</span>
            </button>

            <ol className="about-player__tracks">
              {songs.map((song, index) => {
                const active = song.title === selectedSong.title
                return (
                  <li key={song.title}>
                    <button
                      type="button"
                      className={active ? 'is-active' : ''}
                      onClick={() => selectSong(song)}
                      aria-pressed={active}
                    >
                      <span className="about-player__track-number">{String(index + 1).padStart(2, '0')}</span>
                      <span className="about-player__track-copy">
                        <strong>{song.title}</strong>
                        <small>{song.artist}</small>
                      </span>
                      <Play className="about-player__track-play" size={15} aria-hidden="true" />
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="home-about__label">{content.about.whoLabel}</div>
          <div className="home-about__copy">
            {content.about.whoParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>

          <div className="home-about__label">{content.about.skillsLabel}</div>
          <ol className="home-about__skills" aria-label="Creative services">
            {content.about.skills.map((item, index) => (
              <li key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</li>
            ))}
          </ol>

          <div className="home-about__label">{content.about.locationLabel}</div>
          <div className="home-about__description">
            <p>{content.about.locationText}</p>
            <Link to="/portfolio" className="text-link">{content.about.linkLabel}</Link>
          </div>

        </div>
      </section>

      {/* Portfolio preview */}
      <section id="selected-work" className="section section--tight">
        <div className="container">
          <SectionHeader
            eyebrow={content.selectedWork.eyebrow}
            title={content.selectedWork.title}
            desc={content.selectedWork.description}
            action={<Link to="/portfolio" className="text-link">{content.selectedWork.linkLabel}</Link>}
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
            eyebrow={content.servicesHome.eyebrow}
            title={content.servicesHome.title}
            action={<Link to="/services" className="text-link">{content.servicesHome.linkLabel}</Link>}
          />
          <div className="service-list">
            {services.map((s, i) => (
              <Link className="service-row service-row--link" to={`/booking?service=${encodeURIComponent(s.slug || s.name)}#estimator`} key={s.id}>
                <span className="service-row__num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="display service-row__name">{s.name}</div>
                </div>
                <div className="service-row__price">
                  {s.starting_price ? `From ₱${Number(s.starting_price).toLocaleString()}` : 'Inquire'}
                  <span className="service-row__arrow" aria-hidden="true">↗</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Estimator CTA */}
      <section className="home-estimator-cta">
        <div className="container">
          <div className="home-estimator-cta__copy">
            <span className="eyebrow">{content.estimatorCta.eyebrow}</span>
            <h2 style={{ whiteSpace: 'pre-line' }}>{content.estimatorCta.title}</h2>
            <Link to="/booking" className="btn btn--dark">{content.estimatorCta.buttonLabel}</Link>
          </div>
          <div className="home-estimator-cta__art" aria-hidden="true">
            <img src="/doodles/estimator-camera-doodle.png" alt="" />
          </div>
        </div>
      </section>

      <Faq />
    </>
  )
}
