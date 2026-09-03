import { useEffect, useState } from 'react'
import {
  Plus,
  Trash2,
  Save,
  Pencil,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink
} from 'lucide-react'

import { servicesApi } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'

const emptyForm = {
  name: '',
  category: 'photography',
  description: '',
  starting_price: ''
}

export default function ServicesManager() {
  const { showToast } = useToast()

  const [services, setServices] =
    useState(null)

  const [form, setForm] =
    useState(emptyForm)

  const [editingId, setEditingId] =
    useState(null)

  const [confirmDelete, setConfirmDelete] =
    useState(null)

  const [saving, setSaving] =
    useState(false)

  const [togglingId, setTogglingId] =
    useState(null)

  /*
  ============================================================
  LOAD SERVICES
  ============================================================
  */

  const load = () => {
    servicesApi
      .list(true)
      .then((data) => {
        setServices(
          Array.isArray(data)
            ? data
            : []
        )
      })
      .catch(() => {
        setServices([])
      })
  }

  useEffect(() => {
    document.title =
      'Admin — Services'

    load()
  }, [])

  /*
  ============================================================
  FORM HELPERS
  ============================================================
  */

  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  const startEdit = (service) => {
    setEditingId(service.id)

    setForm({
      name: service.name || '',
      category:
        service.category ||
        'photography',
      description:
        service.description || '',
      starting_price:
        service.starting_price ?? ''
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  /*
  ============================================================
  SAVE
  ============================================================
  */

  const handleSubmit = async (event) => {
    event.preventDefault()

    setSaving(true)

    try {
      if (editingId) {
        const existing =
          services?.find(
            (service) =>
              service.id === editingId
          )

        await servicesApi.update({
          id: editingId,
          ...form,
          visible:
            existing?.visible ?? 1
        })

        showToast(
          'Service updated.'
        )
      } else {
        await servicesApi.create(form)

        showToast(
          'Service added.'
        )
      }

      resetForm()
      load()
    } catch (error) {
      showToast(
        error?.message ||
          'Unable to save service.',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  /*
  ============================================================
  VISIBILITY
  ============================================================
  */

  const toggleVisible = async (
    service
  ) => {
    setTogglingId(service.id)

    try {
      await servicesApi.update({
        ...service,
        visible:
          service.visible ? 0 : 1
      })

      showToast(
        service.visible
          ? 'Service hidden from the public site.'
          : 'Service is now visible on the public site.'
      )

      load()
    } catch (error) {
      showToast(
        error?.message ||
          'Unable to update service visibility.',
        'error'
      )
    } finally {
      setTogglingId(null)
    }
  }

  /*
  ============================================================
  DELETE
  ============================================================
  */

  const handleDelete = async () => {
    if (!confirmDelete) {
      return
    }

    try {
      await servicesApi.remove(
        confirmDelete.id
      )

      showToast(
        'Service deleted.'
      )

      if (
        editingId ===
        confirmDelete.id
      ) {
        resetForm()
      }

      setConfirmDelete(null)

      load()
    } catch (error) {
      showToast(
        error?.message ||
          'Unable to delete service.',
        'error'
      )
    }
  }

  /*
  ============================================================
  PRICE FORMAT
  ============================================================
  */

  const formatPrice = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—'
    }

    const number =
      Number(value)

    if (
      Number.isNaN(number)
    ) {
      return '—'
    }

    return `₱${number.toLocaleString(
      'en-PH',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    )}`
  }

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <>
      <style>{`

        /*
        ============================================================
        SERVICES MANAGER
        ============================================================
        */

        .services-manager-page {
          width: 100%;
        }

        .services-manager-content {
          width: 100%;

          max-width:
            1100px;
        }

        /*
        ============================================================
        INTRO
        ============================================================
        */

        .services-manager-intro {
          margin-bottom:
            20px;

          color:
            var(--c-gray);
        }

        .services-manager-intro p {
          margin:
            0;

          max-width:
            65ch;
        }

        /*
        ============================================================
        EDITOR
        ============================================================
        */

        .services-editor {
          margin-bottom:
            20px;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            var(--c-bg, #fff);

          overflow:
            hidden;
        }

        .services-editor__head {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap:
            15px;

          padding:
            17px 20px;

          border-bottom:
            1px solid
            var(--c-hairline, #e5e5e5);
        }

        .services-editor__title-wrap {
          display: flex;

          align-items: center;

          gap:
            10px;
        }

        .services-editor__icon {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          width:
            31px;

          height:
            31px;

          flex:
            0 0 31px;

          border-radius:
            7px;

          background:
            #111;

          color:
            #fff;
        }

        .services-editor__title {
          margin:
            0;
        }

        .services-editor__body {
          padding:
            20px;
        }

        /*
        ============================================================
        FORM
        ============================================================
        */

        .services-form-grid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );

          gap:
            17px 20px;
        }

        .services-form-field {
          min-width:
            0;
        }

        .services-form-field--full {
          grid-column:
            1 / -1;
        }

        .services-form-actions {
          display: flex;

          align-items: center;

          gap:
            8px;

          margin-top:
            20px;
        }

        .services-submit {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          gap:
            7px;
        }

        /*
        ============================================================
        LIST
        ============================================================
        */

        .services-list-panel {
          overflow:
            hidden;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            var(--c-bg, #fff);
        }

        .services-list-header {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap:
            15px;

          padding:
            17px 20px;

          border-bottom:
            1px solid
            var(--c-hairline, #e5e5e5);
        }

        .services-list-header__title {
          margin:
            0;
        }

        .services-list-header__count {
          color:
            var(--c-gray);
        }

        /*
        ============================================================
        SERVICE ROW
        ============================================================
        */

        .services-list {
          display:
            flex;

          flex-direction:
            column;
        }

        .service-row {
          display: grid;

          grid-template-columns:
            minmax(190px, 1.2fr)
            minmax(130px, 0.8fr)
            140px
            auto
            auto;

          align-items:
            center;

          gap:
            18px;

          padding:
            16px 20px;

          border-bottom:
            1px solid
            var(--c-hairline, #ededed);

          transition:
            background 0.18s ease;
        }

        .service-row:last-child {
          border-bottom:
            0;
        }

        .service-row:hover {
          background:
            #fafafa;
        }

        /*
        ============================================================
        SERVICE INFO
        ============================================================
        */

        .service-row__info {
          min-width:
            0;
        }

        .service-row__name {
          display:
            block;

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }

        .service-row__description {
          margin-top:
            4px;

          overflow:
            hidden;

          color:
            var(--c-gray);

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }

        /*
        ============================================================
        CATEGORY
        ============================================================
        */

        .service-row__category {
          color:
            var(--c-gray);

          text-transform:
            capitalize;
        }

        /*
        ============================================================
        PRICE
        ============================================================
        */

        .service-row__price {
          white-space:
            nowrap;
        }

        .service-row__price-label {
          display:
            block;

          margin-bottom:
            3px;

          color:
            #999;

          text-transform:
            uppercase;
        }

        /*
        ============================================================
        VISIBILITY
        ============================================================
        */

        .service-row__visibility {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            36px;

          height:
            36px;

          padding:
            0;

          border:
            1px solid
            #d8d8d8;

          border-radius:
            7px;

          background:
            #fff;

          color:
            #777;

          cursor:
            pointer;

          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease;
        }

        .service-row__visibility:hover:not(:disabled) {
          background:
            #f2f2f2;

          border-color:
            #c5c5c5;

          color:
            var(--c-text);
        }

        .service-row__visibility--visible {
          color:
            #287449;
        }

        .service-row__visibility:disabled {
          opacity:
            0.55;

          cursor:
            wait;
        }

        /*
        ============================================================
        ACTIONS
        ============================================================
        */

        .service-row__actions {
          display:
            flex;

          align-items:
            center;

          justify-content:
            flex-end;

          gap:
            7px;
        }

        .service-row__edit {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          min-height:
            34px;

          padding:
            0 10px;
        }

        .service-row__delete {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            34px;

          height:
            34px;

          padding:
            0;

          border:
            1px solid
            rgba(
              179,
              38,
              30,
              0.35
            );

          border-radius:
            7px;

          background:
            transparent;

          color:
            #b3261e;

          cursor:
            pointer;

          transition:
            background 0.18s ease,
            border-color 0.18s ease;
        }

        .service-row__delete:hover {
          background:
            rgba(
              179,
              38,
              30,
              0.05
            );

          border-color:
            #b3261e;
        }

        /*
        ============================================================
        EMPTY
        ============================================================
        */

        .services-empty {
          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          padding:
            45px 25px;

          text-align:
            center;

          color:
            var(--c-gray);
        }

        .services-empty__icon {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            44px;

          height:
            44px;

          margin-bottom:
            11px;

          border-radius:
            50%;

          background:
            #f1f1f1;

          color:
            #777;
        }

        .services-empty__title {
          margin:
            0 0 5px;

          color:
            var(--c-text);
        }

        .services-empty__text {
          margin:
            0;
        }

        /*
        ============================================================
        RESPONSIVE
        ============================================================
        */

        @media (max-width: 900px) {

          .service-row {
            grid-template-columns:
              minmax(170px, 1.3fr)
              minmax(110px, 0.8fr)
              120px
              auto;
          }

          .service-row__actions {
            grid-column:
              1 / -1;

            justify-content:
              flex-start;
          }

        }

        @media (max-width: 760px) {

          .services-form-grid {
            grid-template-columns:
              1fr;
          }

          .services-form-field--full {
            grid-column:
              auto;
          }

          .services-form-actions {
            align-items:
              stretch;

            flex-direction:
              column;
          }

          .services-form-actions .btn {
            width:
              100%;
          }

          .service-row {
            display:
              flex;

            align-items:
              flex-start;

            flex-direction:
              column;

            gap:
              10px;

            padding:
              16px;
          }

          .service-row__info,
          .service-row__category,
          .service-row__price,
          .service-row__actions {
            width:
              100%;
          }

          .service-row__visibility {
            margin-right:
              auto;
          }

          .service-row__actions {
            display:
              flex;

            align-items:
              center;

            justify-content:
              flex-start;
          }

        }

        @media (max-width: 500px) {

          .services-editor__head,
          .services-editor__body,
          .services-list-header {
            padding:
              15px;
          }

          .services-list-header {
            align-items:
              flex-start;

            flex-direction:
              column;

            gap:
              4px;
          }

          .service-row__actions {
            flex-wrap:
              wrap;
          }

        }

        /*
        ============================================================
        REDUCED MOTION
        ============================================================
        */

        @media (
          prefers-reduced-motion: reduce
        ) {

          .service-row,
          .service-row__visibility,
          .service-row__delete {
            transition:
              none;
          }

        }

      `}</style>

      <section className="services-manager-page">

        <div className="admin-content services-manager-content">

          {/* ====================================================
              INTRO
              ==================================================== */}

          <div className="services-manager-intro">

            <p>
              Manage the photography services
              offered through the public website
              and estimator.
            </p>

          </div>

          {/* ====================================================
              EDITOR
              ==================================================== */}

          <div className="services-editor">

            <div className="services-editor__head">

              <div className="services-editor__title-wrap">

                <span className="services-editor__icon">
                  {editingId ? (
                    <Pencil size={15} />
                  ) : (
                    <Plus size={15} />
                  )}
                </span>

                <h2 className="services-editor__title">
                  {editingId
                    ? 'Edit Service'
                    : 'Add a Service'}
                </h2>

              </div>

              {editingId && (
                <button
                  type="button"
                  className="
                    btn
                    btn--ghost-light
                    btn--sm
                  "
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}

            </div>

            <form
              className="services-editor__body"
              onSubmit={handleSubmit}
            >

              <div className="services-form-grid">

                {/* NAME */}

                <div className="field services-form-field">

                  <label htmlFor="svc-name">
                    Name
                  </label>

                  <input
                    id="svc-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        'name',
                        event.target.value
                      )
                    }
                    placeholder="Wedding Photography"
                  />

                </div>

                {/* CATEGORY */}

                <div className="field services-form-field">

                  <label htmlFor="svc-cat">
                    Category
                  </label>

                  <select
                    id="svc-cat"
                    value={form.category}
                    onChange={(event) =>
                      updateField(
                        'category',
                        event.target.value
                      )
                    }
                  >

                    <option value="photography">
                      Photography
                    </option>

                    <option value="additional">
                      Additional Services
                    </option>

                  </select>

                </div>

                {/* PRICE */}

                <div className="field services-form-field">

                  <label htmlFor="svc-price">
                    Starting Price
                  </label>

                  <input
                    id="svc-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.starting_price
                    }
                    onChange={(event) =>
                      updateField(
                        'starting_price',
                        event.target.value
                      )
                    }
                    placeholder="25000"
                  />

                </div>

                {/* DESCRIPTION */}

                <div className="field services-form-field services-form-field--full">

                  <label htmlFor="svc-desc">
                    Description
                  </label>

                  <textarea
                    id="svc-desc"
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      updateField(
                        'description',
                        event.target.value
                      )
                    }
                    placeholder="Describe what is included in this service."
                    rows="4"
                  />

                </div>

              </div>

              <div className="services-form-actions">

                <button
                  type="submit"
                  className="
                    btn
                    btn--primary
                    btn--sm
                    services-submit
                  "
                  disabled={saving}
                >

                  <Save size={14} />

                  {saving
                    ? 'Saving…'
                    : editingId
                      ? 'Save Changes'
                      : 'Add Service'}

                </button>

                {editingId && (
                  <button
                    type="button"
                    className="
                      btn
                      btn--ghost-light
                      btn--sm
                    "
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                )}

              </div>

            </form>

          </div>

          {/* ====================================================
              SERVICE LIST
              ==================================================== */}

          {services === null && (
            <LoadingState
              label="Loading services…"
            />
          )}

          {services !== null && (
            <div className="services-list-panel">

              <div className="services-list-header">

                <h2 className="services-list-header__title">
                  Available Services
                </h2>

                <span className="services-list-header__count">
                  {services.length}{' '}
                  {services.length === 1
                    ? 'service'
                    : 'services'}
                </span>

              </div>

              {services.length === 0 ? (
                <div className="services-empty">

                  <div className="services-empty__icon">
                    <Sparkles size={19} />
                  </div>

                  <h3 className="services-empty__title">
                    No services yet
                  </h3>

                  <p className="services-empty__text">
                    Add your first service above.
                  </p>

                </div>
              ) : (
                <div className="services-list">

                  {services.map(
                    (service) => (
                      <div
                        key={service.id}
                        className="service-row"
                      >

                        {/* INFO */}

                        <div className="service-row__info">

                          <strong className="service-row__name">
                            {service.name ||
                              'Untitled Service'}
                          </strong>

                          <div className="service-row__description">
                            {service.description ||
                              'No description provided.'}
                          </div>

                        </div>

                        {/* CATEGORY */}

                        <div className="service-row__category">
                          {service.category ||
                            'Photography'}
                        </div>

                        {/* PRICE */}

                        <div className="service-row__price">

                          <span className="service-row__price-label">
                            Starting
                          </span>

                          <strong>
                            {formatPrice(
                              service.starting_price
                            )}
                          </strong>

                        </div>

                        {/* VISIBILITY */}

                        <button
                          type="button"
                          className={`
                            service-row__visibility
                            ${
                              service.visible
                                ? 'service-row__visibility--visible'
                                : ''
                            }
                          `}
                          onClick={() =>
                            toggleVisible(
                              service
                            )
                          }
                          disabled={
                            togglingId ===
                            service.id
                          }
                          title={
                            service.visible
                              ? 'Visible on public site'
                              : 'Hidden from public site'
                          }
                          aria-label={
                            service.visible
                              ? `Hide ${service.name}`
                              : `Show ${service.name}`
                          }
                        >

                          {service.visible ? (
                            <Eye size={15} />
                          ) : (
                            <EyeOff size={15} />
                          )}

                        </button>

                        {/* ACTIONS */}

                        <div className="service-row__actions">

                          <button
                            type="button"
                            className="
                              btn
                              btn--ghost-light
                              btn--sm
                              service-row__edit
                            "
                            onClick={() =>
                              startEdit(
                                service
                              )
                            }
                          >
                            <Pencil size={13} />
                            Edit
                          </button>

                          <button
                            type="button"
                            className="service-row__delete"
                            onClick={() =>
                              setConfirmDelete(
                                service
                              )
                            }
                            aria-label={`Delete ${service.name}`}
                            title={`Delete ${service.name}`}
                          >
                            <Trash2 size={14} />
                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>
          )}

        </div>

      </section>

      {/* ======================================================
          DELETE CONFIRMATION
          ====================================================== */}

      {confirmDelete && (
        <Modal
          title={`Delete "${confirmDelete.name}"?`}
          body="This cannot be undone."
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