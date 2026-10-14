import { useEffect, useState } from 'react'
import { AlertTriangle, KeyRound, Mail, ShieldCheck, UserRoundCog, WalletCards } from 'lucide-react'
import { superAdminApi } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { peso, formatDate } from '../utils/format.js'

const EMPTY_CONFIRM = { super_admin_password: '' }

export default function SuperAdminOverview() {
  const { showToast } = useToast()
  const [data, setData] = useState(null)
  const [saving, setSaving] = useState('')
  const [notification, setNotification] = useState({ email: '', ...EMPTY_CONFIRM })
  const [reset, setReset] = useState({ new_password: '', confirm_password: '', ...EMPTY_CONFIRM })
  const [transfer, setTransfer] = useState({ username: '', email: '', new_password: '', confirm_password: '', use_as_notification_email: true, ...EMPTY_CONFIRM })

  const load = () => superAdminApi.overview().then((result) => {
    setData(result)
    setNotification((current) => ({ ...current, email: result.booking_notification_email || '' }))
  }).catch((error) => showToast(error.message || 'Unable to load platform oversight.', 'error'))

  useEffect(() => { document.title = 'Super Admin — Platform Oversight'; load() }, [])

  const run = async (name, payload, success) => {
    setSaving(name)
    try {
      const result = await superAdminApi.update(payload)
      showToast(result.message)
      success?.(result)
      await load()
    } catch (error) {
      showToast(error.message || 'The Super Admin action could not be completed.', 'error')
    } finally {
      setSaving('')
    }
  }

  if (!data) return <LoadingState label="Loading platform oversight…" />

  return (
    <section className="super-admin-page">
      <div className="admin-content super-admin-content">
        <header className="platform-fees-hero">
          <div><span>Platform / Restricted</span><h2>Super Admin</h2><p>Oversee the current studio owner, booking-alert routing, platform dues, and support activity. Sensitive changes require your current password and are recorded.</p></div>
          <ShieldCheck size={36} />
        </header>

        <div className="super-admin-stats">
          <article><WalletCards size={20}/><span>Platform fees due</span><strong>{peso(data.total_due)}</strong><small>{data.overdue_cycles} overdue cycle(s)</small></article>
          <article><AlertTriangle size={20}/><span>Open support reports</span><strong>{data.open_support_reports}</strong><small>Open or in progress</small></article>
          <article><UserRoundCog size={20}/><span>Current owner</span><strong>{data.owner?.username || 'Not assigned'}</strong><small>{data.owner?.email || 'Transfer ownership to create one'}</small></article>
        </div>

        <div className="super-admin-grid">
          <section className="super-admin-panel">
            <div className="super-admin-panel__head"><Mail size={19}/><div><h3>Booking notifications</h3><p>Only the Super Admin can choose where new booking requests are emailed.</p></div></div>
            <form onSubmit={(event) => { event.preventDefault(); run('notification', { action: 'notification_email', ...notification }, () => setNotification((v) => ({ ...v, super_admin_password: '' }))) }}>
              <label>Recipient email<input type="email" required maxLength="160" value={notification.email} onChange={(e)=>setNotification({...notification,email:e.target.value})}/></label>
              <label>Confirm with your password<input type="password" required autoComplete="current-password" value={notification.super_admin_password} onChange={(e)=>setNotification({...notification,super_admin_password:e.target.value})}/></label>
              <button className="btn btn--primary" disabled={saving !== ''}>{saving === 'notification' ? 'Saving…' : 'Update recipient'}</button>
            </form>
          </section>

          <section className="super-admin-panel">
            <div className="super-admin-panel__head"><KeyRound size={19}/><div><h3>Reset owner password</h3><p>Use this for account recovery. The password is never shown or emailed.</p></div></div>
            <form onSubmit={(event) => { event.preventDefault(); run('reset', { action: 'reset_owner_password', ...reset }, () => setReset({ new_password:'', confirm_password:'', ...EMPTY_CONFIRM })) }}>
              <label>New temporary password<input type="password" required minLength="12" value={reset.new_password} onChange={(e)=>setReset({...reset,new_password:e.target.value})}/></label>
              <label>Confirm new password<input type="password" required minLength="12" value={reset.confirm_password} onChange={(e)=>setReset({...reset,confirm_password:e.target.value})}/></label>
              <label>Confirm with your password<input type="password" required autoComplete="current-password" value={reset.super_admin_password} onChange={(e)=>setReset({...reset,super_admin_password:e.target.value})}/></label>
              <button className="btn btn--secondary" disabled={saving !== ''}>{saving === 'reset' ? 'Resetting…' : 'Reset owner password'}</button>
            </form>
          </section>
        </div>

        <section className="super-admin-panel super-admin-panel--danger">
          <div className="super-admin-panel__head"><UserRoundCog size={19}/><div><h3>Transfer system ownership</h3><p>This creates a new owner account and immediately deactivates the previous owner. Existing business records are retained.</p></div></div>
          <form className="super-admin-transfer" onSubmit={(event) => { event.preventDefault(); if (!window.confirm('Transfer ownership now? The current owner will be signed out and will no longer be able to access the studio workspace.')) return; run('transfer', { action: 'transfer_ownership', ...transfer }, () => setTransfer({ username:'', email:'', new_password:'', confirm_password:'', use_as_notification_email:true, ...EMPTY_CONFIRM })) }}>
            <label>New owner username<input required maxLength="60" value={transfer.username} onChange={(e)=>setTransfer({...transfer,username:e.target.value})}/></label>
            <label>New owner email<input type="email" required maxLength="160" value={transfer.email} onChange={(e)=>setTransfer({...transfer,email:e.target.value})}/></label>
            <label>Temporary password<input type="password" required minLength="12" value={transfer.new_password} onChange={(e)=>setTransfer({...transfer,new_password:e.target.value})}/></label>
            <label>Confirm temporary password<input type="password" required minLength="12" value={transfer.confirm_password} onChange={(e)=>setTransfer({...transfer,confirm_password:e.target.value})}/></label>
            <label className="super-admin-check"><input type="checkbox" checked={transfer.use_as_notification_email} onChange={(e)=>setTransfer({...transfer,use_as_notification_email:e.target.checked})}/>Send booking notifications to the new owner email</label>
            <label>Confirm with your Super Admin password<input type="password" required autoComplete="current-password" value={transfer.super_admin_password} onChange={(e)=>setTransfer({...transfer,super_admin_password:e.target.value})}/></label>
            <div className="super-admin-transfer__action"><button className="btn btn--primary" disabled={saving !== ''}>{saving === 'transfer' ? 'Transferring…' : 'Transfer ownership'}</button></div>
          </form>
        </section>

        <section className="super-admin-panel">
          <div className="super-admin-panel__head"><ShieldCheck size={19}/><div><h3>Recent security activity</h3><p>Ownership, credential, notification, and support changes are retained here.</p></div></div>
          <div className="super-admin-audit">{data.recent_audit.length ? data.recent_audit.map((entry)=><div key={entry.id}><strong>{entry.action.replaceAll('_',' ')}</strong><span>{entry.actor_username || 'System'}{entry.target_username ? ` → ${entry.target_username}` : ''}</span><time>{formatDate(entry.created_at)}</time></div>) : <p>No Super Admin changes have been recorded yet.</p>}</div>
        </section>
      </div>
    </section>
  )
}

