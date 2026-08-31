import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { estimatorApi, servicesApi } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'

export default function EstimatorSettings() {
  const { showToast } = useToast()

  const [config, setConfig] = useState(null)

  const [newHour, setNewHour] = useState({
    label: '',
    hours: '',
    price: ''
  })

  const [newAddon, setNewAddon] = useState({
    label: '',
    description: '',
    price: ''
  })

  const [confirmDelete, setConfirmDelete] = useState(null)

  // Local state for the Estimator Range Margin
  const [margin, setMargin] = useState(() => {
    return localStorage.getItem('estimator_margin') || '15'
  })

  const load = () =>
    estimatorApi
      .config(true)
      .then((data) => {
        setConfig({
          hours: data?.hours || [],
          addons: data?.addons || [],
          services: data?.services || []
        })
      })
      .catch(() => {
        setConfig({
          hours: [],
          addons: [],
          services: []
        })
      })

  useEffect(() => {
    document.title = 'Admin — Estimator Settings'
    load()
  }, [])

  // ============================================================
  // GLOBAL MARGIN
  // ============================================================

  const saveMargin = (e) => {
    e.preventDefault()

    localStorage.setItem(
      'estimator_margin',
      margin
    )

    showToast(
      'Estimator range margin updated.'
    )
  }

  // ============================================================
  // SERVICE TYPE PRICING
  // ============================================================

  const updateServicePrice = async (
    service,
    value
  ) => {
    const price =
      value === ''
        ? ''
        : Number(value)

    const updated = {
      ...service,
      starting_price: price
    }

    setConfig((current) => ({
      ...current,
      services: current.services.map(
        (item) =>
          item.id === service.id
            ? updated
            : item
      )
    }))

    try {
      await servicesApi.update({
        id: service.id,
        name: service.name,
        category: service.category,
        description: service.description || '',
        starting_price:
          value === ''
            ? ''
            : Number(value),
        visible:
          service.visible ? 1 : 0,
        sort_order:
          Number(service.sort_order || 0)
      })

      showToast(
        `${service.name} price updated.`
      )
    } catch (err) {
      showToast(
        err.message,
        'error'
      )

      load()
    }
  }

  const updateServiceField = async (
    service,
    field,
    value
  ) => {
    const updated = {
      ...service,
      [field]: value
    }

    setConfig((current) => ({
      ...current,
      services: current.services.map(
        (item) =>
          item.id === service.id
            ? updated
            : item
      )
    }))

    try {
      await servicesApi.update({
        id: service.id,
        name:
          field === 'name'
            ? value
            : service.name,
        category:
          field === 'category'
            ? value
            : service.category,
        description:
          field === 'description'
            ? value
            : service.description || '',
        starting_price:
          field === 'starting_price'
            ? (
                value === ''
                  ? ''
                  : Number(value)
              )
            : Number(
                service.starting_price || 0
              ),
        visible:
          field === 'visible'
            ? (value ? 1 : 0)
            : (
                service.visible
                  ? 1
                  : 0
              ),
        sort_order:
          field === 'sort_order'
            ? Number(value || 0)
            : Number(
                service.sort_order || 0
              )
      })

      if (field === 'visible') {
        showToast(
          `${service.name} visibility updated.`
        )
      }
    } catch (err) {
      showToast(
        err.message,
        'error'
      )

      load()
    }
  }

  // ============================================================
  // COVERAGE HOURS
  // ============================================================

  const addHour = async (e) => {
    e.preventDefault()

    try {
      await estimatorApi.createHour(
        newHour
      )

      setNewHour({
        label: '',
        hours: '',
        price: ''
      })

      showToast(
        'Coverage option added.'
      )

      load()
    } catch (err) {
      showToast(
        err.message,
        'error'
      )
    }
  }

  const updateHourField = async (
    h,
    field,
    value
  ) => {
    const updated = {
      ...h,
      [field]: value
    }

    setConfig((current) => ({
      ...current,
      hours: current.hours.map(
        (x) =>
          x.id === h.id
            ? updated
            : x
      )
    }))

    try {
      await estimatorApi.updateHour(
        updated
      )
    } catch (err) {
      showToast(
        err.message,
        'error'
      )

      load()
    }
  }

  // ============================================================
  // ADD-ONS
  // ============================================================

  const addAddon = async (e) => {
    e.preventDefault()

    try {
      await estimatorApi.createAddon(
        newAddon
      )

      setNewAddon({
        label: '',
        description: '',
        price: ''
      })

      showToast(
        'Add-on added.'
      )

      load()
    } catch (err) {
      showToast(
        err.message,
        'error'
      )
    }
  }

  const updateAddonField = async (
    a,
    field,
    value
  ) => {
    const updated = {
      ...a,
      [field]: value
    }

    setConfig((current) => ({
      ...current,
      addons: current.addons.map(
        (x) =>
          x.id === a.id
            ? updated
            : x
      )
    }))

    try {
      await estimatorApi.updateAddon(
        updated
      )
    } catch (err) {
      showToast(
        err.message,
        'error'
      )

      load()
    }
  }

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async () => {
    try {
      if (
        confirmDelete.type === 'hour'
      ) {
        await estimatorApi.deleteHour(
          confirmDelete.id
        )
      } else {
        await estimatorApi.deleteAddon(
          confirmDelete.id
        )
      }

      showToast(
        'Deleted.'
      )

      setConfirmDelete(null)

      load()
    } catch (err) {
      showToast(
        err.message,
        'error'
      )
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (!config) {
    return (
      <LoadingState
        label="Loading estimator settings…"
      />
    )
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 style={{ margin: 0 }}>
            Estimator Settings
          </h1>

          <p
            style={{
              margin: '5px 0 0 0',
              color: '#6b7280',
              fontSize: '0.9rem'
            }}
          >
            Configure service pricing,
            coverage hours, add-ons,
            and pricing logic.
          </p>
        </div>
      </header>

      <div
        className="admin-content"
        style={{
          maxWidth: 1000
        }}
      >

        {/* ======================================================
            GLOBAL SETTINGS
            ====================================================== */}

        <div
          className="admin-panel"
          style={{
            marginBottom: '30px'
          }}
        >
          <div className="admin-panel__head">
            <h2>
              Global Logic
            </h2>
          </div>

          <div className="admin-panel__body">
            <form
              onSubmit={saveMargin}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}
            >
              <div
                style={{
                  flex: 1
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontWeight: 500,
                    marginBottom: '5px'
                  }}
                >
                  Price Range Margin (%)
                </label>

                <p
                  style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: '#6b7280'
                  }}
                >
                  The estimator will display
                  a price range using this
                  percentage.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={margin}
                  onChange={(e) =>
                    setMargin(
                      e.target.value
                    )
                  }
                  style={{
                    width: '80px',
                    padding: '10px',
                    borderRadius: '6px',
                    border:
                      '1px solid #d1d5db'
                  }}
                />

                <span
                  style={{
                    fontWeight: 500
                  }}
                >
                  %
                </span>

                <button
                  type="submit"
                  className="btn btn--primary"
                >
                  Save Margin
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ======================================================
            SERVICE TYPE PRICING
            ====================================================== */}

        <div
          className="admin-panel"
          style={{
            marginBottom: '30px'
          }}
        >
          <div className="admin-panel__head">
            <div>
              <h2>
                Service Type Pricing
              </h2>

              <p
                style={{
                  margin:
                    '4px 0 0 0',
                  color: '#6b7280',
                  fontSize:
                    '0.85rem'
                }}
              >
                Set the individual
                starting price used
                by the public estimator
                for each service.
              </p>
            </div>
          </div>

          <div className="admin-panel__body">

            {config.services.length === 0 ? (
              <div
                style={{
                  padding:
                    '30px 10px',
                  textAlign:
                    'center',
                  color: '#6b7280',
                  fontSize:
                    '0.9rem'
                }}
              >
                No services found.
                Add services from
                the Services section.
              </div>
            ) : (
              config.services.map(
                (service) => (
                  <div
                    className="inline-edit-row"
                    key={service.id}
                    style={{
                      alignItems:
                        'center'
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: '#111827',
                          marginBottom:
                            '3px'
                        }}
                      >
                        {service.name}
                      </div>

                      <div
                        style={{
                          fontSize:
                            '0.75rem',
                          color:
                            '#9ca3af'
                        }}
                      >
                        {service.category ||
                          'Photography'}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: '6px'
                      }}
                    >
                      <span
                        style={{
                          fontSize:
                            '0.85rem',
                          color:
                            '#6b7280'
                        }}
                      >
                        ₱
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          service.starting_price ??
                          ''
                        }
                        onChange={(e) =>
                          updateServicePrice(
                            service,
                            e.target.value
                          )
                        }
                        title="Starting price"
                        style={{
                          width: 130
                        }}
                      />
                    </div>

                    <label
                      className="switch"
                      title={
                        service.visible
                          ? 'Visible'
                          : 'Hidden'
                      }
                    >
                      <input
                        type="checkbox"
                        checked={
                          !!service.visible
                        }
                        onChange={(e) =>
                          updateServiceField(
                            service,
                            'visible',
                            e.target.checked
                          )
                        }
                      />

                      <span className="switch__track" />
                    </label>
                  </div>
                )
              )
            )}

          </div>
        </div>

        {/* ======================================================
            COVERAGE HOURS
            ====================================================== */}

        <div
          className="admin-panel"
          style={{
            marginBottom: '30px'
          }}
        >
          <div className="admin-panel__head">
            <h2>
              Coverage Hours
            </h2>
          </div>

          <div className="admin-panel__body">
            {config.hours.map((h) => (
              <div
                className="inline-edit-row"
                key={h.id}
              >
                <input
                  type="text"
                  value={h.label}
                  onChange={(e) =>
                    updateHourField(
                      h,
                      'label',
                      e.target.value
                    )
                  }
                  style={{
                    width: 140
                  }}
                />

                <input
                  type="number"
                  value={h.hours}
                  onChange={(e) =>
                    updateHourField(
                      h,
                      'hours',
                      e.target.value
                    )
                  }
                  style={{
                    width: 80
                  }}
                  title="Hours"
                />

                <input
                  type="number"
                  value={h.price}
                  onChange={(e) =>
                    updateHourField(
                      h,
                      'price',
                      e.target.value
                    )
                  }
                  style={{
                    width: 110
                  }}
                  title="Price"
                />

                <label
                  className="switch"
                  title="Active"
                >
                  <input
                    type="checkbox"
                    checked={!!h.active}
                    onChange={(e) =>
                      updateHourField(
                        h,
                        'active',
                        e.target.checked
                          ? 1
                          : 0
                      )
                    }
                  />

                  <span className="switch__track" />
                </label>

                <button
                  className="btn btn--sm"
                  style={{
                    color: '#B3261E',
                    borderColor:
                      '#B3261E',
                    marginLeft: 'auto'
                  }}
                  onClick={() =>
                    setConfirmDelete({
                      type: 'hour',
                      id: h.id,
                      label: h.label
                    })
                  }
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            <form
              onSubmit={addHour}
              className="inline-edit-row"
              style={{
                marginTop: 12,
                borderBottom:
                  'none'
              }}
            >
              <input
                type="text"
                placeholder="Label (e.g. 10 Hours)"
                required
                value={
                  newHour.label
                }
                onChange={(e) =>
                  setNewHour({
                    ...newHour,
                    label:
                      e.target.value
                  })
                }
                style={{
                  width: 160
                }}
              />

              <input
                type="number"
                placeholder="Hours"
                required
                value={
                  newHour.hours
                }
                onChange={(e) =>
                  setNewHour({
                    ...newHour,
                    hours:
                      e.target.value
                  })
                }
                style={{
                  width: 80
                }}
              />

              <input
                type="number"
                placeholder="Price"
                required
                value={
                  newHour.price
                }
                onChange={(e) =>
                  setNewHour({
                    ...newHour,
                    price:
                      e.target.value
                  })
                }
                style={{
                  width: 110
                }}
              />

              <button
                type="submit"
                className="btn btn--primary btn--sm"
              >
                + Add Coverage
              </button>
            </form>
          </div>
        </div>

        {/* ======================================================
            ADD-ONS
            ====================================================== */}

        <div className="admin-panel">
          <div className="admin-panel__head">
            <h2>
              Add-ons
            </h2>
          </div>

          <div className="admin-panel__body">
            {config.addons.map((a) => (
              <div
                className="inline-edit-row"
                key={a.id}
              >
                <input
                  type="text"
                  value={a.label}
                  onChange={(e) =>
                    updateAddonField(
                      a,
                      'label',
                      e.target.value
                    )
                  }
                  style={{
                    width: 160
                  }}
                />

                <input
                  type="text"
                  value={
                    a.description || ''
                  }
                  placeholder="Description"
                  onChange={(e) =>
                    updateAddonField(
                      a,
                      'description',
                      e.target.value
                    )
                  }
                  style={{
                    width: 220
                  }}
                />

                <input
                  type="number"
                  value={a.price}
                  onChange={(e) =>
                    updateAddonField(
                      a,
                      'price',
                      e.target.value
                    )
                  }
                  style={{
                    width: 110
                  }}
                  title="Price"
                />

                <label
                  className="switch"
                  title="Active"
                >
                  <input
                    type="checkbox"
                    checked={!!a.active}
                    onChange={(e) =>
                      updateAddonField(
                        a,
                        'active',
                        e.target.checked
                          ? 1
                          : 0
                      )
                    }
                  />

                  <span className="switch__track" />
                </label>

                <button
                  className="btn btn--sm"
                  style={{
                    color: '#B3261E',
                    borderColor:
                      '#B3261E',
                    marginLeft: 'auto'
                  }}
                  onClick={() =>
                    setConfirmDelete({
                      type: 'addon',
                      id: a.id,
                      label: a.label
                    })
                  }
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            <form
              onSubmit={addAddon}
              className="inline-edit-row"
              style={{
                marginTop: 12,
                borderBottom:
                  'none'
              }}
            >
              <input
                type="text"
                placeholder="Label"
                required
                value={
                  newAddon.label
                }
                onChange={(e) =>
                  setNewAddon({
                    ...newAddon,
                    label:
                      e.target.value
                  })
                }
                style={{
                  width: 160
                }}
              />

              <input
                type="text"
                placeholder="Description"
                value={
                  newAddon.description
                }
                onChange={(e) =>
                  setNewAddon({
                    ...newAddon,
                    description:
                      e.target.value
                  })
                }
                style={{
                  width: 220
                }}
              />

              <input
                type="number"
                placeholder="Price"
                required
                value={
                  newAddon.price
                }
                onChange={(e) =>
                  setNewAddon({
                    ...newAddon,
                    price:
                      e.target.value
                  })
                }
                style={{
                  width: 110
                }}
              />

              <button
                type="submit"
                className="btn btn--primary btn--sm"
              >
                + Add Add-on
              </button>
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
          onClose={() =>
            setConfirmDelete(null)
          }
        />
      )}
    </>
  )
}