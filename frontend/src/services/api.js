// Central API client.
//
// In development, Vite proxies /api/* to the PHP backend.
// In production, VITE_API_URL can point directly to the backend API.

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Full backend URL used for uploaded assets such as portfolio images.
const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost/jonathan-photography/backend'
).replace(/\/$/, '')

// Convert stored image paths into a URL served by the PHP backend.
export function assetUrl(path) {
  if (!path) return ''

  // Already an absolute URL
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `${BACKEND_URL}${
    path.startsWith('/') ? path : `/${path}`
  }`
}

let csrfToken = null

export function setCsrfToken(token) {
  csrfToken = token
}

export function getCsrfToken() {
  return csrfToken
}

class ApiError extends Error {
  constructor(message, status, errors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors || {}
  }
}

async function request(
  path,
  { method = 'GET', body, isForm = false } = {}
) {
  const headers = {}

  if (!isForm) {
    headers['Content-Type'] = 'application/json'
  }

  if (csrfToken && method !== 'GET') {
    headers['X-CSRF-Token'] = csrfToken
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body
      ? (isForm ? body : JSON.stringify(body))
      : undefined,
  })

  let json

  try {
    json = await res.json()
  } catch {
    throw new ApiError(
      'The server returned an unexpected response.',
      res.status
    )
  }

  if (!json.success) {
    throw new ApiError(
      json.message || 'Something went wrong.',
      res.status,
      json.errors
    )
  }

  return json.data
}

const get = (path) => request(path)

const post = (path, body) =>
  request(path, {
    method: 'POST',
    body
  })

const put = (path, body) =>
  request(path, {
    method: 'PUT',
    body
  })

const del = (path) =>
  request(path, {
    method: 'DELETE'
  })

const uploadForm = (path, formData) =>
  request(path, {
    method: 'POST',
    body: formData,
    isForm: true
  })

// ---------------- Auth ----------------

export const authApi = {
  check: () =>
    get('/auth/check.php'),

  login: (username, password) =>
    post('/auth/login.php', {
      username,
      password
    }),

  logout: () =>
    post('/auth/logout.php')
}

// ---------------- Portfolio ----------------

export const portfolioApi = {
  categories: (all = false) =>
    get(
      `/portfolio/categories.php${
        all ? '?all=1' : ''
      }`
    ),

  createCategory: (data) =>
    post('/portfolio/categories.php', data),

  updateCategory: (data) =>
    put('/portfolio/categories.php', data),

  deleteCategory: (id) =>
    del(`/portfolio/categories.php?id=${id}`),

  shootsByCategory: (categorySlug) =>
    get(
      `/portfolio/shoots.php?category=${encodeURIComponent(
        categorySlug
      )}`
    ),

  shoot: (categorySlug, shootSlug) =>
    get(
      `/portfolio/shoots.php?category=${encodeURIComponent(
        categorySlug
      )}&shoot=${encodeURIComponent(shootSlug)}`
    ),

  allShoots: () =>
    get('/portfolio/shoots.php?all=1'),

  shootById: (id) =>
    get(`/portfolio/shoots.php?id=${id}`),

  createShoot: (data) =>
    post('/portfolio/shoots.php', data),

  updateShoot: (data) =>
    put('/portfolio/shoots.php', data),

  deleteShoot: (id) =>
    del(`/portfolio/shoots.php?id=${id}`),

  photo: (id) =>
    get(`/portfolio/images.php?id=${id}`),

  imagesForShoot: (shootId) =>
    get(`/portfolio/images.php?shoot_id=${shootId}`),

  updateImage: (data) =>
    put('/portfolio/images.php', data),

  reorderImages: (reorder) =>
    put('/portfolio/images.php', {
      reorder
    }),

  deleteImage: (id) =>
    del(`/portfolio/images.php?id=${id}`),

  uploadImage: (formData) =>
    uploadForm('/portfolio/upload.php', formData)
}

// ---------------- Services ----------------

export const servicesApi = {
  list: (all = false) =>
    get(
      `/services/list.php${
        all ? '?all=1' : ''
      }`
    ),

  create: (data) =>
    post('/services/create.php', data),

  update: (data) =>
    put('/services/update.php', data),

  remove: (id) =>
    del(`/services/delete.php?id=${id}`)
}

// ---------------- Estimator ----------------

export const estimatorApi = {
  config: (all = false) =>
    get(
      `/estimator/config.php${
        all ? '?all=1' : ''
      }`
    ),

  createHour: (data) =>
    post('/estimator/hours.php', data),

  updateHour: (data) =>
    put('/estimator/hours.php', data),

  deleteHour: (id) =>
    del(`/estimator/hours.php?id=${id}`),

  createAddon: (data) =>
    post('/estimator/addons.php', data),

  updateAddon: (data) =>
    put('/estimator/addons.php', data),

  deleteAddon: (id) =>
    del(`/estimator/addons.php?id=${id}`),

  // Supports timeframe filtering.
  leads: (timeframe = 'all') =>
    get(
      `/estimator/leads.php?timeframe=${encodeURIComponent(
        timeframe
      )}`
    ),

  // Update estimator lead status.
  updateLeadStatus: (id, status) =>
    put('/estimator/leads.php', {
      id,
      status
    }),

  saveLead: (data) =>
    post('/estimator/leads.php', data)
}

// ---------------- Bookings ----------------

export const bookingsApi = {
  create: (data) =>
    post('/bookings/create.php', data),

  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()

    return get(
      `/bookings/list.php${
        qs ? `?${qs}` : ''
      }`
    )
  },

  details: (id) =>
    get(`/bookings/details.php?id=${id}`),

  updateStatus: (id, status) =>
    put('/bookings/status.php', {
      id,
      status
    })
}

// ---------------- Global Search ----------------
//
// Uses the existing backend APIs instead of requiring
// a separate search/global.php endpoint.
//
// Bookings already support server-side name/email search.
// Estimator leads are filtered in the frontend.

export const searchApi = {
  global: async (query) => {
    const q = String(query || '').trim().toLowerCase()

    if (!q) {
      return {
        bookings: [],
        leads: []
      }
    }

    const [bookings, leads] = await Promise.all([
      bookingsApi.list({
        search: q
      }),
      estimatorApi.leads('all')
    ])

    const filteredLeads = (leads || []).filter((lead) => {
      const searchableText = [
        lead.name,
        lead.email,
        lead.service_type,
        lead.status
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(q)
    })

    return {
      bookings: bookings || [],
      leads: filteredLeads
    }
  }
}

// ---------------- Contacts ----------------

export const contactsApi = {
  list: (all = false) =>
    get(
      `/contacts/list.php${
        all ? '?all=1' : ''
      }`
    ),

  create: (data) =>
    post('/contacts/create.php', data),

  update: (data) =>
    put('/contacts/update.php', data),

  remove: (id) =>
    del(`/contacts/delete.php?id=${id}`)
}

// ---------------- Dashboard ----------------

export const dashboardApi = {
  stats: () =>
    get('/dashboard/stats.php')
}

export { ApiError }