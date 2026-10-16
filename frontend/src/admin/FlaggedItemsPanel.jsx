import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { oversightApi } from '../services/api.js'
import { formatDateTime } from '../utils/format.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'

export default function FlaggedItemsPanel({ compact = false }) {
  const location = useLocation()
  const { showToast } = useToast()
  const [flags, setFlags] = useState(null)
  const [resolving, setResolving] = useState(null)
  const load = () => oversightApi.flags({ status: 'OPEN' }).then((data) => setFlags(data.flags || [])).catch(() => setFlags([]))
  useEffect(load, [])

  const resolve = async (flag) => {
    const note = window.prompt('Explain how this warning was addressed (required):')?.trim()
    if (!note) return
    setResolving(flag.id)
    try {
      const result = await oversightApi.resolveFlag(flag.id, note)
      setFlags((current) => current.filter((item) => item.id !== flag.id))
      showToast(result.message || 'Warning resolved.')
    } catch (error) { showToast(error.message || 'Unable to resolve this warning.', 'error') }
    finally { setResolving(null) }
  }

  const reviewPath = (flag) => {
    if (flag.entity_type === 'BOOKING') return `/admin/bookings/${flag.entity_id}`
    if (flag.entity_type === 'CALENDAR_EVENT') return '/admin/calendar'
    return '/admin/portfolio'
  }

  return <section className="dashboard-panel oversight-flags-panel">
    <div className="dashboard-panel__header"><h2 className="dashboard-panel__title"><AlertTriangle size={18}/> Flagged Items</h2><span className="dashboard-panel__meta">{flags?.length || 0} open warning(s)</span></div>
    {flags === null ? <LoadingState label="Loading warnings…"/> : flags.length === 0 ? <div className="dashboard-empty">No open oversight warnings.</div> : <div className="oversight-flag-list">
      {flags.slice(0, compact ? 5 : flags.length).map((flag) => <article key={flag.id} className="oversight-flag-card">
        <div><span className="status-badge status-badge--PENDING">Flagged</span><strong>{flag.entity_type.replaceAll('_', ' ')} #{flag.entity_id}</strong><p>{flag.reason}</p><small>Flagged by {flag.flagged_by_username} · {formatDateTime(flag.created_at)}</small></div>
        <div className="oversight-flag-card__actions"><Link className="btn btn--secondary" to={reviewPath(flag)} state={{ from: { ...location, state: { ...(location.state || {}), scrollY: window.scrollY } } }}>Review</Link><button type="button" className="btn btn--secondary" disabled={resolving === flag.id} onClick={() => resolve(flag)}><CheckCircle2 size={15}/>{resolving === flag.id ? 'Resolving…' : 'Resolve'}</button></div>
      </article>)}
    </div>}
  </section>
}
