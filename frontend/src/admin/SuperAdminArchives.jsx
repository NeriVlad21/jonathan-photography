import { useEffect, useRef, useState } from 'react'
import { ArchiveRestore, Download, Eye, Search, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { superArchiveApi } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import AdminDialog, { AdminDialogSummary } from '../components/AdminDialog.jsx'
import { formatDate, formatDateTime, peso } from '../utils/format.js'
import { SUPPORT_STATUSES, SupportPriorityBadge, SupportStatusBadge } from './supportStatus.jsx'
import { FilteredDownloadMenu, RecordFields, SupportDetailBody, useDownloads } from './recordViews.jsx'
import { downloadArchiveListPdf, downloadCyclePdf, downloadLedgerPdf, downloadSupportPdf } from './recordDocuments.js'

const TABS = [
  { key: 'cycles', entity: 'cycle', label: 'Billing cycles', noun: 'billing cycle', plural: 'billing cycles' },
  { key: 'ledger', entity: 'ledger', label: 'Fee ledger', noun: 'fee ledger entry', plural: 'fee ledger entries' },
  { key: 'reports', entity: 'support', label: 'Support reports', noun: 'support report', plural: 'support reports' },
]
const STATUS_OPTIONS = {
  cycle: [['PAID', 'Paid'], ['DUE', 'Due'], ['OPEN', 'Open']],
  ledger: [['PAID', 'Paid'], ['DUE', 'Due'], ['OPEN', 'Open'], ['VOIDED', 'Voided']],
  support: SUPPORT_STATUSES.map(({ value, label }) => [value, label]),
}
const CATEGORY_LABELS = { TECHNICAL: 'Technical', BILLING: 'Billing', ACCOUNT: 'Account', OTHER: 'Other' }
const FILTER_KEYS = ['q', 'status', 'from', 'to']
const titleCase = (value) => (value ? String(value).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : null)
const day = (value) => (value ? formatDate(String(value).slice(0, 10)) : null)
const stamp = (value) => (value ? formatDateTime(value) : null)
const money = (value) => (value === null || value === undefined ? null : peso(value))
const rate = (value) => (value === null || value === undefined ? null : `${Number((Number(value) * 100).toFixed(2))}%`)
const feeParty = (record) => (record.fee_charged_to_client === null || record.fee_charged_to_client === undefined ? null
  : record.fee_charged_to_client ? 'Yes — added to the client total' : 'No — absorbed by the studio')

export default function SuperAdminArchives() {
  const { showToast } = useToast()
  const [params, setParams] = useSearchParams()
  const tab = TABS.find((item) => item.key === params.get('type')) || TABS[0]
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) || '']))
  const [search, setSearch] = useState(filters.q)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [detail, setDetail] = useState(null)
  const [restoring, setRestoring] = useState(null)
  const [restoreBusy, setRestoreBusy] = useState(false)
  const requestId = useRef(0)
  const downloads = useDownloads()

  const rangeError = filters.from && filters.to && filters.from > filters.to ? 'The start date cannot be later than the end date.' : ''
  const activeFilters = FILTER_KEYS.filter((key) => filters[key])
  const apiFilters = { q: filters.q, status: filters.status, from: filters.from, to: filters.to }

  // Filters live in the URL so the tab and filters survive details, reloads and Back.
  const setFilter = (key, value) => setParams((current) => {
    const next = new URLSearchParams(current)
    if (value) next.set(key, value); else next.delete(key)
    return next
  }, { replace: true })
  const clearFilters = () => { setSearch(''); setParams(tab.key === 'cycles' ? {} : { type: tab.key }, { replace: true }) }
  const switchTab = (key) => setParams((current) => {
    // Statuses differ per category, so the status filter does not carry over.
    const next = new URLSearchParams(current)
    next.set('type', key); next.delete('status')
    return next
  })

  useEffect(() => { setSearch(filters.q) }, [filters.q])
  useEffect(() => {
    if (search === filters.q) return undefined
    const timer = setTimeout(() => setFilter('q', search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const load = () => {
    if (rangeError) { setLoading(false); return }
    const id = ++requestId.current
    setLoading(true); setLoadError('')
    superArchiveApi.records(tab.entity, apiFilters)
      .then((data) => { if (id === requestId.current) setResult({ ...data, tab: tab.key }) })
      .catch((error) => { if (id === requestId.current) setLoadError(error.message || 'Unable to load archived records.') })
      .finally(() => { if (id === requestId.current) setLoading(false) })
  }
  useEffect(() => { document.title = 'Super Admin — Archives' }, [])
  useEffect(load, [tab.entity, filters.q, filters.status, filters.from, filters.to, rangeError])

  const rows = result?.tab === tab.key ? result.records : []
  const count = result?.tab === tab.key ? result.count : 0
  const totalInCategory = result?.tab === tab.key ? result.total_in_category : 0

  const openDetail = async (row) => {
    setDetail({ entity: tab.entity, row, data: null, error: '' })
    try {
      const data = await superArchiveApi.record(tab.entity, row.id)
      setDetail((current) => (current?.row.id === row.id ? { ...current, data } : current))
    } catch (error) {
      setDetail((current) => (current?.row.id === row.id ? { ...current, error: error.message || 'Unable to load this record.' } : current))
    }
  }

  const downloadRecord = (entity, id) => downloads.run(`record-${entity}-${id}`, async () => {
    const data = await superArchiveApi.record(entity, id, 'pdf')
    if (entity === 'cycle') await downloadCyclePdf(data)
    else if (entity === 'ledger') await downloadLedgerPdf(data)
    else await downloadSupportPdf({ record: data.record, history: data.related?.history || [], archived: true })
  })
  const downloadListPdf = () => downloads.run('list-pdf', async () => {
    await downloadArchiveListPdf(tab.entity, await superArchiveApi.records(tab.entity, apiFilters, 'pdf'))
  })
  const downloadListCsv = () => downloads.run('list-csv', () => superArchiveApi.downloadCsv(tab.entity, apiFilters))

  const restore = async () => {
    const { entity, row } = restoring
    setRestoreBusy(true)
    try {
      const response = await superArchiveApi.update({ entity, id: row.id, operation: 'restore' })
      setRestoreBusy(false); setRestoring(null)
      if (detail?.row.id === row.id && detail.entity === entity) setDetail(null)
      showToast(response.message)
      load()
    } catch (error) { showToast(error.message || 'Unable to restore record.', 'error') }
    finally { setRestoreBusy(false) }
  }

  const summaryParts = [
    filters.q && `Search “${filters.q}”`,
    filters.status && `Status: ${(STATUS_OPTIONS[tab.entity].find(([value]) => value === filters.status) || [, filters.status])[1]}`,
    (filters.from || filters.to) && `Archived ${filters.from ? day(filters.from) : 'any time'} – ${filters.to ? day(filters.to) : 'today'}`,
  ].filter(Boolean)

  return <section><div className="admin-content super-admin-content">
    <header className="platform-fees-hero"><div><span>Platform / Retention</span><h2>Super Admin Archives</h2><p>Settled financial records and completed support cases stay searchable here. Viewing or downloading a record never restores it.</p></div><ArchiveRestore size={34} aria-hidden="true" /></header>

    <div className="super-tabs" role="tablist" aria-label="Archive categories">
      {TABS.map((item) => <button key={item.key} type="button" role="tab" aria-selected={tab.key === item.key} className={tab.key === item.key ? 'active' : ''} onClick={() => switchTab(item.key)}>
        {item.label}<small>{result?.category_totals?.[item.entity] ?? '–'}</small>
      </button>)}
    </div>

    <div className="super-filterbar archive-filterbar" role="search" aria-label={`Filter archived ${tab.label.toLowerCase()}`}>
      <label className="archive-filterbar__search"><span className="sr-only">Search archived records</span><Search size={16} aria-hidden="true" /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={120} placeholder="Search reference, name, subject…" /></label>
      <label className="archive-filterbar__field"><span>Status</span><select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}><option value="">All statuses</option>{STATUS_OPTIONS[tab.entity].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="archive-filterbar__field"><span>Archived from</span><input type="date" value={filters.from} max={filters.to || undefined} aria-invalid={Boolean(rangeError) || undefined} aria-describedby={rangeError ? 'archive-range-error' : undefined} onChange={(e) => setFilter('from', e.target.value)} /></label>
      <label className="archive-filterbar__field"><span>Archived to</span><input type="date" value={filters.to} min={filters.from || undefined} aria-invalid={Boolean(rangeError) || undefined} aria-describedby={rangeError ? 'archive-range-error' : undefined} onChange={(e) => setFilter('to', e.target.value)} /></label>
      <button type="button" className="btn admin-btn--secondary archive-filterbar__clear" onClick={clearFilters} disabled={!activeFilters.length && !search}><X size={15} aria-hidden="true" />Clear filters</button>
      {rangeError && <p className="archive-filterbar__error" id="archive-range-error" role="alert"><strong>!</strong> {rangeError}</p>}
    </div>

    <div className="archive-toolbar">
      <p aria-live="polite">
        {loading ? 'Loading archived records…' : rangeError ? 'Fix the date range to see results.' : `${count} of ${totalInCategory} archived ${totalInCategory === 1 ? tab.noun : tab.plural}${activeFilters.length ? ' match' : ''}`}
        {summaryParts.length > 0 && <span> · {summaryParts.join(' · ')}</span>}
        {result?.truncated && <span> · Showing the first {result.limit}; narrow the filters to see the rest.</span>}
      </p>
      <FilteredDownloadMenu
        count={loading || loadError || rangeError ? null : count}
        busy={downloads.busy}
        disabledReason={rangeError ? 'Fix the date range before exporting.' : loadError ? 'Records could not be loaded, so there is nothing to export.' : loading ? 'Waiting for results…' : ''}
        onPdf={downloadListPdf}
        onCsv={downloadListCsv}
      />
    </div>

    <section className="super-archive-list" aria-busy={loading || undefined}>
      {loadError ? <div className="support-empty" role="alert"><p>{loadError}</p><button type="button" className="btn admin-btn--secondary" onClick={load}>Retry</button></div>
        : loading && !rows.length ? <div className="support-empty"><p>Loading archived records…</p></div>
        : rows.length ? rows.map((row) => <ArchiveRow key={`${tab.key}-${row.id}`} tab={tab} row={row} busy={downloads.busy}
            onView={() => openDetail(row)} onDownload={() => downloadRecord(tab.entity, row.id)} onRestore={() => setRestoring({ entity: tab.entity, row })} />)
        : <div className="support-empty">
            {activeFilters.length || rangeError
              ? <><p>No archived {tab.plural} match these filters.</p><button type="button" className="btn admin-btn--secondary" onClick={clearFilters}>Clear filters</button></>
              : <p>There are no archived {tab.plural} yet.</p>}
          </div>}
    </section>

    <AdminDialog
      open={Boolean(detail)}
      size="lg"
      title={detail ? `${detail.row.reference} · Archived ${TABS.find((item) => item.entity === detail.entity).noun}` : ''}
      description="Archived and read-only. Downloading does not restore the record; use Restore in the list to bring it back."
      onClose={() => setDetail(null)}
      cancelLabel="Close"
      onSubmit={detail?.data ? () => downloadRecord(detail.entity, detail.row.id) : undefined}
      busy={Boolean(downloads.busy)}
      busyLabel="Preparing download…"
      submitLabel="Download PDF"
      submitTone="secondary"
    >
      {detail && <ArchiveDetail detail={detail} />}
    </AdminDialog>

    <AdminDialog
      open={Boolean(restoring)}
      size="sm"
      title="Restore this record?"
      description="It returns to its active screen and leaves the archive. Nothing else changes."
      onClose={() => { if (!restoreBusy) setRestoring(null) }}
      onSubmit={restore}
      busy={restoreBusy}
      busyLabel="Restoring…"
      submitLabel="Restore record"
    >
      <AdminDialogSummary items={restoring ? [
        { label: 'Record', value: restoring.row.reference },
        { label: 'Type', value: TABS.find((item) => item.entity === restoring.entity).noun },
        { label: 'Archived', value: stamp(restoring.row.archived_at) },
      ] : []} />
    </AdminDialog>
  </div></section>
}

function ArchiveRow({ tab, row, busy, onView, onDownload, onRestore }) {
  const title = tab.entity === 'cycle' ? `${day(row.cycle_start)} – ${day(row.cycle_end)}`
    : tab.entity === 'ledger' ? `${row.booking_reference || 'No booking'} · ${row.client_name || 'Client'}` : row.subject
  const meta = tab.entity === 'cycle' ? `${money(row.total_fees)} fees · ${row.entry_count} entr${row.entry_count === 1 ? 'y' : 'ies'}`
    : tab.entity === 'ledger' ? `${row.invoice_number || 'No invoice'} · ${money(row.fee_amount)} fee on ${money(row.agreed_total)}`
    : `${CATEGORY_LABELS[row.category] || row.category} · from ${row.submitted_by_username || 'Owner'}`
  const downloading = busy === `record-${tab.entity}-${row.id}`
  return <article>
    <div><span>{row.reference} · {tab.noun}</span><h3>{title}</h3><p>{meta}</p></div>
    <div>
      <div className="archive-row__status">{tab.entity === 'support' ? <><SupportPriorityBadge priority={row.priority} /><SupportStatusBadge status={row.status} /></> : <em>{titleCase(row.status)}</em>}</div>
      <time dateTime={row.archived_at}>Archived {stamp(row.archived_at)}</time>
      <div className="admin-actions archive-row__actions">
        <button type="button" className="btn admin-btn--neutral" onClick={onView} aria-label={`View details for ${row.reference}`}><Eye size={15} aria-hidden="true" />View details</button>
        <button type="button" className="btn admin-btn--neutral" onClick={onDownload} disabled={Boolean(busy)} aria-label={`Download PDF for ${row.reference}`}><Download size={15} aria-hidden="true" />{downloading ? 'Preparing…' : 'PDF'}</button>
        <button type="button" className="btn admin-btn--secondary" onClick={onRestore}><ArchiveRestore size={15} aria-hidden="true" />Restore</button>
      </div>
    </div>
  </article>
}

function ArchiveDetail({ detail }) {
  if (detail.error) return <p className="record-error" role="alert">{detail.error}</p>
  if (!detail.data) return <p className="record-loading" aria-live="polite">Loading record…</p>
  const { record: r, related } = detail.data
  const archivedRow = ['Archived', `${stamp(r.archived_at)}${r.archived_by ? ` by ${r.archived_by}` : ''}`]
  if (detail.entity === 'cycle') {
    const ledger = related?.ledger || []
    return <>
      <p className="record-banner">Archived · Read-only · Status: {titleCase(r.status)}</p>
      <RecordFields items={[
        ['Reference', r.reference], ['Status', titleCase(r.status)],
        ['Cycle period', `${day(r.cycle_start)} – ${day(r.cycle_end)}`], ['Due date', day(r.due_date)],
        ['Bookings / entries', `${r.entry_count}${r.voided_count ? ` (${r.voided_count} voided, excluded)` : ''}`],
        ['Agreed totals', money(r.total_agreed)], ['Platform fees', money(r.total_fees)],
        ['Outstanding', money(r.outstanding)], ['Paid on', day(r.paid_at)], ['Payment note', r.payment_note],
        ['Archive reason', null], archivedRow, ['Created', stamp(r.created_at)], ['Last updated', stamp(r.updated_at)],
      ]} />
      <section className="record-text"><h3>Fee entries in this cycle</h3>
        {ledger.length ? <div className="record-table-wrap"><table className="record-table">
          <thead><tr><th scope="col">Entry</th><th scope="col">Booking</th><th scope="col">Invoice</th><th scope="col" className="num">Agreed</th><th scope="col" className="num">Rate</th><th scope="col" className="num">Fee</th></tr></thead>
          <tbody>{ledger.map((e) => <tr key={e.id} className={e.voided_at ? 'is-voided' : undefined}><td>{e.reference}{e.voided_at ? ' (voided)' : ''}</td><td>{e.booking_reference || '—'}<small>{e.client_name}</small></td><td>{e.invoice_number || '—'}</td><td className="num">{money(e.agreed_total)}</td><td className="num">{rate(e.fee_rate)}</td><td className="num">{money(e.fee_amount)}</td></tr>)}</tbody>
          <tfoot><tr><th scope="row" colSpan={3}>Total (excluding voided)</th><td className="num">{money(r.total_agreed)}</td><td /><td className="num">{money(r.total_fees)}</td></tr></tfoot>
        </table></div> : <p className="is-missing">No fee entries are linked to this cycle.</p>}
      </section>
    </>
  }
  if (detail.entity === 'ledger') {
    return <>
      <p className="record-banner">Archived · Read-only · Status: {titleCase(r.status)}</p>
      <RecordFields items={[
        ['Reference', r.reference], ['Status', titleCase(r.status)],
        ['Booking', r.booking_reference], ['Client', r.client_name], ['Service', r.service],
        ['Invoice', r.invoice_number ? `${r.invoice_number}${r.invoice_type ? ` · ${titleCase(r.invoice_type)}` : ''}` : null],
        ['Agreed total', money(r.agreed_total)], ['Fee rate', rate(r.fee_rate)], ['Platform fee', money(r.fee_amount)],
        ['Fee passed to client', feeParty(r)],
        ['Billing cycle', r.cycle_reference ? `${r.cycle_reference} · ${day(r.cycle_start)} – ${day(r.cycle_end)}` : null],
        ['Cycle status', titleCase(r.cycle_status)], ['Cycle paid on', day(r.cycle_paid_at)],
        ['Accrued', stamp(r.accrued_at)], ['Voided', stamp(r.voided_at)], ['Archive reason', null], archivedRow, ['Last updated', stamp(r.updated_at)],
      ]} />
      <p className="record-note">Amounts are the values stored when the fee was recorded; they are not recalculated with current settings.</p>
    </>
  }
  return <SupportDetailBody record={r} history={related?.history || []} archived />
}
