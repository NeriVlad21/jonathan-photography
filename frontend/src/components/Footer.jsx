import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, ExternalLink } from 'lucide-react'
import { contactsApi } from '../services/api.js'
import EditorialDoodles from './EditorialDoodles.jsx'
import { useSiteContent } from '../context/SiteContentContext.jsx'
import { PUBLIC_NAV_ORDER } from '../content/publicNavigation.js'
import { getStudioAddress, getStudioMapUrls } from '../utils/studioLocation.js'

const CONTACT_FALLBACK = [
  { id: 'contact-page', label: 'Contact details', link: '/contact', internal: true }
]

export default function Footer() {
  const content = useSiteContent()
  const { brand, footer, navigation } = content
  const studioAddress = getStudioAddress(content)
  const map = getStudioMapUrls(studioAddress, content.brand?.mapLatitude, content.brand?.mapLongitude, content.brand?.mapLink)
  const [platforms, setPlatforms] = useState(CONTACT_FALLBACK)

  useEffect(() => {
    contactsApi.list()
      .then((rows) => setPlatforms(Array.isArray(rows) && rows.length ? rows : CONTACT_FALLBACK))
      .catch(() => setPlatforms(CONTACT_FALLBACK))
  }, [])

  return (
    <footer className="footer">
      <EditorialDoodles variant="public" />
      <div className="footer__cta">
        <p>{footer.ctaTitle}</p>
        <Link to="/booking">{footer.ctaButton} <span>↗</span></Link>
      </div>
      <div className="footer__top">
        <div className="footer__brand">{brand.name} <span>{brand.accent}</span></div>
        <div className="footer__cols">
          <div className="footer__col">
            <h5>{footer.exploreTitle}</h5>
            {PUBLIC_NAV_ORDER.map(({ key, to }) => <Link key={key} to={to}>{navigation[key]}</Link>)}
          </div>
          <div className="footer__col">
            <h5>{footer.connectTitle}</h5>
            {platforms.map((p) => p.internal ? (
              <Link key={p.id} to={p.link}>{p.label}</Link>
            ) : (
              <a key={p.id} href={p.link} target={p.link?.startsWith('http') ? '_blank' : undefined} rel={p.link?.startsWith('http') ? 'noreferrer' : undefined}>{p.label}</a>
            ))}
            <Link className="footer__found-camera" to="/photobooth" aria-label="Open the hidden Jonathan Photography photobooth" title="A hidden frame">
              <Camera size={12} strokeWidth={1.8} aria-hidden="true" />
              <span className="visually-hidden">Open the hidden photobooth</span>
            </Link>
          </div>
          {studioAddress && <div className="footer__col footer__studio">
            <h5>{footer.studioTitle}</h5>
            <address className="studio-address">{studioAddress}</address>
            <div className="footer__map">
              <iframe
                src={map.embed}
                title="Jonathan Photography studio location"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <a className="footer__map-link" href={map.link} target="_blank" rel="noreferrer">
              View on Google Maps <ExternalLink size={13} aria-hidden="true" />
              <span className="visually-hidden">(opens in a new tab)</span>
            </a>
          </div>}
        </div>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} {footer.copyright}</span>
        <span>{footer.location}</span>
      </div>
    </footer>
  )
}
