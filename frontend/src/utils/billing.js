// Mirrors backend/helpers/billing.php so admin forms can preview figures.
// The server recalculates and validates every amount; these are previews only.

export const FEE_RESPONSIBILITY_LABELS = {
  CLIENT: 'Client pays platform fee',
  STUDIO: 'Studio absorbs platform fee'
}

// Whole pesos, halves rounded up (₱5,000.50 → ₱5,001).
export function wholePeso(amount) {
  return Math.floor(Number(Number(amount).toFixed(6)) + 0.5)
}

export function previewFinancials(serviceTotal, responsibility, settings = {}) {
  const total = Number(serviceTotal) || 0
  const rate = total > Number(settings.threshold ?? 10000) ? Number(settings.high_rate ?? 0.01) : Number(settings.low_rate ?? 0.005)
  const feeAmount = wholePeso(total * rate)
  const clientTotal = total + (responsibility === 'CLIENT' ? feeAmount : 0)
  return { feeRate: rate, feeAmount, clientTotal, requiredDownPayment: wholePeso(clientTotal * 0.5) }
}

export function formatRate(rate) {
  return `${Number((Number(rate || 0) * 100).toFixed(2))}%`
}
