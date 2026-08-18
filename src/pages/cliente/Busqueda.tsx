import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { ObservationCard, PlateTag, VehicleDetails, VehicleThumb } from '../../components/VehicleCards'
import { compressImage } from '../../image'
import { formatDay, partById, useStore } from '../../store'

export function ClienteBusqueda() {
  const { state, user, addVehicle } = useStore()
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [plate, setPlate] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState(2020)
  const [color, setColor] = useState('')
  const [photo, setPhoto] = useState('')
  const mine = state.vehicles.filter((v) => v.ownerId === user?.id)

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return mine
    return mine.filter((v) =>
      [v.plate, v.brand, v.model, v.vin, String(v.year)].join(' ').toLowerCase().includes(s),
    )
  }, [mine, q])

  const selected = matches.find((v) => v.id === selectedId) ?? matches[0]
  const relatedAppointments = selected
    ? state.appointments.filter((a) => a.vehicleId === selected.id)
    : []
  const relatedOrders = selected ? state.orders.filter((o) => o.vehicleId === selected.id) : []
  const relatedObs = selected ? state.observations.filter((o) => o.vehicleId === selected.id) : []

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhoto(await compressImage(file, { maxEdge: 900 }))
  }

  const onAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!user || !plate.trim()) return
    addVehicle({
      plate,
      brand,
      model,
      year,
      color,
      vin: '',
      ownerId: user.id,
      mileage: 0,
      status: 'activo',
      photo,
    })
    setPlate('')
    setBrand('')
    setModel('')
    setPhoto('')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Búsqueda de vehículo</h2>
          <p>Toca la foto o la placa para ver detalles, evidencias y el historial.</p>
        </div>
        <div className="search">
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej. ABC-1234 o Sentra"
          />
        </div>
      </div>
      <div className="grid two">
        <div className="card">
          <h3>Resultados</h3>
          {matches.length === 0 && <p className="empty">No se encontró el vehículo</p>}
          {matches.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`result-btn${selected?.id === v.id ? ' active' : ''}`}
              onClick={() => setSelectedId(v.id)}
            >
              <div className="vehicle-card">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <VehicleThumb vehicle={v} size={72} />
                  <div>
                    <PlateTag plate={v.plate} />
                    <div>
                      <strong>
                        {v.brand} {v.model} {v.year}
                      </strong>
                    </div>
                  </div>
                </div>
                <StatusBadge value={v.status} />
              </div>
            </button>
          ))}
          <h3 style={{ marginTop: 18 }}>Registrar vehículo</h3>
          <form className="form" onSubmit={onAdd}>
            <div className="form-row">
              <label>
                Placa
                <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} required />
              </label>
              <label>
                Foto
                <input type="file" accept="image/*" onChange={onPhoto} />
              </label>
            </div>
            <div className="form-row">
              <label>
                Marca
                <input value={brand} onChange={(e) => setBrand(e.target.value)} required />
              </label>
              <label>
                Modelo
                <input value={model} onChange={(e) => setModel(e.target.value)} required />
              </label>
            </div>
            <div className="form-row">
              <label>
                Año
                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
              </label>
              <label>
                Color
                <input value={color} onChange={(e) => setColor(e.target.value)} />
              </label>
            </div>
            <button className="btn" type="submit">
              Guardar unidad
            </button>
          </form>
        </div>
        <div className="card">
          <h3>Historial {selected ? `· ${selected.plate}` : ''}</h3>
          {!selected && <p className="empty">Selecciona o busca una unidad</p>}
          {selected && (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <VehicleThumb vehicle={selected} size={96} />
                <div>
                  <PlateTag plate={selected.plate} />
                  <p>
                    {selected.brand} {selected.model} {selected.year}
                  </p>
                  <button className="btn small" type="button" onClick={() => setOpenId(selected.id)}>
                    Ver foto, placa y evidencias
                  </button>
                </div>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Citas</p>
              {relatedAppointments.map((a) => (
                <div key={a.id} style={{ marginBottom: 8 }}>
                  {formatDay(a.date)} {a.time} — {a.service} <StatusBadge value={a.status} />
                </div>
              ))}
              <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 16 }}>Órdenes</p>
              {relatedOrders.length === 0 && <p className="empty">Sin órdenes</p>}
              {relatedOrders.map((o) => (
                <div key={o.id} style={{ marginBottom: 8 }}>
                  {o.folio}: {o.description}{' '}
                  {o.parts.map((line) => partById(state.parts, line.partId)?.name).join(', ')}
                  <div>
                    <StatusBadge value={o.status} />
                  </div>
                </div>
              ))}
              <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 16 }}>Observaciones</p>
              {relatedObs.map((o) => (
                <ObservationCard key={o.id} observation={o} onOpenVehicle={setOpenId} />
              ))}
            </>
          )}
        </div>
      </div>
      {openId && <VehicleDetails vehicleId={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
