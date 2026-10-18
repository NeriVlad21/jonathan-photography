// The studio address has one source: siteContent.brand.address ("Studio address"
// in Admin → Website Content). Every public surface reads it through here.
export function getStudioAddress(content) {
  return String(content?.brand?.address || '').replace(/\s+/g, ' ').trim()
}

const MAPS_EMBED_KEY = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY || ''

export function getStudioMapUrls(address) {
  if (!address) return null
  const query = encodeURIComponent(address)
  return {
    // Maps Embed API when a key is configured; otherwise the keyless query embed.
    embed: MAPS_EMBED_KEY
      ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(MAPS_EMBED_KEY)}&q=${query}`
      : `https://maps.google.com/maps?q=${query}&z=15&output=embed`,
    link: `https://www.google.com/maps/search/?api=1&query=${query}`,
  }
}
