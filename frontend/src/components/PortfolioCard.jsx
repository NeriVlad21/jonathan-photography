import { Link } from 'react-router-dom'
import EditorialImage from './EditorialImage.jsx'

/**
 * A single editorial category row on the Portfolio index page.
 * Categories genuinely are an ordered, admin-controlled sequence,
 * so the "01 / 02 / 03" numbering communicates real structure.
 */
export default function PortfolioCard({ category, index, reverse }) {
  const num = String(index + 1).padStart(2, '0')
  return (
    <article className={`cat-row ${reverse ? 'cat-row--reverse' : ''}`}>
      <div>
        <span className="cat-row__index">{num} — {category.name}</span>
        <h3 className="display cat-row__title">{category.name}</h3>
        {category.description && <p className="cat-row__desc">{category.description}</p>}
        <Link to={`/portfolio/${category.slug}`} className="text-link">
          View Stories →
        </Link>
      </div>
      <Link to={`/portfolio/${category.slug}`} className="cat-row__media" tabIndex={-1}>
        <EditorialImage
          src={category.cover_image}
          alt={category.name}
          style={{ height: '100%' }}
        />
      </Link>
    </article>
  )
}
