import { useEffect, useState, type FormEvent } from 'react'
import { MapPin } from 'lucide-react'
import { PhoneField } from '../../components/PhoneField'
import { ShopMap, shopDirectionsUrl } from '../../components/ShopMap'
import { useStore } from '../../store'
import type { ShopSettings } from '../../types'

export function TallerUbicacion() {
  const { state, saveShop } = useStore()
  const [form, setForm] = useState<ShopSettings>(state.shop)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [geoMsg, setGeoMsg] = useState<string | null>(null)

  useEffect(() => {
    setForm(state.shop)
  }, [state.shop])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setOk(false)
    const result = await saveShop(form)
    setBusy(false)
    if (result) {
      setError(result)
      return
    }
    setOk(true)
  }

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setGeoMsg('Este navegador no permite leer la ubicación.')
      return
    }
    setGeoMsg('Obteniendo ubicación…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }))
        setGeoMsg('Coordenadas listas. Guarda para publicarlas.')
      },
      () => setGeoMsg('No se pudo leer la ubicación. Activa el permiso o pega el enlace de Maps.'),
    )
  }

  const mapsOpen = shopDirectionsUrl(form)

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Ubicación del taller</h2>
          <p>Los clientes verán esta dirección y el mapa en su panel. El WhatsApp del taller recibe aviso si un cliente no llega a su cita.</p>
        </div>
      </div>
      <div className="grid two">
        <div className="card">
          <h3>
            <MapPin size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Datos públicos
          </h3>
          <form className="form" onSubmit={onSubmit}>
            <label>
              Nombre del taller
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label>
              Dirección
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Calle, número, colonia, ciudad"
                required
              />
            </label>
            <label>
              Enlace de Google Maps
              <input
                value={form.mapsUrl}
                onChange={(e) => setForm((f) => ({ ...f, mapsUrl: e.target.value }))}
                placeholder="Pega aquí el enlace de Cómo llegar"
              />
            </label>
            <div className="form-row">
              <label>
                Latitud
                <input
                  value={form.lat}
                  onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                  placeholder="19.432608"
                />
              </label>
              <label>
                Longitud
                <input
                  value={form.lng}
                  onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                  placeholder="-99.133209"
                />
              </label>
            </div>
            <button className="btn secondary" type="button" onClick={useDeviceLocation}>
              Usar ubicación de este dispositivo
            </button>
            {geoMsg && <p className="hint">{geoMsg}</p>}
            <label>
              WhatsApp del taller
              <PhoneField value={form.whatsapp} onChange={(whatsapp) => setForm((f) => ({ ...f, whatsapp }))} />
            </label>
            <p className="hint">Ahí te llega el aviso si un cliente no se presenta, además del WhatsApp de tu cuenta de taller.</p>
            <label>
              Indicaciones (entrada, referencias)
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </label>
            {error && <div className="error">{error}</div>}
            {ok && <p className="hint">Ubicación publicada. Los clientes ya pueden verla.</p>}
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar ubicación'}
            </button>
          </form>
        </div>
        <div className="card">
          <h3>Vista previa</h3>
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>
            {form.address || 'Escribe la dirección para ver el mapa.'}
          </p>
          <ShopMap shop={form} />
          {mapsOpen && (
            <a className="btn secondary" href={mapsOpen} target="_blank" rel="noreferrer" style={{ marginTop: 12 }}>
              Abrir en Google Maps
            </a>
          )}
        </div>
      </div>
    </>
  )
}
