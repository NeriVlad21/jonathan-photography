import { useEffect, useState } from 'react'
import { getSkillItems } from '../content/defaultSiteContent.js'
import { getStudioAddress } from '../utils/studioLocation.js'
import { Link, useLocation } from 'react-router-dom'
import { Play } from 'lucide-react'
import Hero from '../components/Hero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import Faq from '../components/Faq.jsx'
import { assetUrl, portfolioApi, servicesApi } from '../services/api.js'
import { useMusicPlayer } from '../context/MusicPlayerContext.jsx'
import { useSiteContent } from '../context/SiteContentContext.jsx'
import { pickPortfolioCover } from '../utils/portfolioCover.js'

export default function Home() {
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const { songs, selectedSong, selectSong, openPlayer } = useMusicPlayer()
  const content = useSiteContent()
  const skillItems = getSkillItems(content.about)
  const studioAddress = getStudioAddress(content)

  useEffect(() => {
    portfolioApi.categories().then((c) => {
      const selected = content.selectedWork.categorySlugs || []
      const ordered = selected.length ? selected.map((slug) => c.find((item) => item.slug === slug)).filter(Boolean) : c
      Promise.all(ordered.slice(0, 8).map(async (category) => {
        try {
          const images = await portfolioApi.imagesByCategory(category.slug)
          const cover = pickPortfolioCover(images)
          return cover ? { ...category, cover } : null
        } catch { return null }
      })).then((items) => setCategories(items.filter(Boolean).slice(0, 4)))
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

            <ol className="about-player__tracks" role="radiogroup" aria-label="Choose a soundtrack">
              {songs.map((song, index) => {
                const active = song.title === selectedSong.title
                return (
                  <li key={song.title}>
                    <button
                      type="button"
                      role="radio"
                      className={active ? 'is-active' : ''}
                      onClick={() => selectSong(song)}
                      aria-checked={active}
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

          <div className="home-about__label" id="about-skills-label">{content.about.skillsLabel}</div>
          <ol className="home-about__skills" aria-labelledby="about-skills-label">
            {skillItems.map((item, index) => (
              <li key={`${item.title}-${index}`}>
                <span className="home-about__skill-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="home-about__skill-title">{item.title}</h3>
                  {item.description && <p className="home-about__skill-desc">{item.description}</p>}
                </div>
              </li>
            ))}
          </ol>

          {studioAddress && <>
            <div className="home-about__label">{content.about.studioLocationLabel}</div>
            <div className="home-about__description">
              <address className="studio-address">{studioAddress}</address>
              {content.about.locationText && <p>{content.about.locationText}</p>}
            </div>
          </>}

        </div>
      </section>

      {/* Portfolio preview */}
      <section id="selected-work" className="section section--tight">
        <div className="container">
          <SectionHeader
            title={content.selectedWork.title}
            desc={content.selectedWork.description}
            action={<Link to="/portfolio" className="text-link">{content.selectedWork.linkLabel}</Link>}
          />
        </div>
        {categories.length > 0 && <div className="container">
          <div className="preview-strip">
            {categories.map((c) => (
              <Link key={c.id} to={`/portfolio/${c.slug}`} className="preview-strip__item">
                <img
                  src={assetUrl(c.cover.image_path)}
                  alt={c.cover.caption || c.cover.title || c.name}
                  loading="lazy"
                />
                <span className="preview-strip__caption">
                  {c.cover.caption || c.cover.title || c.name}
                </span>
              </Link>
            ))}
          </div>
        </div>}
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
