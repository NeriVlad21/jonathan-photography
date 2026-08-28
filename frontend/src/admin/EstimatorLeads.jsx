import { useEffect, useState } from 'react'
import { estimatorApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useToast } from '../context/ToastContext.jsx'
import html2pdf from 'html2pdf.js'

export default function EstimatorLeads() {
  const [leads, setLeads] = useState(null)
  const [timeframe, setTimeframe] = useState('all')
  const { showToast } = useToast()

  useEffect(() => {
    document.title = 'Admin — Estimator Leads'
    fetchLeads()
  }, [timeframe])

  const fetchLeads = () => {
    setLeads(null)
    // We will update the API service next to accept this timeframe parameter
    estimatorApi.leads(timeframe).then(setLeads).catch(() => setLeads([]))
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      // We will add this update method to api.js next
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

  return (
    <>
      <header className="admin-header"><h1>Estimator Leads</h1></header>
      <div className="admin-content" style={{ maxWidth: 1100 }}>
        <p style={{ color: 'var(--c-gray)', marginBottom: 20 }}>
          People who priced a package but haven't necessarily submitted a booking yet.
        </p>

        {/* Date Filter & Export Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <div className="field" style={{ margin: 0 }}>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)} 
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--c-hairline)' }}
            >
              <option value="all">All Time / Archive</option>
              <option value="today">Today</option>
              <option value="last_week">Last Week</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="last_year">Last Year</option>
            </select>
          </div>
          <button onClick={exportToPDF} className="btn btn--primary" style={{ padding: '8px 16px' }}>
            Download PDF
          </button>
        </div>

        {leads === null && <LoadingState label="Loading leads…" />}
        {leads && leads.length === 0 && (
          <EmptyState title="No estimator leads found." body="Try changing the date filter or wait for new leads." />
        )}
        
        {leads && leads.length > 0 && (
          <div className="admin-panel" id="export-container" style={{ padding: '10px' }}>
            <h3 style={{ marginBottom: '15px', display: 'none' }} className="pdf-title">Estimator Leads Report</h3>
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