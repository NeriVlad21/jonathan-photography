export function peso(amount) {
  const n = Number(amount || 0)
  return '₱' + n.toLocaleString('en-PH', { maximumFractionDigits: 0 })
}

export function formatDate(dateStr) {
  if (!dateStr) return 'To be discussed'
  const d = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function imageUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path

  // VITE_API_URL is usually left unset in dev (Vite's proxy forwards /api
  // for us), but that meant this function had nothing to fall back to and
  // returned a bare "/uploads/..." path — which the browser resolves
  // against the frontend's own origin (localhost:5173) instead of the PHP
  // backend, so every image 404'd.
  //
  // VITE_BACKEND_URL is a required, explicit backend origin that doesn't
  // depend on whether VITE_API_URL happens to be set. Set it in
  // frontend/.env, e.g.:
  //   VITE_BACKEND_URL=http://localhost/jonathan-photography/backend
  const apiBase = import.meta.env.VITE_API_URL || ''
  const explicitBackend = import.meta.env.VITE_BACKEND_URL || ''

  const backendOrigin = apiBase
    ? apiBase.replace(/\/api\/?$/, '')
    : explicitBackend.replace(/\/$/, '')

  return `${backendOrigin}${path}`
}