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
          <div className="home-about__music-intro">
            <span className="eyebrow">Favorite songs</span>
            <h2 className="display">A soundtrack for the scroll.</h2>
            <p>Choose a song, press play, and let it accompany you through the rest of the story.</p>
          </div>

          <div className="about-player">
            <button type="button" className="about-player__now" onClick={openPlayer}>
              <span className="about-player__mark"><Play size={19} aria-hidden="true" /></span>
              <span className="about-player__now-copy">
                <small>Selected soundtrack</small>
                <strong>{selectedSong.title}</strong>
                <small>{selectedSong.artist} · open player</small>
              </span>
              <span className="about-player__count">10 tracks</span>
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

          <div className="home-about__label">who I am</div>
          <div className="home-about__copy">
            <p>
              I am Jonathan Agbisit, a passionate multimedia enthusiast dedicated
              to capturing the moments that make life worth remembering. Through
              photography and videography, I transform meaningful moments into
              timeless stories that you can look back on for years to come.
            </p>
            <p>
              Whether it is a celebration, milestone, special occasion, or a simple
              moment worth cherishing, I offer professional photo and video coverage
              tailored to bring a vision to life. My goal is not just to capture
              images, but to preserve the emotions, memories, and stories behind
              every moment—one moment at a time.
            </p>
          </div>

          <div className="home-about__label">what I do</div>
          <ol className="home-about__skills" aria-label="Creative services">
            {['Photography', 'Videography', 'Editing', 'Layout Design'].map((item, index) => (
              <li key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</li>
            ))}
          </ol>

          <div className="home-about__label">based in Sison</div>
          <div className="home-about__description">
            <p>
              I currently reside in Brgy. Tara-tara, Sison, Pangasinan, where I
              have dedicated over a decade to photography and multimedia. With
              years of experience capturing life’s most meaningful moments, I
              strive to turn every occasion into lasting memories through creative,
              timeless photographs and videos.
            </p>
            <Link to="/portfolio" className="text-link">Explore the stories I have captured →</Link>
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
            <span className="eyebrow">Build your package</span>
            <h2>
              Get a clear starting price<br />before the conversation.
            </h2>
            <Link to="/booking" className="btn btn--dark">Estimate &amp; request a session</Link>
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
