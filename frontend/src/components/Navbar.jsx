import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { to: '/portfolio', label: 'Work' },
  { to: '/services', label: 'Services' },
  { to: '/estimator', label: 'Estimate' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <Link to="/" className="navbar__logo">
          JONATHAN <span>Photography</span>
        </Link>

        <nav className="navbar__links" aria-label="Primary">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__right">
          <Link to="/booking" className="btn btn--primary btn--sm">Book Now</Link>
          <button className="navbar__toggle" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {open && (
        <div className="navbar__mobile-panel" role="dialog" aria-modal="true">
          <button className="navbar__mobile-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={28} />
          </button>
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <Link to="/booking" onClick={() => setOpen(false)} className="btn btn--primary" style={{ marginTop: 20 }}>
            Book Now
          </Link>
        </div>
      )}
    </>
  )
}
