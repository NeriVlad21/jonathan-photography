import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { portfolioApi } from '../services/api.js'
import { imageUrl, formatDate } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'

export default function PhotoView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [photo, setPhoto] = useState(null)
  const [notFound, setNotFound] = useState(false)
  
  useEffect(() => {
    setPhoto(null)
    setNotFound(false)
    
    portfolioApi.photo(id)
      .then((p) => { 
        setPhoto(p); 
        document.title = `Jonathan Photography — ${p.title || p.shoot_title}` 
      })
      .catch(() => {
        setNotFound(true)
      })
  }, [id])

  const goPrev = useCallback(() => {
    if (photo?.prev_id) navigate(`/portfolio/photo/${photo.prev_id}`)
  }, [photo, navigate])

  const goNext = useCallback(() => {
    if (photo?.next_id) navigate(`/portfolio/photo/${photo.next_id}`)
  }, [photo, navigate])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'Escape' && photo) navigate(`/portfolio/${photo.category_slug}/${photo.shoot_slug}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext, photo, navigate])

  if (notFound) {
    return (
      <section style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow eyebrow--on-dark">Archive / unavailable</div>
          <h1 className="display" style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)', marginTop: 16 }}>Photo not found.</h1>
          <p style={{ color: 'rgba(255,255,255,.62)', margin: '16px auto 0', maxWidth: '38ch' }}>
            This photograph may have moved or is no longer part of the public collection.
          </p>
          <Link to="/portfolio" className="text-link" style={{ marginTop: 28, display: 'inline-flex', color: '#F2CB05' }}>← Back to work</Link>
        </div>
      </section>
    )
  }

  if (!photo) return <div style={{ background: '#0A0A0A', minHeight: '100svh' }}><LoadingState label="Loading photo…" /></div>

  return (
    <div className="photo-view">
      <Link to={`/portfolio/${photo.category_slug}/${photo.shoot_slug}`} className="photo-view__close" aria-label="Close photo view">
        <X size={26} />
      </Link>

      {photo.prev_id && (
        <button className="photo-view__nav photo-view__nav--prev" onClick={goPrev} aria-label="Previous photo">
          <ChevronLeft size={22} />
        </button>
      )}
      {photo.next_id && (
        <button className="photo-view__nav photo-view__nav--next" onClick={goNext} aria-label="Next photo">
          <ChevronRight size={22} />
        </button>
      )}

      <div className="photo-view__stage">
        <img src={imageUrl(photo.image_path)} alt={photo.title || photo.shoot_title} />
      </div>

      <div className="photo-view__meta">
        <div>
          <div className="eyebrow eyebrow--on-dark">{photo.category_name}</div>
          <h1 className="display" style={{ fontSize: '1.4rem', color: '#fff', marginTop: 8 }}>
            {photo.title || photo.shoot_title}
          </h1>
          {photo.caption && <p style={{ color: 'rgba(247,247,245,0.7)', marginTop: 6, maxWidth: '50ch' }}>{photo.caption}</p>}
        </div>
        <div style={{ textAlign: 'right', color: 'rgba(247,247,245,0.6)', fontSize: '0.88rem' }}>
          {photo.location && <div>{photo.location}</div>}
          {photo.shoot_date && <div>{formatDate(photo.shoot_date)}</div>}
        </div>
      </div>
    </div>
  )
}
