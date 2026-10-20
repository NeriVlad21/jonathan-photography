import { useEffect, useMemo, useState } from 'react'
import { useDialog } from '../components/useDialog.js'
import { Link, useLocation } from 'react-router-dom'
import { Archive, Download, Search, WalletCards } from 'lucide-react'
import { feesApi, oversightApi, superArchiveApi } from '../services/api.js'
import { peso, formatDate } from '../utils/format.js'
import { FEE_RESPONSIBILITY_LABELS, formatRate } from '../utils/billing.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import AdminDialog, { AdminDialogSummary } from '../components/AdminDialog.jsx'
import { notifyAdminDataChanged } from '../utils/adminDataSync.js'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'

const INITIAL_FILTERS = { q: '', status: 'ALL', from: '', to: '' }
const includesDate = (value, from, to) => (!from || value >= from) && (!to || value <= to)

export default function PlatformFees() {
  const location = useLocation()
  const { showToast } = useToast()
  const { admin } = useAdminAuth()
  const [data, setData] = useState(null)
  const canManage = data?.can_manage ?? admin?.role === 'OWNER'
  const [paying, setPaying] = useState(null)
  const [archiving, setArchiving] = useState(null)
  const [archiveBusy, setArchiveBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const payDialogRef = useDialog(Boolean(paying), () => { if (!saving) setPaying(null) })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [exportingKey, setExportingKey] = useState('')
  const [filters, setFilters] = useState(() => ({ ...INITIAL_FILTERS, ...(location.state?.feeFilters || {}) }))
  const [payment, setPayment] = useState({ paid_at: new Date().toISOString().slice(0, 10), note: '' })

  const load = () => feesApi.list().then(setData).catch((error) => showToast(error.message || 'Unable to load platform fees.', 'error'))
  useEffect(() => { document.title = 'Admin — Platform Fees'; load() }, [])

  const filteredCycles = useMemo(() => (data?.cycles || []).filter((cycle) => {
    const haystack = `${cycle.cycle_start} ${cycle.cycle_end} ${cycle.due_date} ${cycle.status} ${cycle.payment_note || ''}`.toLowerCase()
    return (!filters.q || haystack.includes(filters.q.toLowerCase())) && (filters.status === 'ALL' || cycle.status === filters.status) && includesDate(cycle.cycle_start, filters.from, filters.to)
  }), [data, filters])

  const filteredLedger = useMemo(() => (data?.ledger || []).filter((entry) => {
    const haystack = `${entry.reference_code} ${entry.name} ${entry.invoice_number} ${entry.cycle_status}`.toLowerCase()
    return (!filters.q || haystack.includes(filters.q.toLowerCase())) && (filters.status === 'ALL' || entry.cycle_status === filters.status) && includesDate(entry.accrued_at?.slice(0, 10) || '', filters.from, filters.to)
  }), [data, filters])

  const cycleEntries = useMemo(() => paying ? (data?.ledger || []).filter((entry) => Number(entry.cycle_id) === Number(paying.id) && !entry.voided_at) : [], [data, paying])
  const markPaid = async (event) => {
    event.preventDefault(); setSaving(true)
    try { const result = await feesApi.markCyclePaid({ cycle_id: paying.id, ...payment }); setData((current) => ({ ...current, cycles: current.cycles.map((cycle) => cycle.id === paying.id ? { ...cycle, ...result } : cycle) })); setPaying(null); notifyAdminDataChanged({ type: 'fee-cycle' }); showToast(result.message) }
    catch (error) { showToast(error.message || 'Unable to mark this cycle paid.', 'error') }
    finally { setSaving(false) }
  }
  const updateStart = async (event) => {
    const value = event.target.value; setSettingsSaving(true)
    try { const result = await feesApi.updateSettings(value); setData((current) => ({ ...current, settings: { ...current.settings, cycle_start_date: result.cycle_start_date } })); showToast(result.message) }
    catch (error) { showToast(error.message || 'Unable to update cycle settings.', 'error') }
    finally { setSettingsSaving(false) }
  }
  const updatePassThrough = async (event) => {
    const enabled = event.target.checked
    if (!window.confirm(`${enabled ? 'Enable' : 'Disable'} passing the platform fee to clients by default? Existing bookings and issued invoices will not change.`)) return
    setSettingsSaving(true)
    try { const result = await feesApi.updatePassThroughDefault(enabled); setData((current) => ({ ...current, settings: { ...current.settings, pass_platform_fee_to_client_default: result.pass_platform_fee_to_client_default } })); showToast(result.message) }
    catch (error) { showToast(error.message || 'Unable to update the platform-fee default.', 'error') }
    finally { setSettingsSaving(false) }
  }
  const archiveRecord = (entity, id, label) => setArchiving({ entity, id, label })
  const confirmArchive = async () => {
    setArchiveBusy(true)
    try {
      const result = await superArchiveApi.update({ entity: archiving.entity, id: archiving.id, operation: 'archive' })
      await load()
      setArchiveBusy(false)
      setArchiving(null)
      showToast(result.message)
    } catch (error) { showToast(error.message || 'Unable to archive this record.', 'error') }
    finally { setArchiveBusy(false) }
  }

  const exportCycle = async (cycle) => {
    if (exportingKey) return
    setExportingKey(`cycle-${cycle.id}`)
    const rows = (data.ledger || []).filter((entry) => Number(entry.cycle_id) === Number(cycle.id) && !entry.voided_at)
    const totalAgreed = rows.reduce((sum, entry) => sum + Number(entry.agreed_total || 0), 0)
    const totalFees = rows.reduce((sum, entry) => sum + Number(entry.fee_amount || 0), 0)
    const generated = new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })
    const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]))
    const root = document.createElement('div')
    root.style.cssText = 'font-family:Arial,sans-serif;padding:34px;color:#111;background:#fff;font-size:11px;line-height:1.45'
    root.innerHTML = `
      <header style="display:flex;justify-content:space-between;gap:24px;padding-bottom:18px;border-bottom:3px solid #111">
        <div><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#777">Platform administration</div><h1 style="margin:6px 0 0;font-size:25px">Statement of Platform Fees</h1><p style="margin:6px 0 0;color:#555">Jonathan Photography</p></div>
        <div style="text-align:right"><strong>Statement #FC-${escape(cycle.id)}</strong><br>Generated ${escape(generated)}<br>Currency: Philippine Peso (PHP)</div>
      </header>
      <section style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:20px 0">
        <div style="padding:12px;background:#f3f2ee"><small>STATEMENT PERIOD</small><br><strong>${escape(formatDate(cycle.cycle_start))}<br>to ${escape(formatDate(cycle.cycle_end))}</strong></div>
        <div style="padding:12px;background:#f3f2ee"><small>DUE DATE</small><br><strong>${escape(formatDate(cycle.due_date))}</strong></div>
        <div style="padding:12px;background:#f3f2ee"><small>STATUS</small><br><strong>${escape(cycle.status)}</strong></div>
        <div style="padding:12px;background:#f5d000"><small>BALANCE DUE</small><br><strong style="font-size:18px">${escape(peso(cycle.status === 'PAID' ? 0 : totalFees))}</strong><br><span>Assessed: ${escape(peso(totalFees))}</span></div>
      </section>
      <h2 style="font-size:14px;margin:22px 0 8px">Transaction schedule</h2>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#111;color:#fff"><th style="padding:9px;text-align:left">Accrued</th><th style="padding:9px;text-align:left">Reference / Client</th><th style="padding:9px;text-align:left">Invoice</th><th style="padding:9px;text-align:right">Agreed total</th><th style="padding:9px;text-align:right">Rate</th><th style="padding:9px;text-align:right">Platform fee</th></tr></thead>
        <tbody>${rows.length ? rows.map((entry) => `<tr><td style="padding:9px;border-bottom:1px solid #ddd">${escape(formatDate(entry.accrued_at))}</td><td style="padding:9px;border-bottom:1px solid #ddd"><strong>${escape(entry.reference_code)}</strong><br><span style="color:#666">${escape(entry.name)}</span></td><td style="padding:9px;border-bottom:1px solid #ddd">${escape(entry.invoice_number)}</td><td style="padding:9px;border-bottom:1px solid #ddd;text-align:right">${escape(peso(entry.agreed_total))}</td><td style="padding:9px;border-bottom:1px solid #ddd;text-align:right">${escape(formatRate(entry.fee_rate))}</td><td style="padding:9px;border-bottom:1px solid #ddd;text-align:right"><strong>${escape(peso(entry.fee_amount))}</strong><br><small>${escape(FEE_RESPONSIBILITY_LABELS[entry.fee_responsibility] || 'Studio absorbs')}</small></td></tr>`).join('') : '<tr><td colspan="6" style="padding:18px;text-align:center">No fee transactions in this period.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="3" style="padding:12px;text-align:right"><strong>Totals</strong></td><td style="padding:12px;text-align:right"><strong>${escape(peso(totalAgreed))}</strong></td><td></td><td style="padding:12px;text-align:right;background:#f5d000"><strong>${escape(peso(totalFees))}</strong></td></tr></tfoot>
      </table>
      <section style="margin-top:20px;padding:14px;border:1px solid #ccc"><strong>Payment record</strong><br>${cycle.paid_at ? `Paid ${escape(formatDate(cycle.paid_at))}` : `Payment due ${escape(formatDate(cycle.due_date))}`}${cycle.payment_note ? `<br>Note: ${escape(cycle.payment_note)}` : ''}</section>
      <footer style="margin-top:28px;padding-top:12px;border-top:1px solid #bbb;color:#666">This statement summarizes platform fees recorded for the stated billing cycle. Booking payments occur outside the website. Keep this document with the corresponding invoices and payment evidence for reconciliation.</footer>`
    document.body.appendChild(root)
    try { const { default: html2pdf } = await import('html2pdf.js'); await html2pdf().set({ margin:.42, filename:`Platform_Fee_Statement_${cycle.cycle_start}_${cycle.cycle_end}.pdf`, html2canvas:{scale:2}, jsPDF:{unit:'in',format:'letter',orientation:'portrait'}, pagebreak:{mode:['avoid-all','css','legacy']} }).from(root).save(); if (admin?.role === 'SUPER_ADMIN') await oversightApi.logAccess('LEDGER_EXPORT', `cycle-${cycle.id}`); showToast('Statement downloaded.') }
    catch (error) { showToast(error.message || 'Unable to export the statement.', 'error') }
    finally { root.remove(); setExportingKey('') }
  }

  const exportLedger = async () => {
    if (!filteredLedger.length || exportingKey) return
    setExportingKey('ledger')
    const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]))
    const root = document.createElement('div')
    root.style.cssText = 'font-family:Arial,sans-serif;padding:30px;color:#111;background:#fff;font-size:11px'
    root.innerHTML = `<h1>Platform Fee Ledger</h1><p>${escape(filters.from || 'Beginning')} to ${escape(filters.to || 'Present')} · Generated ${escape(new Date().toLocaleString('en-PH'))}</p><table style="width:100%;border-collapse:collapse"><thead><tr><th>Accrued</th><th>Reference</th><th>Client</th><th>Agreed total</th><th>Rate</th><th>Fee</th><th>Cycle status</th></tr></thead><tbody>${filteredLedger.map((entry) => `<tr><td>${escape(entry.accrued_at || '')}</td><td>${escape(entry.reference_code)}</td><td>${escape(entry.name)}</td><td>${escape(peso(entry.agreed_total))}</td><td>${escape(formatRate(entry.fee_rate))}</td><td>${escape(peso(entry.fee_amount))}</td><td>${escape(entry.cycle_status)}</td></tr>`).join('')}</tbody></table>`
    document.body.appendChild(root)
    try { const { default: html2pdf } = await import('html2pdf.js'); await html2pdf().set({ margin:.4, filename:`Platform_Fee_Ledger_${filters.from || 'start'}_${filters.to || 'present'}.pdf`, html2canvas:{scale:2}, jsPDF:{unit:'in',format:'letter',orientation:'landscape'} }).from(root).save(); if (admin?.role === 'SUPER_ADMIN') await oversightApi.logAccess('LEDGER_EXPORT', `${filters.from || 'start'}:${filters.to || 'present'}`); showToast('Ledger export downloaded.') } catch (error) { showToast(error.message || 'Unable to export the ledger.', 'error') } finally { root.remove(); setExportingKey('') }
  }

  if (!data) return <LoadingState label="Loading platform fees…" />
  return <section className="platform-fees-page"><div className="admin-content">
    <header className="platform-fees-hero"><div><span>Billing / Commission</span><h2>Platform Fees</h2><p>{canManage ? 'Manage client pass-through defaults and record externally settled billing cycles.' : 'Read-only ledger oversight. Only the Owner can change settings or mark a cycle paid.'}</p></div><WalletCards size={34} /></header>
    <div className="platform-fees-summary"><div><span>Total currently due</span><strong>{peso(data.total_due)}</strong></div><label>30-day cycles begin<input type="date" disabled={!canManage || settingsSaving} value={data.settings.cycle_start_date} onChange={updateStart} /></label>{canManage && <label className="platform-fee-toggle"><input type="checkbox" disabled={settingsSaving} checked={Boolean(data.settings.pass_platform_fee_to_client_default)} onChange={updatePassThrough}/> Pass platform fee to client by default</label>}</div>
    <div className="super-filterbar"><label><Search size={16} aria-hidden="true"/><input aria-label="Search billing records" value={filters.q} onChange={(e)=>setFilters({...filters,q:e.target.value})} placeholder="Search reference, client, invoice, cycle…"/></label><select aria-label="Filter by status" value={filters.status} onChange={(e)=>setFilters({...filters,status:e.target.value})}><option value="ALL">All statuses</option><option value="OPEN">Open</option><option value="DUE">Due</option><option value="PAID">Paid</option></select><input type="date" aria-label="From date" value={filters.from} onChange={(e)=>setFilters({...filters,from:e.target.value})}/><input type="date" aria-label="To date" value={filters.to} onChange={(e)=>setFilters({...filters,to:e.target.value})}/>{Object.values(filters).some(Boolean)&&<button type="button" className="btn admin-btn--secondary" onClick={()=>setFilters(INITIAL_FILTERS)}>Clear</button>}</div>
    <section className="platform-fees-panel"><h3>Active billing cycles <small>{filteredCycles.length}</small></h3><div className="platform-cycle-grid">{filteredCycles.length ? filteredCycles.map((cycle) => <article key={cycle.id} className={`platform-cycle platform-cycle--${cycle.status.toLowerCase()}`}><div><span>{formatDate(cycle.cycle_start)} – {formatDate(cycle.cycle_end)}</span><strong>{peso(cycle.total_owed)}</strong><small>{cycle.booking_count} booking(s) · Due {formatDate(cycle.due_date)} · {cycle.status}</small></div><div className="admin-actions"><button className="btn admin-btn--neutral" type="button" disabled={Boolean(exportingKey)} onClick={() => exportCycle(cycle)}><Download size={15}/>{exportingKey === `cycle-${cycle.id}` ? 'Preparing…' : 'Statement'}</button>{canManage && cycle.status !== 'PAID' && <button className="btn admin-btn--primary" type="button" onClick={() => setPaying(cycle)}>Mark Paid</button>}{canManage && cycle.status === 'PAID' && <button type="button" className="btn admin-btn--secondary" onClick={()=>archiveRecord('cycle',cycle.id,`${formatDate(cycle.cycle_start)} – ${formatDate(cycle.cycle_end)} · ${peso(cycle.total_owed)}`)}><Archive size={15}/>Archive</button>}</div></article>) : <p>No active billing cycles match these filters.</p>}</div></section>
    <section className="platform-fees-panel"><div className="platform-fees-panel__header"><h3>Active fee ledger <small>{filteredLedger.length}</small></h3><button type="button" className="btn btn--secondary" disabled={!filteredLedger.length || Boolean(exportingKey)} onClick={exportLedger}><Download size={15}/>{exportingKey === 'ledger' ? 'Preparing…' : 'Export range'}</button></div><div className="platform-fee-ledger">{filteredLedger.length ? filteredLedger.map((entry) => { const content=<><span>{entry.reference_code}<small>{entry.name} · {entry.invoice_number}</small></span><span>{peso(entry.agreed_total)}<small>{formatRate(entry.fee_rate)} rate · {entry.fee_responsibility === 'CLIENT' ? 'Client pays' : 'Studio absorbs'}</small></span><strong>{peso(entry.fee_amount)}</strong><em>{entry.voided_at ? 'Voided' : entry.cycle_status}</em></>; return canManage ? <div key={entry.id} className={entry.voided_at ? 'is-voided' : ''}>{content}{(entry.voided_at||entry.cycle_status==='PAID')&&<button className="icon-btn" title="Archive fee record" onClick={()=>archiveRecord('ledger',entry.id,`${entry.reference_code} · ${peso(entry.fee_amount)}`)}><Archive size={15}/></button>}</div> : <Link key={entry.id} to={`/admin/oversight/bookings/${entry.booking_id}`} state={{ from: { ...location, state: { ...(location.state || {}), feeFilters: filters, scrollY: window.scrollY } } }} className={entry.voided_at ? 'is-voided' : ''}>{content}</Link> }) : <p>No active fee records match these filters.</p>}</div></section>
    <AdminDialog
      open={Boolean(archiving)}
      size="sm"
      title="Archive this settled record?"
      description="Moves it to Financial Archives. It stays searchable there and can be restored at any time."
      onClose={() => { if (!archiveBusy) setArchiving(null) }}
      onSubmit={confirmArchive}
      busy={archiveBusy}
      busyLabel="Archiving…"
      submitLabel="Archive record"
    >
      <AdminDialogSummary items={archiving ? [{ label: archiving.entity === 'cycle' ? 'Billing cycle' : 'Ledger entry', value: archiving.label }] : []} />
    </AdminDialog>
    {paying && <div className="invoice-preview-modal" onMouseDown={() => !saving && setPaying(null)}><form ref={payDialogRef} role="dialog" aria-modal="true" aria-label="Mark cycle paid" onSubmit={markPaid} onMouseDown={(event) => event.stopPropagation()}><h2>Mark cycle paid</h2><p>{formatDate(paying.cycle_start)} – {formatDate(paying.cycle_end)} · {peso(paying.total_owed)}</p><label>Date paid<input type="date" required value={payment.paid_at} onChange={(e)=>setPayment({...payment,paid_at:e.target.value})}/></label><label>Note<textarea maxLength="500" rows="3" value={payment.note} onChange={(e)=>setPayment({...payment,note:e.target.value})}/></label><div className="booking-action-form__actions"><button type="button" className="btn btn--secondary" onClick={()=>setPaying(null)}>Cancel</button><button type="submit" className="btn btn--primary" disabled={saving}>{saving?'Saving…':'Confirm paid'}</button></div><small>{cycleEntries.length} fee record(s) in this statement.</small></form></div>}
  </div></section>
}
