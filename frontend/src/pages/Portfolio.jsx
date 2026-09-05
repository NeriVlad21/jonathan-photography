import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { assetUrl, portfolioApi } from '../services/api.js'
import { temporaryPhotosForCategory } from '../data/temporaryPortfolio.js'

const SLIDE_DURATION = 4600

export default function Portfolio() {
  const [categories, setCategories] = useState(null)
  const [photos, setPhotos] = useState([])
  const [activeSlide, setActiveSlide] = useState(0)
  const galleryRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    document.title = 'Jonathan Photography — Work'

    portfolioApi.categories()
      .then(async (categoryData) => {
        if (cancelled) return

        const visibleCategories = Array.isArray(categoryData) ? categoryData : []
        setCategories(visibleCategories)

        const imageGroups = await Promise.all(
          visibleCategories.map(async (category) => {
            try {
              const images = await portfolioApi.imagesByCategory(category.slug)
              return (Array.isArray(images) ? images : []).map((image) => ({
                ...image,
                categoryName: category.name,
                categorySlug: category.slug,
              }))
            } catch {
              return []
            }
          })
        )

        if (!cancelled) setPhotos(imageGroups.flat())
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })

    return () => { cancelled = true }
  }, [])

  const galleryItems = useMemo(() => {
    return (categories || []).flatMap((category) => [
      ...temporaryPhotosForCategory(category.slug, category.name),
      ...photos.filter((photo) => photo.categorySlug === category.slug),
    ])
  }, [categories, photos])

  const heroImages = useMemo(() => {
    const firstPass = (categories || []).map((category) =>
      temporaryPhotosForCategory(category.slug, category.name)[0]
    )
    const secondPass = (categories || []).map((category) =>
      temporaryPhotosForCategory(category.slug, category.name)[1]
    )

    return [...firstPass, ...secondPass].slice(0, 8)
  }, [categories])

  useEffect(() => {
    if (heroImages.length < 2) return undefined

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) return undefined

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroImages.length)
    }, SLIDE_DURATION)

    return () => window.clearInterval(interval)
  }, [heroImages.length])

  useEffect(() => {
    if (activeSlide >= heroImages.length) setActiveSlide(0)
  }, [activeSlide, heroImages.length])

  useEffect(() => {
    let frame = 0

    const resizeFrame = () => {
      const element = frameRef.current
      if (!element) return

      const isCompact = window.innerWidth <= 800
      const startRatio = isCompact ? 0.86 : 0.58
      const startMax = isCompact ? 640 : 760
      const startWidth = Math.min(window.innerWidth * startRatio, startMax)
      const progress = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.62)))
      const width = startWidth + ((window.innerWidth - startWidth) * progress)

      element.style.width = `${width}px`
      element.style.setProperty('--work-frame-progress', progress.toFixed(3))
    }

    const requestResize = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(resizeFrame)
    }

    resizeFrame()
    window.addEventListener('scroll', requestResize, { passive: true })
    window.addEventListener('resize', requestResize)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestResize)
      window.removeEventListener('resize', requestResize)
    }
  }, [])

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="work-page">
      <header className="work-intro">
        <div ref={frameRef} className="work-intro__frame" aria-live="polite">
          <div className="work-intro__placeholder" />
          {heroImages.length > 0 && (
            heroImages.map((image, index) => (
              <img
                key={`${image.id}-${index}`}
                className={`work-intro__image ${index === activeSlide ? 'is-active' : ''}`}
                src={assetUrl(image.image_path)}
                alt=""
                aria-hidden={index !== activeSlide}
                onError={(event) => event.currentTarget.classList.add('is-missing')}
              />
            ))
          )}

          <div className="work-intro__shade" />
          <div className="work-intro__copy">
            <p className="work-intro__kicker">Selected work</p>
            <h1>A bit of my photography</h1>
            <p>Portraits, celebrations, stories, and everything in between.</p>
          </div>
        </div>

        <button
          type="button"
          className="work-intro__arrow"
          onClick={scrollToGallery}
          aria-label="Scroll to the gallery"
        >
          <span aria-hidden="true">↓</span>
        </button>
      </header>

      <div ref={galleryRef} className="work-gallery" id="work-gallery">
        {categories === null && (
          <div className="work-gallery__state">
            <LoadingState label="Loading the gallery…" />
          </div>
        )}

        {categories && categories.length === 0 && (
          <div className="work-gallery__state">
            <EmptyState title="The portfolio is being updated." body="Please check back shortly." />
          </div>
        )}

        {galleryItems.map((item, index) => (
          <Link
            key={`${item.id}-${index}`}
            to={`/portfolio/${item.categorySlug}`}
            className={`work-gallery__item work-gallery__item--${item.orientation || 'portrait'}`}
            aria-label={`View ${item.categoryName}`}
          >
            <img
              src={assetUrl(item.image_path)}
              alt={item.title || `${item.categoryName} photograph`}
              loading={index < 6 ? 'eager' : 'lazy'}
              onError={(event) => {
                event.currentTarget.classList.add('is-missing')
                event.currentTarget.parentElement?.classList.add('has-missing-image')
              }}
            />
            <span className="work-gallery__overlay" aria-hidden="true">
              <span>{item.categoryName}</span>
              <span>View story ↗</span>
            </span>
          </Link>
        ))}
      </div>

      {categories && categories.length > 0 && (
        <nav className="work-index" aria-label="Portfolio categories">
          <div className="work-index__heading">
            <p>Explore by collection</p>
            <h2>Choose a story.</h2>
            <span>Browse the work by the kind of moment you want to remember.</span>
          </div>
          <div className="work-index__grid">
            {categories.map((category, index) => (
              <Link key={category.id} to={`/portfolio/${category.slug}`} className="work-index__card">
                <img
                  src={assetUrl(temporaryPhotosForCategory(category.slug, category.name)[0].image_path)}
                  alt=""
                  loading="lazy"
                />
                <span className="work-index__shade" aria-hidden="true" />
                <span className="work-index__number">{String(index + 1).padStart(2, '0')}</span>
                <span className="work-index__name">{category.name}</span>
                <span className="work-index__arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </section>
  )
}
