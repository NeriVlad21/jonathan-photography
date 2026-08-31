// ============================================================
// CENTRAL API CLIENT
// ============================================================
//
// Development:
// Vite proxies /api/* to the PHP backend.
//
// Production:
// VITE_API_URL can point directly to the backend API.
//
// ============================================================

const BASE_URL =
  import.meta.env.VITE_API_URL || '/api'

// Full backend URL used for uploaded assets.
const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost/jonathan-photography/backend'
).replace(/\/$/, '')

// ============================================================
// ASSET URL HELPER
// ============================================================

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

// ============================================================
// CSRF
// ============================================================

let csrfToken = null

export function setCsrfToken(token) {
  csrfToken = token
}

export function getCsrfToken() {
  return csrfToken
}

// ============================================================
// API ERROR
// ============================================================

class ApiError extends Error {
  constructor(message, status, errors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors || {}
  }
}

// ============================================================
// REQUEST
// ============================================================

async function request(
  path,
  {
    method = 'GET',
    body,
    isForm = false
  } = {}
) {
  const headers = {}

  if (!isForm) {
    headers['Content-Type'] = 'application/json'
  }

  if (csrfToken && method !== 'GET') {
    headers['X-CSRF-Token'] = csrfToken
  }

  let res

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body
        ? (
            isForm
              ? body
              : JSON.stringify(body)
          )
        : undefined
    })
  } catch (error) {
    throw new ApiError(
      'Unable to connect to the server.',
      0,
      {
        originalError: error
      }
    )
  }

  let json

  try {
    json = await res.json()
  } catch {
    throw new ApiError(
      'The server returned an unexpected response.',
      res.status
    )
  }

  if (!res.ok || !json.success) {
    throw new ApiError(
      json.message ||
        `Request failed with status ${res.status}.`,
      res.status,
      json.errors
    )
  }

  return json.data
}

// ============================================================
// BASIC HTTP HELPERS
// ============================================================

const get = (path) =>
  request(path)

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

const uploadForm = (
  path,
  formData
) =>
  request(path, {
    method: 'POST',
    body: formData,
    isForm: true
  })

// ============================================================
// NORMALIZE API COLLECTIONS
// ============================================================

function toArray(value, keys = []) {
  if (Array.isArray(value)) {
    return value
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  for (const key of keys) {
    if (Array.isArray(value[key])) {
      return value[key]
    }
  }

  if (Array.isArray(value.data)) {
    return value.data
  }

  if (Array.isArray(value.results)) {
    return value.results
  }

  return []
}

// ============================================================
// AUTH
// ============================================================

export const authApi = {
  check: () =>
    get('/auth/check.php'),

  login: (
    username,
    password
  ) =>
    post('/auth/login.php', {
      username,
      password
    }),

  logout: () =>
    post('/auth/logout.php')
}

// ============================================================
// PORTFOLIO
// ============================================================

export const portfolioApi = {
  categories: (
    all = false
  ) =>
    get(
      `/portfolio/categories.php${
        all ? '?all=1' : ''
      }`
    ),

  createCategory: (
    data
  ) =>
    post(
      '/portfolio/categories.php',
      data
    ),

  updateCategory: (
    data
  ) =>
    put(
      '/portfolio/categories.php',
      data
    ),

  deleteCategory: (
    id
  ) =>
    del(
      `/portfolio/categories.php?id=${id}`
    ),

  shootsByCategory: (
    categorySlug
  ) =>
    get(
      `/portfolio/shoots.php?category=${encodeURIComponent(
        categorySlug
      )}`
    ),

  shoot: (
    categorySlug,
    shootSlug
  ) =>
    get(
      `/portfolio/shoots.php?category=${encodeURIComponent(
        categorySlug
      )}&shoot=${encodeURIComponent(
        shootSlug
      )}`
    ),

  allShoots: () =>
    get(
      '/portfolio/shoots.php?all=1'
    ),

  shootById: (
    id
  ) =>
    get(
      `/portfolio/shoots.php?id=${id}`
    ),

  createShoot: (
    data
  ) =>
    post(
      '/portfolio/shoots.php',
      data
    ),

  updateShoot: (
    data
  ) =>
    put(
      '/portfolio/shoots.php',
      data
    ),

  deleteShoot: (
    id
  ) =>
    del(
      `/portfolio/shoots.php?id=${id}`
    ),

  photo: (
    id
  ) =>
    get(
      `/portfolio/images.php?id=${id}`
    ),

  imagesForShoot: (
    shootId
  ) =>
    get(
      `/portfolio/images.php?shoot_id=${shootId}`
    ),

  updateImage: (
    data
  ) =>
    put(
      '/portfolio/images.php',
      data
    ),

  reorderImages: (
    reorder
  ) =>
    put(
      '/portfolio/images.php',
      {
        reorder
      }
    ),

  deleteImage: (
    id
  ) =>
    del(
      `/portfolio/images.php?id=${id}`
    ),

  uploadImage: (
    formData
  ) =>
    uploadForm(
      '/portfolio/upload.php',
      formData
    )
}

// ============================================================
// SERVICES
// ============================================================

export const servicesApi = {
  list: (
    all = false
  ) =>
    get(
      `/services/list.php${
        all ? '?all=1' : ''
      }`
    ),

  create: (
    data
  ) =>
    post(
      '/services/create.php',
      data
    ),

  update: (
    data
  ) =>
    put(
      '/services/update.php',
      data
    ),

  remove: (
    id
  ) =>
    del(
      `/services/delete.php?id=${id}`
    )
}

// ============================================================
// ESTIMATOR
// ============================================================

export const estimatorApi = {
  // ----------------------------------------------------------
  // Main estimator configuration
  // ----------------------------------------------------------

  config: (
    all = false
  ) =>
    get(
      `/estimator/config.php${
        all ? '?all=1' : ''
      }`
    ),

  // ----------------------------------------------------------
  // SERVICE TYPE PRICING
  // ----------------------------------------------------------

  serviceTypes: (
    all = false
  ) =>
    get(
      `/estimator/service-types.php${
        all ? '?all=1' : ''
      }`
    ),

  createServiceType: (
    data
  ) =>
    post(
      '/estimator/service-types.php',
      data
    ),

  updateServiceType: (
    data
  ) =>
    put(
      '/estimator/service-types.php',
      data
    ),

  deleteServiceType: (
    id
  ) =>
    del(
      `/estimator/service-types.php?id=${id}`
    ),

  // ----------------------------------------------------------
  // HOURS
  // ----------------------------------------------------------

  createHour: (
    data
  ) =>
    post(
      '/estimator/hours.php',
      data
    ),

  updateHour: (
    data
  ) =>
    put(
      '/estimator/hours.php',
      data
    ),

  deleteHour: (
    id
  ) =>
    del(
      `/estimator/hours.php?id=${id}`
    ),

  // ----------------------------------------------------------
  // ADDONS
  // ----------------------------------------------------------

  createAddon: (
    data
  ) =>
    post(
      '/estimator/addons.php',
      data
    ),

  updateAddon: (
    data
  ) =>
    put(
      '/estimator/addons.php',
      data
    ),

  deleteAddon: (
    id
  ) =>
    del(
      `/estimator/addons.php?id=${id}`
    ),

  // ----------------------------------------------------------
  // LEADS
  // ----------------------------------------------------------

  leads: (
    timeframe = 'all'
  ) =>
    get(
      `/estimator/leads.php?timeframe=${encodeURIComponent(
        timeframe
      )}`
    ),

  updateLeadStatus: (
    id,
    status
  ) =>
    put(
      '/estimator/leads.php',
      {
        id,
        status
      }
    ),

  saveLead: (
    data
  ) =>
    post(
      '/estimator/leads.php',
      data
    )
}

// ============================================================
// BOOKINGS
// ============================================================

export const bookingsApi = {
  create: (
    data
  ) =>
    post(
      '/bookings/create.php',
      data
    ),

  list: (
    params = {}
  ) => {
    const qs =
      new URLSearchParams(
        params
      ).toString()

    return get(
      `/bookings/list.php${
        qs ? `?${qs}` : ''
      }`
    )
  },

  details: (
    id
  ) =>
    get(
      `/bookings/details.php?id=${id}`
    ),

  updateStatus: (
    id,
    status
  ) =>
    put(
      '/bookings/status.php',
      {
        id,
        status
      }
    )
}

// ============================================================
// GLOBAL SEARCH
// ============================================================

export const searchApi = {
  global: async (
    query
  ) => {
    const q = String(
      query || ''
    )
      .trim()
      .toLowerCase()

    if (!q) {
      return {
        bookings: [],
        leads: []
      }
    }

    const [
      bookingsResponse,
      leadsResponse
    ] = await Promise.all([
      bookingsApi.list(),
      estimatorApi.leads('all')
    ])

    const allBookings = toArray(
      bookingsResponse,
      [
        'bookings',
        'items',
        'rows'
      ]
    )

    const allLeads = toArray(
      leadsResponse,
      [
        'leads',
        'items',
        'rows'
      ]
    )

    // ========================================================
    // BOOKING SEARCH
    // ========================================================

    const filteredBookings =
      allBookings
        .filter((booking) => {
          const searchableText = [
            booking.name,
            booking.client_name,
            booking.full_name,
            booking.email,
            booking.phone,
            booking.shoot_type,
            booking.service_type,
            booking.reference_code,
            booking.booking_code,
            booking.status
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return searchableText.includes(q)
        })
        .slice(0, 5)

    // ========================================================
    // LEAD SEARCH
    // ========================================================

    const filteredLeads =
      allLeads
        .filter((lead) => {
          const searchableText = [
            lead.name,
            lead.client_name,
            lead.full_name,
            lead.email,
            lead.phone,
            lead.service_type,
            lead.shoot_type,
            lead.reference_code,
            lead.status
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return searchableText.includes(q)
        })
        .slice(0, 5)

    return {
      bookings:
        filteredBookings,

      leads:
        filteredLeads
    }
  }
}

// ============================================================
// CONTACTS
// ============================================================

export const contactsApi = {
  list: (
    all = false
  ) =>
    get(
      `/contacts/list.php${
        all ? '?all=1' : ''
      }`
    ),

  create: (
    data
  ) =>
    post(
      '/contacts/create.php',
      data
    ),

  update: (
    data
  ) =>
    put(
      '/contacts/update.php',
      data
    ),

  remove: (
    id
  ) =>
    del(
      `/contacts/delete.php?id=${id}`
    )
}

// ============================================================
// DASHBOARD
// ============================================================

export const dashboardApi = {
  stats: (
    timeframe = 'all'
  ) =>
    get(
      `/dashboard/stats.php?timeframe=${encodeURIComponent(
        timeframe
      )}`
    )
}

// ============================================================
// EXPORT ERROR CLASS
// ============================================================

export {
  ApiError
}