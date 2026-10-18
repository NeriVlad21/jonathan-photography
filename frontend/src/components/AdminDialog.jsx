import { useEffect, useId, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Shared Admin / Super Admin dialog for flag, warning, resolve, archive and
 * support-report actions.
 *
 * - role="dialog" + aria-modal, title and description wired with ARIA ids
 * - focus moves to the first field (or first button) and is trapped inside
 * - Escape and backdrop clicks close it, except while `busy`
 * - focus returns to the element that opened it
 * - the caller decides when to close (only after its request succeeds)
 */
export default function AdminDialog({
  open,
  title,
  description,
  onClose,
  onSubmit,
  busy = false,
  submitLabel = 'Save',
  busyLabel = 'Saving…',
  submitTone = 'primary',
  submitDisabled = false,
  cancelLabel = 'Cancel',
  size = 'md',
  children,
}) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef(null)
  const closeRef = useRef(onClose)
  const busyRef = useRef(busy)
  closeRef.current = onClose
  busyRef.current = busy

  useEffect(() => {
    if (!open) return undefined
    const previousFocus = document.activeElement
    const panel = panelRef.current
    const first = panel?.querySelector('input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])') || panel?.querySelector(FOCUSABLE)
    ;(first || panel)?.focus({ preventScroll: true })

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (!busyRef.current) closeRef.current?.()
        event.stopPropagation()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((node) => node.offsetParent !== null)
      if (!items.length) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (event.shiftKey && document.activeElement === firstItem) { event.preventDefault(); lastItem.focus() }
      else if (!event.shiftKey && document.activeElement === lastItem) { event.preventDefault(); firstItem.focus() }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      previousFocus?.focus?.({ preventScroll: true })
    }
  }, [open])

  if (!open) return null

  const submit = (event) => {
    event.preventDefault()
    if (busy || submitDisabled) return
    onSubmit?.()
  }

  return (
    <div className="admin-dialog-backdrop" onMouseDown={() => { if (!busy) onClose?.() }}>
      <form
        ref={panelRef}
        className={`admin-dialog admin-dialog--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        aria-busy={busy || undefined}
        tabIndex={-1}
        noValidate
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="admin-dialog__header">
          <h2 id={titleId}>{title}</h2>
          {description && <p id={descriptionId}>{description}</p>}
        </header>
        <div className="admin-dialog__body">{children}</div>
        <footer className="admin-dialog__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={busy}>{cancelLabel}</button>
          <button type="submit" className={`btn admin-btn--${submitTone}`} disabled={busy || submitDisabled}>
            {busy ? busyLabel : submitLabel}
          </button>
        </footer>
      </form>
    </div>
  )
}

/** Read-only facts about the record being acted on (no sensitive contact data). */
export function AdminDialogSummary({ items }) {
  const rows = (items || []).filter((item) => item && item.value !== undefined && item.value !== null && item.value !== '')
  if (!rows.length) return null
  return (
    <dl className="admin-dialog__summary">
      {rows.map((item) => (
        <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
      ))}
    </dl>
  )
}

/** Labelled field with required/optional marker, counter and inline error. */
export function AdminDialogField({ label, value, onChange, required = false, maxLength, minLength, multiline = false, rows = 4, hint, error, options, id: idProp }) {
  const generatedId = useId()
  const id = idProp || generatedId
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint || maxLength ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
  const common = {
    id,
    value: value ?? '',
    onChange: (event) => onChange(event.target.value),
    required,
    'aria-invalid': Boolean(error) || undefined,
    'aria-describedby': describedBy,
  }
  return (
    <div className={`admin-dialog__field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>
        {label} <span className="admin-dialog__marker">{required ? 'Required' : 'Optional'}</span>
      </label>
      {options
        ? <select {...common}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        : multiline
          ? <textarea {...common} rows={rows} maxLength={maxLength} minLength={minLength} />
          : <input {...common} maxLength={maxLength} minLength={minLength} />}
      {(hint || maxLength) && (
        <div className="admin-dialog__hint" id={hintId}>
          <span>{hint}</span>
          {maxLength && <span>{maxLength - String(value || '').length} characters left</span>}
        </div>
      )}
      {error && <p className="admin-dialog__error" id={errorId} role="alert">{error}</p>}
    </div>
  )
}
