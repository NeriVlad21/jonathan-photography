import { useEffect, useState } from 'react'
import PortfolioCard from '../components/PortfolioCard.jsx'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { portfolioApi } from '../services/api.js'

export default function Portfolio() {
  const [categories, setCategories] = useState(null)

  useEffect(() => {
    document.title = 'Jonathan Photography — Portfolio'
    portfolioApi.categories().then(setCategories).catch(() => setCategories([]))
  }, [])

  return (
    <section className="section" style={{ paddingTop: 'clamp(120px, 16vw, 180px)' }}>
      <div className="container">
        <span className="eyebrow">The Full Archive</span>
        <h1 className="display" style={{ fontSize: 'var(--fluid-h1)', margin: '14px 0 8px' }}>Portfolio</h1>
        <p style={{ color: 'var(--c-gray)', maxWidth: '52ch', fontSize: '1.05rem' }}>
          Every category below is its own story, built one shoot at a time.
        </p>
      </div>

      <div className="container">
        {categories === null && <LoadingState label="Loading the portfolio…" />}
        {categories && categories.length === 0 && (
          <EmptyState title="The portfolio is being updated." body="Please check back shortly." />
        )}
        {categories && categories.map((c, i) => (
          <PortfolioCard key={c.id} category={c} index={i} reverse={i % 2 === 1} />
        ))}
      </div>
    </section>
  )
}
