const TEMPORARY_IMAGE_COUNT = 10

const setForCategory = (slug = '') => {
  const value = slug.toLowerCase()

  if (value.includes('wedding')) return 'weddings'
  if (value.includes('engagement')) return 'engagement'
  if (value.includes('portrait')) return 'portraits'
  if (value.includes('event')) return 'events'

  return 'editorial'
}

export function temporaryPhotosForCategory(categorySlug, categoryName = categorySlug) {
  const set = setForCategory(categorySlug)

  return Array.from({ length: TEMPORARY_IMAGE_COUNT }, (_, index) => ({
    id: `temporary-${categorySlug}-${index + 1}`,
    image_path: `/demo/portfolio/${set}/${String(index + 1).padStart(2, '0')}.jpg`,
    title: `${categoryName} preview ${index + 1}`,
    categoryName,
    categorySlug,
    isTemporary: true,
    orientation: [0, 3, 5, 8].includes(index) ? 'landscape' : 'portrait',
  }))
}
