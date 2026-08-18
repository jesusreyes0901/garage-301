import { useState, type FormEvent } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import { formatMoney, partById, useStore, vehicleById } from '../../store'

export function ClienteRefacciones() {
  const { state, user, addPartRequest } = useStore()
  const mine = state.vehicles.filter((v) => v.ownerId === user?.id)
  const [vehicleId, setVehicleId] = useState(mine[0]?.id ?? '')
  const [partId, setPartId] = useState(state.parts[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const requests = state.partRequests.filter((r) => r.clientId === user?.id)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!vehicleId || !partId) return
    addPartRequest(vehicleId, partId, qty)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Refacciones</h2>
          <p>Consulta disponibilidad y solicita piezas para tu unidad.</p>
        </div>
      </div>
      <div className="grid two">
        <div className="card">
          <h3>Catálogo</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pieza</th>
                  <th>Disponible</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {state.parts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.name}
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                        {p.sku} · {p.category}
                      </div>
                    </td>
                    <td>{p.stock > 0 ? `${p.stock} pzas` : 'Agotado'}</td>
                    <td>{formatMoney(p.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form className="form" style={{ marginTop: 16 }} onSubmit={onSubmit}>
            <div className="form-row">
              <label>
                Vehículo
                <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  {mine.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Pieza
                <select value={partId} onChange={(e) => setPartId(e.target.value)}>
                  {state.parts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Cantidad
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </label>
            <button className="btn" type="submit">
              Solicitar refacción
            </button>
          </form>
        </div>
        <div className="card">
          <h3>Mis solicitudes</h3>
          {requests.length === 0 && <p className="empty">Todavía no has pedido piezas</p>}
          {requests.map((r) => {
            const p = partById(state.parts, r.partId)
            const v = vehicleById(state.vehicles, r.vehicleId)
            return (
              <div className="vehicle-card" key={r.id} style={{ marginBottom: 12 }}>
                <div>
                  <strong>
                    {p?.name} × {r.qty}
                  </strong>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{v?.plate}</div>
                </div>
                <StatusBadge value={r.status} />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
