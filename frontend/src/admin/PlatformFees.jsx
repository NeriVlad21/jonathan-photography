import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Download, WalletCards } from 'lucide-react'
import { feesApi } from '../services/api.js'
import { peso, formatDate } from '../utils/format.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { notifyAdminDataChanged } from '../utils/adminDataSync.js'

export default function PlatformFees() {
  const location = useLocation()
  const { showToast } = useToast()
  const [data, setData] = useState(null)
  const [paying, setPaying] = useState(null)
  const [saving, setSaving] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [payment, setPayment] = useState({ paid_at: new Date().toISOString().slice(0, 10), note: '' })

  const load = () => feesApi.list().then(setData).catch((error) => showToast(error.message || 'Unable to load platform fees.', 'error'))
  useEffect(() => { document.title = 'Admin — Platform Fees'; load() }, [])

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
  const exportCycle = async (cycle) => {
    const rows = data.ledger.filter((entry) => Number(entry.cycle_id) === Number(cycle.id) && !entry.voided_at)
    const root = document.createElement('div'); root.style.cssText = 'font-family:Arial,sans-serif;padding:40px;color:#111'
    const heading = document.createElement('h1'); heading.textContent = 'Jonathan Photography — Platform Fee Statement'; root.appendChild(heading)
    ;[`Cycle: ${formatDate(cycle.cycle_start)} – ${formatDate(cycle.cycle_end)}`, `Due: ${formatDate(cycle.due_date)}`, `Status: ${cycle.status}`, `Total owed: ${peso(cycle.total_owed)}`].forEach((text) => { const p=document.createElement('p');p.textContent=text;root.appendChild(p) })
    rows.forEach((entry) => { const p=document.createElement('p');p.textContent=`${entry.reference_code} — ${peso(entry.agreed_total)} × ${Number(entry.fee_rate)*100}% = ${peso(entry.fee_amount)}`;root.appendChild(p) })
    document.body.appendChild(root)
    try { const { default: html2pdf } = await import('html2pdf.js'); await html2pdf().set({ margin:.5, filename:`Platform_Fees_${cycle.cycle_start}_${cycle.cycle_end}.pdf`, html2canvas:{scale:2}, jsPDF:{unit:'in',format:'letter'} }).from(root).save() } finally { root.remove() }
  }
  if (!data) return <LoadingState label="Loading platform fees…" />
  return <section className="platform-fees-page"><div className="admin-content">
    <header className="platform-fees-hero"><div><span>Billing / Commission</span><h2>Platform Fees</h2><p>Track the service fees included in agreed package prices. Payments are recorded manually and happen outside this website.</p></div><WalletCards size={34} /></header>
    <div className="platform-fees-summary"><div><span>Total currently due</span><strong>{peso(data.total_due)}</strong></div><label>30-day cycles begin<input type="date" disabled={settingsSaving} value={data.settings.cycle_start_date} onChange={updateStart} /></label></div>
    <section className="platform-fees-panel"><h3>Billing cycles</h3><div className="platform-cycle-grid">{data.cycles.length ? data.cycles.map((cycle) => <article key={cycle.id} className={`platform-cycle platform-cycle--${cycle.status.toLowerCase()}`}><div><span>{formatDate(cycle.cycle_start)} – {formatDate(cycle.cycle_end)}</span><strong>{peso(cycle.total_owed)}</strong><small>{cycle.booking_count} booking(s) · Due {formatDate(cycle.due_date)} · {cycle.status}</small></div><div><button className="btn btn--secondary" type="button" onClick={() => exportCycle(cycle)}><Download size={15}/> Statement</button>{cycle.status !== 'PAID' && <button className="btn btn--primary" type="button" onClick={() => setPaying(cycle)}>Mark Paid</button>}</div></article>) : <p>No platform fees have accrued yet.</p>}</div></section>
    <section className="platform-fees-panel"><h3>Fee ledger</h3><div className="platform-fee-ledger">{data.ledger.map((entry) => <Link key={entry.id} to={`/admin/bookings/${entry.booking_id}`} state={{ from: { ...location, state: { ...(location.state || {}), scrollY: window.scrollY } } }} className={entry.voided_at ? 'is-voided' : ''}><span>{entry.reference_code}<small>{entry.name}</small></span><span>{peso(entry.agreed_total)}<small>{Number(entry.fee_rate)*100}% rate</small></span><strong>{peso(entry.fee_amount)}</strong><em>{entry.voided_at ? 'Voided' : entry.cycle_status}</em></Link>)}</div></section>
    {paying && <div className="invoice-preview-modal" onMouseDown={() => !saving && setPaying(null)}><form onSubmit={markPaid} onMouseDown={(event) => event.stopPropagation()}><h2>Mark cycle paid</h2><p>{formatDate(paying.cycle_start)} – {formatDate(paying.cycle_end)} · {peso(paying.total_owed)}</p><label>Date paid<input type="date" required value={payment.paid_at} onChange={(e)=>setPayment({...payment,paid_at:e.target.value})}/></label><label>Note<textarea maxLength="500" rows="3" value={payment.note} onChange={(e)=>setPayment({...payment,note:e.target.value})}/></label><div className="booking-action-form__actions"><button type="button" className="btn btn--secondary" onClick={()=>setPaying(null)}>Cancel</button><button type="submit" className="btn btn--primary" disabled={saving}>{saving?'Saving…':'Confirm paid'}</button></div><small>{cycleEntries.length} fee record(s) in this statement.</small></form></div>}
  </div></section>
}
