import React, { useEffect, useRef, useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useLocation
} from 'react-router-dom'

import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  TrendingUp,
  Images,
  Sparkles,
  Calculator,
  AtSign,
  LogOut,
  Search,
  Menu,
  X,
  Archive,
  User,
  ChevronRight
} from 'lucide-react'

import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import { searchApi } from '../services/api.js'

const NAV = [
  {
    section: 'Overview',
    links: [
      {
        to: '/admin/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard
      }
    ]
  },
  {
    section: 'Requests',
    links: [
      {
        to: '/admin/bookings',
        label: 'Bookings',
        icon: CalendarCheck
      },
      {
        to: '/admin/calendar',
        label: 'Calendar',
        icon: CalendarDays
      },
      {
        to: '/admin/leads',
        label: 'Estimator Leads',
        icon: TrendingUp
      }
    ]
  },
  {
    section: 'Content',
    links: [
      {
        to: '/admin/portfolio',
        label: 'Portfolio',
        icon: Images
      },
      {
        to: '/admin/services',
        label: 'Services',
        icon: Sparkles
      }
    ]
  },
  {
    section: 'Configuration',
    links: [
      {
        to: '/admin/estimator-settings',
        label: 'Estimator',
        icon: Calculator
      },
      {
        to: '/admin/contacts',
        label: 'Contact Links',
        icon: AtSign
      }
    ]
  },
  {
    section: 'Storage',
    links: [
      {
        to: '/admin/archive',
        label: 'Archive & Logs',
        icon: Archive
      }
    ]
  }
]

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth()

  const navigate = useNavigate()
  const location = useLocation()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false)

  const searchRef = useRef(null)

  /*
  ============================================================
  SEARCH VISIBILITY
  ============================================================
  */

  const showSearch =
    location.pathname === '/admin' ||
    location.pathname === '/admin/dashboard' ||
    location.pathname.startsWith('/admin/bookings') ||
    location.pathname.startsWith('/admin/leads') ||
    location.pathname.startsWith('/admin/archive')

  /*
  ============================================================
  CURRENT PAGE
  ============================================================
  */

  const currentPage =
    location.pathname === '/admin/profile'
      ? 'Profile'
      : NAV
      .flatMap((group) => group.links)
      .find((link) => {
        if (location.pathname === link.to) {
          return true
        }

        return location.pathname.startsWith(
          `${link.to}/`
        )
      })?.label || 'Dashboard'

  /*
  ============================================================
  LOGOUT
  ============================================================
  */

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  /*
  ============================================================
  GLOBAL SEARCH
  ============================================================
  */

  useEffect(() => {
    const query = searchQuery.trim()

    if (!query) {
      setSearchResults(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    const delay = setTimeout(async () => {
      try {
        const results =
          await searchApi.global(query)

        setSearchResults({
          bookings:
            results?.bookings || [],

          leads:
            results?.leads || []
        })
      } catch {
        setSearchResults({
          bookings: [],
          leads: []
        })
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      clearTimeout(delay)
    }
  }, [searchQuery])

  /*
  ============================================================
  CLOSE SEARCH WHEN CLICKING OUTSIDE
  ============================================================
  */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target
        )
      ) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [])

  /*
  ============================================================
  CLOSE SEARCH WHEN NAVIGATING
  ============================================================
  */

  useEffect(() => {
    setIsSearchOpen(false)
    setIsNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = isNavOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isNavOpen])

  /*
  ============================================================
  CLEAR SEARCH
  ============================================================
  */

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
    setIsSearchOpen(false)
  }

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <div className="admin-shell">

      <style>{`

        /*
        ============================================================
        ADMIN SHELL
        ============================================================
        */

        .admin-shell {
          min-height: 100vh;

          display: flex;

          background:
            var(--c-bg, #f7f7f5);

          color:
            var(--c-text, #111);
        }

        /*
        ============================================================
        SIDEBAR
        ============================================================
        */

        .admin-sidebar {
          position: sticky;

          top: 0;

          width: 255px;

          height: 100vh;

          flex:
            0 0 255px;

          display: flex;

          flex-direction: column;

          overflow-y: auto;

          background:
            #111;

          color:
            #fff;

          scrollbar-width:
            thin;

          z-index:
            100;
        }

        /*
        ============================================================
        BRAND
        ============================================================
        */

        .admin-sidebar__brand {
          display: flex;

          flex-direction: column;

          justify-content: center;

          min-height:
            88px;

          padding:
            22px 24px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );
        }

        .admin-sidebar__brand span {
          display:
            block;

          margin-top:
            5px;

          opacity:
            0.45;
        }

        /*
        ============================================================
        NAV
        ============================================================
        */

        .admin-sidebar__nav {
          flex:
            1;

          padding:
            16px 12px 20px;
        }

        .admin-sidebar__group {
          margin-bottom:
            22px;
        }

        .admin-sidebar__section {
          padding:
            0 12px;

          margin:
            0 0 7px;

          opacity:
            0.38;

          text-transform:
            uppercase;
        }

        .admin-sidebar__link {
          position:
            relative;

          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          width:
            100%;

          min-height:
            44px;

          padding:
            0 12px;

          margin-bottom:
            3px;

          border-radius:
            8px;

          color:
            rgba(
              255,
              255,
              255,
              0.68
            );

          text-decoration:
            none;

          transition:
            background 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
        }

        .admin-sidebar__link:hover {
          color:
            #fff;

          background:
            rgba(
              255,
              255,
              255,
              0.07
            );
        }

        .admin-sidebar__link.active {
          color:
            #fff;

          background:
            rgba(
              255,
              255,
              255,
              0.12
            );
        }

        .admin-sidebar__link.active::before {
          content:
            '';

          position:
            absolute;

          left:
            0;

          top:
            8px;

          bottom:
            8px;

          width:
            3px;

          border-radius:
            999px;

          background:
            #fff;
        }

        .admin-sidebar__link-icon {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          flex:
            0 0 auto;

          opacity:
            0.8;
        }

        .admin-sidebar__link.active
        .admin-sidebar__link-icon {
          opacity:
            1;
        }

        /*
        ============================================================
        SIDEBAR FOOTER
        ============================================================
        */

        .admin-sidebar__footer {
          margin-top:
            auto;

          padding:
            16px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );
        }

        .admin-sidebar__profile {
          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          min-width:
            0;

          padding:
            8px;

          margin-bottom:
            10px;

          border-radius:
            9px;

          background:
            rgba(
              255,
              255,
              255,
              0.04
            );
        }

        .admin-sidebar__avatar {
          width:
            36px;

          height:
            36px;

          flex:
            0 0 36px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            #F5D000;

          color:
            #111;
        }

        .admin-sidebar__profile-copy {
          min-width:
            0;
        }

        .admin-sidebar__profile-label {
          display:
            block;

          margin-bottom:
            3px;

          opacity:
            0.38;

          text-transform:
            uppercase;
        }

        .admin-sidebar__profile-name {
          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;

          color:
            rgba(
              255,
              255,
              255,
              0.92
            );
        }

        .admin-sidebar__logout {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;

          width:
            100%;

          min-height:
            38px;

          padding:
            0 12px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.09
            );

          border-radius:
            7px;

          background:
            rgba(
              255,
              255,
              255,
              0.035
            );

          color:
            rgba(
              255,
              255,
              255,
              0.72
            );

          cursor:
            pointer;

          transition:
            background 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease;
        }

        .admin-sidebar__logout:hover {
          color:
            #fff;

          background:
            rgba(
              255,
              255,
              255,
              0.09
            );

          border-color:
            rgba(
              255,
              255,
              255,
              0.18
            );
        }

        /*
        ============================================================
        MAIN
        ============================================================
        */

        .admin-main {
          min-width:
            0;

          flex:
            1;
        }

        /*
        ============================================================
        TOP BAR
        ============================================================
        */

        .admin-topbar {
          position:
            sticky;

          top:
            0;

          z-index:
            80;

          min-height:
            68px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            24px;

          padding:
            12px 28px;

          border-bottom:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            rgba(
              255,
              255,
              255,
              0.94
            );

          backdrop-filter:
            blur(12px);
        }

        /*
        ============================================================
        SINGLE PAGE TITLE
        ============================================================
        */

        .admin-topbar__title {
          min-width:
            0;

          margin:
            0;

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;

          line-height:
            1.1;
        }

        /*
        ============================================================
        SEARCH
        ============================================================
        */

        .admin-search {
          position:
            relative;

          width:
            min(
              380px,
              42vw
            );

          flex:
            0 0 auto;
        }

        .admin-search__input-wrap {
          position:
            relative;
        }

        .admin-search__icon {
          position:
            absolute;

          left:
            13px;

          top:
            50%;

          transform:
            translateY(-50%);

          color:
            #9ca3af;

          pointer-events:
            none;
        }

        .admin-search__input {
          width:
            100%;

          min-height:
            40px;

          box-sizing:
            border-box;

          padding:
            0 38px;

          border:
            1px solid
            #d8d8d8;

          border-radius:
            999px;

          outline:
            none;

          background:
            #fafafa;

          color:
            var(--c-text);

          font:
            inherit;

          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .admin-search__input:hover {
          background:
            #fff;
        }

        .admin-search__input:focus {
          background:
            #fff;

          border-color:
            var(--c-text);

          box-shadow:
            0 0 0 3px
            rgba(
              0,
              0,
              0,
              0.04
            );
        }

        .admin-search__clear {
          position:
            absolute;

          right:
            11px;

          top:
            50%;

          transform:
            translateY(-50%);

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            24px;

          height:
            24px;

          padding:
            0;

          border:
            0;

          border-radius:
            50%;

          background:
            transparent;

          color:
            #8c8c8c;

          cursor:
            pointer;

          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .admin-search__clear:hover {
          color:
            var(--c-text);

          background:
            #ededed;
        }

        /*
        ============================================================
        SEARCH RESULTS
        ============================================================
        */

        .admin-search__results {
          position:
            absolute;

          top:
            calc(
              100% + 9px
            );

          left:
            0;

          right:
            0;

          max-height:
            440px;

          overflow-y:
            auto;

          overflow-x:
            hidden;

          border:
            1px solid
            #dedede;

          border-radius:
            10px;

          background:
            #fff;

          box-shadow:
            0 16px 40px
            rgba(
              0,
              0,
              0,
              0.12
            );
        }

        .admin-search__state {
          padding:
            18px;

          color:
            #777;

          text-align:
            center;
        }

        .admin-search__group {
          padding:
            8px;
        }

        .admin-search__group
        + .admin-search__group {
          border-top:
            1px solid
            #ededed;
        }

        .admin-search__group-label {
          padding:
            6px 8px;

          color:
            #999;

          text-transform:
            uppercase;
        }

        .admin-search__result {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            14px;

          width:
            100%;

          min-height:
            58px;

          padding:
            8px;

          border:
            0;

          border-radius:
            7px;

          background:
            transparent;

          color:
            var(--c-text);

          text-align:
            left;

          cursor:
            pointer;

          transition:
            background 0.2s ease;
        }

        .admin-search__result:hover {
          background:
            #f5f5f5;
        }

        .admin-search__result-copy {
          min-width:
            0;
        }

        .admin-search__result-name {
          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }

        .admin-search__result-meta {
          margin-top:
            3px;

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;

          color:
            #777;
        }

        .admin-search__result-arrow {
          flex:
            0 0 auto;

          color:
            #aaa;
        }

        /*
        ============================================================
        CONTENT
        ============================================================
        */

        .admin-main > .admin-content,
        .admin-main > main {
          min-width:
            0;
        }

        .admin-nav-toggle,
        .admin-sidebar__close,
        .admin-nav-backdrop {
          display: none;
        }

        /*
        ============================================================
        RESPONSIVE
        ============================================================
        */

        @media (max-width: 1000px) {

          .admin-sidebar {
            width:
              220px;

            flex-basis:
              220px;
          }

          .admin-topbar {
            padding:
              12px 20px;
          }

          .admin-search {
            width:
              min(
                320px,
                45vw
              );
          }

        }

        @media (max-width: 760px) {

          .admin-shell { display: block; }

          .admin-shell .admin-sidebar {
            position: fixed;
            inset: 0 auto 0 0;
            width: min(86vw, 320px);
            height: 100svh;
            max-height: none;
            overflow: hidden;
            transform: translateX(-102%);
            transition: transform 240ms ease;
            box-shadow: 18px 0 50px rgba(0, 0, 0, 0.24);
          }

          .admin-shell .admin-sidebar.is-open { transform: translateX(0); }

          .admin-sidebar__brand { position: relative; min-height: 66px; padding: 17px 58px 17px 20px; }

          .admin-sidebar__close {
            position: absolute;
            top: 14px;
            right: 14px;
            display: grid;
            width: 38px;
            height: 38px;
            place-items: center;
            border: 0;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            color: #fff;
          }

          .admin-shell .admin-sidebar__nav { display: block; overflow-y: auto; padding: 12px; }

          .admin-shell .admin-sidebar__group { display: block; margin: 0 0 14px; }

          .admin-shell .admin-sidebar__section { display: block; padding: 5px 9px; margin-bottom: 4px; }

          .admin-shell .admin-sidebar__link { justify-content: flex-start; min-height: 44px; padding: 0 12px; border-radius: 6px; }

          .admin-shell .admin-sidebar__footer { display: block; padding: 12px; }

          .admin-sidebar__profile {
            margin-bottom:
              8px;
          }

          .admin-topbar { position: sticky; top: 0; min-height: 64px; align-items: center; flex-flow: row wrap; padding: 10px 16px; gap: 10px; }

          .admin-nav-toggle {
            display: grid;
            width: 42px;
            height: 42px;
            flex: 0 0 42px;
            place-items: center;
            border: 1px solid var(--c-hairline, #ddd);
            border-radius: 50%;
            background: #fff;
            color: #111;
          }

          .admin-nav-backdrop {
            position: fixed;
            inset: 0;
            z-index: 90;
            display: block;
            border: 0;
            background: rgba(0,0,0,0.48);
            backdrop-filter: blur(2px);
          }

          .admin-topbar__title { width: auto; flex: 1; font-size: clamp(1.15rem, 5vw, 1.45rem); }

          .admin-search { order: 3; width: 100%; }

        }

        @media (max-width: 500px) {

          .admin-topbar { padding-inline: 12px; }

        }

        /*
        ============================================================
        REDUCED MOTION
        ============================================================
        */

        @media (
          prefers-reduced-motion: reduce
        ) {

          .admin-sidebar__link,
          .admin-sidebar__logout,
          .admin-search__input,
          .admin-search__clear,
          .admin-search__result {
            transition:
              none;
          }

        }

      `}</style>

      {/* ========================================================
          SIDEBAR
      ======================================================== */}

      <aside id="admin-navigation" className={`admin-sidebar ${isNavOpen ? 'is-open' : ''}`}>

        <div className="admin-sidebar__brand">
          <strong>jonathan</strong>
          <span>photography / studio</span>
          <button type="button" className="admin-sidebar__close" onClick={() => setIsNavOpen(false)} aria-label="Close admin navigation">
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar__nav">

          {NAV.map((group) => (
            <div
              key={group.section}
              className="admin-sidebar__group"
            >

              <div className="admin-sidebar__section">
                {group.section}
              </div>

              {group.links.map((link) => {
                const Icon = link.icon

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `admin-sidebar__link ${
                        isActive
                          ? 'active'
                          : ''
                      }`
                    }
                    onClick={() => setIsNavOpen(false)}
                  >

                    <span className="admin-sidebar__link-icon">
                      <Icon size={17} />
                    </span>

                    <span>
                      {link.label}
                    </span>

                  </NavLink>
                )
              })}

            </div>
          ))}

        </nav>

        <div className="admin-sidebar__footer">

          <Link
            to="/admin/profile"
            className="admin-sidebar__profile"
            aria-label="Open admin profile"
          >

            <div className="admin-sidebar__avatar">
              {admin?.username ? (
                admin.username
                  .charAt(0)
                  .toUpperCase()
              ) : (
                <User size={18} />
              )}
            </div>

            <div className="admin-sidebar__profile-copy">

              <span className="admin-sidebar__profile-label">
                Workspace
              </span>

              <div className="admin-sidebar__profile-name">
                Hi,{' '}
                {admin?.username || 'Admin'}!
              </div>

            </div>

          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="admin-sidebar__logout"
          >
            <LogOut size={15} />
            Logout
          </button>

        </div>

      </aside>

      {isNavOpen && (
        <button type="button" className="admin-nav-backdrop" onClick={() => setIsNavOpen(false)} aria-label="Close admin navigation" />
      )}

      {/* ========================================================
          MAIN
      ======================================================== */}

      <div className="admin-main">

        <header className="admin-topbar">

          <button
            type="button"
            className="admin-nav-toggle"
            onClick={() => setIsNavOpen(true)}
            aria-controls="admin-navigation"
            aria-expanded={isNavOpen}
            aria-label="Open admin navigation"
          >
            <Menu size={21} />
          </button>

          {/* ONE PAGE NAME ONLY */}

          <h1 className="admin-topbar__title">
            {currentPage}
          </h1>

          {/* SEARCH */}

          {showSearch && (
            <div
              className="admin-search"
              ref={searchRef}
            >

              <div className="admin-search__input-wrap">

                <Search
                  size={17}
                  className="admin-search__icon"
                />

                <input
                  type="text"
                  className="admin-search__input"
                  placeholder="Search clients, emails, or bookings..."
                  value={searchQuery}
                  onFocus={() => {
                    if (
                      searchQuery.trim()
                    ) {
                      setIsSearchOpen(
                        true
                      )
                    }
                  }}
                  onChange={(event) => {
                    setSearchQuery(
                      event.target.value
                    )

                    setIsSearchOpen(
                      true
                    )
                  }}
                />

                {searchQuery && (
                  <button
                    type="button"
                    className="admin-search__clear"
                    onMouseDown={(event) =>
                      event.preventDefault()
                    }
                    onClick={
                      clearSearch
                    }
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}

              </div>

              {searchQuery &&
                isSearchOpen && (
                  <div className="admin-search__results">

                    {isSearching && (
                      <div className="admin-search__state">
                        Searching...
                      </div>
                    )}

                    {!isSearching &&
                      searchResults && (
                        <>

                          {/* BOOKINGS */}

                          {searchResults.bookings?.length >
                            0 && (
                            <div className="admin-search__group">

                              <div className="admin-search__group-label">
                                Bookings
                              </div>

                              {searchResults.bookings.map(
                                (booking) => (
                                  <button
                                    type="button"
                                    key={`b-${booking.id}`}
                                    className="admin-search__result"
                                    onMouseDown={(event) =>
                                      event.preventDefault()
                                    }
                                    onClick={() => {
                                      navigate(
                                        `/admin/bookings/${booking.id}`
                                      )

                                      clearSearch()
                                    }}
                                  >

                                    <div className="admin-search__result-copy">

                                      <div className="admin-search__result-name">
                                        {booking.name ||
                                          booking.client_name ||
                                          booking.full_name ||
                                          'Unnamed Client'}
                                      </div>

                                      <div className="admin-search__result-meta">
                                        {booking.email ||
                                          'No email'}

                                        {' · '}

                                        {booking.shoot_type ||
                                          booking.service_type ||
                                          'Booking'}
                                      </div>

                                    </div>

                                    <ChevronRight
                                      size={15}
                                      className="admin-search__result-arrow"
                                    />

                                  </button>
                                )
                              )}

                            </div>
                          )}

                          {/* LEADS */}

                          {searchResults.leads?.length >
                            0 && (
                            <div className="admin-search__group">

                              <div className="admin-search__group-label">
                                Estimator Leads
                              </div>

                              {searchResults.leads.map(
                                (lead) => (
                                  <button
                                    type="button"
                                    key={`l-${lead.id}`}
                                    className="admin-search__result"
                                    onMouseDown={(event) =>
                                      event.preventDefault()
                                    }
                                    onClick={() => {
                                      navigate(
                                        '/admin/leads'
                                      )

                                      clearSearch()
                                    }}
                                  >

                                    <div className="admin-search__result-copy">

                                      <div className="admin-search__result-name">
                                        {lead.name ||
                                          lead.client_name ||
                                          lead.full_name ||
                                          'Unnamed Lead'}
                                      </div>

                                      <div className="admin-search__result-meta">
                                        {lead.email ||
                                          'No email'}

                                        {' · Status: '}

                                        {lead.status ||
                                          'New'}
                                      </div>

                                    </div>

                                    <ChevronRight
                                      size={15}
                                      className="admin-search__result-arrow"
                                    />

                                  </button>
                                )
                              )}

                            </div>
                          )}

                          {/* NO RESULTS */}

                          {!searchResults.bookings?.length &&
                            !searchResults.leads?.length && (
                              <div className="admin-search__state">
                                No results found for "{searchQuery}".
                              </div>
                            )}

                        </>
                      )}

                  </div>
                )}

            </div>
          )}

        </header>

        <Outlet />

      </div>

    </div>
  )
}
