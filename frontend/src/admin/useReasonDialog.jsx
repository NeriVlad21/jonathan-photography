import { useCallback, useRef, useState } from 'react'
import AdminDialog, { AdminDialogField, AdminDialogSummary } from '../components/AdminDialog.jsx'
import { useToast } from '../context/ToastContext.jsx'

const MIN_REASON = 5
const MAX_REASON = 500

/**
 * Flag / advisory-warning dialog used by Super Admin oversight pages.
 *
 *   const [openFlagDialog, flagDialog] = useReasonDialog()
 *   openFlagDialog({ title, target, summary, onSubmit: async (reason) => { ... } })
 *
 * The dialog stays open (and locked) while `onSubmit` runs, shows an inline
 * error if it fails, and closes only after it succeeds.
 */
export function useReasonDialog() {
  const { showToast } = useToast()
  const [request, setRequest] = useState(null)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)

  const openReasonDialog = useCallback((options) => {
    setValue('')
    setError('')
    setRequest({
      title: 'Flag for Owner review',
      description: 'Sends an advisory warning to the Owner. Nothing is changed, hidden, or deleted.',
      label: 'Flag reason',
      hint: `At least ${MIN_REASON} characters. The Owner sees this reason.`,
      submitLabel: 'Send flag',
      ...options,
    })
  }, [])

  const close = () => { if (!busyRef.current) setRequest(null) }

  const submit = async () => {
    const reason = value.trim()
    if (reason.length < MIN_REASON) {
      setError(reason ? `Enter at least ${MIN_REASON} characters so the Owner understands the concern.` : 'Enter a reason for this flag.')
      return
    }
    busyRef.current = true
    setBusy(true)
    try {
      await request.onSubmit(reason)
      busyRef.current = false
      setRequest(null)
    } catch (submitError) {
      const message = submitError?.message || 'Unable to send this flag.'
      setError(message)
      showToast(message, 'error')
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const dialog = (
    <AdminDialog
      open={Boolean(request)}
      title={request?.title}
      description={request?.description}
      onClose={close}
      onSubmit={submit}
      busy={busy}
      busyLabel="Sending…"
      submitLabel={request?.submitLabel}
      submitTone="warning"
    >
      <AdminDialogSummary items={request?.summary} />
      <AdminDialogField
        label={request?.label}
        value={value}
        onChange={(next) => { setValue(next); if (error) setError('') }}
        required
        multiline
        maxLength={MAX_REASON}
        hint={request?.hint}
        error={error}
      />
    </AdminDialog>
  )

  return [openReasonDialog, dialog]
}
