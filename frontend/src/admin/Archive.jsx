import { useEffect, useState } from 'react'
import { bookingsApi, estimatorApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import html2pdf from 'html2pdf.js'

const TIMEFRAMES = [
  { value: 'today', label: 'Today' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'all', label: 'All Time / Archive' }
]

export default function Archive() {
  const [activeTab, setActiveTab] = useState('bookings')
  const [timeframe, setTimeframe] = useState('today')
  const [data, setData] = useState(null)

  useEffect(() => {
    document.title = 'Admin — Archive & Storage'
    loadArchiveData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, timeframe])

  const loadArchiveData = async () => {
    setData(null)
    try {
      if (activeTab === 'bookings') {
        const result = await bookingsApi.list({ timeframe })
        setData(result || [])
      } else {
        const result = await estimatorApi.leads(timeframe)
        setData(result || [])
      }
    } catch (error) {
      console.error('Archive load failed:', error)
      setData([])
    }
  }

  const exportToPDF = () => {
    const element = document.getElementById('archive-export-container')
    const header = document.getElementById('pdf-header')
    if (!element) return
    
    // Briefly show the header so html2canvas can capture it
    if (header) header.style.display = 'block'

    const opt = {
      margin: 0.5,
      filename: `Archive_${activeTab}_${timeframe}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    }
    
    html2pdf().set(opt).from(element).save().then(() => {
      // Hide it again immediately after processing
      if (header) header.style.display = 'none'
    })
  }

  const timeframeLabel = TIMEFRAMES.find((item) => item.value === timeframe)?.label || 'All Time / Archive'

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 style={{ margin: 0 }}>Archive & Storage</h1>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>Central storage for historical studio records.</p>
        </div>
      </header>

      <div className="admin-content" style={{ maxWidth: 1200 }}>
        
        {/* Archive Tabs and Filters Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 15, marginBottom: 25, flexWrap: 'wrap', background: '#fff', padding: '15px 20px', borderRadius: '8px', border: '1px solid var(--c-hairline)' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setActiveTab('bookings')} className={`btn ${activeTab === 'bookings' ? 'btn--primary' : 'btn--ghost-dark'}`}>
              Archived Bookings
            </button>
            <button type="button" onClick={() => setActiveTab('leads')} className={`btn ${activeTab === 'leads' ? 'btn--primary' : 'btn--ghost-dark'}`}>
              Archived Estimator Leads
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#4b5563' }}>Filter Data:</span>
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', outline: 'none', cursor: 'pointer' }}>
              {TIMEFRAMES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <button type="button" onClick={exportToPDF} className="btn btn--primary" style={{ padding: '8px 20px' }}>
              Download PDF Report
            </button>
          </div>
        </div>

        {data === null && <LoadingState label="Loading archive data…" />}
        
        {data && data.length === 0 && (
          <EmptyState title="No archived records found." body={`No results for ${timeframeLabel.toLowerCase()}.`} />
        )}

        {data && data.length > 0 && (
          <div className="admin-panel" id="archive-export-container" style={{ padding: 10 }}>
            
            {/* Hidden PDF Header - Only shows in downloaded file */}
            <div id="pdf-header" className="pdf-title" style={{ display: 'none', marginBottom: '25px', borderBottom: '2px solid #111827', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#111827' }}>
                Jonathan Photography — {activeTab === 'bookings' ? 'Bookings' : 'Estimator Leads'} Archive
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: '#4b5563', fontSize: '0.95rem' }}>
                <span><strong>Timeframe:</strong> {timeframeLabel}</span>
                <span><strong>Generated:</strong> {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="data-table-wrap">
              <table className="data-table">
                {activeTab === 'bookings' ? (
                  <>
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Client</th>
                        <th>Shoot</th>
                        <th>Date</th>
                        <th>Estimate</th>
                        <th>Status</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((booking) => (
                        <tr key={booking.id}>
                          <td>{booking.reference_code}</td>
                          <td>
                            <strong>{booking.name}</strong><br />
                            <span style={{ color: 'var(--c-gray)', fontSize: '0.8rem' }}>{booking.email}</span>
                          </td>
                          <td>{booking.shoot_type || '—'}</td>
                          <td>{booking.preferred_date || '—'}</td>
                          <td>{booking.estimate_total ? peso(booking.estimate_total) : '—'}</td>
                          <td><span className={`status-badge status-badge--${booking.status}`}>{booking.status}</span></td>
                          <td>{formatDateTime(booking.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Hours</th>
                        <th>Service</th>
                        <th>Add-ons</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((lead) => {
                        let addons = []
                        try { addons = JSON.parse(lead.addons || '[]') } catch { addons = [] }
                        const status = lead.status || (lead.booked_live ? 'Booked' : 'New')
                        return (
                          <tr key={lead.id}>
                            <td>{lead.name}</td>
                            <td>{lead.email}</td>
                            <td>{lead.hours || '—'}</td>
                            <td>{lead.service_type || '—'}</td>
                            <td>{addons.length ? addons.map((addon) => addon.label).join(', ') : '—'}</td>
                            <td>{peso(lead.total)}</td>
                            <td><span className="status-badge">{status}</span></td>
                            <td>{formatDateTime(lead.created_at)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}