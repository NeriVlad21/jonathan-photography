// Pure helper (no import.meta.env) so it can be unit-tested with plain Node.
// Accepts only HTTPS Google Maps links: share links (maps.app.goo.gl,
// goo.gl/maps) and google.com/maps or maps.google.com URLs.
export function safeGoogleMapsLink(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  let url
  try { url = new URL(text) } catch { return '' }
  if (url.protocol !== 'https:') return ''
  const host = url.hostname.toLowerCase()
  const path = url.pathname
  const allowed = host === 'maps.app.goo.gl'
    || (host === 'goo.gl' && path.startsWith('/maps'))
    || host === 'maps.google.com'
    || ((host === 'google.com' || host === 'www.google.com') && path.startsWith('/maps'))
  if (!allowed) return ''
  // Share links carry an app-tracking parameter that is not needed to open them.
  if (!url.searchParams.has('g_st')) return url.href
  url.searchParams.delete('g_st')
  return url.href
}
