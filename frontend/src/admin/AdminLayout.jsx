import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarCheck, TrendingUp, Images, Sparkles,
  Calculator, AtSign, LogOut,
} from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'

const NAV = [
  { section: 'Overview', links: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ] },
  { section: 'Requests', links: [
    { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
    { to: '/admin/leads', label: 'Estimator Leads', icon: TrendingUp },
  ] },
  { section: 'Content', links: [
    { to: '/admin/portfolio', label: 'Portfolio', icon: Images },
    { to: '/admin/services', label: 'Services', icon: Sparkles },
  ] },
  { section: 'Configuration', links: [
    { to: '/admin/estimator-settings', label: 'Estimator', icon: Calculator },
    { to: '/admin/contacts', label: 'Contact Links', icon: AtSign },
  ] },
]

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">JONATHAN <span>Photography</span></div>
        <nav className="admin-sidebar__nav">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="admin-sidebar__section">{group.section}</div>
              {group.links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) => `admin-sidebar__link ${isActive ? 'active' : ''}`}
                >
                  <l.icon size={17} /> {l.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <div style={{ color: 'rgba(247,247,245,0.5)', fontSize: '0.78rem', marginBottom: 10 }}>
            Signed in as <strong style={{ color: '#fff' }}>{admin?.username}</strong>
          </div>
          <button onClick={handleLogout} className="admin-sidebar__link" style={{ width: '100%', border: 0, background: 'none', textAlign: 'left' }}>
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  )
}
