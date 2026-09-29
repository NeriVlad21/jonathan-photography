const integerEnv = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

// Frontend protection flags live here. The backend remains authoritative for
// exported preview dimensions, quality, metadata, and baked watermark mode.
export const protectionConfig = Object.freeze({
  publicPortfolio: Object.freeze({
    previewMaxEdge: integerEnv(import.meta.env.VITE_PUBLIC_PREVIEW_MAX_EDGE, 1600, 600, 2400),
    previewQuality: integerEnv(import.meta.env.VITE_PUBLIC_PREVIEW_QUALITY, 78, 45, 92) / 100,
    blockContextMenu: true,
    blockNativeDrag: true,
    blockSelection: true,
  }),
})
