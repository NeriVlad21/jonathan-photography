const BOOKING_ESTIMATE_KEY = 'jonathan-photography:booking-estimate'

export function isBookingEstimate(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    value.service &&
    Number(value.service.id) > 0 &&
    value.hours &&
    Number(value.hours.id) > 0 &&
    Number(value.total) > 0
  )
}

export function saveBookingEstimate(estimate) {
  if (!isBookingEstimate(estimate)) return false

  try {
    sessionStorage.setItem(BOOKING_ESTIMATE_KEY, JSON.stringify(estimate))
    return true
  } catch {
    return false
  }
}

export function readBookingEstimate() {
  try {
    const value = JSON.parse(sessionStorage.getItem(BOOKING_ESTIMATE_KEY) || 'null')
    return isBookingEstimate(value) ? value : null
  } catch {
    return null
  }
}

export function clearBookingEstimate() {
  try {
    sessionStorage.removeItem(BOOKING_ESTIMATE_KEY)
  } catch {
    // Storage can be unavailable in strict privacy modes. There is nothing to clear.
  }
}
