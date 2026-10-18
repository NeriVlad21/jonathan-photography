import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Archive, Download, Eye, LifeBuoy, Search, Send, X } from 'lucide-react'
import { supportApi, superArchiveApi } from '../services/api.js'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import AdminDialog, { AdminDialogField, AdminDialogSummary } from '../components/AdminDialog.jsx'
import { formatDate } from '../utils/format.js'
import { SUPPORT_STATUSES, SupportPriorityBadge, SupportStatusBadge, supportStatusKey } from './supportStatus.jsx'
import { FilteredDownloadMenu, SupportDetailBody, useDownloads } from './recordViews.jsx'
import { downloadSupportListPdf, downloadSupportPdf } from './recordDocuments.js'

const EMPTY_REPORT = { subject: '', category: 'TECHNICAL', priority: 'NORMAL', description: '' }
const CATEGORY_LABELS = { TECHNICAL: 'Technical', BILLING: 'Billing', ACCOUNT: 'Account', OTHER: 'Other' }
const FILTER_KEYS = ['q', 'status', 'priority', 'category', 'from', 'to']
const reference = (id) => `SR-${String(id).padStart(6, '0')}`

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
  const [detail, setDetail] = useState(null)
  const requestId = useRef(0)
  const downloads = useDownloads()

  // Filters live in the URL so they survive opening a report, reloads, and Back.
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = { q: searchParams.get('q') || '', status: searchParams.get('status') || 'ALL', priority: searchParams.get('priority') || 'ALL', category: searchParams.get('category') || 'ALL', from: searchParams.get('from') || '', to: searchParams.get('to') || '' }
  const setFilter = (key, value) => setSearchParams((current) => {
    const next = new URLSearchParams(current)
    if (!value || value === 'ALL') next.delete(key)
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

  // Same rules as the server-side export (report-records.php), so a filtered
  // download contains exactly the reports listed here.
  const rangeError = filters.from && filters.to && filters.from > filters.to ? 'The start date cannot be later than the end date.' : ''
  const filteredReports = useMemo(() => (rangeError ? [] : (reports || []).filter((report) => {
    const key = supportStatusKey(report)
    const statusMatch = filters.status === 'ALL' ? key !== 'ARCHIVED' : key === filters.status
    const text = `${reference(report.id)} ${report.subject} ${report.description} ${report.category} ${report.submitted_by_username || ''}`.toLowerCase()
    const date = (report.created_at || '').slice(0, 10)
    return statusMatch && (filters.priority === 'ALL' || report.priority === filters.priority) && (filters.category === 'ALL' || report.category === filters.category)
      && (!filters.q || text.includes(filters.q.trim().toLowerCase())) && (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to)
  })), [reports, rangeError, filters.q, filters.status, filters.priority, filters.category, filters.from, filters.to])
  const exportFilters = {
    context: filters.status === 'ARCHIVED' ? 'archived' : 'active',
    status: ['ALL', 'ARCHIVED'].includes(filters.status) ? '' : filters.status,
    priority: filters.priority, category: filters.category, q: filters.q.trim(), from: filters.from, to: filters.to,
  }

  const openDetail = async (report) => {
    setDetail({ id: report.id, reference: reference(report.id), data: null, error: '' })
    try {
      const data = await supportApi.record(report.id)
      setDetail((current) => (current?.id === report.id ? { ...current, data } : current))
    } catch (error) {
      setDetail((current) => (current?.id === report.id ? { ...current, error: error.message || 'Unable to load this report.' } : current))
    }
  }
  const downloadReport = (id) => downloads.run(`report-${id}`, async () => { await downloadSupportPdf(await supportApi.record(id, 'pdf')) })
  const downloadListPdf = () => downloads.run('list-pdf', async () => { await downloadSupportListPdf(await supportApi.records(exportFilters, 'pdf')) })
  const downloadListCsv = () => downloads.run('list-csv', () => supportApi.downloadCsv(exportFilters))

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
      <label className="support-filterbar__search"><Search size={16} aria-hidden="true" /><input aria-label="Search support reports" placeholder="Search reference, subject, description…" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} /></label>
      <select aria-label="Filter by status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <select aria-label="Filter by priority" value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)}><option value="ALL">All priorities</option><option value="URGENT">Urgent</option><option value="NORMAL">Normal</option></select>
      <select aria-label="Filter by category" value={filters.category} onChange={(e) => setFilter('category', e.target.value)}><option value="ALL">All categories</option>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <label className="support-filterbar__date"><span>Submitted from</span><input type="date" value={filters.from} max={filters.to || undefined} aria-invalid={Boolean(rangeError) || undefined} aria-describedby={rangeError ? 'support-range-error' : undefined} onChange={(e) => setFilter('from', e.target.value)} /></label>
      <label className="support-filterbar__date"><span>Submitted to</span><input type="date" value={filters.to} min={filters.from || undefined} aria-invalid={Boolean(rangeError) || undefined} aria-describedby={rangeError ? 'support-range-error' : undefined} onChange={(e) => setFilter('to', e.target.value)} /></label>
      <button type="button" className="btn admin-btn--secondary support-filterbar__clear" onClick={clearFilters} disabled={!hasFilters}><X size={15} aria-hidden="true" />Clear filters</button>
      {rangeError && <p className="archive-filterbar__error" id="support-range-error" role="alert"><strong>!</strong> {rangeError}</p>}
    </div>

    {isSuper && <div className="archive-toolbar">
      <p>{filters.status === 'ARCHIVED' ? 'Exports include archived reports only.' : 'Exports include active reports matching the filters.'}</p>
      <FilteredDownloadMenu
        label="Download filtered reports"
        count={loading ? null : filteredReports.length}
        busy={downloads.busy}
        disabledReason={rangeError ? 'Fix the date range before exporting.' : loading ? 'Waiting for results…' : ''}
        onPdf={downloadListPdf}
        onCsv={downloadListCsv}
      />
    </div>}

    <section className="support-list" aria-busy={loading || undefined}>
      <h3>{isSuper ? 'Reports' : 'Your reports'} <small aria-live="polite">{loading ? 'Updating…' : `${filteredReports.length} matching`}</small></h3>
      {filteredReports.length ? filteredReports.map((report) => {
        const archived = Boolean(report.archived_at)
        return <article key={report.id} className={`support-card ${report.priority === 'URGENT' ? 'support-card--urgent' : ''}`}>
          <header>
            <div><span>{reference(report.id)} · {CATEGORY_LABELS[report.category] || report.category}</span><h4>{report.subject}</h4></div>
            <div className="support-card__badges"><SupportPriorityBadge priority={report.priority} /><SupportStatusBadge report={report} /></div>
          </header>
          {isSuper && <small>From {report.submitted_by_username} · {report.submitted_by_email}</small>}
          <p>{report.description}</p>
          {report.super_admin_reply && <blockquote><strong>Super Admin response</strong>{report.super_admin_reply}</blockquote>}
          <footer>
            <time dateTime={report.created_at}>{formatDate(report.created_at)}</time>
            <div className="admin-actions">
              <button type="button" className="btn admin-btn--neutral" onClick={() => openDetail(report)} aria-label={`View details for ${reference(report.id)}`}><Eye size={15} aria-hidden="true" />View details</button>
              {isSuper && <button type="button" className="btn admin-btn--neutral" onClick={() => downloadReport(report.id)} disabled={Boolean(downloads.busy)} aria-label={`Download PDF for ${reference(report.id)}`}><Download size={15} aria-hidden="true" />{downloads.busy === `report-${report.id}` ? 'Preparing…' : 'PDF'}</button>}
              {isSuper && !archived && <button type="button" className="btn admin-btn--neutral" onClick={() => openReview(report)}>Review</button>}
              {isSuper && !archived && ['RESOLVED', 'CLOSED'].includes(report.status) && <button type="button" className="btn admin-btn--secondary" onClick={() => setArchiving(report)}><Archive size={15} aria-hidden="true" />Archive</button>}
            </div>
          </footer>
        </article>
      }) : <div className="support-empty">
        <p>{rangeError ? 'Fix the date range to see reports.' : hasFilters ? 'No reports match these filters.' : isSuper ? 'There are no active support reports.' : 'You have not sent any reports yet.'}</p>
        {hasFilters && <button type="button" className="btn admin-btn--secondary" onClick={clearFilters}>Clear filters</button>}
      </div>}
    </section>

    <AdminDialog
      open={Boolean(detail)}
      size="lg"
      title={detail ? `Support report ${detail.reference}` : ''}
      description={detail?.data?.archived ? 'Archived and read-only.' : 'Read-only view. Use Review to change the status or response.'}
      onClose={() => setDetail(null)}
      cancelLabel="Close"
      onSubmit={isSuper && detail?.data ? () => downloadReport(detail.id) : undefined}
      busy={Boolean(downloads.busy)}
      busyLabel="Preparing download…"
      submitLabel="Download PDF"
      submitTone="secondary"
    >
      {detail && (detail.error ? <p className="record-error" role="alert">{detail.error}</p>
        : !detail.data ? <p className="record-loading" aria-live="polite">Loading report…</p>
        : <SupportDetailBody record={detail.data.record} history={detail.data.history} archived={detail.data.archived} showReporter={isSuper} />)}
    </AdminDialog>

    <AdminDialog
      open={Boolean(editing)}
      title={editing ? `Review report ${reference(editing.id)}` : ''}
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
        { label: 'Report', value: `${reference(archiving.id)} · ${archiving.subject}` },
        { label: 'Current state', value: <SupportStatusBadge report={archiving} /> },
      ] : []} />
    </AdminDialog>
  </div></section>
}
