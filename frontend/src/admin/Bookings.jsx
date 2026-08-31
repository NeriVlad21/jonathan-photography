import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingsApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import html2pdf from 'html2pdf.js'

const STATUSES = ['NEW', 'CONTACTED', 'CONFIRMED', 'DECLINED']

const TIMEFRAMES = [
  { value: 'today', label: 'Today' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'all', label: 'All Time / Archive' }
]

export default function Bookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState(null)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [timeframe, setTimeframe] = useState('today')

  const load = () => {
    setBookings(null)
    
    const params = {}
    if (status) params.status = status
    if (timeframe && timeframe !== 'all') params.timeframe = timeframe

    bookingsApi.list(params)
      .then((data) => {
        // Handle the search filtering instantly on the frontend!
        let filtered = data || []
        if (search.trim()) {
          const q = search.toLowerCase()
          filtered = filtered.filter(b => 
            (b.name && b.name.toLowerCase().includes(q)) || 
            (b.email && b.email.toLowerCase().includes(q)) ||
            (b.reference_code && b.reference_code.toLowerCase().includes(q))
          )
        }
        setBookings(filtered)
      })
      .catch(() => setBookings([]))
  }

  useEffect(() => {
    document.title = 'Admin — Bookings'
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, timeframe])

  const exportToPDF = () => {
    const element = document.getElementById('export-container')
    const header = document.getElementById('pdf-header')
    
    // Briefly show the header so the PDF canvas can "see" it
    if (header) header.style.display = 'block'

    const opt = {
      margin: 0.5,
      filename: `Bookings_Report_${timeframe}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    }
    
    html2pdf().set(opt).from(element).save().then(() => {
      // Instantly hide it again once the PDF finishes generating
      if (header) header.style.display = 'none'
    })
  }

  const timeframeLabel = TIMEFRAMES.find((item) => item.value === timeframe)?.label || 'All Time / Archive'

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 style={{ margin: 0 }}>Bookings</h1>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>Manage and track your client bookings.</p>
        </div>
      </header>
      
      <div className="admin-content" style={{ maxWidth: 1200 }}>
        
        <div className="admin-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '8px', border: '1px solid var(--c-hairline)' }}>
          <div style={{ display: 'flex', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search name or email…" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
            />
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', outline: 'none', cursor: 'pointer' }}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', outline: 'none', cursor: 'pointer' }}>
              {TIMEFRAMES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <button onClick={exportToPDF} className="btn btn--primary" style={{ padding: '8px 20px', whiteSpace: 'nowrap' }}>
            Download PDF Report
          </button>
        </div>

        {bookings === null && <LoadingState label="Loading bookings…" />}
        {bookings && bookings.length === 0 && (
          <EmptyState title="No bookings found." body="Try adjusting your search or date filters." />
        )}
        
        {bookings && bookings.length > 0 && (
          <div className="admin-panel" id="export-container" style={{ padding: '10px' }}>
            
            <div id="pdf-header" style={{ display: 'none', marginBottom: '25px', borderBottom: '2px solid #111827', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#111827' }}>Jonathan Photography — Bookings Report</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: '#4b5563', fontSize: '0.95rem' }}>
                <span><strong>Timeframe:</strong> {timeframeLabel}</span>
                <span><strong>Generated:</strong> {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

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
                      <td>
                        <strong>{b.name}</strong><br />
                        <span style={{ color: 'var(--c-gray)', fontSize: '0.8rem' }}>{b.email}</span>
                      </td>
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