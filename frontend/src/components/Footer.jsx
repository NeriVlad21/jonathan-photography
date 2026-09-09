import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { contactsApi } from '../services/api.js'
import EditorialDoodles from './EditorialDoodles.jsx'

const CONTACT_FALLBACK = [
  { id: 'contact-page', label: 'Contact details', link: '/contact', internal: true }
]

export default function Footer() {
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
        <p>Have something worth remembering?</p>
        <Link to="/booking">Let’s photograph it. <span>↗</span></Link>
      </div>
      <div className="footer__top">
        <div className="footer__brand">jonathan <span>photography</span></div>
        <div className="footer__cols">
          <div className="footer__col">
            <h5>Explore</h5>
            <Link to="/portfolio">Work</Link>
            <Link to="/services">Services</Link>
            <Link to="/#about">About</Link>
            <Link to="/booking">Book a Session</Link>
          </div>
          <div className="footer__col">
            <h5>Connect</h5>
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
          <div className="footer__col">
            <h5>Studio</h5>
            <p>0013 Mc Arthur Hi-way,</p>
            <p>Brgy. Asan Norte, Sison, Pangasinan</p>
          </div>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} Jonathan Photography. All rights reserved.</span>
        <span>Pangasinan, Philippines</span>
      </div>
    </footer>
  )
}
