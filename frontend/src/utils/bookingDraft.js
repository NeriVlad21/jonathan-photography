const BOOKING_DRAFT_KEY = 'jp_booking_request_draft'

const DRAFT_FIELDS = [
  'name',
  'email',
  'phone',
  'facebook',
  'preferred_date',
  'preferred_time',
  'location',
  'guest_count',
  'message'
]

export function readBookingDraft() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(BOOKING_DRAFT_KEY) || '{}')
    return Object.fromEntries(DRAFT_FIELDS.map((field) => [field, typeof saved[field] === 'string' ? saved[field] : '']))
  } catch {
    return Object.fromEntries(DRAFT_FIELDS.map((field) => [field, '']))
  }
}

export function saveBookingDraft(form) {
  try {
    sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify(Object.fromEntries(DRAFT_FIELDS.map((field) => [field, String(form[field] || '')])))
    )
  } catch {
    // Storage may be unavailable in privacy-restricted browsers. The live form still works.
  }
}

export function clearBookingDraft() {
  try {
    sessionStorage.removeItem(BOOKING_DRAFT_KEY)
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}
