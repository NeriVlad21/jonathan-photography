import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PageHero from '../components/PageHero.jsx'
import ServiceDetailsDialog from '../components/ServiceDetailsDialog.jsx'
import { servicesApi } from '../services/api.js'
import { peso } from '../utils/format.js'
import { useSiteContent } from '../context/SiteContentContext.jsx'

const CATEGORY_LABELS = { photography: 'Photography', additional: 'Additional Services' }

export default function Services() {
  const { servicesPage } = useSiteContent()
  const [services, setServices] = useState(null)
  const [detailsId, setDetailsId] = useState(null)
  const closeDetails = useCallback(() => setDetailsId(null), [])

  useEffect(() => {
    document.title = 'Jonathan Photography — Services'
    servicesApi.list().then((rows) => setServices(Array.isArray(rows) ? rows : [])).catch(() => setServices([]))
  }, [])

  const categoryLabel = (key) =>
    servicesPage.categories?.find((item) => item.key === key)?.label || CATEGORY_LABELS[key] || key

  const grouped = (services || []).reduce((acc, s) => {
    const key = s.category || 'photography'
    acc[key] = acc[key] || []
    acc[key].push(s)
    return acc
  }, {})

  const detailsService = (services || []).find((s) => s.id === detailsId) || null

  return (
    <>
      <PageHero
        eyebrow={servicesPage.eyebrow}
        title={servicesPage.title}
        intro={servicesPage.intro}
        note={servicesPage.note}
      />

      <section className="page-content">
        <div className="container">

        {services === null && <LoadingState label="Loading services…" />}
        {services && services.length === 0 && <EmptyState title="Services are being updated." />}

        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 56 }}>
            <h2 className="display" style={{ fontSize: '1.6rem', marginBottom: 8 }}>
              {categoryLabel(cat)}
            </h2>
            <div className="service-list">
              {items.map((s, i) => (
                <button
                  type="button"
                  className="service-row service-row--link service-row--button"
                  onClick={() => setDetailsId(s.id)}
                  aria-haspopup="dialog"
                  aria-label={`View details for ${s.name}`}
                  key={s.id}
                >
                  <span className="service-row__num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <div className="display service-row__name">{s.name}</div>
                    {s.description && <p className="service-row__desc">{s.description}</p>}
                  </div>
                  <div className="service-row__price">
                    {s.starting_price ? `From ${peso(s.starting_price)}` : 'Inquire'}
                    <span className="service-row__arrow service-row__info" aria-hidden="true"><Info size={16} /></span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="page-action">
          <Link to="/booking" className="btn btn--primary">{servicesPage.buttonLabel}</Link>
        </div>
      </div>
      </section>

      {detailsService && (
        <ServiceDetailsDialog
          service={detailsService}
          categoryLabel={categoryLabel(detailsService.category)}
          onClose={closeDetails}
        >
          <button type="button" className="btn btn--ghost-light btn--sm" onClick={closeDetails}>Close</button>
          <Link
            className="btn btn--primary btn--sm"
            to={`/booking?service=${encodeURIComponent(detailsService.slug || detailsService.name)}#estimator`}
          >
            Build an estimate
          </Link>
        </ServiceDetailsDialog>
      )}
    </>
  )
}
