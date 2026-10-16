import { useEffect, useRef } from 'react'

export default function Modal({ title, body, children, confirmLabel = 'Confirm', danger, confirmDisabled = false, busy = false, onConfirm, onClose }) {
  const dialogRef = useRef(null)
  // Keep the latest close handler without re-running the focus trap on every render,
  // so typing in a field inside the dialog never loses focus.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const focusables = () => [...(dialog?.querySelectorAll('button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || [])]
    const firstField = dialog?.querySelector('input, select, textarea')
    ;(firstField || focusables()[0])?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current()
      const focusable = focusables()
      if (event.key !== 'Tab' || focusable.length < 2) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus?.()
    }
  }, [])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div ref={dialogRef} className="modal-card" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h3 id="modal-title">{title}</h3>
        {body && <p>{body}</p>}
        {children}
        <div className="modal-card__actions">
          <button type="button" className="btn btn--ghost-light btn--sm" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={`btn btn--sm ${danger ? 'btn--danger-solid' : 'btn--dark'}`}
            disabled={confirmDisabled || busy}
            aria-busy={busy || undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
