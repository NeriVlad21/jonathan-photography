import { useEffect, useState } from 'react'
import { Trash2, Save } from 'lucide-react'
import { contactsApi } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'

const emptyForm = { label: '', tagline: '', handle: '', link: '', icon: 'link' }
const ICON_OPTIONS = ['instagram', 'facebook', 'phone', 'mail', 'link']

export default function ContactManager() {
  const { showToast } = useToast()
  const [platforms, setPlatforms] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => contactsApi.list(true).then(setPlatforms).catch(() => setPlatforms([]))

  useEffect(() => { document.title = 'Admin — Contact Links'; load() }, [])

  const startEdit = (p) => {
    setEditingId(p.id)
    setForm({ label: p.label, tagline: p.tagline || '', handle: p.handle || '', link: p.link, icon: p.icon })
  }
  const resetForm = () => { setEditingId(null); setForm(emptyForm) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await contactsApi.update({ id: editingId, ...form, visible: platforms.find((p) => p.id === editingId)?.visible ?? 1 })
        showToast('Platform updated.')
      } else {
        await contactsApi.create(form)
        showToast('Platform added.')
      }
      resetForm()
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleVisible = async (p) => {
    try { await contactsApi.update({ ...p, visible: p.visible ? 0 : 1 }); load() }
    catch (err) { showToast(err.message, 'error') }
  }

  const handleDelete = async () => {
    try {
      await contactsApi.remove(confirmDelete.id)
      showToast('Deleted.')
      setConfirmDelete(null)
      load()
    } catch (err) { showToast(err.message, 'error') }
  }

  return (
    <>
      <header className="admin-header"><h1>Contact Links</h1></header>
      <div className="admin-content" style={{ maxWidth: 1000 }}>

        <div className="admin-panel">
          <div className="admin-panel__head"><h2>{editingId ? 'Edit Platform' : 'Add a Platform'}</h2></div>
          <form className="admin-panel__body" onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="field">
                <label htmlFor="c-label">Label</label>
                <input id="c-label" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Instagram" />
              </div>
              <div className="field">
                <label htmlFor="c-icon">Icon</label>
                <select id="c-icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                  {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="c-handle">Handle (display text)</label>
                <input id="c-handle" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} placeholder="@jonathanphotography" />
              </div>
              <div className="field">
                <label htmlFor="c-link">Link</label>
                <input id="c-link" required value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://instagram.com/…" />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="c-tagline">Tagline (the witty line shown on the public site)</label>
                <input id="c-tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="See what we're currently obsessed with." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>
                <Save size={14} /> {editingId ? 'Save Changes' : 'Add Platform'}
              </button>
              {editingId && <button type="button" className="btn btn--ghost-light btn--sm" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        </div>

        {platforms === null && <LoadingState label="Loading contact links…" />}
        {platforms && (
          <div className="admin-panel">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Label</th><th>Tagline</th><th>Link</th><th>Visible</th><th></th></tr></thead>
                <tbody>
                  {platforms.map((p) => (
                    <tr key={p.id}>
                      <td>{p.label}</td>
                      <td style={{ maxWidth: 240 }}>{p.tagline}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.link}</td>
                      <td>
                        <label className="switch">
                          <input type="checkbox" checked={!!p.visible} onChange={() => toggleVisible(p)} />
                          <span className="switch__track" />
                        </label>
                      </td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn--ghost-light btn--sm" onClick={() => startEdit(p)}>Edit</button>
                        <button className="btn btn--sm" style={{ color: '#B3261E', borderColor: '#B3261E' }} onClick={() => setConfirmDelete(p)}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <Modal
          title={`Delete "${confirmDelete.label}"?`}
          body="It will disappear from the public site immediately."
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </>
  )
}
