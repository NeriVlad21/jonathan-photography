import { assetUrl } from '../services/api.js'

// Whole pesos (₱1,500). Amounts that are not whole pesos (older records)
// keep their centavos so the display never hides money.
export function peso(amount) {
  const n = Number(amount || 0)
  const whole = Math.abs(n - Math.round(n)) < 0.005
  return '₱' + n.toLocaleString('en-PH', whole ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

// Same resolution as assetUrl() in services/api.js: one helper for every page,
// so a stored path can never map to different URLs on different screens.
export function imageUrl(path) {
  return assetUrl(path)
}
