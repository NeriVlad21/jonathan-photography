import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Music2, Play } from 'lucide-react'
import Hero from '../components/Hero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import EditorialImage from '../components/EditorialImage.jsx'
import Faq from '../components/Faq.jsx'
import { portfolioApi, servicesApi } from '../services/api.js'
import { temporaryPhotosForCategory } from '../data/temporaryPortfolio.js'

const FAVORITE_SONGS = [
  { title: 'I Want It That Way', artist: 'Backstreet Boys', type: 'track', spotifyId: '47BBI51FKFwOMlIiX6m8ya' },
  { title: 'Wonderful Tonight', artist: 'Eric Clapton', type: 'track', spotifyId: '524OAAojQlHE0DSmUT0oX3' },
  { title: 'Wake Me Up Before You Go-Go', artist: 'Wham!', type: 'track', spotifyId: '5qFPs70nZD1fQZOi7u7cIZ' },
  { title: '214', artist: 'Rivermaya', type: 'track', spotifyId: '7gZ3kWNtIxFgxjsm5OTVMB' },
  { title: 'Every Breath You Take', artist: 'The Police', type: 'track', spotifyId: '1JSTJqkT5qHq8MDJnJbRE1' },
  { title: 'Kahit Maputi Na Ang Buhok Ko', artist: 'Rey Valera', type: 'track', spotifyId: '1ZQIagXD5ku6N7LD6kLa0C' },
  { title: 'Truly Madly Deeply', artist: 'Savage Garden', type: 'track', spotifyId: '2ntpyUU3itxHWcJnOJmVic' },
  { title: 'With a Smile', artist: 'Eraserheads', type: 'track', spotifyId: '1NopgVCMVhCKIm64tF7auX' },
  { title: 'Tuwing Umuulan at Kapiling Ka', artist: 'Eraserheads', type: 'track', spotifyId: '61jPZwzRkdQ0dZP3bDtyTX' },
  { title: 'How Deep Is Your Love', artist: 'Bee Gees', type: 'track', spotifyId: '0Fao76Lcqht5xhyqOJeRCs' }
]

export default function Home() {
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const [selectedSong, setSelectedSong] = useState(FAVORITE_SONGS[0])

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

          <div className="home-about__music-intro">
            <span className="eyebrow">Favorite songs</span>
            <h2 className="display">A soundtrack for the scroll.</h2>
            <p>Choose a song, press play, and let it accompany you through the rest of the story.</p>
          </div>

          <div className="about-player">
            <div className="about-player__now">
              <div className="about-player__mark" aria-hidden="true"><Music2 size={26} /></div>
              <div>
                <span>Jonathan&apos;s playlist</span>
                <strong>For moments worth remembering</strong>
                <small>Ten handpicked favorites for your scroll</small>
              </div>
              <span className="about-player__count">10 tracks</span>
            </div>

            <iframe
              key={`${selectedSong.type}-${selectedSong.spotifyId}`}
              className="about-player__embed"
              title={`Listen to ${selectedSong.title} by ${selectedSong.artist}`}
              src={`https://open.spotify.com/embed/${selectedSong.type}/${selectedSong.spotifyId}?utm_source=generator&theme=0`}
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />

            <ol className="about-player__tracks">
              {FAVORITE_SONGS.map((song, index) => {
                const active = song.title === selectedSong.title
                return (
                  <li key={song.title}>
                    <button
                      type="button"
                      className={active ? 'is-active' : ''}
                      onClick={() => setSelectedSong(song)}
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
