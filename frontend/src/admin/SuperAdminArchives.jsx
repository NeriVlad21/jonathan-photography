import { useEffect, useMemo, useState } from 'react'
import { ArchiveRestore, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { superArchiveApi } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { formatDate, peso } from '../utils/format.js'
import { SupportStatusBadge } from './supportStatus.jsx'

export default function SuperAdminArchives(){
  const {showToast}=useToast();const [params,setParams]=useSearchParams();const [data,setData]=useState(null)
  const [filters,setFilters]=useState({q:'',status:'ALL',from:'',to:''});const type=params.get('type')||'cycles'
  const load=()=>superArchiveApi.list().then(setData).catch((e)=>showToast(e.message||'Unable to load archives.','error'))
  useEffect(()=>{document.title='Super Admin — Archives';load()},[])
  const rows=useMemo(()=>{const source=data?.[type]||[];return source.filter((row)=>{const text=JSON.stringify(row).toLowerCase();const status=row.status||row.cycle_status||'';const date=(row.archived_at||'').slice(0,10);return(!filters.q||text.includes(filters.q.toLowerCase()))&&(filters.status==='ALL'||status===filters.status)&&(!filters.from||date>=filters.from)&&(!filters.to||date<=filters.to)})},[data,type,filters])
  const restore=async(entity,id)=>{try{const result=await superArchiveApi.update({entity,id,operation:'restore'});showToast(result.message);await load()}catch(e){showToast(e.message||'Unable to restore record.','error')}}
  if(!data)return <LoadingState label="Loading Super Admin archives…"/>
  return <section><div className="admin-content super-admin-content"><header className="platform-fees-hero"><div><span>Platform / Retention</span><h2>Super Admin Archives</h2><p>Settled financial records and completed support cases remain searchable and can be restored without affecting active work queues.</p></div><ArchiveRestore size={34}/></header>
    <div className="super-tabs">{[['cycles','Billing cycles'],['ledger','Fee ledger'],['reports','Support reports']].map(([key,label])=><button key={key} className={type===key?'active':''} onClick={()=>setParams({type:key})}>{label}<small>{data[key]?.length||0}</small></button>)}</div>
    <div className="super-filterbar"><label><Search size={16}/><input value={filters.q} onChange={(e)=>setFilters({...filters,q:e.target.value})} placeholder="Search archived records…"/></label><select value={filters.status} onChange={(e)=>setFilters({...filters,status:e.target.value})}><option value="ALL">All statuses</option>{type==='reports'?<><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></>:<><option value="PAID">Paid</option><option value="DUE">Due</option><option value="OPEN">Open</option></>}</select><input type="date" aria-label="Archived from" value={filters.from} onChange={(e)=>setFilters({...filters,from:e.target.value})}/><input type="date" aria-label="Archived to" value={filters.to} onChange={(e)=>setFilters({...filters,to:e.target.value})}/></div>
    <section className="super-archive-list">{rows.length?rows.map((row)=>{
      const entity=type==='cycles'?'cycle':type==='ledger'?'ledger':'support';const id=row.id
      const title=type==='cycles'?`${formatDate(row.cycle_start)} – ${formatDate(row.cycle_end)}`:type==='ledger'?`${row.reference_code} · ${row.name}`:`#${row.id} · ${row.subject}`
      const detail=type==='cycles'?`${peso(row.total_owed)} · ${row.booking_count} booking(s)`:type==='ledger'?`${row.invoice_number} · ${peso(row.fee_amount)}`:`${row.category} · ${row.submitted_by_username}`
      return <article key={`${type}-${id}`}><div><span>{type.replace('reports','support report').replace('cycles','billing cycle').replace('ledger','fee ledger')}</span><h3>{title}</h3><p>{detail}</p></div><div>{type==='reports'?<SupportStatusBadge status={row.status}/>:<em>{row.status||row.cycle_status}</em>}<time>Archived {formatDate(row.archived_at)}</time><button type="button" className="btn admin-btn--secondary" onClick={()=>restore(entity,id)}><ArchiveRestore size={15}/>Restore</button></div></article>}) : <div className="support-empty">No archived records match these filters.</div>}</section>
  </div></section>
}

