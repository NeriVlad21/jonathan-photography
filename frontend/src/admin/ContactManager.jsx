import { useEffect, useState } from 'react'
import {
  Trash2,
  Save,
  Pencil,
  Plus,
  ExternalLink,
  Instagram,
  Facebook,
  Phone,
  Mail,
  Link as LinkIcon,
  Eye,
  EyeOff
} from 'lucide-react'

import { contactsApi } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'

const emptyForm = {
  label: '',
  tagline: '',
  handle: '',
  link: '',
  icon: 'link'
}

const ICON_OPTIONS = [
  'instagram',
  'facebook',
  'phone',
  'mail',
  'link'
]

export default function ContactManager() {
  const { showToast } = useToast()

  const [platforms, setPlatforms] =
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
  LOAD
  ============================================================
  */

  const load = () => {
    contactsApi
      .list(true)
      .then((data) => {
        setPlatforms(
          Array.isArray(data)
            ? data
            : []
        )
      })
      .catch(() => {
        setPlatforms([])
      })
  }

  useEffect(() => {
    document.title =
      'Admin — Contact Links'

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

  const startEdit = (platform) => {
    setEditingId(platform.id)

    setForm({
      label: platform.label || '',
      tagline: platform.tagline || '',
      handle: platform.handle || '',
      link: platform.link || '',
      icon: platform.icon || 'link'
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
          platforms?.find(
            (platform) =>
              platform.id === editingId
          )

        await contactsApi.update({
          id: editingId,
          ...form,
          visible:
            existing?.visible ?? 1
        })

        showToast(
          'Contact platform updated.'
        )
      } else {
        await contactsApi.create(form)

        showToast(
          'Contact platform added.'
        )
      }

      resetForm()
      load()
    } catch (error) {
      showToast(
        error?.message ||
          'Unable to save contact platform.',
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

  const toggleVisible = async (platform) => {
    setTogglingId(platform.id)

    try {
      await contactsApi.update({
        ...platform,
        visible: platform.visible
          ? 0
          : 1
      })

      showToast(
        platform.visible
          ? 'Platform hidden from the public site.'
          : 'Platform is now visible on the public site.'
      )

      load()
    } catch (error) {
      showToast(
        error?.message ||
          'Unable to update visibility.',
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
      await contactsApi.remove(
        confirmDelete.id
      )

      showToast(
        'Contact platform deleted.'
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
          'Unable to delete contact platform.',
        'error'
      )
    }
  }

  /*
  ============================================================
  ICON
  ============================================================
  */

  const getIcon = (icon) => {
    switch (icon) {
      case 'instagram':
        return Instagram

      case 'facebook':
        return Facebook

      case 'phone':
        return Phone

      case 'mail':
        return Mail

      default:
        return LinkIcon
    }
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
        CONTACT MANAGER
        ============================================================
        */

        .contact-manager-page {
          width: 100%;
        }

        .contact-manager-content {
          width: 100%;

          max-width:
            1050px;
        }

        /*
        ============================================================
        INTRO
        ============================================================
        */

        .contact-manager-intro {
          display: flex;

          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;

          margin-bottom:
            20px;
        }

        .contact-manager-intro__copy {
          min-width: 0;
        }

        .contact-manager-intro__title {
          margin: 0;
        }

        .contact-manager-intro__text {
          margin:
            5px 0 0;

          color:
            var(--c-gray);

          max-width:
            60ch;
        }

        /*
        ============================================================
        EDITOR PANEL
        ============================================================
        */

        .contact-editor {
          margin-bottom:
            20px;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            var(--c-bg, #fff);
        }

        .contact-editor__head {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 15px;

          padding:
            17px 20px;

          border-bottom:
            1px solid
            var(--c-hairline, #e5e5e5);
        }

        .contact-editor__title-wrap {
          display: flex;

          align-items: center;

          gap: 9px;

          min-width: 0;
        }

        .contact-editor__icon {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          width: 30px;
          height: 30px;

          flex: 0 0 30px;

          border-radius:
            7px;

          background:
            #111;

          color:
            #fff;
        }

        .contact-editor__title {
          margin: 0;
        }

        .contact-editor__body {
          padding:
            20px;
        }

        /*
        ============================================================
        FORM
        ============================================================
        */

        .contact-form-grid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );

          gap:
            17px 20px;
        }

        .contact-form-field {
          min-width: 0;
        }

        .contact-form-field--full {
          grid-column:
            1 / -1;
        }

        .contact-form-actions {
          display: flex;

          align-items: center;

          gap: 8px;

          margin-top:
            20px;
        }

        .contact-save-button {
          display: inline-flex;

          align-items: center;

          justify-content: center;

          gap: 7px;
        }

        /*
        ============================================================
        LIST HEADER
        ============================================================
        */

        .contact-list-panel {
          overflow: hidden;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            var(--c-bg, #fff);
        }

        .contact-list-header {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 15px;

          padding:
            17px 20px;

          border-bottom:
            1px solid
            var(--c-hairline, #e5e5e5);
        }

        .contact-list-header__title {
          margin: 0;
        }

        .contact-list-header__count {
          color:
            var(--c-gray);
        }

        /*
        ============================================================
        CONTACT ROW
        ============================================================
        */

        .contact-list {
          display: flex;

          flex-direction: column;
        }

        .contact-row {
          display: grid;

          grid-template-columns:
            minmax(170px, 1.1fr)
            minmax(180px, 1fr)
            minmax(220px, 1.2fr)
            auto;

          align-items: center;

          gap: 18px;

          padding:
            16px 20px;

          border-bottom:
            1px solid
            var(--c-hairline, #ededed);

          transition:
            background 0.18s ease;
        }

        .contact-row:last-child {
          border-bottom: 0;
        }

        .contact-row:hover {
          background:
            #fafafa;
        }

        /*
        ============================================================
        PLATFORM
        ============================================================
        */

        .contact-row__platform {
          display: flex;

          align-items: center;

          gap: 11px;

          min-width: 0;
        }

        .contact-row__icon {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          width: 38px;
          height: 38px;

          flex: 0 0 38px;

          border:
            1px solid
            var(--c-hairline, #e0e0e0);

          border-radius:
            9px;

          background:
            #f7f7f7;

          color:
            var(--c-text);
        }

        .contact-row__platform-copy {
          min-width: 0;
        }

        .contact-row__label {
          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        }

        .contact-row__handle {
          margin-top:
            3px;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;

          color:
            var(--c-gray);
        }

        /*
        ============================================================
        TAGLINE
        ============================================================
        */

        .contact-row__tagline {
          min-width: 0;

          color:
            var(--c-gray);

          line-height:
            1.45;
        }

        /*
        ============================================================
        LINK
        ============================================================
        */

        .contact-row__link {
          min-width: 0;

          display: flex;

          align-items: center;

          gap: 6px;

          color:
            var(--c-text);

          text-decoration:
            none;
        }

        .contact-row__link-text {
          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        }

        .contact-row__link:hover
        .contact-row__link-text {
          text-decoration:
            underline;
        }

        .contact-row__external {
          flex: 0 0 auto;

          color:
            #999;
        }

        /*
        ============================================================
        ROW ACTIONS
        ============================================================
        */

        .contact-row__actions {
          display: flex;

          align-items: center;

          justify-content: flex-end;

          gap: 7px;
        }

        .contact-row__visibility {
          display: inline-flex;

          align-items: center;

          justify-content: center;

          width: 34px;
          height: 34px;

          padding: 0;

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
            color 0.18s ease,
            border-color 0.18s ease;
        }

        .contact-row__visibility:hover:not(:disabled) {
          background:
            #f2f2f2;

          color:
            var(--c-text);

          border-color:
            #c5c5c5;
        }

        .contact-row__visibility:disabled {
          cursor:
            wait;

          opacity:
            0.55;
        }

        .contact-row__visibility--visible {
          color:
            #2d7448;
        }

        .contact-row__edit,
        .contact-row__delete {
          display: inline-flex;

          align-items: center;

          justify-content: center;

          gap: 6px;

          min-height:
            34px;

          padding:
            0 10px;
        }

        .contact-row__delete {
          color:
            #b3261e;

          border-color:
            rgba(
              179,
              38,
              30,
              0.35
            );
        }

        .contact-row__delete:hover {
          color:
            #a51f19;

          border-color:
            #b3261e;

          background:
            rgba(
              179,
              38,
              30,
              0.04
            );
        }

        /*
        ============================================================
        MOBILE ROW
        ============================================================
        */

        .contact-row__mobile-meta {
          display: none;
        }

        /*
        ============================================================
        EMPTY
        ============================================================
        */

        .contact-empty {
          padding:
            45px 25px;

          text-align:
            center;

          color:
            var(--c-gray);
        }

        .contact-empty__icon {
          display: flex;

          align-items: center;
          justify-content: center;

          width: 44px;
          height: 44px;

          margin:
            0 auto 12px;

          border-radius:
            50%;

          background:
            #f1f1f1;

          color:
            #777;
        }

        .contact-empty__title {
          margin:
            0 0 5px;

          color:
            var(--c-text);
        }

        .contact-empty__text {
          margin:
            0;
        }

        /*
        ============================================================
        RESPONSIVE
        ============================================================
        */

        @media (max-width: 1000px) {

          .contact-row {
            grid-template-columns:
              minmax(160px, 1fr)
              minmax(180px, 1.2fr)
              auto;
          }

          .contact-row__tagline {
            display: none;
          }

        }

        @media (max-width: 760px) {

          .contact-form-grid {
            grid-template-columns:
              1fr;
          }

          .contact-form-field--full {
            grid-column:
              auto;
          }

          .contact-row {
            display: flex;

            align-items:
              flex-start;

            flex-direction:
              column;

            gap:
              12px;

            padding:
              16px;
          }

          .contact-row__platform,
          .contact-row__tagline,
          .contact-row__link {
            width:
              100%;
          }

          .contact-row__tagline {
            display: block;
          }

          .contact-row__actions {
            width:
              100%;

            justify-content:
              flex-start;

            flex-wrap:
              wrap;
          }

          .contact-row__visibility {
            margin-right:
              auto;
          }

        }

        @media (max-width: 500px) {

          .contact-editor__head,
          .contact-editor__body,
          .contact-list-header {
            padding:
              15px;
          }

          .contact-form-actions {
            align-items:
              stretch;

            flex-direction:
              column;
          }

          .contact-form-actions .btn {
            width:
              100%;
          }

          .contact-list-header {
            align-items:
              flex-start;

            flex-direction:
              column;

            gap:
              4px;
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

          .contact-row,
          .contact-row__visibility {
            transition:
              none;
          }

        }

      `}</style>

      <section className="contact-manager-page">

        <div className="admin-content contact-manager-content">

          {/* ====================================================
              EDITOR
              ==================================================== */}

          <div className="contact-editor">

            <div className="contact-editor__head">

              <div className="contact-editor__title-wrap">

                <span className="contact-editor__icon">
                  {editingId ? (
                    <Pencil size={15} />
                  ) : (
                    <Plus size={15} />
                  )}
                </span>

                <h2 className="contact-editor__title">
                  {editingId
                    ? 'Edit Platform'
                    : 'Add a Platform'}
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
                >
                  Cancel
                </button>
              )}

            </div>

            <form
              className="contact-editor__body"
              onSubmit={handleSubmit}
            >

              <div className="contact-form-grid">

                {/* LABEL */}

                <div className="field contact-form-field">

                  <label htmlFor="c-label">
                    Label
                  </label>

                  <input
                    id="c-label"
                    type="text"
                    required
                    value={form.label}
                    onChange={(event) =>
                      updateField(
                        'label',
                        event.target.value
                      )
                    }
                    placeholder="Instagram"
                  />

                </div>

                {/* ICON */}

                <div className="field contact-form-field">

                  <label htmlFor="c-icon">
                    Icon
                  </label>

                  <select
                    id="c-icon"
                    value={form.icon}
                    onChange={(event) =>
                      updateField(
                        'icon',
                        event.target.value
                      )
                    }
                  >

                    {ICON_OPTIONS.map(
                      (icon) => (
                        <option
                          key={icon}
                          value={icon}
                        >
                          {icon}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* HANDLE */}

                <div className="field contact-form-field">

                  <label htmlFor="c-handle">
                    Handle
                  </label>

                  <input
                    id="c-handle"
                    type="text"
                    value={form.handle}
                    onChange={(event) =>
                      updateField(
                        'handle',
                        event.target.value
                      )
                    }
                    placeholder="@jonathanphotography"
                  />

                </div>

                {/* LINK */}

                <div className="field contact-form-field">

                  <label htmlFor="c-link">
                    Link
                  </label>

                  <input
                    id="c-link"
                    type="url"
                    required
                    value={form.link}
                    onChange={(event) =>
                      updateField(
                        'link',
                        event.target.value
                      )
                    }
                    placeholder="https://instagram.com/..."
                  />

                </div>

                {/* TAGLINE */}

                <div className="field contact-form-field contact-form-field--full">

                  <label htmlFor="c-tagline">
                    Tagline
                  </label>

                  <input
                    id="c-tagline"
                    type="text"
                    value={form.tagline}
                    onChange={(event) =>
                      updateField(
                        'tagline',
                        event.target.value
                      )
                    }
                    placeholder="See what we're currently obsessed with."
                  />

                </div>

              </div>

              <div className="contact-form-actions">

                <button
                  type="submit"
                  className="
                    btn
                    btn--primary
                    btn--sm
                    contact-save-button
                  "
                  disabled={saving}
                >

                  <Save size={14} />

                  {saving
                    ? 'Saving…'
                    : editingId
                      ? 'Save Changes'
                      : 'Add Platform'}

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
              LOADING
              ==================================================== */}

          {platforms === null && (
            <LoadingState
              label="Loading contact links…"
            />
          )}

          {/* ====================================================
              PLATFORM LIST
              ==================================================== */}

          {platforms !== null && (
            <div className="contact-list-panel">

              <div className="contact-list-header">

                <h2 className="contact-list-header__title">
                  Contact Platforms
                </h2>

                <span className="contact-list-header__count">
                  {platforms.length}{' '}
                  {platforms.length === 1
                    ? 'platform'
                    : 'platforms'}
                </span>

              </div>

              {platforms.length === 0 ? (
                <div className="contact-empty">

                  <div className="contact-empty__icon">
                    <LinkIcon size={19} />
                  </div>

                  <h3 className="contact-empty__title">
                    No contact platforms yet
                  </h3>

                  <p className="contact-empty__text">
                    Add your first social
                    or contact link above.
                  </p>

                </div>
              ) : (
                <div className="contact-list">

                  {platforms.map(
                    (platform) => {
                      const Icon =
                        getIcon(
                          platform.icon
                        )

                      const visible =
                        !!platform.visible

                      return (
                        <div
                          key={platform.id}
                          className="contact-row"
                        >

                          {/* PLATFORM */}

                          <div className="contact-row__platform">

                            <span className="contact-row__icon">
                              <Icon
                                size={17}
                              />
                            </span>

                            <div className="contact-row__platform-copy">

                              <div className="contact-row__label">
                                {platform.label ||
                                  'Untitled'}
                              </div>

                              {platform.handle && (
                                <div className="contact-row__handle">
                                  {platform.handle}
                                </div>
                              )}

                            </div>

                          </div>

                          {/* TAGLINE */}

                          <div className="contact-row__tagline">
                            {platform.tagline ||
                              'No tagline set.'}
                          </div>

                          {/* LINK */}

                          <a
                            href={
                              platform.link ||
                              '#'
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="contact-row__link"
                            onClick={(event) => {
                              if (!platform.link) {
                                event.preventDefault()
                              }
                            }}
                            title={
                              platform.link ||
                              'No link'
                            }
                          >

                            <span className="contact-row__link-text">
                              {platform.link ||
                                'No link'}
                            </span>

                            {platform.link && (
                              <ExternalLink
                                size={14}
                                className="contact-row__external"
                              />
                            )}

                          </a>

                          {/* ACTIONS */}

                          <div className="contact-row__actions">

                            <button
                              type="button"
                              className={`
                                contact-row__visibility
                                ${
                                  visible
                                    ? 'contact-row__visibility--visible'
                                    : ''
                                }
                              `}
                              onClick={() =>
                                toggleVisible(
                                  platform
                                )
                              }
                              disabled={
                                togglingId ===
                                platform.id
                              }
                              aria-label={
                                visible
                                  ? `Hide ${platform.label}`
                                  : `Show ${platform.label}`
                              }
                              title={
                                visible
                                  ? 'Visible on public site'
                                  : 'Hidden from public site'
                              }
                            >

                              {visible ? (
                                <Eye size={15} />
                              ) : (
                                <EyeOff size={15} />
                              )}

                            </button>

                            <button
                              type="button"
                              className="
                                btn
                                btn--ghost-light
                                btn--sm
                                contact-row__edit
                              "
                              onClick={() =>
                                startEdit(
                                  platform
                                )
                              }
                            >
                              <Pencil size={13} />
                              Edit
                            </button>

                            <button
                              type="button"
                              className="
                                btn
                                btn--sm
                                contact-row__delete
                              "
                              onClick={() =>
                                setConfirmDelete(
                                  platform
                                )
                              }
                              aria-label={`Delete ${platform.label}`}
                              title={`Delete ${platform.label}`}
                            >
                              <Trash2 size={13} />
                            </button>

                          </div>

                        </div>
                      )
                    }
                  )}

                </div>
              )}

            </div>
          )}

        </div>

      </section>

      {/* ======================================================
          DELETE MODAL
          ====================================================== */}

      {confirmDelete && (
        <Modal
          title={`Delete "${confirmDelete.label}"?`}
          body="It will disappear from the public site immediately."
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