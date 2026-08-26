import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EditorialImage from '../components/EditorialImage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { portfolioApi } from '../services/api.js'
import { formatDate } from '../utils/format.js'

export default function PortfolioCategory() {
  const { category } = useParams()
  const [shoots, setShoots] = useState(null)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    setShoots(null)
    portfolioApi.shootsByCategory(category).then(setShoots).catch(() => setShoots([]))
    portfolioApi.categories().then(setCategories).catch(() => {})
  }, [category])

  const currentName = categories.find((c) => c.slug === category)?.name || category

  useEffect(() => {
    document.title = `Jonathan Photography — ${currentName}`
  }, [currentName])

  return (
    <section className="section" style={{ paddingTop: 'clamp(120px, 16vw, 180px)' }}>
      <div className="container">
        <Link to="/portfolio" className="text-link" style={{ marginBottom: 24, display: 'inline-flex' }}>← All Categories</Link>
        <h1 className="display" style={{ fontSize: 'var(--fluid-h1)', margin: '14px 0 40px', textTransform: 'capitalize' }}>
          {currentName}
        </h1>
      </div>

      <div className="container">
        {shoots === null && <LoadingState label="Loading stories…" />}
        {shoots && shoots.length === 0 && (
          <EmptyState title="No stories published yet." body="This category is being updated — check back soon." />
        )}
        <div className="grid-2" style={{ rowGap: 56 }}>
          {shoots && shoots.map((s) => (
            <Link key={s.id} to={`/portfolio/${category}/${s.slug}`}>
              <EditorialImage
                src={s.cover_image_path}
                alt={s.title}
                style={{ aspectRatio: '4/5', marginBottom: 16 }}
              />
              <h3 className="display" style={{ fontSize: '1.4rem' }}>{s.title}</h3>
              <p style={{ color: 'var(--c-gray)', fontSize: '0.9rem', marginTop: 6 }}>
                {[s.location, s.shoot_date ? formatDate(s.shoot_date) : null].filter(Boolean).join(' — ')}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
