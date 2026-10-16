import { useCallback, useRef, useState } from 'react'
import Modal from '../components/Modal.jsx'

// Promise-based replacement for window.prompt: `const reason = await askReason({...})`
// resolves with the trimmed text, or null when the dialog is cancelled.
export function useReasonDialog() {
  const [request, setRequest] = useState(null)
  const [value, setValue] = useState('')
  const resolver = useRef(null)

  const askReason = useCallback((options = {}) => new Promise((resolve) => {
    resolver.current = resolve
    setValue('')
    setRequest({ title: 'Add an advisory warning', label: 'Reason', help: 'Required, at least 5 characters. The Owner sees this reason and must resolve the warning.', confirmLabel: 'Add warning', minLength: 5, ...options })
  }), [])

  const finish = (result) => {
    resolver.current?.(result)
    resolver.current = null
    setRequest(null)
  }

  const dialog = request && (
    <Modal
      title={request.title}
      body={request.body}
      confirmLabel={request.confirmLabel}
      confirmDisabled={value.trim().length < request.minLength}
      onConfirm={() => finish(value.trim())}
      onClose={() => finish(null)}
    >
      <label className="modal-field">
        <span>{request.label}</span>
        <textarea value={value} onChange={(event) => setValue(event.target.value)} maxLength={500} required />
        <small>{request.help}</small>
      </label>
    </Modal>
  )

  return [askReason, dialog]
}
