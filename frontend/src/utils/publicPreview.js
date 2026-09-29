import { protectionConfig } from '../config/protection.js'

const { previewMaxEdge, previewQuality } = protectionConfig.publicPortfolio

export async function preparePublicPreview(file) {
  if (!file?.type?.startsWith('image/')) return file

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const longestEdge = Math.max(bitmap.width, bitmap.height)
  const scale = Math.min(1, previewMaxEdge / longestEdge)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { alpha: false })
  if (!context) {
    bitmap.close()
    return file
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/webp', previewQuality)
  })

  if (!blob) return file

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'portfolio-preview'
  return new File([blob], `${baseName}-web-preview.webp`, {
    type: 'image/webp',
    lastModified: Date.now()
  })
}
