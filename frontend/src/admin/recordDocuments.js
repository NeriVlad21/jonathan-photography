// PDF documents for archived records and support reports. Every document is
// built from the same JSON the screens show (archive-records.php /
// report-records.php), so values and totals cannot drift from the UI.
import { addFields, addHeading, addParagraph, addTable, createPdf, finishPdf, orNotRecorded, pdfDate, pdfFilename, pdfMoney, pdfRate } from '../utils/pdfDocuments.js'

const CATEGORY = { TECHNICAL: 'Technical', BILLING: 'Billing', ACCOUNT: 'Account', OTHER: 'Other' }
const SUPPORT_STATUS = { OPEN: 'New', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved', CLOSED: 'Closed' }
const yesNo = (value) => (value === null || value === undefined ? 'Not recorded' : value ? 'Yes — added to the client total' : 'No — absorbed by the studio')
const titleCase = (value) => (value ? String(value).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : 'Not recorded')

export function filterSummary(filters = {}, labels = {}) {
  const parts = []
  if (filters.context) parts.push(`Scope: ${filters.context === 'all' ? 'active and archived' : filters.context}`)
  if (filters.q) parts.push(`Search: "${filters.q}"`)
  if (filters.status) parts.push(`Status: ${labels.status?.[filters.status] || titleCase(filters.status)}`)
  if (filters.priority) parts.push(`Priority: ${titleCase(filters.priority)}`)
  if (filters.category) parts.push(`Category: ${CATEGORY[filters.category] || filters.category}`)
  if (filters.from || filters.to) parts.push(`${labels.dateLabel || 'Date'}: ${filters.from || 'any'} to ${filters.to || 'any'}`)
  return parts.length ? `Filters — ${parts.join(' · ')}` : 'Filters — none (all records in this view)'
}

// --------------------------------------------------------- single records
export async function downloadCyclePdf({ record: c, related }) {
  const ctx = await createPdf({ title: 'Archived billing cycle', documentType: 'Billing cycle record', reference: c.reference, statusLine: `ARCHIVED · READ-ONLY · Status: ${titleCase(c.status)}` })
  addHeading(ctx, 'Cycle')
  addFields(ctx, [
    ['Reference', c.reference], ['Status', titleCase(c.status)],
    ['Covered period', `${pdfDate(c.cycle_start)} – ${pdfDate(c.cycle_end)}`], ['Due date', pdfDate(c.due_date)],
    ['Settled on', pdfDate(c.paid_at)], ['Payment note', c.payment_note],
  ])
  addHeading(ctx, 'Financial summary')
  addFields(ctx, [
    ['Booking value', pdfMoney(c.total_agreed)], ['Platform fees', pdfMoney(c.total_fees)],
    ['Outstanding', pdfMoney(c.outstanding)], ['Ledger entries', `${c.entry_count} (${c.voided_count} voided)`],
  ])
  addHeading(ctx, 'Ledger entries')
  const rows = (related?.ledger || []).map((e) => [e.reference, `${e.booking_reference}\n${e.client_name}`, e.invoice_number, pdfMoney(e.agreed_total), pdfRate(e.fee_rate), pdfMoney(e.fee_amount), e.voided_at ? 'Voided' : titleCase(e.status)])
  addTable(ctx, [
    { label: 'Fee ref', width: 0.14 }, { label: 'Booking / client', width: 0.24 }, { label: 'Invoice', width: 0.16 },
    { label: 'Agreed total', width: 0.15, align: 'right' }, { label: 'Rate', width: 0.08, align: 'right' }, { label: 'Fee', width: 0.12, align: 'right' }, { label: 'State', width: 0.11 },
  ], rows, ['Totals', 'Excluding voided entries', '', pdfMoney(c.total_agreed), '', pdfMoney(c.total_fees), ''])
  addHeading(ctx, 'Record dates')
  addFields(ctx, [['Created', pdfDate(c.created_at, true)], ['Last updated', pdfDate(c.updated_at, true)], ['Archived', pdfDate(c.archived_at, true)], ['Archived by', c.archived_by]])
  finishPdf(ctx, pdfFilename('billing-cycle', c.reference))
}

export async function downloadLedgerPdf({ record: e }) {
  const ctx = await createPdf({ title: 'Archived fee-ledger entry', documentType: 'Fee ledger record', reference: e.reference, statusLine: `ARCHIVED · READ-ONLY · ${e.voided_at ? 'Voided' : `Cycle status: ${titleCase(e.cycle_status)}`}` })
  addHeading(ctx, 'Booking')
  addFields(ctx, [['Booking', e.booking_reference], ['Client', e.client_name], ['Service', e.service], ['Invoice', `${orNotRecorded(e.invoice_number)} (${titleCase(e.invoice_type)})`]])
  addHeading(ctx, 'Platform fee (stored values)')
  addFields(ctx, [
    ['Agreed total', pdfMoney(e.agreed_total)], ['Fee rate', pdfRate(e.fee_rate)],
    ['Platform fee', pdfMoney(e.fee_amount)], ['Fee passed to client', yesNo(e.fee_charged_to_client)],
  ])
  addHeading(ctx, 'Billing cycle')
  addFields(ctx, [['Cycle', e.cycle_reference], ['Covered period', `${pdfDate(e.cycle_start)} – ${pdfDate(e.cycle_end)}`], ['Cycle status', titleCase(e.cycle_status)], ['Cycle settled on', pdfDate(e.cycle_paid_at)]])
  addHeading(ctx, 'Record dates')
  addFields(ctx, [['Accrued', pdfDate(e.accrued_at, true)], ['Voided', pdfDate(e.voided_at, true)], ['Last updated', pdfDate(e.updated_at, true)], ['Archived', pdfDate(e.archived_at, true)], ['Archived by', e.archived_by], ['Archive reason', 'Not recorded']])
  finishPdf(ctx, pdfFilename('fee-ledger', e.reference))
}

export async function downloadSupportPdf({ record: r, history, archived }) {
  const ctx = await createPdf({ title: 'Platform Support Report', documentType: 'Jonathan Photography Platform Support Report', reference: r.reference, statusLine: `${archived ? 'ARCHIVED · READ-ONLY · ' : ''}Status: ${SUPPORT_STATUS[r.status] || titleCase(r.status)} · Priority: ${titleCase(r.priority)}` })
  addHeading(ctx, 'Report')
  addFields(ctx, [['Reference', r.reference], ['Category', CATEGORY[r.category] || r.category], ['Priority', titleCase(r.priority)], ['Status', SUPPORT_STATUS[r.status] || titleCase(r.status)], ['Reporter', r.submitted_by_username], ['Reporter email', r.submitted_by_email]])
  addHeading(ctx, 'Subject')
  addParagraph(ctx, r.subject)
  addHeading(ctx, 'Description')
  addParagraph(ctx, r.description)
  addHeading(ctx, 'Super Admin response / resolution note')
  addParagraph(ctx, r.super_admin_reply)
  addHeading(ctx, 'Status history')
  addTable(ctx, [{ label: 'When', width: 0.28 }, { label: 'Event', width: 0.3 }, { label: 'Status', width: 0.2 }, { label: 'By', width: 0.22 }],
    (history || []).map((h) => [pdfDate(h.at, true), h.event, h.status ? (SUPPORT_STATUS[h.status] || titleCase(h.status)) : '—', orNotRecorded(h.actor)]))
  addHeading(ctx, 'Record dates')
  addFields(ctx, [['Created', pdfDate(r.created_at, true)], ['Last updated', pdfDate(r.updated_at, true)], ['Resolved', pdfDate(r.resolved_at, true)], ['Archived', pdfDate(r.archived_at, true)]])
  finishPdf(ctx, pdfFilename('support-report', r.reference))
}

// -------------------------------------------------------- filtered lists
export async function downloadArchiveListPdf(entity, data) {
  const stamp = new Date().toISOString().slice(0, 10)
  const common = { summaryLines: [filterSummary(data.filters, { dateLabel: 'Archived' }), `${data.count} record(s) exported${data.truncated ? ` — limited to the first ${data.limit}` : ''}.`] }
  if (entity === 'cycle') {
    const ctx = await createPdf({ ...common, orientation: 'landscape', title: 'Archived billing cycles', documentType: 'Super Admin archive export' })
    addTable(ctx, [
      { label: 'Reference', width: 0.08 }, { label: 'Period', width: 0.2 }, { label: 'Status', width: 0.08 }, { label: 'Settled', width: 0.11 },
      { label: 'Entries', width: 0.07, align: 'right' }, { label: 'Booking value', width: 0.13, align: 'right' }, { label: 'Platform fees', width: 0.12, align: 'right' }, { label: 'Outstanding', width: 0.1, align: 'right' }, { label: 'Archived', width: 0.11 },
    ], data.records.map((c) => [c.reference, `${pdfDate(c.cycle_start)} – ${pdfDate(c.cycle_end)}`, titleCase(c.status), pdfDate(c.paid_at), String(c.entry_count), pdfMoney(c.total_agreed), pdfMoney(c.total_fees), pdfMoney(c.outstanding), pdfDate(c.archived_at)]),
    ['Totals', '', '', '', '', pdfMoney(data.totals.total_agreed), pdfMoney(data.totals.total_fees), pdfMoney(data.totals.outstanding), ''])
    return finishPdf(ctx, pdfFilename('archived-billing-cycles', stamp))
  }
  if (entity === 'ledger') {
    const ctx = await createPdf({ ...common, orientation: 'landscape', title: 'Archived fee ledger', documentType: 'Super Admin archive export', summaryLines: [...common.summaryLines, data.totals.voided_excluded ? `${data.totals.voided_excluded} voided entr(ies) listed but excluded from totals.` : ''] })
    addTable(ctx, [
      { label: 'Reference', width: 0.1 }, { label: 'Booking / client', width: 0.2 }, { label: 'Invoice', width: 0.12 }, { label: 'Cycle', width: 0.07 },
      { label: 'Agreed total', width: 0.13, align: 'right' }, { label: 'Rate', width: 0.07, align: 'right' }, { label: 'Fee', width: 0.11, align: 'right' }, { label: 'To client', width: 0.08 }, { label: 'Archived', width: 0.12 },
    ], data.records.map((e) => [e.reference, `${e.booking_reference} · ${e.client_name}`, e.invoice_number, e.cycle_reference, pdfMoney(e.agreed_total), pdfRate(e.fee_rate), pdfMoney(e.fee_amount) + (e.voided_at ? ' (void)' : ''), e.fee_charged_to_client === null ? '—' : e.fee_charged_to_client ? 'Yes' : 'No', pdfDate(e.archived_at)]),
    ['Totals', 'Excluding voided entries', '', '', pdfMoney(data.totals.agreed_total), '', pdfMoney(data.totals.fee_amount), '', ''])
    return finishPdf(ctx, pdfFilename('archived-fee-ledger', stamp))
  }
  const ctx = await createPdf({ ...common, orientation: 'landscape', title: 'Archived support reports', documentType: 'Super Admin archive export' })
  addSupportRows(ctx, data.records)
  return finishPdf(ctx, pdfFilename('archived-support-reports', stamp))
}

export async function downloadSupportListPdf(data) {
  const ctx = await createPdf({
    orientation: 'landscape', title: 'Platform support reports', documentType: 'Support reports export',
    summaryLines: [filterSummary(data.filters, { dateLabel: 'Submitted', status: SUPPORT_STATUS }), `${data.count} report(s) exported${data.truncated ? ` — limited to the first ${data.limit}` : ''}.`],
  })
  addSupportRows(ctx, data.records)
  finishPdf(ctx, pdfFilename('support-reports', data.filters?.context || 'active', new Date().toISOString().slice(0, 10)))
}

function addSupportRows(ctx, records) {
  addTable(ctx, [
    { label: 'Reference', width: 0.1 }, { label: 'Subject', width: 0.3 }, { label: 'Category', width: 0.09 }, { label: 'Priority', width: 0.08 },
    { label: 'Status', width: 0.1 }, { label: 'Reporter', width: 0.11 }, { label: 'Created', width: 0.11 }, { label: 'Resolved', width: 0.11 },
  ], records.map((r) => [r.reference, r.subject + (r.archived_at ? ' (archived)' : ''), CATEGORY[r.category] || r.category, titleCase(r.priority), SUPPORT_STATUS[r.status] || titleCase(r.status), orNotRecorded(r.submitted_by_username), pdfDate(r.created_at), pdfDate(r.resolved_at)]))
}
