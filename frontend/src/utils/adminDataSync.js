export const ADMIN_DATA_CHANGED = 'jonathan:admin-data-changed'

export function notifyAdminDataChanged(detail = {}) {
  window.dispatchEvent(new CustomEvent(ADMIN_DATA_CHANGED, { detail }))
}

export function subscribeAdminDataChanged(handler) {
  window.addEventListener(ADMIN_DATA_CHANGED, handler)
  return () => window.removeEventListener(ADMIN_DATA_CHANGED, handler)
}
