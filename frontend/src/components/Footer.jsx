import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { contactsApi } from '../services/api.js'

export default function Footer() {
  const [platforms, setPlatforms] = useState([])

  useEffect(() => {
    contactsApi.list().then(setPlatforms).catch(() => setPlatforms([]))
  }, [])

  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">JONATHAN <span>Photography</span></div>
        <div className="footer__cols">
          <div className="footer__col">
            <h5>Explore</h5>
            <Link to="/portfolio">Portfolio</Link>
            <Link to="/services">Services</Link>
            <Link to="/estimator">Estimator</Link>
            <Link to="/booking">Book a Session</Link>
          </div>
          <div className="footer__col">
            <h5>Connect</h5>
            {platforms.map((p) => (
              <a key={p.id} href={p.link} target="_blank" rel="noreferrer">{p.label}</a>
            ))}
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
        <span>Digital Photo &amp; Video Coverage</span>
      </div>
    </footer>
  )
}
