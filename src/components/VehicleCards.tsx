import { useState } from 'react'
import { Lightbox } from './Lightbox'
import { StatusBadge } from './StatusBadge'
import { formatDate, userById, vehicleById, useStore } from '../store'
import type { Observation, Vehicle } from '../types'

export function PlateTag({ plate }: { plate: string }) {
  return <span className="plate-tag">{plate}</span>
}

export function VehicleThumb({ vehicle, size = 64 }: { vehicle: Vehicle; size?: number }) {
  if (vehicle.photo) {
    return (
      <img
        className="vehicle-thumb"
        src={vehicle.photo}
        alt={vehicle.plate}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div className="vehicle-thumb fallback" style={{ width: size, height: size }}>
      {vehicle.plate.slice(0, 3)}
    </div>
  )
}

export function ObservationCard({
  observation,
  onOpenVehicle,
}: {
  observation: Observation
  onOpenVehicle: (vehicleId: string) => void
}) {
  const { state } = useStore()
  const [preview, setPreview] = useState<string | null>(null)
  const v = vehicleById(state.vehicles, observation.vehicleId)
  const a = userById(state.users, observation.authorId)
  if (!v) return null

  return (
    <article className="obs-card">
      <button className="obs-identity" type="button" onClick={() => onOpenVehicle(v.id)}>
        <VehicleThumb vehicle={v} />
        <div>
          <PlateTag plate={v.plate} />
          <div className="obs-car">
            {v.brand} {v.model} {v.year}
          </div>
          <div className="meta">
            {a?.name} · {formatDate(observation.createdAt)}
          </div>
        </div>
      </button>
      {observation.text && <p className="obs-text">{observation.text}</p>}
      {observation.photos.length > 0 && (
        <div className="photo-grid">
          {observation.photos.map((src, i) => (
            <button key={i} type="button" className="photo-btn" onClick={() => setPreview(src)}>
              <img src={src} alt={`Evidencia ${i + 1} de ${v.plate}`} />
            </button>
          ))}
        </div>
      )}
      <button className="btn secondary small" type="button" onClick={() => onOpenVehicle(v.id)}>
        Ver detalles de {v.plate}
      </button>
      <Lightbox src={preview} onClose={() => setPreview(null)} />
    </article>
  )
}

export function VehicleDetails({
  vehicleId,
  onClose,
}: {
  vehicleId: string
  onClose: () => void
}) {
  const { state } = useStore()
  const [preview, setPreview] = useState<string | null>(null)
  const v = vehicleById(state.vehicles, vehicleId)
  if (!v) return null
  const owner = userById(state.users, v.ownerId)
  const obs = state.observations
    .filter((o) => o.vehicleId === v.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="vehicle-hero">
          {v.photo ? (
            <img src={v.photo} alt={v.plate} onClick={() => setPreview(v.photo)} />
          ) : (
            <div className="vehicle-hero-empty">Sin foto del vehículo</div>
          )}
          <div>
            <PlateTag plate={v.plate} />
            <h3>
              {v.brand} {v.model} {v.year}
            </h3>
            <p>
              {v.color} · {v.mileage.toLocaleString('es-MX')} km
              {v.vin ? ` · VIN ${v.vin}` : ''}
            </p>
            <p>{owner?.name}</p>
            <StatusBadge value={v.status} />
          </div>
        </div>
        <h3>Observaciones y evidencias</h3>
        {obs.length === 0 && <p className="empty">Sin observaciones</p>}
        {obs.map((o) => (
          <div key={o.id} className="obs" style={{ marginBottom: 14 }}>
            <div className="meta">
              {userById(state.users, o.authorId)?.name} · {formatDate(o.createdAt)}
            </div>
            <div>{o.text}</div>
            <div className="photo-grid">
              {o.photos.map((src, i) => (
                <button key={i} type="button" className="photo-btn" onClick={() => setPreview(src)}>
                  <img src={src} alt={`Evidencia ${v.plate}`} />
                </button>
              ))}
            </div>
          </div>
        ))}
        <button className="btn secondary" type="button" onClick={onClose}>
          Cerrar
        </button>
        <Lightbox src={preview} onClose={() => setPreview(null)} />
      </aside>
    </div>
  )
}
