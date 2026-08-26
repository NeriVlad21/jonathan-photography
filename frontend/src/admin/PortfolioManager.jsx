import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Save, Star, UploadCloud } from 'lucide-react'
import { portfolioApi } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import { imageUrl } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'

export default function PortfolioManager() {
  const { showToast } = useToast()

  const [categories, setCategories] = useState(null)
  const [activeCategoryId, setActiveCategoryId] = useState(null)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [shoots, setShoots] = useState(null)
  const [activeShootId, setActiveShootId] = useState(null)
  const [shootForm, setShootForm] = useState({ title: '', description: '', location: '', shoot_date: '' })

  const [images, setImages] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const [confirmDelete, setConfirmDelete] = useState(null) // { type, id, label }

  useEffect(() => {
    document.title = 'Admin — Portfolio'
    loadCategories()
  }, [])

  function loadCategories() {
    portfolioApi.categories(true).then(setCategories).catch(() => setCategories([]))
  }

  function loadShoots() {
    setShoots(null)
    setActiveShootId(null)
    setImages(null)
    portfolioApi.allShoots().then((all) => {
      setShoots(all.filter((s) => s.category_id === activeCategoryId))
    }).catch(() => setShoots([]))
  }

  useEffect(() => {
    if (activeCategoryId) loadShoots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategoryId])

  function loadImages() {
    setImages(null)
    portfolioApi.imagesForShoot(activeShootId).then(setImages).catch(() => setImages([]))
  }

  useEffect(() => {
    if (activeShootId) loadImages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeShootId])

  // ---------------- Categories ----------------
  const addCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    try {
      const created = await portfolioApi.createCategory({ name: newCategoryName })
      setNewCategoryName('')
      loadCategories()
      setActiveCategoryId(created.id)
      showToast('Category created.')
    } catch (err) { showToast(err.message, 'error') }
  }

  const toggleCategoryVisible = async (c) => {
    try { await portfolioApi.updateCategory({ ...c, visible: c.visible ? 0 : 1 }); loadCategories() }
    catch (err) { showToast(err.message, 'error') }
  }

  const renameCategory = async (c, name) => {
    setCategories((cs) => cs.map((x) => (x.id === c.id ? { ...x, name } : x)))
    try { await portfolioApi.updateCategory({ ...c, name }) }
    catch (err) { showToast(err.message, 'error'); loadCategories() }
  }

  // ---------------- Shoots ----------------
  const addShoot = async (e) => {
    e.preventDefault()
    if (!shootForm.title.trim()) return
    try {
      const created = await portfolioApi.createShoot({ ...shootForm, category_id: activeCategoryId })
      setShootForm({ title: '', description: '', location: '', shoot_date: '' })
      loadShoots()
      setActiveShootId(created.id)
      showToast('Shoot created.')
    } catch (err) { showToast(err.message, 'error') }
  }

  const toggleShootVisible = async (s) => {
    try { await portfolioApi.updateShoot({ ...s, visible: s.visible ? 0 : 1, category_id: s.category_id }); loadShoots() }
    catch (err) { showToast(err.message, 'error') }
  }

  // ---------------- Images ----------------
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append('image', file)
        fd.append('shoot_id', activeShootId)
        await portfolioApi.uploadImage(fd)
      }
      showToast(`${files.length} image${files.length > 1 ? 's' : ''} uploaded.`)
      loadImages()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const setCover = async (img) => {
    try { await portfolioApi.updateImage({ id: img.id, is_cover: true }); loadImages() }
    catch (err) { showToast(err.message, 'error') }
  }

  const updateCaption = async (img, caption) => {
    setImages((imgs) => imgs.map((x) => (x.id === img.id ? { ...x, caption } : x)))
    try { await portfolioApi.updateImage({ ...img, caption }) }
    catch (err) { showToast(err.message, 'error'); loadImages() }
  }

  const toggleImageVisible = async (img) => {
    try { await portfolioApi.updateImage({ ...img, visible: img.visible ? 0 : 1 }); loadImages() }
    catch (err) { showToast(err.message, 'error') }
  }

  // ---------------- Delete confirm ----------------
  const handleDelete = async () => {
    try {
      if (confirmDelete.type === 'category') {
        await portfolioApi.deleteCategory(confirmDelete.id)
        if (activeCategoryId === confirmDelete.id) setActiveCategoryId(null)
        loadCategories()
      } else if (confirmDelete.type === 'shoot') {
        await portfolioApi.deleteShoot(confirmDelete.id)
        if (activeShootId === confirmDelete.id) setActiveShootId(null)
        loadShoots()
      } else if (confirmDelete.type === 'image') {
        await portfolioApi.deleteImage(confirmDelete.id)
        loadImages()
      }
      showToast('Deleted.')
      setConfirmDelete(null)
    } catch (err) { showToast(err.message, 'error') }
  }

  const activeCategory = categories?.find((c) => c.id === activeCategoryId)
  const activeShoot = shoots?.find((s) => s.id === activeShootId)

  return (
    <>
      <header className="admin-header"><h1>Portfolio</h1></header>
      <div className="admin-content" style={{ maxWidth: 1200 }}>

        {/* Categories */}
        <div className="admin-panel">
          <div className="admin-panel__head"><h2>Categories</h2></div>
          <div className="admin-panel__body manager-columns">
            <div>
              {categories === null && <LoadingState label="Loading…" />}
              {categories && categories.length === 0 && <EmptyState title="No categories yet." />}
              {categories && categories.map((c) => (
                <div key={c.id} className={`manager-list-item ${activeCategoryId === c.id ? 'active' : ''}`} onClick={() => setActiveCategoryId(c.id)}>
                  <input
                    value={c.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => renameCategory(c, e.target.value)}
                    style={{ border: 'none', background: 'transparent', color: 'inherit', font: 'inherit', width: '65%' }}
                  />
                  {!c.visible && <span className="badge-hidden">Hidden</span>}
                </div>
              ))}
              <form onSubmit={addCategory} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input type="text" placeholder="New category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--c-hairline)', borderRadius: 2 }} />
                <button type="submit" className="btn btn--sm btn--primary"><Plus size={14} /></button>
              </form>
            </div>

            <div>
              {activeCategory ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <strong>{activeCategory.name}</strong>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <label className="switch" title="Visible on site">
                        <input type="checkbox" checked={!!activeCategory.visible} onChange={() => toggleCategoryVisible(activeCategory)} />
                        <span className="switch__track" />
                      </label>
                      <button className="btn btn--sm" style={{ color: '#B3261E', borderColor: '#B3261E' }} onClick={() => setConfirmDelete({ type: 'category', id: activeCategory.id, label: activeCategory.name })}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    placeholder="Category description"
                    defaultValue={activeCategory.description || ''}
                    onBlur={(e) => portfolioApi.updateCategory({ ...activeCategory, description: e.target.value }).catch((err) => showToast(err.message, 'error'))}
                    style={{ width: '100%', minHeight: 70, padding: 10, border: '1px solid var(--c-hairline)', borderRadius: 2, fontFamily: 'inherit' }}
                  />
                </>
              ) : (
                <p style={{ color: 'var(--c-gray)' }}>Select a category to manage its shoots.</p>
              )}
            </div>
          </div>
        </div>

        {/* Shoots */}
        {activeCategoryId && (
          <div className="admin-panel">
            <div className="admin-panel__head"><h2>Shoots in {activeCategory?.name}</h2></div>
            <div className="admin-panel__body manager-columns">
              <div>
                {shoots === null && <LoadingState label="Loading…" />}
                {shoots && shoots.length === 0 && <EmptyState title="No shoots yet." body="Add your first photography story." />}
                {shoots && shoots.map((s) => (
                  <div key={s.id} className={`manager-list-item ${activeShootId === s.id ? 'active' : ''}`} onClick={() => setActiveShootId(s.id)}>
                    <span>{s.title} <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>({s.image_count})</span></span>
                    {!s.visible && <span className="badge-hidden">Hidden</span>}
                  </div>
                ))}
                <form onSubmit={addShoot} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="text" placeholder="Shoot title" required value={shootForm.title} onChange={(e) => setShootForm({ ...shootForm, title: e.target.value })} style={{ padding: '8px 10px', border: '1px solid var(--c-hairline)', borderRadius: 2 }} />
                  <input type="text" placeholder="Location" value={shootForm.location} onChange={(e) => setShootForm({ ...shootForm, location: e.target.value })} style={{ padding: '8px 10px', border: '1px solid var(--c-hairline)', borderRadius: 2 }} />
                  <input type="date" value={shootForm.shoot_date} onChange={(e) => setShootForm({ ...shootForm, shoot_date: e.target.value })} style={{ padding: '8px 10px', border: '1px solid var(--c-hairline)', borderRadius: 2 }} />
                  <textarea placeholder="Description" value={shootForm.description} onChange={(e) => setShootForm({ ...shootForm, description: e.target.value })} style={{ padding: 10, border: '1px solid var(--c-hairline)', borderRadius: 2, minHeight: 60, fontFamily: 'inherit' }} />
                  <button type="submit" className="btn btn--sm btn--primary"><Plus size={14} /> Add Shoot</button>
                </form>
              </div>

              <div>
                {activeShoot ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <strong>{activeShoot.title}</strong>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <label className="switch" title="Published">
                        <input type="checkbox" checked={!!activeShoot.visible} onChange={() => toggleShootVisible(activeShoot)} />
                        <span className="switch__track" />
                      </label>
                      <button className="btn btn--sm" style={{ color: '#B3261E', borderColor: '#B3261E' }} onClick={() => setConfirmDelete({ type: 'shoot', id: activeShoot.id, label: activeShoot.title })}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--c-gray)' }}>Select a shoot to manage its photos.</p>
                )}

                {activeShoot && (
                  <>
                    <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                      <UploadCloud size={22} style={{ marginBottom: 8 }} />
                      <div>{uploading ? 'Uploading…' : 'Click to upload photos (JPG, PNG, WEBP) — unlimited'}</div>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={handleFileSelect} />
                    </div>

                    {images === null && <LoadingState label="Loading photos…" />}
                    {images && images.length === 0 && <EmptyState title="No photos yet." body="Upload the first one above." />}
                    {images && images.length > 0 && (
                      <div className="image-grid">
                        {images.map((img) => (
                          <div className="image-tile" key={img.id}>
                            {!!img.is_cover && <span className="image-tile__cover-badge">Cover</span>}
                            <img src={imageUrl(img.image_path)} alt={img.title || ''} style={{ opacity: img.visible ? 1 : 0.35 }} />
                            <div className="image-tile__actions">
                              <button onClick={() => setCover(img)} title="Set as cover"><Star size={12} /></button>
                              <button onClick={() => toggleImageVisible(img)} title="Toggle visible">{img.visible ? 'Hide' : 'Show'}</button>
                              <button onClick={() => setConfirmDelete({ type: 'image', id: img.id, label: 'this photo' })} title="Delete"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <Modal
          title={`Delete ${confirmDelete.type === 'category' ? 'category' : confirmDelete.type === 'shoot' ? 'shoot' : ''} "${confirmDelete.label}"?`}
          body={confirmDelete.type !== 'image' ? 'This will also delete everything inside it. This cannot be undone.' : 'This cannot be undone.'}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </>
  )
}
