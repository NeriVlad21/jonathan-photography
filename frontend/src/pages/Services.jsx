import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PageHero from '../components/PageHero.jsx'
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
    <>
      <PageHero
        eyebrow="Services / 02"
        title="Coverage made for real life."
        intro="From full-day weddings to portraits and event details. Start with a service, then shape it around the day you are planning."
        note="Photo + video"
      />

      <section className="page-content">
        <div className="container">

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

        <div className="page-action">
          <Link to="/estimator" className="btn btn--primary">Build a Custom Estimate</Link>
        </div>
      </div>
      </section>
    </>
  )
}
