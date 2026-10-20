// Pure helpers that turn a stored upload path into a browser URL. Kept free of
// import.meta.env so they can be unit-tested with plain Node (see tests/).

const PASS_THROUGH = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i // http:, https:, data:, blob:, //host
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

const trimSlash = (value) => String(value || '').trim().replace(/\/+$/, '')

/**
 * Backend base URL for uploaded files ("/backend" or "https://host/backend").
 * Prefers an explicit backend URL, then one derived from the API URL, then the
 * production default. A production build never points visitors at a localhost
 * backend (a development value baked into the bundle), unless the page itself
 * is being served from localhost.
 */
export function resolveBackendBase({ backendUrl, apiUrl, dev = false, pageHostname = '' } = {}) {
  const fromApi = apiUrl ? trimSlash(apiUrl).replace(/\/api$/, '') : ''
  const fallback = dev ? 'http://localhost/jonathan-photography/backend' : '/backend'
  const base = trimSlash(backendUrl) || fromApi || fallback
  if (dev) return base
  const host = hostnameOf(base)
  if (host && LOCAL_HOSTS.has(host) && !LOCAL_HOSTS.has(String(pageHostname).toLowerCase())) return '/backend'
  return base
}

/**
 * Joins a stored upload path ("/uploads/…", "uploads/…" or "/backend/uploads/…")
 * to the backend base without dropping or duplicating the "/backend" segment.
 * Absolute, protocol-relative, data: and blob: URLs pass through unchanged;
 * legacy demo paths resolve to "" so they are never shown as studio work.
 */
export function resolveAssetUrl(path, backendBase) {
  if (path === null || path === undefined) return ''
  const value = String(path).trim()
  if (!value) return ''
  if (PASS_THROUGH.test(value)) return value
  let rooted = value.startsWith('/') ? value : `/${value}`
  if (rooted.startsWith('/demo/')) return ''

  const base = trimSlash(backendBase)
  const basePath = pathOf(base)
  if (basePath && (rooted === basePath || rooted.startsWith(`${basePath}/`))) {
    rooted = rooted.slice(basePath.length) || '/'
  }
  return `${base}${rooted}`
}

function hostnameOf(url) {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/:?#]+|\[[^\]]+\])/i.exec(url)
  return match ? match[1].toLowerCase() : ''
}

function pathOf(url) {
  const withoutOrigin = url.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, '')
  return trimSlash(withoutOrigin)
}
