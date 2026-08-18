import { useState, type FormEvent } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import { formatMoney, orderIncome, partById, useStore, userById, vehicleById } from '../../store'
import type { OrderStatus } from '../../types'

const STATUSES: OrderStatus[] = ['en_proceso', 'espera_refaccion', 'entregada']

export function TallerOrdenes() {
  const { state, addOrder, updateOrderStatus } = useStore()
  const [open, setOpen] = useState(false)
  const [vehicleId, setVehicleId] = useState(state.vehicles[0]?.id ?? '')
  const [mechanic, setMechanic] = useState('Miguel Torres')
  const [description, setDescription] = useState('')
  const [labor, setLabor] = useState(600)
  const [partId, setPartId] = useState(state.parts[0]?.id ?? '')
  const [qty, setQty] = useState(1)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const v = vehicleById(state.vehicles, vehicleId)
    if (!v) return
    addOrder({
      vehicleId,
      clientId: v.ownerId,
      mechanic,
      description,
      status: 'en_proceso',
      labor,
      parts: partId ? [{ partId, qty }] : [],
    })
    setDescription('')
    setOpen(false)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Órdenes de trabajo</h2>
          <p>Folios, mano de obra, refacciones y avance de cada unidad.</p>
        </div>
        <button className="btn" type="button" onClick={() => setOpen((v) => !v)}>
          {open ? 'Cerrar' : 'Nueva orden'}
        </button>
      </div>
      {open && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form className="form" onSubmit={onSubmit}>
            <div className="form-row">
              <label>
                Vehículo
                <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  {state.vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} · {v.brand} {v.model}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Mecánico
                <input value={mechanic} onChange={(e) => setMechanic(e.target.value)} required />
              </label>
            </div>
            <label>
              Descripción
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
            </label>
            <div className="form-row">
              <label>
                Mano de obra (MXN)
                <input
                  type="number"
                  min={0}
                  value={labor}
                  onChange={(e) => setLabor(Number(e.target.value))}
                />
              </label>
              <label>
                Refacción inicial
                <select value={partId} onChange={(e) => setPartId(e.target.value)}>
                  {state.parts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatMoney(p.price)})
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
              Crear orden
            </button>
          </form>
        </div>
      )}
      <div className="grid two">
        {state.orders.map((o) => {
          const v = vehicleById(state.vehicles, o.vehicleId)
          const c = userById(state.users, o.clientId)
          return (
            <div className="card" key={o.id}>
              <div className="vehicle-card">
                <div>
                  <div className="plate">{o.folio}</div>
                  <strong>
                    {v?.brand} {v?.model} · {v?.plate}
                  </strong>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{c?.name}</div>
                </div>
                <StatusBadge value={o.status} />
              </div>
              <p style={{ margin: '12px 0', color: 'var(--muted)' }}>{o.description}</p>
              <p style={{ fontSize: 13 }}>
                Mecánico: <strong>{o.mechanic}</strong>
              </p>
              <ul style={{ color: 'var(--muted)', fontSize: 13 }}>
                {o.parts.map((line) => {
                  const p = partById(state.parts, line.partId)
                  return (
                    <li key={line.partId}>
                      {p?.name} × {line.qty}
                    </li>
                  )
                })}
              </ul>
              <p>
                Total estimado: <strong>{formatMoney(orderIncome(o, state.parts))}</strong>
              </p>
              <div className="row-actions" style={{ marginTop: 12 }}>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    className="btn secondary small"
                    type="button"
                    disabled={s === o.status}
                    onClick={() => updateOrderStatus(o.id, s)}
                  >
                    {s.replaceAll('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
