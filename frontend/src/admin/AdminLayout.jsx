import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarCheck,
  TrendingUp,
  Images,
  Sparkles,
  Calculator,
  AtSign,
  LogOut,
  Search,
  X,
  Archive,
  User
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

  const searchRef = useRef(null)

  const showSearch = [
    '/admin',
    '/admin/dashboard',
    '/admin/bookings',
    '/admin/leads',
    '/admin/archive'
  ].includes(location.pathname)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    const delay = setTimeout(async () => {
      try {
        const results = await searchApi.global(searchQuery)

        setSearchResults({
          bookings: results?.bookings || [],
          leads: results?.leads || []
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

    return () => clearTimeout(delay)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target)
      ) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
    setIsSearchOpen(false)
  }

  return (
    <div className="admin-shell">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="admin-sidebar__brand">
          JONATHAN <span>Photography</span>
        </div>

        <nav
          className="admin-sidebar__nav"
          style={{ flex: 1 }}
        >
          {NAV.map((group) => (
            <div key={group.section}>

              <div className="admin-sidebar__section">
                {group.section}
              </div>

              {group.links.map((l) => {
                const Icon = l.icon

                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className={({ isActive }) =>
                      `admin-sidebar__link ${
                        isActive ? 'active' : ''
                      }`
                    }
                  >
                    <Icon size={17} />
                    {l.label}
                  </NavLink>
                )
              })}

            </div>
          ))}
        </nav>

        {/* ADMIN FOOTER */}
        <div
          className="admin-sidebar__footer"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            padding: '20px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '15px'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#F5D000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#111827',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                flexShrink: 0
              }}
            >
              {admin?.username
                ? admin.username.charAt(0).toUpperCase()
                : <User size={20} />
              }
            </div>

            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '2px'
                }}
              >
                Workspace
              </div>

              <div
                style={{
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                Hi, {admin?.username || 'Admin'}!
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background =
                'rgba(255,255,255,0.1)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background =
                'rgba(255,255,255,0.05)'
              e.currentTarget.style.color = '#d1d5db'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className="admin-main">

        {/* SEARCH BAR */}
        {showSearch && (
          <div
            style={{
              padding: '1rem 2rem',
              borderBottom:
                '1px solid var(--c-hairline, #e5e5e5)',
              background: '#fff',
              display: 'flex',
              justifyContent: 'flex-end',
              position: 'sticky',
              top: 0,
              zIndex: 40
            }}
          >
            <div
              ref={searchRef}
              style={{
                position: 'relative',
                width: '350px'
              }}
            >

              <div style={{ position: 'relative' }}>

                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }}
                />

                <input
                  type="text"
                  placeholder="Search clients, emails, or bookings..."
                  value={searchQuery}
                  onFocus={() => {
                    if (searchQuery.trim()) {
                      setIsSearchOpen(true)
                    }
                  }}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setIsSearchOpen(true)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 35px',
                    borderRadius: '20px',
                    border: '1px solid #d1d5db',
                    outline: 'none',
                    fontSize: '0.9rem',
                    backgroundColor: '#f9fafb',
                    boxSizing: 'border-box'
                  }}
                />

                {searchQuery && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                    }}
                    onClick={clearSearch}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                  >
                    <X size={16} />
                  </button>
                )}

              </div>

              {/* RESULTS */}
              {searchQuery && isSearchOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    left: 0,
                    background: '#fff',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    boxShadow:
                      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    marginTop: '8px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 50
                  }}
                >

                  {isSearching ? (
                    <div
                      style={{
                        padding: '1rem',
                        textAlign: 'center',
                        color: '#6b7280',
                        fontSize: '0.9rem'
                      }}
                    >
                      Searching...
                    </div>
                  ) : searchResults ? (
                    <>

                      {/* BOOKINGS */}
                      {searchResults.bookings?.length > 0 && (
                        <div style={{ padding: '0.5rem' }}>

                          <div
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              color: '#9ca3af',
                              marginBottom: '0.5rem',
                              paddingLeft: '0.5rem'
                            }}
                          >
                            Bookings
                          </div>

                          {searchResults.bookings.map((b) => (
                            <div
                              key={`b-${b.id}`}
                              style={{
                                padding: '0.75rem',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                borderBottom:
                                  '1px solid #f3f4f6'
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault()
                              }}
                              onClick={() => {
                                navigate(`/admin/bookings/${b.id}`)
                                clearSearch()
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  '#f3f4f6'
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  'transparent'
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: '500',
                                  color: '#111827'
                                }}
                              >
                                {b.name ||
                                  b.client_name ||
                                  b.full_name ||
                                  'Unnamed Client'}
                              </div>

                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: '#6b7280'
                                }}
                              >
                                {b.email || 'No email'}
                                {' • '}
                                {b.shoot_type ||
                                  b.service_type ||
                                  'Booking'}
                              </div>
                            </div>
                          ))}

                        </div>
                      )}

                      {/* LEADS */}
                      {searchResults.leads?.length > 0 && (
                        <div
                          style={{
                            padding: '0.5rem',
                            borderTop:
                              searchResults.bookings?.length > 0
                                ? '1px solid #e5e7eb'
                                : 'none'
                          }}
                        >

                          <div
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              color: '#9ca3af',
                              marginBottom: '0.5rem',
                              paddingLeft: '0.5rem'
                            }}
                          >
                            Estimator Leads
                          </div>

                          {searchResults.leads.map((l) => (
                            <div
                              key={`l-${l.id}`}
                              style={{
                                padding: '0.75rem',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                borderBottom:
                                  '1px solid #f3f4f6'
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault()
                              }}
                              onClick={() => {
                                navigate('/admin/leads')
                                clearSearch()
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  '#f3f4f6'
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  'transparent'
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: '500',
                                  color: '#111827'
                                }}
                              >
                                {l.name ||
                                  l.client_name ||
                                  l.full_name ||
                                  'Unnamed Lead'}
                              </div>

                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: '#6b7280'
                                }}
                              >
                                {l.email || 'No email'}
                                {' • Status: '}
                                {l.status || 'New'}
                              </div>
                            </div>
                          ))}

                        </div>
                      )}

                      {/* NO RESULTS */}
                      {!searchResults.bookings?.length &&
                        !searchResults.leads?.length && (
                          <div
                            style={{
                              padding: '1rem',
                              textAlign: 'center',
                              color: '#6b7280',
                              fontSize: '0.9rem'
                            }}
                          >
                            No results found for "{searchQuery}".
                          </div>
                        )}

                    </>
                  ) : null}

                </div>
              )}

            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <Outlet />

      </div>
    </div>
  )
}