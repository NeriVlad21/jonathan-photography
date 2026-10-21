const RETRYABLE_UPLOAD_STATUSES = new Set([429, 503])
const MAX_RETRY_DELAY_MS = 10_000

export function shouldRetryUpload(status, attempt, maxAttempts) {
  return RETRYABLE_UPLOAD_STATUSES.has(Number(status)) && attempt < maxAttempts
}

export function uploadRetryDelay(response, attempt) {
  const retryAfter = response?.headers?.get?.('Retry-After')
  if (retryAfter) {
    const seconds = Number(retryAfter)
    const dateDelay = Number.isFinite(seconds)
      ? seconds * 1000
      : Date.parse(retryAfter) - Date.now()
    if (Number.isFinite(dateDelay) && dateDelay > 0) {
      return Math.min(dateDelay, MAX_RETRY_DELAY_MS)
    }
  }

  return Math.min(800 * (2 ** Math.max(0, attempt - 1)), 5_000)
}
