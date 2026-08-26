import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    document.title = 'Admin — Dashboard'
    dashboardApi.stats().then(setStats).catch(() => {})
  }, [])

  if (!stats) return <LoadingState label="Loading dashboard…" />

  const { cards, recent_activity } = stats

  return (
    <>
      <header className="admin-header"><h1>Dashboard</h1></header>
      <div className="admin-content">
        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-card__label">Total Bookings</div>
            <div className="stat-card__value">{cards.total_bookings}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">New Bookings</div>
            <div className="stat-card__value">{cards.new_bookings}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Estimator Uses</div>
            <div className="stat-card__value">{cards.estimator_uses}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Average Estimate</div>
            <div className="stat-card__value">{peso(cards.average_estimate)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Estimate → Booking</div>
            <div className="stat-card__value">{cards.estimator_to_booking_rate}%</div>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__head"><h2>Recent Activity</h2></div>
          <div className="admin-panel__body">
            {recent_activity.length === 0 && <p style={{ color: 'var(--c-gray)' }}>Nothing yet — new bookings and estimator leads will show up here.</p>}
            {recent_activity.map((item) => (
              <div key={`${item.type}-${item.id}`} className="inline-edit-row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>{item.type === 'booking' ? 'New booking' : 'Estimator lead'}</strong>
                  {' — '}
                  {item.type === 'booking' ? (
                    <Link to={`/admin/bookings/${item.id}`} className="text-link" style={{ color: 'inherit', borderColor: 'var(--c-hairline)' }}>
                      {item.name} ({item.shoot_type})
                    </Link>
                  ) : (
                    <span>{item.name} — {peso(item.total)}</span>
                  )}
                </div>
                <span style={{ color: 'var(--c-gray)', fontSize: '0.82rem' }}>{formatDateTime(item.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
