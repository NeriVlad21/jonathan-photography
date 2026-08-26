import { useEffect, useState } from 'react'
import { estimatorApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function EstimatorLeads() {
  const [leads, setLeads] = useState(null)

  useEffect(() => {
    document.title = 'Admin — Estimator Leads'
    estimatorApi.leads().then(setLeads).catch(() => setLeads([]))
  }, [])

  return (
    <>
      <header className="admin-header"><h1>Estimator Leads</h1></header>
      <div className="admin-content" style={{ maxWidth: 1100 }}>
        <p style={{ color: 'var(--c-gray)', marginBottom: 20 }}>
          People who priced a package but haven't necessarily submitted a booking yet.
        </p>

        {leads === null && <LoadingState label="Loading leads…" />}
        {leads && leads.length === 0 && (
          <EmptyState title="No estimator leads yet." body="When someone emails themselves an estimate, it will show up here." />
        )}
        {leads && leads.length > 0 && (
          <div className="admin-panel">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Hours</th><th>Service</th><th>Add-ons</th><th>Total</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {leads.map((l) => {
                    const addons = (() => { try { return JSON.parse(l.addons || '[]') } catch { return [] } })()
                    return (
                      <tr key={l.id}>
                        <td>{l.name}</td>
                        <td>{l.email}</td>
                        <td>{l.hours || '—'}</td>
                        <td>{l.service_type || '—'}</td>
                        <td>{addons.length ? addons.map((a) => a.label).join(', ') : '—'}</td>
                        <td>{peso(l.total)}</td>
                        <td>
                          <span className={`status-badge status-badge--${l.booked_live ? 'booked' : 'not-booked'}`}>
                            {l.booked_live ? 'Booked' : 'Not Yet Booked'}
                          </span>
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
