import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { bookingsApi } from '../services/api.js'
import { peso, formatDateTime, formatDate } from '../utils/format.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'

const STATUSES = ['NEW', 'CONTACTED', 'CONFIRMED', 'DECLINED']

export default function BookingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [booking, setBooking] = useState(null)
  const [updating, setUpdating] = useState(false)

  const load = () => {
    bookingsApi.details(id).then(setBooking).catch(() => setBooking(false))
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { document.title = 'Admin — Booking Details' }, [])

  const changeStatus = async (status) => {
    setUpdating(true)
    try {
      await bookingsApi.updateStatus(id, status)
      showToast(`Marked as ${status}.`)
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUpdating(false)
    }
  }

  if (booking === null) return <LoadingState label="Loading booking…" />
  if (booking === false) {
    return (
      <div className="admin-content">
        <p>Booking not found.</p>
        <Link to="/admin/bookings" className="text-link">← Back to Bookings</Link>
      </div>
    )
  }

  return (
    <>
      <header className="admin-header">
        <h1>Booking {booking.reference_code}</h1>
        <Link to="/admin/bookings" className="text-link" style={{ color: 'inherit', borderColor: 'var(--c-hairline)' }}>← All Bookings</Link>
      </header>
      <div className="admin-content" style={{ maxWidth: 900 }}>

        <div className="admin-panel">
          <div className="admin-panel__head">
            <h2>Status</h2>
            <span className={`status-badge status-badge--${booking.status}`}>{booking.status}</span>
          </div>
          <div className="admin-panel__body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {STATUSES.map((s) => (
              <button
                key={s}
                className="btn btn--sm"
                disabled={updating || s === booking.status}
                style={s === booking.status ? { background: '#0A0A0A', color: '#fff', borderColor: '#0A0A0A' } : {}}
                onClick={() => changeStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__head"><h2>Client</h2></div>
          <div className="admin-panel__body admin-form-grid">
            <p><strong>Name</strong><br />{booking.name}</p>
            <p><strong>Email</strong><br />{booking.email}</p>
            <p><strong>Phone</strong><br />{booking.phone}</p>
            <p><strong>Facebook</strong><br />{booking.facebook || '—'}</p>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__head"><h2>Shoot</h2></div>
          <div className="admin-panel__body admin-form-grid">
            <p><strong>Type</strong><br />{booking.shoot_type}</p>
            <p><strong>Date</strong><br />{booking.preferred_date ? formatDate(booking.preferred_date) : 'Not specified'}</p>
            <p><strong>Location</strong><br />{booking.location || '—'}</p>
            <p><strong>Guests</strong><br />{booking.guest_count || '—'}</p>
          </div>
          <div className="admin-panel__body" style={{ paddingTop: 0 }}>
            <p><strong>Message</strong></p>
            <p style={{ color: 'var(--c-dark)' }}>{booking.message}</p>
          </div>
        </div>

        {booking.estimate_total && (
          <div className="admin-panel">
            <div className="admin-panel__head"><h2>Estimate</h2></div>
            <div className="admin-panel__body">
              {booking.addons.map((a) => (
                <div key={a.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                  <span>{a.label}</span><span>{peso(a.price)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, paddingTop: 10, marginTop: 6, borderTop: '1px solid var(--c-hairline)' }}>
                <span>Total</span><span>{peso(booking.estimate_total)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="admin-panel">
          <div className="admin-panel__head"><h2>Metadata</h2></div>
          <div className="admin-panel__body admin-form-grid">
            <p><strong>Booking ID</strong><br />#{booking.id}</p>
            <p><strong>Submitted</strong><br />{formatDateTime(booking.created_at)}</p>
            <p><strong>Privacy Consent</strong><br />{booking.privacy_agreed ? 'Agreed' : 'Not agreed'}</p>
            <p><strong>Consent Timestamp</strong><br />{booking.privacy_agreed_at ? formatDateTime(booking.privacy_agreed_at) : '—'}</p>
          </div>
        </div>
      </div>
    </>
  )
}
