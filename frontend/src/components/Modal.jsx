export default function Modal({ title, body, confirmLabel = 'Confirm', danger, onConfirm, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h3 id="modal-title">{title}</h3>
        {body && <p>{body}</p>}
        <div className="modal-card__actions">
          <button className="btn btn--ghost-light btn--sm" onClick={onClose}>Cancel</button>
          <button
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
