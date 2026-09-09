import { peso } from '../utils/format.js'
import { Link } from 'react-router-dom'

export default function ServiceCard({ service, index }) {
  return (
    <Link className="service-row service-row--link" to={`/booking?service=${encodeURIComponent(service.slug || service.name)}#estimator`}>
      <span className="service-row__num">{String(index + 1).padStart(2, '0')}</span>
      <div>
        <div className="display service-row__name">{service.name}</div>
        {service.description && <p className="service-row__desc">{service.description}</p>}
      </div>
      <div className="service-row__price">
        {service.starting_price ? <>From {peso(service.starting_price)}</> : 'Inquire'}
        <span className="service-row__arrow" aria-hidden="true">↗</span>
      </div>
    </Link>
  )
}
