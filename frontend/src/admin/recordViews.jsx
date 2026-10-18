import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Download } from 'lucide-react'
import { useToast } from '../context/ToastContext.jsx'
import { formatDateTime } from '../utils/format.js'
import { SUPPORT_STATUSES, SupportPriorityBadge, SupportStatusBadge } from './supportStatus.jsx'

// Shared pieces for read-only record details and downloads (Super Admin
// archives and support reports).

export const notRecorded = (value) => (value === null || value === undefined || String(value).trim() === '' ? 'Not recorded' : value)

/** Label/value list for a record; missing optional values read "Not recorded". */
export function RecordFields({ items }) {
  return (
    <dl className="record-fields">
      {items.filter(Boolean).map(([label, value]) => {
        const missing = value === null || value === undefined || String(value).trim() === ''
        return <div key={label}><dt>{label}</dt><dd className={missing ? 'is-missing' : undefined}>{missing ? 'Not recorded' : value}</dd></div>
      })}
    </dl>
  )
}

/** Free text (descriptions, responses) shown as plain text with line breaks kept. */
export function RecordText({ label, text }) {
  return (
    <section className="record-text">
      <h3>{label}</h3>
      {text && String(text).trim() ? <p>{text}</p> : <p className="is-missing">Not recorded</p>}
    </section>
  )
}

/**
 * One download at a time: the key of the running download is exposed so its
 * button can show "Preparing download…"; repeated clicks are ignored.
 */
export function useDownloads() {
  const { showToast } = useToast()
  const [busy, setBusy] = useState(null)
  const busyRef = useRef(null)
  const run = async (key, task) => {
    if (busyRef.current) return
    busyRef.current = key
    setBusy(key)
    showToast('Preparing download…', 'info')
    try {
      await task()
      showToast('Download ready.')
    } catch (error) {
      showToast(error?.message ? `Download failed: ${error.message}` : 'Download failed. Please try again.', 'error')
    } finally {
      busyRef.current = null
      setBusy(null)
    }
  }
  return { busy, run }
}

/**
 * "Download filtered results" with a compact PDF / CSV menu. Disabled (with a
 * visible reason) while another download runs or when nothing matches.
 */
export function FilteredDownloadMenu({ label = 'Download filtered results', count, busy, disabledReason, onPdf, onCsv }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const menuId = useId()
  const reasonId = useId()
  const reason = disabledReason || (count === 0 ? 'Nothing matches the current filters, so there is nothing to export.' : '')
  const disabled = Boolean(busy) || Boolean(reason)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (event) => { if (!wrapRef.current?.contains(event.target)) setOpen(false) }
    const onKey = (event) => {
      if (event.key === 'Escape') { setOpen(false); wrapRef.current?.querySelector('button')?.focus(); return }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      const items = [...(wrapRef.current?.querySelectorAll('[role="menuitem"]') || [])]
      const index = items.indexOf(document.activeElement)
      if (index < 0) return
      event.preventDefault()
      items[(index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    wrapRef.current?.querySelector('[role="menuitem"]')?.focus()
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  useEffect(() => { if (disabled) setOpen(false) }, [disabled])

  const choose = (action) => { setOpen(false); action() }
  const busyHere = busy === 'list-pdf' || busy === 'list-csv'
  return (
    <div className="record-download" ref={wrapRef}>
      <button
        type="button"
        className="btn admin-btn--secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-describedby={reason ? reasonId : undefined}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <Download size={15} aria-hidden="true" />{busyHere ? 'Preparing download…' : label}<ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="record-download__menu" role="menu" id={menuId}>
          <button type="button" role="menuitem" onClick={() => choose(onPdf)}>PDF <small>formatted report</small></button>
          <button type="button" role="menuitem" onClick={() => choose(onCsv)}>CSV <small>spreadsheet data</small></button>
        </div>
      )}
      {reason && <p className="record-download__reason" id={reasonId}>{reason}</p>}
    </div>
  )
}

const CATEGORY_LABELS = { TECHNICAL: 'Technical', BILLING: 'Billing', ACCOUNT: 'Account', OTHER: 'Other' }
const stamp = (value) => (value ? formatDateTime(value) : null)
const titleCase = (value) => (value ? String(value).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : null)
const statusLabel = (value) => (SUPPORT_STATUSES.find((s) => s.value === value) || {}).label || titleCase(value)

/** Read-only support report details (used by Support Reports and Archives). Text renders as plain text only. */
export function SupportDetailBody({ record: r, history, archived, showReporter = true }) {
  return <>
    <p className="record-banner">{archived ? 'Archived · Read-only' : 'Active report'} · <SupportPriorityBadge priority={r.priority} /> <SupportStatusBadge status={r.status} /></p>
    <RecordFields items={[
      ['Reference', r.reference], ['Status', statusLabel(r.status)],
      ['Category', CATEGORY_LABELS[r.category] || r.category], ['Priority', titleCase(r.priority)],
      showReporter && ['Reported by', r.submitted_by_username ? `${r.submitted_by_username}${r.submitted_by_email ? ` · ${r.submitted_by_email}` : ''}` : null],
      ['Submitted', stamp(r.created_at)], ['Last updated', stamp(r.updated_at)], ['Resolved', stamp(r.resolved_at)],
      archived && ['Archived', `${stamp(r.archived_at)}${r.archived_by ? ` by ${r.archived_by}` : ''}`],
      ['Attachments', 'Not supported for support reports'],
    ]} />
    <section className="record-text"><h3>Subject</h3><p>{r.subject}</p></section>
    <RecordText label="Description" text={r.description} />
    <RecordText label="Super Admin response / resolution note" text={r.super_admin_reply} />
    <section className="record-text"><h3>Status history</h3>
      {history.length ? <ol className="record-history">{history.map((h, index) => <li key={index}><time dateTime={h.at}>{stamp(h.at)}</time><span>{h.event}{h.status ? ` → ${statusLabel(h.status)}` : ''}</span><small>{h.actor || 'System'}</small></li>)}</ol>
        : <p className="is-missing">No status changes were recorded for this report.</p>}
    </section>
  </>
}
