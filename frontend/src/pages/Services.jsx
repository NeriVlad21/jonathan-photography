import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { servicesApi } from '../services/api.js'
import { peso } from '../utils/format.js'

const CATEGORY_LABELS = { photography: 'Photography', additional: 'Additional Services' }

export default function Services() {
  const [services, setServices] = useState(null)

  useEffect(() => {
    document.title = 'Jonathan Photography — Services'
    servicesApi.list().then(setServices).catch(() => setServices([]))
  }, [])

  const grouped = (services || []).reduce((acc, s) => {
    const key = s.category || 'photography'
    acc[key] = acc[key] || []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <section className="section" style={{ paddingTop: 'clamp(120px, 16vw, 180px)' }}>
      <div className="container">
        <span className="eyebrow">What We Offer</span>
        <h1 className="display" style={{ fontSize: 'var(--fluid-h1)', margin: '14px 0 20px' }}>Services</h1>
        <p style={{ color: 'var(--c-gray)', maxWidth: '56ch', fontSize: '1.05rem', marginBottom: 56 }}>
          From full-day wedding coverage to the printed details that finish an
          event. Not sure what you need? Build a custom estimate instead.
        </p>

        {services === null && <LoadingState label="Loading services…" />}
        {services && services.length === 0 && <EmptyState title="Services are being updated." />}

        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 56 }}>
            <h2 className="display" style={{ fontSize: '1.6rem', marginBottom: 8 }}>
              {CATEGORY_LABELS[cat] || cat}
            </h2>
            <div className="service-list">
              {items.map((s, i) => (
                <div className="service-row" key={s.id}>
                  <span className="service-row__num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <div className="display service-row__name">{s.name}</div>
                    {s.description && <p className="service-row__desc">{s.description}</p>}
                  </div>
                  <div className="service-row__price">
                    {s.starting_price ? `From ${peso(s.starting_price)}` : 'Inquire'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/estimator" className="btn btn--primary">Build a Custom Estimate</Link>
        </div>
      </div>
    </section>
  )
}
