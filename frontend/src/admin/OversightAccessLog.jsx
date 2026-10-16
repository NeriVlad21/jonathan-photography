import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import { oversightApi } from '../services/api.js'
import { formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import FlaggedItemsPanel from './FlaggedItemsPanel.jsx'

export default function OversightAccessLog() {
  const [data, setData] = useState(null)
  const [query, setQuery] = useState('')
  useEffect(() => { document.title = 'Admin — Oversight Transparency'; oversightApi.accessLog().then((value) => setData(value.access_log || [])).catch(() => setData([])) }, [])
  const rows = useMemo(() => (data || []).filter((item) => `${item.resource_type} ${item.resource_id || ''} ${item.action} ${item.superadmin_username}`.toLowerCase().includes(query.toLowerCase())), [data, query])
  return <section className="admin-content oversight-transparency-page">
    <header className="platform-fees-hero"><div><span>Privacy / Accountability</span><h2>Oversight Transparency</h2><p>Review advisory warnings and every recorded Superadmin access to studio records.</p></div><ShieldCheck size={34}/></header>
    <FlaggedItemsPanel />
    <section className="dashboard-panel"><div className="dashboard-panel__header"><h2 className="dashboard-panel__title">Superadmin access log</h2><label className="bookings-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resource, action, or account…"/></label></div>
      {data === null ? <LoadingState label="Loading access history…"/> : <div className="responsive-table"><table><thead><tr><th>When</th><th>Account</th><th>Action</th><th>Resource</th><th>Record</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{formatDateTime(row.created_at)}</td><td>{row.superadmin_username}</td><td>{row.action}</td><td>{row.resource_type.replaceAll('_',' ')}</td><td>{row.resource_id || '—'}</td></tr>)}</tbody></table>{rows.length === 0 && <div className="dashboard-empty">No access entries match this search.</div>}</div>}
    </section>
  </section>
}
