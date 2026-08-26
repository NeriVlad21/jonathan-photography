import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { estimatorApi } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'

export default function EstimatorSettings() {
  const { showToast } = useToast()
  const [config, setConfig] = useState(null)
  const [newHour, setNewHour] = useState({ label: '', hours: '', price: '' })
  const [newAddon, setNewAddon] = useState({ label: '', description: '', price: '' })
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = () => estimatorApi.config(true).then(setConfig).catch(() => setConfig({ hours: [], addons: [] }))

  useEffect(() => { document.title = 'Admin — Estimator Settings'; load() }, [])

  const addHour = async (e) => {
    e.preventDefault()
    try {
      await estimatorApi.createHour(newHour)
      setNewHour({ label: '', hours: '', price: '' })
      showToast('Coverage option added.')
      load()
    } catch (err) { showToast(err.message, 'error') }
  }

  const addAddon = async (e) => {
    e.preventDefault()
    try {
      await estimatorApi.createAddon(newAddon)
      setNewAddon({ label: '', description: '', price: '' })
      showToast('Add-on added.')
      load()
    } catch (err) { showToast(err.message, 'error') }
  }

  const updateHourField = async (h, field, value) => {
    const updated = { ...h, [field]: value }
    setConfig((c) => ({ ...c, hours: c.hours.map((x) => (x.id === h.id ? updated : x)) }))
    try { await estimatorApi.updateHour(updated) } catch (err) { showToast(err.message, 'error'); load() }
  }

  const updateAddonField = async (a, field, value) => {
    const updated = { ...a, [field]: value }
    setConfig((c) => ({ ...c, addons: c.addons.map((x) => (x.id === a.id ? updated : x)) }))
    try { await estimatorApi.updateAddon(updated) } catch (err) { showToast(err.message, 'error'); load() }
  }

  const handleDelete = async () => {
    try {
      if (confirmDelete.type === 'hour') await estimatorApi.deleteHour(confirmDelete.id)
      else await estimatorApi.deleteAddon(confirmDelete.id)
      showToast('Deleted.')
      setConfirmDelete(null)
      load()
    } catch (err) { showToast(err.message, 'error') }
  }

  if (!config) return <LoadingState label="Loading estimator settings…" />

  return (
    <>
      <header className="admin-header"><h1>Estimator Settings</h1></header>
      <div className="admin-content" style={{ maxWidth: 1000 }}>

        <div className="admin-panel">
          <div className="admin-panel__head"><h2>Coverage Hours</h2></div>
          <div className="admin-panel__body">
            {config.hours.map((h) => (
              <div className="inline-edit-row" key={h.id}>
                <input type="text" value={h.label} onChange={(e) => updateHourField(h, 'label', e.target.value)} style={{ width: 140 }} />
                <input type="number" value={h.hours} onChange={(e) => updateHourField(h, 'hours', e.target.value)} style={{ width: 80 }} title="Hours" />
                <input type="number" value={h.price} onChange={(e) => updateHourField(h, 'price', e.target.value)} style={{ width: 110 }} title="Price" />
                <label className="switch" title="Active">
                  <input type="checkbox" checked={!!h.active} onChange={(e) => updateHourField(h, 'active', e.target.checked ? 1 : 0)} />
                  <span className="switch__track" />
                </label>
                <button className="btn btn--sm" style={{ color: '#B3261E', borderColor: '#B3261E', marginLeft: 'auto' }} onClick={() => setConfirmDelete({ type: 'hour', id: h.id, label: h.label })}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <form onSubmit={addHour} className="inline-edit-row" style={{ marginTop: 12, borderBottom: 'none' }}>
              <input type="text" placeholder="Label (e.g. 10 Hours)" required value={newHour.label} onChange={(e) => setNewHour({ ...newHour, label: e.target.value })} style={{ width: 160 }} />
              <input type="number" placeholder="Hours" required value={newHour.hours} onChange={(e) => setNewHour({ ...newHour, hours: e.target.value })} style={{ width: 80 }} />
              <input type="number" placeholder="Price" required value={newHour.price} onChange={(e) => setNewHour({ ...newHour, price: e.target.value })} style={{ width: 110 }} />
              <button type="submit" className="btn btn--primary btn--sm">+ Add Coverage</button>
            </form>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__head"><h2>Add-ons</h2></div>
          <div className="admin-panel__body">
            {config.addons.map((a) => (
              <div className="inline-edit-row" key={a.id}>
                <input type="text" value={a.label} onChange={(e) => updateAddonField(a, 'label', e.target.value)} style={{ width: 160 }} />
                <input type="text" value={a.description || ''} placeholder="Description" onChange={(e) => updateAddonField(a, 'description', e.target.value)} style={{ width: 220 }} />
                <input type="number" value={a.price} onChange={(e) => updateAddonField(a, 'price', e.target.value)} style={{ width: 110 }} title="Price" />
                <label className="switch" title="Active">
                  <input type="checkbox" checked={!!a.active} onChange={(e) => updateAddonField(a, 'active', e.target.checked ? 1 : 0)} />
                  <span className="switch__track" />
                </label>
                <button className="btn btn--sm" style={{ color: '#B3261E', borderColor: '#B3261E', marginLeft: 'auto' }} onClick={() => setConfirmDelete({ type: 'addon', id: a.id, label: a.label })}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <form onSubmit={addAddon} className="inline-edit-row" style={{ marginTop: 12, borderBottom: 'none' }}>
              <input type="text" placeholder="Label" required value={newAddon.label} onChange={(e) => setNewAddon({ ...newAddon, label: e.target.value })} style={{ width: 160 }} />
              <input type="text" placeholder="Description" value={newAddon.description} onChange={(e) => setNewAddon({ ...newAddon, description: e.target.value })} style={{ width: 220 }} />
              <input type="number" placeholder="Price" required value={newAddon.price} onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })} style={{ width: 110 }} />
              <button type="submit" className="btn btn--primary btn--sm">+ Add Add-on</button>
            </form>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <Modal
          title={`Delete "${confirmDelete.label}"?`}
          body="This will remove it from the public estimator immediately."
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </>
  )
}
