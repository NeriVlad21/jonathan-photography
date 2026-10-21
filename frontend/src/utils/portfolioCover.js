/** Pick the portfolio image explicitly marked as the category's cover. */
export function pickPortfolioCover(images) {
  if (!Array.isArray(images)) return null

  const usable = images.filter((image) =>
    image?.image_path && !String(image.image_path).includes('/demo/')
  )

  return usable.find((image) => image.is_cover === true || Number(image.is_cover) === 1)
    || usable[0]
    || null
}
