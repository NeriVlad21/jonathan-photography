import { useEffect, useRef } from 'react'

export default function Modal({ title, body, confirmLabel = 'Confirm', danger, onConfirm, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const focusable = dialog?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []
    focusable[0]?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
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
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div ref={dialogRef} className="modal-card" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h3 id="modal-title">{title}</h3>
        {body && <p>{body}</p>}
        <div className="modal-card__actions">
          <button type="button" className="btn btn--ghost-light btn--sm" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn--sm"
            style={danger ? { background: '#B3261E', borderColor: '#B3261E', color: '#fff' } : { background: '#0A0A0A', borderColor: '#0A0A0A', color: '#fff' }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
