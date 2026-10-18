import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { oversightApi } from '../services/api.js'
import { formatDateTime } from '../utils/format.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import AdminDialog, { AdminDialogField, AdminDialogSummary } from '../components/AdminDialog.jsx'

export default function FlaggedItemsPanel({ compact = false }) {
  const location = useLocation()
  const { showToast } = useToast()
  const [flags, setFlags] = useState(null)
  const [resolving, setResolving] = useState(null)
  const [pending, setPending] = useState(null)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState('')
  const load = () => oversightApi.flags({ status: 'OPEN' }).then((data) => setFlags(data.flags || [])).catch(() => setFlags([]))
  // The effect must not return load()'s promise: React would call it as a cleanup function.
  useEffect(() => { load() }, [])

  const openResolve = (flag) => { setNote(''); setNoteError(''); setPending(flag) }

  const resolve = async () => {
    const flag = pending
    const trimmed = note.trim()
    if (!flag) return
    if (trimmed.length < 5) { setNoteError(trimmed ? 'Enter at least 5 characters.' : 'Explain how this warning was addressed.'); return }
    setResolving(flag.id)
    try {
      const result = await oversightApi.resolveFlag(flag.id, trimmed)
      setFlags((current) => current.filter((item) => item.id !== flag.id))
      setResolving(null)
      setPending(null)
      showToast(result.message || 'Warning resolved.')
    } catch (error) {
      setNoteError(error.message || 'Unable to resolve this warning.')
      showToast(error.message || 'Unable to resolve this warning.', 'error')
    } finally { setResolving(null) }
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
        <div><span className="status-badge status-badge--FLAGGED">Flagged</span><strong>{flag.entity_type.replaceAll('_', ' ')} #{flag.entity_id}</strong><p>{flag.reason}</p><small>Flagged by {flag.flagged_by_username} · {formatDateTime(flag.created_at)}</small></div>
        <div className="oversight-flag-card__actions admin-actions"><Link className="btn admin-btn--neutral" to={reviewPath(flag)} state={{ from: { ...location, state: { ...(location.state || {}), scrollY: window.scrollY } } }}>Review</Link><button type="button" className="btn admin-btn--primary" disabled={resolving === flag.id} onClick={() => openResolve(flag)}><CheckCircle2 size={15}/>{resolving === flag.id ? 'Resolving…' : 'Resolve'}</button></div>
      </article>)}
    </div>}
    <AdminDialog
      open={Boolean(pending)}
      title="Resolve this warning"
      description="Marks the Superadmin's advisory warning as addressed. The record itself is not changed."
      onClose={() => { if (!resolving) setPending(null) }}
      onSubmit={resolve}
      busy={Boolean(resolving)}
      busyLabel="Resolving…"
      submitLabel="Resolve warning"
    >
      <AdminDialogSummary items={pending ? [
        { label: 'Item', value: `${pending.entity_type.replaceAll('_', ' ').toLowerCase()} #${pending.entity_id}` },
        { label: 'Flag reason', value: pending.reason },
        { label: 'Current state', value: `Open · flagged ${formatDateTime(pending.created_at)}` },
      ] : []} />
      <AdminDialogField
        label="Resolution note"
        value={note}
        onChange={(value) => { setNote(value); if (noteError) setNoteError('') }}
        required
        multiline
        maxLength={1000}
        hint="At least 5 characters. Saved with the warning and the audit log."
        error={noteError}
      />
    </AdminDialog>
  </section>
}
