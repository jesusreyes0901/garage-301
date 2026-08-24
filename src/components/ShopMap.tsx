import type { ShopSettings } from '../types'

function mapsQuery(url: string) {
  const raw = url.trim()
  if (!raw) return ''
  try {
    const u = new URL(raw)
    const q = u.searchParams.get('q') || u.searchParams.get('query') || u.searchParams.get('destination')
    if (q) return q
    const place = u.pathname.match(/\/maps\/place\/([^/]+)/)
    if (place) return decodeURIComponent(place[1].replace(/\+/g, ' '))
    const at = raw.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (at) return `${at[1]},${at[2]}`
  } catch {
    return raw
  }
  return ''
}

export function shopMapSrc(shop: ShopSettings) {
  const lat = shop.lat.trim()
  const lng = shop.lng.trim()
  if (lat && lng) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=16&output=embed`
  }
  const fromUrl = mapsQuery(shop.mapsUrl)
  if (fromUrl) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(fromUrl)}&z=16&output=embed`
  }
  if (shop.address.trim()) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(shop.address.trim())}&z=16&output=embed`
  }
  return ''
}

export function shopDirectionsUrl(shop: ShopSettings) {
  if (shop.mapsUrl.trim()) return shop.mapsUrl.trim()
  const lat = shop.lat.trim()
  const lng = shop.lng.trim()
  if (lat && lng) return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`
  if (shop.address.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address.trim())}`
  }
  return ''
}

export function ShopMap({ shop }: { shop: ShopSettings }) {
  const src = shopMapSrc(shop)
  if (!src) {
    return <p className="empty">Aún no hay una ubicación publicada del taller.</p>
  }
  return (
    <div className="shop-map">
      <iframe
        title={`Mapa de ${shop.name || 'Garaje 301'}`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  )
}
