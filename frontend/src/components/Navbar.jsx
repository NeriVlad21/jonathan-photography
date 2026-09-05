import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CalendarPlus, Menu, X } from 'lucide-react'

const LINKS = [
  { to: '/portfolio', label: 'Work' },
  { to: '/services', label: 'Services' },
  { to: '/#about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const isWorkIndex = location.pathname === '/portfolio'

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
      <header className={`navbar ${isWorkIndex ? 'navbar--work' : ''} ${scrolled ? 'navbar--scrolled' : ''}`}>
        <Link to="/" className="navbar__logo">
          <strong>jonathan</strong><span>photography</span>
        </Link>

        <nav className="navbar__links" aria-label="Primary">
          {LINKS.map((l) => l.to.includes('#') ? (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ) : (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__right">
          <Link to="/booking" className="btn btn--primary btn--sm navbar__book-button">Book a session</Link>
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
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link to="/booking" onClick={() => setOpen(false)} className="btn btn--primary navbar__book-button" style={{ marginTop: 20 }}>
            Book Now
          </Link>
        </div>
      )}

      <Link to="/booking" className="navbar__mobile-book" aria-label="Book a session">
        <CalendarPlus size={24} aria-hidden="true" />
      </Link>
    </>
  )
}
