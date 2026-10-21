// The studio address has one source: siteContent.brand.address ("Studio address"
// in Admin → Website Content). Every public surface reads it through here.
export function getStudioAddress(content) {
  return String(content?.brand?.address || '').replace(/\s+/g, ' ').trim()
}

import { safeGoogleMapsLink } from './mapLink.js'

const MAPS_EMBED_KEY = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY || ''

// mapLink: optional Google Maps link saved in Website Content. It opens the
// studio's own Maps listing; the embed still uses the pin or the address because
// share links cannot be embedded.
export function getStudioMapUrls(address, latitude, longitude, mapLink) {
  if (!address) return null
  const lat = Number(latitude)
  const lng = Number(longitude)
  const hasPin = String(latitude ?? '').trim() !== '' && String(longitude ?? '').trim() !== ''
    && Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  const query = encodeURIComponent(hasPin ? `${lat},${lng}` : address)
  const zoom = hasPin ? 18 : 15
  return {
    // Maps Embed API when a key is configured; otherwise the keyless query embed.
    embed: MAPS_EMBED_KEY
      ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(MAPS_EMBED_KEY)}&q=${query}`
      : `https://maps.google.com/maps?q=${query}&z=${zoom}&output=embed`,
    link: safeGoogleMapsLink(mapLink) || `https://www.google.com/maps/search/?api=1&query=${query}`,
  }
}
