import { useEffect, useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { servicesApi } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'

const emptyForm = { name: '', category: 'photography', description: '', starting_price: '' }

export default function ServicesManager() {
  const { showToast } = useToast()
  const [services, setServices] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => servicesApi.list(true).then(setServices).catch(() => setServices([]))

  useEffect(() => { document.title = 'Admin — Services'; load() }, [])

  const startEdit = (s) => {
    setEditingId(s.id)
    setForm({ name: s.name, category: s.category, description: s.description || '', starting_price: s.starting_price ?? '' })
  }

  const resetForm = () => { setEditingId(null); setForm(emptyForm) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await servicesApi.update({ id: editingId, ...form, visible: services.find((s) => s.id === editingId)?.visible ?? 1 })
        showToast('Service updated.')
      } else {
        await servicesApi.create(form)
        showToast('Service added.')
      }
      resetForm()
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleVisible = async (s) => {
    try {
      await servicesApi.update({ ...s, visible: s.visible ? 0 : 1 })
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await servicesApi.remove(confirmDelete.id)
      showToast('Service deleted.')
      setConfirmDelete(null)
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <>
      <header className="admin-header"><h1>Services</h1></header>
      <div className="admin-content" style={{ maxWidth: 1100 }}>

        <div className="admin-panel">
          <div className="admin-panel__head"><h2>{editingId ? 'Edit Service' : 'Add a Service'}</h2></div>
          <form className="admin-panel__body" onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="field">
                <label htmlFor="svc-name">Name</label>
                <input id="svc-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="svc-cat">Category</label>
                <select id="svc-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="photography">Photography</option>
                  <option value="additional">Additional Services</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="svc-price">Starting Price (optional)</label>
                <input id="svc-price" type="number" min="0" value={form.starting_price} onChange={(e) => setForm({ ...form, starting_price: e.target.value })} />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="svc-desc">Description</label>
                <textarea id="svc-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>
                <Save size={14} /> {editingId ? 'Save Changes' : 'Add Service'}
              </button>
              {editingId && <button type="button" className="btn btn--ghost-light btn--sm" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        </div>

        {services === null && <LoadingState label="Loading services…" />}
        {services && (
          <div className="admin-panel">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Visible</th><th></th></tr></thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td style={{ textTransform: 'capitalize' }}>{s.category}</td>
                      <td>{s.starting_price ? `₱${Number(s.starting_price).toLocaleString()}` : '—'}</td>
                      <td>
                        <label className="switch">
                          <input type="checkbox" checked={!!s.visible} onChange={() => toggleVisible(s)} />
                          <span className="switch__track" />
                        </label>
                      </td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn--ghost-light btn--sm" onClick={() => startEdit(s)}>Edit</button>
                        <button className="btn btn--sm" style={{ color: '#B3261E', borderColor: '#B3261E' }} onClick={() => setConfirmDelete(s)}>
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
          title={`Delete "${confirmDelete.name}"?`}
          body="This cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </>
  )
}
