import { useEffect, useRef } from 'react'

// Shared behaviour for the admin's inline dialogs: focus moves inside when the
// dialog opens, Escape closes it, and focus returns to the trigger afterwards.
// Attach the returned ref to the dialog element.
export function useDialog(active, onClose) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!active) return undefined
    const previousFocus = document.activeElement
    const node = ref.current
    const first = node?.querySelector('input:not([type=hidden]):not([disabled]), select, textarea, button:not([disabled])')
    ;(first || node)?.focus({ preventScroll: true })

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeRef.current?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus?.({ preventScroll: true })
    }
  }, [active])

  return ref
}
