import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { PlateTag, VehicleDetails, VehicleThumb } from '../../components/VehicleCards'
import { compressImage } from '../../image'
import { useStore, userById } from '../../store'
import type { VehicleStatus } from '../../types'

export function TallerVehiculos() {
  const { state, updateVehicleStatus, setVehiclePhoto } = useStore()
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return state.vehicles.filter((v) => {
      const owner = userById(state.users, v.ownerId)?.name ?? ''
      return [v.plate, v.brand, v.model, v.vin, String(v.year), owner].join(' ').toLowerCase().includes(s)
    })
  }, [q, state.users, state.vehicles])

  const statuses: VehicleStatus[] = ['activo', 'en_taller', 'entregado']

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Vehículos</h2>
          <p>Foto + placa para identificar la unidad. Entra al detalle con un clic.</p>
        </div>
        <div className="search">
          <Search size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar placas, VIN, marca..." />
        </div>
      </div>
      <div className="grid three">
        {list.map((v) => {
          const owner = userById(state.users, v.ownerId)
          return (
            <div className="card" key={v.id}>
              <button type="button" className="obs-identity" onClick={() => setOpenId(v.id)}>
                <VehicleThumb vehicle={v} size={72} />
                <div>
                  <PlateTag plate={v.plate} />
                  <strong>
                    {v.brand} {v.model} {v.year}
                  </strong>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                    {v.color} · {v.mileage.toLocaleString('es-MX')} km
                  </div>
                  <div style={{ marginTop: 6 }}>{owner?.name}</div>
                </div>
              </button>
              <div style={{ marginTop: 10 }}>
                <StatusBadge value={v.status} />
              </div>
              <label style={{ display: 'block', marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
                Foto del vehículo
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    setVehiclePhoto(v.id, await compressImage(file, { maxEdge: 900 }))
                  }}
                />
              </label>
              <div className="row-actions" style={{ marginTop: 14 }}>
                {statuses.map((s) => (
                  <button
                    key={s}
                    className="btn secondary small"
                    type="button"
                    onClick={() => updateVehicleStatus(v.id, s)}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {list.length === 0 && <p className="empty">No hay coincidencias</p>}
      {openId && <VehicleDetails vehicleId={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
