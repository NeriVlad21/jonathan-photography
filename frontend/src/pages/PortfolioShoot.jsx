import { Fragment, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EditorialImage from '../components/EditorialImage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { portfolioApi } from '../services/api.js'
import { formatDate } from '../utils/format.js'

export default function PortfolioShoot() {
  const { category, shoot } = useParams()
  const [data, setData] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setData(null)
    setNotFound(false)
    portfolioApi.shoot(category, shoot)
      .then((d) => { setData(d); document.title = `Jonathan Photography — ${d.title}` })
      .catch(() => setNotFound(true))
  }, [category, shoot])

  if (notFound) {
    return (
      <section className="section" style={{ paddingTop: 160, textAlign: 'center' }}>
        <div className="container">
          <h1 className="display" style={{ fontSize: '2rem' }}>Story not found.</h1>
          <Link to="/portfolio" className="text-link" style={{ marginTop: 20, display: 'inline-flex' }}>← Back to Portfolio</Link>
        </div>
      </section>
    )
  }

  if (!data) return <LoadingState label="Loading the story…" />

  const images = data.images || []

  // Alternate full-width / paired-half images for an editorial rhythm.
  const rows = []
  let i = 0
  let toggle = true
  while (i < images.length) {
    if (toggle && i + 1 < images.length) {
      rows.push([images[i], images[i + 1]])
      i += 2
    } else {
      rows.push([images[i]])
      i += 1
    }
    toggle = !toggle
  }

  return (
    <article>
      <header className="section--tight" style={{ paddingTop: 'clamp(120px, 16vw, 180px)' }}>
        <div className="container">
          <Link to={`/portfolio/${category}`} className="text-link" style={{ marginBottom: 24, display: 'inline-flex' }}>
            ← {data.category_name}
          </Link>
          <h1 className="display" style={{ fontSize: 'var(--fluid-h1)', margin: '14px 0 20px' }}>{data.title}</h1>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', color: 'var(--c-gray)', fontSize: '0.92rem' }}>
            {data.location && <span>{data.location}</span>}
            {data.shoot_date && <span>{formatDate(data.shoot_date)}</span>}
          </div>
          {data.description && (
            <p style={{ maxWidth: '62ch', marginTop: 24, fontSize: '1.05rem', color: 'var(--c-dark)', lineHeight: 1.7 }}>
              {data.description}
            </p>
          )}
        </div>
      </header>

      <div className="container" style={{ paddingBottom: 100 }}>
        <div className="shoot-grid">
          {rows.map((row, idx) => (
            row.length === 2 ? (
              <Fragment key={row[0].id}>
                <Link to={`/portfolio/photo/${row[0].id}`} className="shoot-grid__half">
                  <EditorialImage src={row[0].image_path} alt={row[0].title || data.title} style={{ height: '100%' }} />
                </Link>
                <Link to={`/portfolio/photo/${row[1].id}`} className="shoot-grid__half">
                  <EditorialImage src={row[1].image_path} alt={row[1].title || data.title} style={{ height: '100%' }} />
                </Link>
              </Fragment>
            ) : (
              <Link key={row[0].id} to={`/portfolio/photo/${row[0].id}`} className="shoot-grid__full">
                <EditorialImage src={row[0].image_path} alt={row[0].title || data.title} style={{ height: '100%' }} />
              </Link>
            )
          ))}
        </div>
      </div>
    </article>
  )
}
