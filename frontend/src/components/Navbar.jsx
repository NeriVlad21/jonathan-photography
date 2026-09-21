import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CalendarPlus, Menu, X } from 'lucide-react'
import { useSiteContent } from '../context/SiteContentContext.jsx'

export default function Navbar() {
  const { brand, navigation } = useSiteContent()
  const links = [
    { to: '/portfolio', label: navigation.work },
    { to: '/services', label: navigation.services },
    { to: '/#about', label: navigation.about },
    { to: '/contact', label: navigation.contact },
  ]
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

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!open) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  return (
    <>
      <header className={`navbar ${isWorkIndex ? 'navbar--work' : ''} ${scrolled ? 'navbar--scrolled' : ''}`}>
        <Link to="/" className="navbar__logo">
          <strong>{brand.name}</strong><span>{brand.accent}</span>
        </Link>

        <nav className="navbar__links" aria-label="Primary">
          {links.map((l) => l.to.includes('#') ? (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ) : (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__right">
          <Link to="/booking" className="btn btn--primary btn--sm navbar__book-button">{navigation.booking}</Link>
          <button type="button" className="navbar__toggle" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="mobile-navigation">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {open && (
        <div id="mobile-navigation" className="navbar__mobile-panel" role="dialog" aria-modal="true" aria-label="Site navigation">
          <button type="button" className="navbar__mobile-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={28} />
          </button>
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link to="/booking" onClick={() => setOpen(false)} className="btn btn--primary navbar__book-button" style={{ marginTop: 20 }}>
            {navigation.booking}
          </Link>
        </div>
      )}

      <Link to="/booking" className="navbar__mobile-book" aria-label="Book a session">
        <CalendarPlus size={24} aria-hidden="true" />
      </Link>
    </>
  )
}
