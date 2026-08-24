import { MapPin, Navigation, Phone } from 'lucide-react'
import { ShopMap, shopDirectionsUrl } from '../../components/ShopMap'
import { useStore } from '../../store'

function waShop(phone: string) {
  const d = phone.replace(/\D/g, '')
  const withMx = d.length === 10 ? `52${d}` : d
  if (!withMx) return ''
  return `https://wa.me/${withMx}?text=${encodeURIComponent('Hola, quiero información de Garaje 301.')}`
}

export function ClienteUbicacion() {
  const { state } = useStore()
  const shop = state.shop
  const maps = shopDirectionsUrl(shop)
  const wa = waShop(shop.whatsapp)

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Ubicación del taller</h2>
          <p>Cómo llegar a {shop.name || 'Garaje 301'}.</p>
        </div>
        {maps && (
          <a className="btn" href={maps} target="_blank" rel="noreferrer">
            <Navigation size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Cómo llegar
          </a>
        )}
      </div>
      <div className="card" style={{ maxWidth: 880 }}>
        <div className="vehicle-card" style={{ marginBottom: 16 }}>
          <div>
            <h3 style={{ marginBottom: 6 }}>
              <MapPin size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              {shop.name || 'Garaje 301'}
            </h3>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              {shop.address || 'El taller aún no ha publicado su dirección.'}
            </p>
            {shop.notes && <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>{shop.notes}</p>}
          </div>
        </div>
        <ShopMap shop={shop} />
        <div className="kpi-row" style={{ marginTop: 16 }}>
          {maps && (
            <a className="btn secondary" href={maps} target="_blank" rel="noreferrer">
              Abrir en Google Maps
            </a>
          )}
          {wa && (
            <a className="btn secondary" href={wa} target="_blank" rel="noreferrer">
              <Phone size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              WhatsApp del taller
            </a>
          )}
        </div>
      </div>
    </>
  )
}
