import { useEffect, useState } from 'react'
import { estimatorApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useToast } from '../context/ToastContext.jsx'
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

export default function EstimatorLeads() {
  const [leads, setLeads] = useState(null)
  const [timeframe, setTimeframe] = useState('today')
  const { showToast } = useToast()

  useEffect(() => {
    document.title = 'Admin — Estimator Leads'
    fetchLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe])

  const fetchLeads = () => {
    setLeads(null)
    estimatorApi.leads(timeframe).then(setLeads).catch(() => setLeads([]))
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await estimatorApi.updateLeadStatus(id, newStatus)
      showToast('Lead status updated successfully', 'success')
      setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l))
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error')
    }
  }

  const exportToPDF = () => {
    const element = document.getElementById('export-container')
    const opt = {
      margin: 0.5,
      filename: `Estimator_Leads_${timeframe}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    }
    html2pdf().set(opt).from(element).save()
  }

  const timeframeLabel = TIMEFRAMES.find((item) => item.value === timeframe)?.label || 'All Time / Archive'

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 style={{ margin: 0 }}>Estimator Leads</h1>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
            People who priced a package but haven't necessarily submitted a booking yet.
          </p>
        </div>
      </header>
      
      <div className="admin-content" style={{ maxWidth: 1100 }}>
        
        {/* Date Filter & Export Controls */}
        <div className="admin-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '8px', border: '1px solid var(--c-hairline)', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#4b5563' }}>Filter Data:</span>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)} 
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', outline: 'none', cursor: 'pointer' }}
            >
              {TIMEFRAMES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <button onClick={exportToPDF} className="btn btn--primary" style={{ padding: '8px 20px' }}>
            Download PDF Report
          </button>
        </div>

        {leads === null && <LoadingState label="Loading leads…" />}
        {leads && leads.length === 0 && (
          <EmptyState title="No estimator leads found." body="Try changing the date filter or wait for new leads." />
        )}
        
        {leads && leads.length > 0 && (
          <div className="admin-panel" id="export-container" style={{ padding: '10px' }}>
            
            {/* Hidden PDF Header - Only shows in downloaded file */}
            <div className="pdf-title" style={{ display: 'none', marginBottom: '25px', borderBottom: '2px solid #111827', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#111827' }}>Jonathan Photography — Estimator Leads Report</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: '#4b5563', fontSize: '0.95rem' }}>
                <span><strong>Timeframe:</strong> {timeframeLabel}</span>
                <span><strong>Generated:</strong> {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Hours</th><th>Service</th><th>Add-ons</th><th>Total</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {leads.map((l) => {
                    const addons = (() => { try { return JSON.parse(l.addons || '[]') } catch { return [] } })()
                    
                    // Fallback to "New" if the database column is null
                    const currentStatus = l.status || (l.booked_live ? 'Booked' : 'New');

                    return (
                      <tr key={l.id}>
                        <td>{l.name}</td>
                        <td>{l.email}</td>
                        <td>{l.hours || '—'}</td>
                        <td>{l.service_type || '—'}</td>
                        <td>{addons.length ? addons.map((a) => a.label).join(', ') : '—'}</td>
                        <td>{peso(l.total)}</td>
                        <td>
                          {/* Status Control Dropdown */}
                          <select 
                            value={currentStatus} 
                            onChange={(e) => handleStatusChange(l.id, e.target.value)}
                            style={{ 
                              padding: '4px', 
                              borderRadius: '4px', 
                              border: '1px solid #ccc', 
                              fontSize: '0.85rem',
                              backgroundColor: currentStatus === 'Booked' ? '#dcfce7' : currentStatus === 'Lost' ? '#fee2e2' : '#f3f4f6'
                            }}
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Booked">Booked</option>
                            <option value="Lost">Lost</option>
                          </select>
                        </td>
                        <td>{formatDateTime(l.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}