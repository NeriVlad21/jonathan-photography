import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingsApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'

const STATUSES = ['NEW', 'CONTACTED', 'CONFIRMED', 'DECLINED']

export default function Bookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState(null)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const load = () => {
    setBookings(null)
    bookingsApi.list({ ...(status ? { status } : {}), ...(search ? { search } : {}) })
      .then(setBookings)
      .catch(() => setBookings([]))
  }

  useEffect(() => {
    document.title = 'Admin — Bookings'
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search])

  return (
    <>
      <header className="admin-header"><h1>Bookings</h1></header>
      <div className="admin-content" style={{ maxWidth: 1200 }}>
        <div className="admin-toolbar">
          <input type="text" placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {bookings === null && <LoadingState label="Loading bookings…" />}
        {bookings && bookings.length === 0 && (
          <EmptyState title="No bookings yet." body="When someone sends a booking request, it will appear here." />
        )}
        {bookings && bookings.length > 0 && (
          <div className="admin-panel">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th><th>Client</th><th>Shoot</th><th>Date</th><th>Estimate</th><th>Status</th><th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="clickable" onClick={() => navigate(`/admin/bookings/${b.id}`)}>
                      <td>{b.reference_code}</td>
                      <td>{b.name}<br /><span style={{ color: 'var(--c-gray)', fontSize: '0.8rem' }}>{b.email}</span></td>
                      <td>{b.shoot_type}</td>
                      <td>{b.preferred_date || '—'}</td>
                      <td>{b.estimate_total ? peso(b.estimate_total) : '—'}</td>
                      <td><span className={`status-badge status-badge--${b.status}`}>{b.status}</span></td>
                      <td>{formatDateTime(b.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
