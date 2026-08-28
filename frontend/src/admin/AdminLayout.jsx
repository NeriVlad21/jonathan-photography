import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
  Archive
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

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef(null)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  // Handle Search Fetching (with 300ms debounce to prevent spamming the database)
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
        setSearchResults(results)
      } catch (err) {
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchQuery('')
        setSearchResults(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          JONATHAN <span>Photography</span>
        </div>

        <nav className="admin-sidebar__nav">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="admin-sidebar__section">
                {group.section}
              </div>

              {group.links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `admin-sidebar__link ${isActive ? 'active' : ''}`
                  }
                >
                  <l.icon size={17} />
                  {l.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div
            style={{
              color: 'rgba(247,247,245,0.5)',
              fontSize: '0.78rem',
              marginBottom: 10
            }}
          >
            Signed in as{' '}
            <strong style={{ color: '#fff' }}>
              {admin?.username}
            </strong>
          </div>

          <button
            onClick={handleLogout}
            className="admin-sidebar__link"
            style={{
              width: '100%',
              border: 0,
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      <div className="admin-main">
        {/* Top Bar containing the Global Search */}
        <div
          style={{
            padding: '1rem 2rem',
            borderBottom: '1px solid var(--c-hairline, #e5e5e5)',
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
                  color: '#9ca3af'
                }}
              />

              <input
                type="text"
                placeholder="Search clients, emails, or bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 35px',
                  borderRadius: '20px',
                  border: '1px solid #d1d5db',
                  outline: 'none',
                  fontSize: '0.9rem',
                  backgroundColor: '#f9fafb'
                }}
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchQuery && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  left: 0,
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  marginTop: '8px',
                  maxHeight: '400px',
                  overflowY: 'auto'
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
                    {/* Bookings Results */}
                    {searchResults.bookings &&
                      searchResults.bookings.length > 0 && (
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
                                borderBottom: '1px solid #f3f4f6'
                              }}
                              onClick={() => {
                                navigate('/admin/bookings')
                                setSearchQuery('')
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  '#f3f4f6')
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  'transparent')
                              }
                            >
                              <div
                                style={{
                                  fontWeight: '500',
                                  color: '#111827'
                                }}
                              >
                                {b.name}
                              </div>

                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: '#6b7280'
                                }}
                              >
                                {b.email} • {b.shoot_type}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Estimator Leads Results */}
                    {searchResults.leads &&
                      searchResults.leads.length > 0 && (
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
                                borderBottom: '1px solid #f3f4f6'
                              }}
                              onClick={() => {
                                navigate('/admin/leads')
                                setSearchQuery('')
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  '#f3f4f6')
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  'transparent')
                              }
                            >
                              <div
                                style={{
                                  fontWeight: '500',
                                  color: '#111827'
                                }}
                              >
                                {l.name}
                              </div>

                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: '#6b7280'
                                }}
                              >
                                {l.email} • Status: {l.status || 'New'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* No Results */}
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

        {/* Page Content */}
        <Outlet />
      </div>
    </div>
  )
}