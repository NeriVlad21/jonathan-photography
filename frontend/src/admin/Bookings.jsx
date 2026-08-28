import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingsApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import html2pdf from 'html2pdf.js'

const STATUSES = ['NEW', 'CONTACTED', 'CONFIRMED', 'DECLINED']

export default function Bookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState(null)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [timeframe, setTimeframe] = useState('all')

  const load = () => {
    setBookings(null)
    
    // Build our query parameters based on active filters
    const params = {}
    if (status) params.status = status
    if (search) params.search = search
    if (timeframe && timeframe !== 'all') params.timeframe = timeframe

    bookingsApi.list(params)
      .then(setBookings)
      .catch(() => setBookings([]))
  }

  useEffect(() => {
    document.title = 'Admin — Bookings'
  }, [])

  useEffect(() => {
    // Debounce the load function so typing in the search bar doesn't spam the API
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, timeframe])

  const exportToPDF = () => {
    const element = document.getElementById('export-container')
    const opt = {
      margin: 0.5,
      filename: `Bookings_Report_${timeframe}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    }
    html2pdf().set(opt).from(element).save()
  }

  return (
    <>
      <header className="admin-header"><h1>Bookings</h1></header>
      <div className="admin-content" style={{ maxWidth: 1200 }}>
        
        {/* Filters and Export Toolbar */}
        <div className="admin-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
            <input 
              type="text" 
              placeholder="Search name or email…" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ flex: 1, minWidth: '200px' }}
            />
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '8px 12px' }}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={{ padding: '8px 12px' }}>
              <option value="all">All Time / Archive</option>
              <option value="today">Today</option>
              <option value="last_week">Last Week</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="last_year">Last Year</option>
            </select>
          </div>
          <button onClick={exportToPDF} className="btn btn--primary" style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
            Download PDF
          </button>
        </div>

        {bookings === null && <LoadingState label="Loading bookings…" />}
        {bookings && bookings.length === 0 && (
          <EmptyState title="No bookings found." body="Try adjusting your search or date filters." />
        )}
        
        {bookings && bookings.length > 0 && (
          <div className="admin-panel" id="export-container" style={{ padding: '10px' }}>
            <h3 style={{ marginBottom: '15px', display: 'none' }} className="pdf-title">Bookings Report</h3>
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