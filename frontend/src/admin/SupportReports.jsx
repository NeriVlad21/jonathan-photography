import { useEffect, useMemo, useState } from 'react'
import { useDialog } from '../components/useDialog.js'
import { Archive, LifeBuoy, Search, Send } from 'lucide-react'
import { supportApi, superArchiveApi } from '../services/api.js'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { formatDate } from '../utils/format.js'

const EMPTY_REPORT = { subject: '', category: 'TECHNICAL', priority: 'NORMAL', description: '' }

export default function SupportReports() {
  const { admin } = useAdminAuth()
  const { showToast } = useToast()
  const isSuper = admin?.role === 'SUPER_ADMIN'
  const [reports, setReports] = useState(null)
  const [form, setForm] = useState(EMPTY_REPORT)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const editDialogRef = useDialog(Boolean(editing), () => { if (!saving) setEditing(null) })
  const [filters, setFilters] = useState({ q:'', status:'ALL', from:'', to:'' })

  const load = () => supportApi.list().then((data)=>setReports(data.reports || [])).catch((error)=>showToast(error.message || 'Unable to load support reports.', 'error'))
  useEffect(()=>{ document.title = isSuper ? 'Super Admin — Support Reports' : 'Admin — Report a Problem'; load() }, [isSuper])

  const submit = async (event) => {
    event.preventDefault(); setSaving(true)
    try { const result=await supportApi.create(form); setReports((rows)=>[result.report,...(rows||[])]); setForm(EMPTY_REPORT); showToast(result.message) }
    catch(error){ showToast(error.message || 'Unable to send the report.', 'error') }
    finally{ setSaving(false) }
  }

  const update = async (event) => {
    event.preventDefault(); setSaving(true)
    try { const result=await supportApi.update({ id:editing.id,status:editing.status,reply:editing.super_admin_reply || '' }); setReports((rows)=>rows.map((row)=>Number(row.id)===Number(editing.id)?{...row,...result}:row)); setEditing(null); showToast(result.message) }
    catch(error){ showToast(error.message || 'Unable to update the report.', 'error') }
    finally{ setSaving(false) }
  }

  const filteredReports = useMemo(() => reports?.filter((report) => {
    const text=`${report.id} ${report.subject} ${report.description} ${report.category} ${report.submitted_by_username || ''} ${report.submitted_by_email || ''}`.toLowerCase()
    const date=(report.created_at || '').slice(0,10)
    return (!filters.q || text.includes(filters.q.toLowerCase())) && (filters.status==='ALL' || report.status===filters.status) && (!filters.from || date>=filters.from) && (!filters.to || date<=filters.to)
  }) || [],[reports,filters])

  const archiveReport = async (id) => {
    if(!window.confirm('Move this resolved report to Super Admin Archives?')) return
    try{const result=await superArchiveApi.update({entity:'support',id,operation:'archive'});setReports((rows)=>rows.filter((row)=>Number(row.id)!==Number(id)));showToast(result.message)}
    catch(error){showToast(error.message || 'Unable to archive this report.','error')}
  }

  if (reports === null) return <LoadingState label="Loading support reports…" />

  return <section className="support-page"><div className="admin-content support-content">
    <header className="platform-fees-hero"><div><span>{isSuper?'Platform support':'Help / Support'}</span><h2>{isSuper?'Support Reports':'Report a Problem'}</h2><p>{isSuper?'Review owner-reported technical, billing, and account issues.':'Describe what happened and what you were trying to do. The report is saved in the platform and emailed to the Super Admin.'}</p></div><LifeBuoy size={34}/></header>
    {!isSuper && <form className="support-form" onSubmit={submit}>
      <label>Subject<input required maxLength="160" value={form.subject} onChange={(e)=>setForm({...form,subject:e.target.value})} placeholder="Short summary of the problem"/></label>
      <div><label>Category<select value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}><option value="TECHNICAL">Technical</option><option value="BILLING">Billing</option><option value="ACCOUNT">Account</option><option value="OTHER">Other</option></select></label><label>Priority<select value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value})}><option value="NORMAL">Normal</option><option value="URGENT">Urgent</option></select></label></div>
      <label>Description<textarea required minLength="20" maxLength="5000" rows="6" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} placeholder="Include the page, action, result, and any error message."/></label>
      <button className="btn btn--primary" disabled={saving}><Send size={16}/>{saving?'Sending…':'Send report'}</button>
    </form>}
    <div className="super-filterbar"><label><Search size={16} aria-hidden="true"/><input aria-label="Search support reports" placeholder="Search reports, owner, category…" value={filters.q} onChange={(e)=>setFilters({...filters,q:e.target.value})}/></label><select aria-label="Filter by status" value={filters.status} onChange={(e)=>setFilters({...filters,status:e.target.value})}><option value="ALL">All statuses</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select><input type="date" aria-label="From date" value={filters.from} onChange={(e)=>setFilters({...filters,from:e.target.value})}/><input type="date" aria-label="To date" value={filters.to} onChange={(e)=>setFilters({...filters,to:e.target.value})}/></div>
    <section className="support-list"><h3>{isSuper?'Active reports':'Your reports'} <small>{filteredReports.length}</small></h3>{filteredReports.length ? filteredReports.map((report)=><article key={report.id} className={`support-card support-card--${report.priority.toLowerCase()}`}><header><div><span>#{report.id} · {report.category}</span><h4>{report.subject}</h4></div><em>{report.status.replace('_',' ')}</em></header>{isSuper&&<small>From {report.submitted_by_username} · {report.submitted_by_email}</small>}<p>{report.description}</p>{report.super_admin_reply&&<blockquote><strong>Super Admin response</strong>{report.super_admin_reply}</blockquote>}<footer><time>{formatDate(report.created_at)}</time>{isSuper&&<div><button type="button" className="btn btn--secondary" onClick={()=>setEditing({...report})}>Review</button>{['RESOLVED','CLOSED'].includes(report.status)&&<button type="button" className="btn btn--secondary" onClick={()=>archiveReport(report.id)}><Archive size={15}/>Archive</button>}</div>}</footer></article>) : <div className="support-empty">No active support reports match these filters.</div>}</section>
    {editing&&<div className="invoice-preview-modal" onMouseDown={()=>!saving&&setEditing(null)}><form ref={editDialogRef} role="dialog" aria-modal="true" aria-label={`Review report #${editing.id}`} onSubmit={update} onMouseDown={(e)=>e.stopPropagation()}><h2>Review report #{editing.id}</h2><label>Status<select value={editing.status} onChange={(e)=>setEditing({...editing,status:e.target.value})}><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select></label><label>Response / internal update<textarea rows="6" maxLength="5000" value={editing.super_admin_reply||''} onChange={(e)=>setEditing({...editing,super_admin_reply:e.target.value})}/></label><div className="booking-action-form__actions"><button type="button" className="btn btn--secondary" onClick={()=>setEditing(null)}>Cancel</button><button className="btn btn--primary" disabled={saving}>{saving?'Saving…':'Save update'}</button></div></form></div>}
  </div></section>
}

