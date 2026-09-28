import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { peso } from '../utils/format.js'

// Section order and headings for the package details stored on each service.
// Keys match the `details` object returned by the services/estimator APIs.
const DETAIL_SECTIONS = [
  ['included', 'Included'],
  ['coverage', 'Coverage'],
  ['deliverables', 'Deliverables'],
  ['options', 'Options'],
  ['notes', 'Notes']
]

const lines = (value) => (Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim() !== '') : [])

/**
 * Read-only package details for one service. Content comes entirely from the
 * service record (admin-editable); sections without content are not rendered.
 * All values are rendered as text, never as HTML.
 */
export default function ServiceDetailsDialog({ service, categoryLabel, addons = [], onClose, children }) {
  const titleId = useId()
  const closeRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus()
    }
  }, [onClose])

  if (!service) return null

  const details = service.details || {}
  const price = Number(service.starting_price || 0)
  const sections = DETAIL_SECTIONS
    .map(([key, heading]) => [key, heading, lines(details[key])])
    .filter(([, , items]) => items.length > 0)
  const addonList = addons.filter((addon) => addon && addon.label)

  return (
    <div className="modal-backdrop service-details-backdrop" onClick={onClose}>
      <div
        className="service-details"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="service-details__head">
          <div>
            {categoryLabel && <span className="service-details__eyebrow">{categoryLabel}</span>}
            <h3 id={titleId} className="service-details__title">{service.name}</h3>
            <p className="service-details__price">
              {price > 0 ? <>Starts at <strong>{peso(price)}</strong></> : 'Pricing discussed during consultation'}
            </p>
          </div>
          <button ref={closeRef} type="button" className="service-details__close" onClick={onClose} aria-label="Close details">
            <X size={18} />
          </button>
        </header>

        <div className="service-details__body">
          {service.description && <p className="service-details__desc">{service.description}</p>}

          {sections.map(([key, heading, items]) => (
            <section className="service-details__section" key={key}>
              <h4>{heading}</h4>
              <ul>
                {items.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </section>
          ))}

          {addonList.length > 0 && (
            <section className="service-details__section">
              <h4>Available add-ons</h4>
              <ul className="service-details__addons">
                {addonList.map((addon) => (
                  <li key={addon.id}>
                    <span>{addon.label}</span>
                    <span>{Number(addon.price || 0) > 0 ? `+${peso(Number(addon.price))}${addon.is_quantity_based ? ' each' : ''}` : 'Quoted on request'}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!service.description && sections.length === 0 && (
            <p className="service-details__desc">More details for this package are shared during your consultation.</p>
          )}

          <p className="service-details__disclaimer">
            Prices shown are a preliminary reference. The final package and price are confirmed with the studio during consultation.
          </p>
        </div>

        {children && <footer className="service-details__actions">{children}</footer>}
      </div>
    </div>
  )
}
