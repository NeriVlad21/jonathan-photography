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

import { servicesApi, siteContentApi } from '../services/api.js'
import { DEFAULT_SITE_CONTENT, mergeSiteContent } from '../content/defaultSiteContent.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'

const emptyForm = {
  name: '',
  category: 'photography',
  description: '',
  starting_price: '',
  sort_order: '',
  visible: 1,
  inclusions: '',
  coverage_details: '',
  deliverables: '',
  package_options: '',
  notes: ''
}

// Package-detail fields shown in the public Services dialog and the
// estimator's occasion info panel. One item per line.
const DETAIL_FIELDS = [
  { key: 'inclusions', label: 'Included', placeholder: 'One item per line, e.g.\nPre-event consultation\nOne lead photographer' },
  { key: 'coverage_details', label: 'Coverage', placeholder: 'One item per line, e.g.\nPreparation to reception' },
  { key: 'deliverables', label: 'Deliverables', placeholder: 'One item per line, e.g.\nEdited digital gallery' },
  { key: 'package_options', label: 'Options', placeholder: 'One item per line — optional upgrades or variations' },
  { key: 'notes', label: 'Notes', placeholder: 'One item per line — travel, scheduling, or other notes' }
]

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
  const [serviceSections, setServiceSections] = useState(DEFAULT_SITE_CONTENT.servicesPage.categories)

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
    siteContentApi.get().then((data) => setServiceSections(mergeSiteContent(data?.content).servicesPage.categories)).catch(() => {})
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
        service.starting_price ?? '',
      sort_order:
        service.sort_order ?? '',
      visible:
        service.visible ? 1 : 0,
      inclusions: service.inclusions || '',
      coverage_details: service.coverage_details || '',
      deliverables: service.deliverables || '',
      package_options: service.package_options || '',
      notes: service.notes || ''
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
        await servicesApi.update({
          id: editingId,
          ...form
        })

        showToast(
          'Service updated.'
        )
      } else {
        const { sort_order: sortOrder, ...createForm } = form

        // A blank sort order lets the server append the service at the end.
        await servicesApi.create(
          sortOrder === '' ? createForm : form
        )

        showToast(
          'Service added.'
        )
      }

      resetForm()
      load()
    } catch (error) {
      // Surface the specific field problem returned by the server.
      const fieldError = Object.values(error?.errors || {}).find(
        (value) => typeof value === 'string'
      )

      showToast(
        fieldError ||
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
      // Partial update: only visibility changes, package details are kept.
      await servicesApi.update({
        id: service.id,
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

        .services-details-heading {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-top: 14px;
          border-top: 1px solid var(--c-hairline, #e5e5e5);
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

        .svc-admin-row {
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

        .svc-admin-row:last-child {
          border-bottom:
            0;
        }

        .svc-admin-row:hover {
          background:
            #fafafa;
        }

        /*
        ============================================================
        SERVICE INFO
        ============================================================
        */

        .svc-admin-row__info {
          min-width:
            0;
        }

        .svc-admin-row__name {
          display:
            block;

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }

        .svc-admin-row__description {
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

        .svc-admin-row__category {
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

        .svc-admin-row__price {
          white-space:
            nowrap;
        }

        .svc-admin-row__price-label {
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

        .svc-admin-row__visibility {
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

        .svc-admin-row__visibility:hover:not(:disabled) {
          background:
            #f2f2f2;

          border-color:
            #c5c5c5;

          color:
            var(--c-text);
        }

        .svc-admin-row__visibility--visible {
          color:
            #287449;
        }

        .svc-admin-row__visibility:disabled {
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

        .svc-admin-row__actions {
          display:
            flex;

          align-items:
            center;

          justify-content:
            flex-end;

          gap:
            7px;
        }

        .svc-admin-row__edit {
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

        .svc-admin-row__delete {
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

        .svc-admin-row__delete:hover {
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

          .svc-admin-row {
            grid-template-columns:
              minmax(170px, 1.3fr)
              minmax(110px, 0.8fr)
              120px
              auto;
          }

          .svc-admin-row__actions {
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

          .svc-admin-row {
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

          .svc-admin-row__info,
          .svc-admin-row__category,
          .svc-admin-row__price,
          .svc-admin-row__actions {
            width:
              100%;
          }

          .svc-admin-row__visibility {
            margin-right:
              auto;
          }

          .svc-admin-row__actions {
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

          .svc-admin-row__actions {
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

          .svc-admin-row,
          .svc-admin-row__visibility,
          .svc-admin-row__delete {
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

                    {!serviceSections.some((section) => section.key === form.category) && (
                      <option value={form.category}>{form.category}</option>
                    )}
                    {serviceSections.map((section) => <option value={section.key} key={section.key}>{section.label}</option>)}

                  </select>

                </div>

                {/* PRICE */}

                <div className="field services-form-field">

                  <label htmlFor="svc-price">
                    Starting Price
                  </label>

                  <small className="services-form-help">
                    Shared with Estimator settings and the public package builder.
                  </small>

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
                    placeholder="A short summary shown on the Services page and in the estimator."
                    rows="4"
                    maxLength={1200}
                  />

                </div>

                {/* SORT ORDER */}

                <div className="field services-form-field">

                  <label htmlFor="svc-sort">
                    Sort Order
                  </label>

                  <input
                    id="svc-sort"
                    type="number"
                    step="1"
                    value={form.sort_order}
                    onChange={(event) =>
                      updateField(
                        'sort_order',
                        event.target.value
                      )
                    }
                    placeholder="Added last when blank"
                  />

                </div>

                {/* VISIBILITY */}

                <div className="field services-form-field">

                  <label htmlFor="svc-visible">
                    Visibility
                  </label>

                  <select
                    id="svc-visible"
                    value={form.visible ? '1' : '0'}
                    onChange={(event) =>
                      updateField(
                        'visible',
                        event.target.value === '1' ? 1 : 0
                      )
                    }
                  >
                    <option value="1">Visible on the public site and estimator</option>
                    <option value="0">Hidden from the public</option>
                  </select>

                </div>

                {/* PACKAGE DETAILS */}

                <div className="services-form-field services-form-field--full services-details-heading">
                  <strong>Package details</strong>
                  <small className="services-form-help">
                    Shown when visitors open this service on the Services page or tap the info button in the estimator. Write one item per line; empty sections are hidden.
                  </small>
                </div>

                {DETAIL_FIELDS.map((detail) => (
                  <div className="field services-form-field" key={detail.key}>

                    <label htmlFor={`svc-${detail.key}`}>
                      {detail.label}
                    </label>

                    <textarea
                      id={`svc-${detail.key}`}
                      value={form[detail.key]}
                      onChange={(event) =>
                        updateField(
                          detail.key,
                          event.target.value
                        )
                      }
                      placeholder={detail.placeholder}
                      rows="4"
                      maxLength={2000}
                    />

                  </div>
                ))}

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
                        className="svc-admin-row"
                      >

                        {/* INFO */}

                        <div className="svc-admin-row__info">

                          <strong className="svc-admin-row__name">
                            {service.name ||
                              'Untitled Service'}
                          </strong>

                          <div className="svc-admin-row__description">
                            {service.description ||
                              'No description provided.'}
                          </div>

                        </div>

                        {/* CATEGORY */}

                        <div className="svc-admin-row__category">
                          {service.category ||
                            'Photography'}
                        </div>

                        {/* PRICE */}

                        <div className="svc-admin-row__price">

                          <span className="svc-admin-row__price-label">
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
                            svc-admin-row__visibility
                            ${
                              service.visible
                                ? 'svc-admin-row__visibility--visible'
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

                        <div className="svc-admin-row__actions">

                          <button
                            type="button"
                            className="
                              btn
                              btn--ghost-light
                              btn--sm
                              svc-admin-row__edit
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
                            className="svc-admin-row__delete"
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
