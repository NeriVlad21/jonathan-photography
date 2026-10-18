import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Archive, LifeBuoy, Search, Send, X } from 'lucide-react'
import { supportApi, superArchiveApi } from '../services/api.js'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import AdminDialog, { AdminDialogField, AdminDialogSummary } from '../components/AdminDialog.jsx'
import { formatDate } from '../utils/format.js'
import { SUPPORT_STATUSES, SupportPriorityBadge, SupportStatusBadge, supportStatusKey } from './supportStatus.jsx'

const EMPTY_REPORT = { subject: '', category: 'TECHNICAL', priority: 'NORMAL', description: '' }
const CATEGORY_LABELS = { TECHNICAL: 'Technical', BILLING: 'Billing', ACCOUNT: 'Account', OTHER: 'Other' }
const FILTER_KEYS = ['q', 'status', 'from', 'to']

export default function SupportReports() {
  const { admin } = useAdminAuth()
  const { showToast } = useToast()
  const isSuper = admin?.role === 'SUPER_ADMIN'
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_REPORT)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editError, setEditError] = useState('')
  const [archiving, setArchiving] = useState(null)
  const [archiveBusy, setArchiveBusy] = useState(false)
  const requestId = useRef(0)

  // Filters live in the URL so they survive opening a report, reloads, and Back.
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = { q: searchParams.get('q') || '', status: searchParams.get('status') || 'ALL', from: searchParams.get('from') || '', to: searchParams.get('to') || '' }
  const setFilter = (key, value) => setSearchParams((current) => {
    const next = new URLSearchParams(current)
    if (!value || (key === 'status' && value === 'ALL')) next.delete(key)
    else next.set(key, value)
    return next
  }, { replace: true })
  const clearFilters = () => setSearchParams((current) => {
    const next = new URLSearchParams(current)
    FILTER_KEYS.forEach((key) => next.delete(key))
    return next
  }, { replace: true })
  const hasFilters = FILTER_KEYS.some((key) => searchParams.get(key))

  const load = () => {
    const id = ++requestId.current
    setLoading(true)
    return supportApi.list({ includeArchived: isSuper })
      .then((data) => { if (id === requestId.current) setReports(data.reports || []) })
      .catch((error) => { if (id === requestId.current) { setReports((current) => current || []); showToast(error.message || 'Unable to load support reports.', 'error') } })
      .finally(() => { if (id === requestId.current) setLoading(false) })
  }
  useEffect(() => { document.title = isSuper ? 'Super Admin — Support Reports' : 'Admin — Report a Problem'; load() }, [isSuper])

  const submit = async (event) => {
    event.preventDefault(); setSaving(true)
    try { const result = await supportApi.create(form); setReports((rows) => [result.report, ...(rows || [])]); setForm(EMPTY_REPORT); showToast(result.message) }
    catch (error) { showToast(error.message || 'Unable to send the report.', 'error') }
    finally { setSaving(false) }
  }

  const openReview = (report) => { setEditError(''); setEditing({ ...report, super_admin_reply: report.super_admin_reply || '' }) }

  const update = async () => {
    setSaving(true)
    try {
      const result = await supportApi.update({ id: editing.id, status: editing.status, reply: editing.super_admin_reply.trim() })
      setReports((rows) => rows.map((row) => (Number(row.id) === Number(editing.id) ? { ...row, status: result.status, super_admin_reply: result.super_admin_reply } : row)))
      setSaving(false)
      setEditing(null)
      showToast(result.message)
    } catch (error) {
      setEditError(error.message || 'Unable to update the report.')
      showToast(error.message || 'Unable to update the report.', 'error')
    } finally { setSaving(false) }
  }

  const archiveReport = async () => {
    const id = archiving.id
    setArchiveBusy(true)
    try {
      const result = await superArchiveApi.update({ entity: 'support', id, operation: 'archive' })
      setReports((rows) => rows.map((row) => (Number(row.id) === Number(id) ? { ...row, archived_at: new Date().toISOString() } : row)))
      setArchiveBusy(false)
      setArchiving(null)
      showToast(result.message)
    } catch (error) { showToast(error.message || 'Unable to archive this report.', 'error') }
    finally { setArchiveBusy(false) }
  }

  const filteredReports = useMemo(() => (reports || []).filter((report) => {
    const key = supportStatusKey(report)
    const statusMatch = filters.status === 'ALL' ? key !== 'ARCHIVED' : key === filters.status
    const text = `${report.id} ${report.subject} ${report.description} ${report.category} ${report.submitted_by_username || ''}`.toLowerCase()
    const date = (report.created_at || '').slice(0, 10)
    return statusMatch && (!filters.q || text.includes(filters.q.toLowerCase())) && (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to)
  }), [reports, filters.q, filters.status, filters.from, filters.to])

  if (reports === null) return <LoadingState label="Loading support reports…" />

  const statusOptions = [{ value: 'ALL', label: 'All active statuses' }, ...SUPPORT_STATUSES.map(({ value, label }) => ({ value, label })), ...(isSuper ? [{ value: 'ARCHIVED', label: 'Archived' }] : [])]

  return <section className="support-page"><div className="admin-content support-content">
    <header className="platform-fees-hero"><div><span>{isSuper ? 'Platform support' : 'Help / Support'}</span><h2>{isSuper ? 'Support Reports' : 'Report a Problem'}</h2><p>{isSuper ? 'Review owner-reported technical, billing, and account issues.' : 'Describe what happened and what you were trying to do. The report is saved in the platform and emailed to the Super Admin.'}</p></div><LifeBuoy size={34} aria-hidden="true" /></header>

    {!isSuper && <form className="support-form" onSubmit={submit}>
      <label>Subject<input required maxLength="160" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Short summary of the problem" /></label>
      <div><label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="NORMAL">Normal</option><option value="URGENT">Urgent</option></select></label></div>
      <label>Description<textarea required minLength="20" maxLength="5000" rows="6" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Include the page, action, result, and any error message." /><small className="support-form__count">{5000 - form.description.length} characters left · at least 20</small></label>
      <div className="admin-actions"><button className="btn admin-btn--primary" disabled={saving}><Send size={16} aria-hidden="true" />{saving ? 'Sending…' : 'Send report'}</button></div>
    </form>}

    <div className="super-filterbar support-filterbar" role="search" aria-label="Filter support reports">
      <label className="support-filterbar__search"><Search size={16} aria-hidden="true" /><input aria-label="Search support reports" placeholder="Search subject, description, category…" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} /></label>
      <select aria-label="Filter by status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <input type="date" aria-label="Submitted from" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilter('from', e.target.value)} />
      <input type="date" aria-label="Submitted to" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter('to', e.target.value)} />
      <button type="button" className="btn admin-btn--secondary support-filterbar__clear" onClick={clearFilters} disabled={!hasFilters}><X size={15} aria-hidden="true" />Clear</button>
    </div>

    <section className="support-list" aria-busy={loading || undefined}>
      <h3>{isSuper ? 'Reports' : 'Your reports'} <small aria-live="polite">{loading ? 'Updating…' : `${filteredReports.length} matching`}</small></h3>
      {filteredReports.length ? filteredReports.map((report) => {
        const archived = Boolean(report.archived_at)
        return <article key={report.id} className={`support-card ${report.priority === 'URGENT' ? 'support-card--urgent' : ''}`}>
          <header>
            <div><span>#{report.id} · {CATEGORY_LABELS[report.category] || report.category}</span><h4>{report.subject}</h4></div>
            <div className="support-card__badges"><SupportPriorityBadge priority={report.priority} /><SupportStatusBadge report={report} /></div>
          </header>
          {isSuper && <small>From {report.submitted_by_username} · {report.submitted_by_email}</small>}
          <p>{report.description}</p>
          {report.super_admin_reply && <blockquote><strong>Super Admin response</strong>{report.super_admin_reply}</blockquote>}
          <footer>
            <time dateTime={report.created_at}>{formatDate(report.created_at)}</time>
            {isSuper && !archived && <div className="admin-actions">
              <button type="button" className="btn admin-btn--neutral" onClick={() => openReview(report)}>Review</button>
              {['RESOLVED', 'CLOSED'].includes(report.status) && <button type="button" className="btn admin-btn--secondary" onClick={() => setArchiving(report)}><Archive size={15} aria-hidden="true" />Archive</button>}
            </div>}
          </footer>
        </article>
      }) : <div className="support-empty">
        <p>{hasFilters ? 'No reports match these filters.' : isSuper ? 'There are no active support reports.' : 'You have not sent any reports yet.'}</p>
        {hasFilters && <button type="button" className="btn admin-btn--secondary" onClick={clearFilters}>Clear filters</button>}
      </div>}
    </section>

    <AdminDialog
      open={Boolean(editing)}
      title={editing ? `Review report #${editing.id}` : ''}
      description="Update the status and leave a response the Owner can read on their Report a Problem page."
      onClose={() => { if (!saving) setEditing(null) }}
      onSubmit={update}
      busy={saving}
      submitLabel="Save update"
    >
      <AdminDialogSummary items={editing ? [
        { label: 'Subject', value: editing.subject },
        { label: 'Category', value: CATEGORY_LABELS[editing.category] || editing.category },
        { label: 'Priority', value: editing.priority === 'URGENT' ? 'Urgent' : 'Normal' },
        { label: 'Description', value: editing.description },
        { label: 'Submitted', value: `${formatDate(editing.created_at)} by ${editing.submitted_by_username || 'Owner'}` },
      ] : []} />
      {editing && <AdminDialogField
        label="Status"
        value={editing.status}
        onChange={(value) => { setEditing((current) => ({ ...current, status: value })); setEditError('') }}
        required
        options={SUPPORT_STATUSES.map(({ value, label }) => ({ value, label }))}
      />}
      {editing && <AdminDialogField
        label="Response / resolution note"
        value={editing.super_admin_reply}
        onChange={(value) => { setEditing((current) => ({ ...current, super_admin_reply: value })); if (editError) setEditError('') }}
        multiline
        rows={5}
        maxLength={5000}
        hint="Visible to the Owner."
        error={editError}
      />}
    </AdminDialog>

    <AdminDialog
      open={Boolean(archiving)}
      size="sm"
      title="Archive this report?"
      description="Moves the report to Financial Archives → Support reports. It stays searchable there and can be restored at any time."
      onClose={() => { if (!archiveBusy) setArchiving(null) }}
      onSubmit={archiveReport}
      busy={archiveBusy}
      busyLabel="Archiving…"
      submitLabel="Archive report"
    >
      <AdminDialogSummary items={archiving ? [
        { label: 'Report', value: `#${archiving.id} · ${archiving.subject}` },
        { label: 'Current state', value: <SupportStatusBadge report={archiving} /> },
      ] : []} />
    </AdminDialog>
  </div></section>
}
