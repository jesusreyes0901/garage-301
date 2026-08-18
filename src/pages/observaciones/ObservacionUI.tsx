import { useState, type ChangeEvent, type FormEvent } from 'react'
import { compressImage } from '../../image'
import { ObservationCard, VehicleDetails } from '../../components/VehicleCards'
import { formatDate, useStore, vehicleById } from '../../store'

export function ObservationComposer({
  vehicles,
  title,
}: {
  vehicles: { id: string; plate: string; brand: string; model: string }[]
  title: string
}) {
  const { addObservation } = useStore()
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '')
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const selected = vehicles.find((v) => v.id === vehicleId)

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    setError(null)
    try {
      const next = await Promise.all(files.slice(0, 4 - photos.length).map((f) => compressImage(f)))
      setPhotos((prev) => [...prev, ...next].slice(0, 4))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las fotos.')
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!vehicleId) return
    if (!text.trim() && photos.length === 0) {
      setError('Escribe una nota o adjunta al menos una foto.')
      return
    }
    addObservation(vehicleId, text.trim(), photos)
    setText('')
    setPhotos([])
    setError(null)
  }

  return (
    <div className="card">
      <h3>{title}</h3>
      {vehicles.length === 0 ? (
        <p className="empty">No hay vehículos para comentar.</p>
      ) : (
        <form className="form" onSubmit={onSubmit}>
          <label>
            Vehículo (placa)
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} · {v.brand} {v.model}
                </option>
              ))}
            </select>
          </label>
          {selected && (
            <div className="hint-plate">
              Evidencia para la placa <strong>{selected.plate}</strong>
            </div>
          )}
          <label>
            Observación
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Hallazgos, ruido, piezas, instrucciones..."
            />
          </label>
          <label>
            Evidencia fotográfica (hasta 4)
            <input type="file" accept="image/*" multiple onChange={onFiles} />
          </label>
          {photos.length > 0 && (
            <div className="photo-grid">
              {photos.map((src, i) => (
                <div key={i} className="photo-preview">
                  <img src={src} alt="" />
                  <button type="button" className="btn secondary small" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
          {error && <div className="error">{error}</div>}
          <button className="btn" type="submit">
            Publicar
          </button>
        </form>
      )}
    </div>
  )
}

export function ObservationFeed({ vehicleIds }: { vehicleIds?: string[] }) {
  const { state } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)
  const list = [...state.observations]
    .filter((o) => !vehicleIds || vehicleIds.includes(o.vehicleId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="card">
      <h3>Bitácora</h3>
      <div className="timeline">
        {list.length === 0 && <p className="empty">Sin observaciones aún</p>}
        {list.map((o) => (
          <ObservationCard key={o.id} observation={o} onOpenVehicle={setOpenId} />
        ))}
      </div>
      {openId && <VehicleDetails vehicleId={openId} onClose={() => setOpenId(null)} />}
      <p className="meta" style={{ marginTop: 8 }}>
        {list[0] && vehicleById(state.vehicles, list[0].vehicleId)
          ? `Última nota: ${formatDate(list[0].createdAt)}`
          : ''}
      </p>
    </div>
  )
}
