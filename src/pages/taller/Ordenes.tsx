import { useState, type FormEvent } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import {
  formatMoney,
  orderExpense,
  orderIncome,
  partById,
  useStore,
  userById,
  vehicleById,
} from '../../store'
import type { OrderStatus, WorkOrder } from '../../types'

const STATUSES: OrderStatus[] = ['en_proceso', 'espera_refaccion', 'entregada']

type MaterialDraft = {
  name: string
  qty: number
  cost: number
  price: number
  partId: string
}

const emptyLine = (): MaterialDraft => ({
  name: '',
  qty: 1,
  cost: 0,
  price: 0,
  partId: '',
})

export function TallerOrdenes() {
  const { state, addOrder, updateOrderStatus, deliverOrder } = useStore()
  const openOrders = state.orders.filter((o) => o.status !== 'entregada')
  const [open, setOpen] = useState(false)
  const [vehicleId, setVehicleId] = useState(state.vehicles[0]?.id ?? '')
  const [mechanic, setMechanic] = useState('Miguel Torres')
  const [description, setDescription] = useState('')
  const [labor, setLabor] = useState(600)
  const [partId, setPartId] = useState(state.parts[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const [delivering, setDelivering] = useState<WorkOrder | null>(null)
  const [lines, setLines] = useState<MaterialDraft[]>([emptyLine()])
  const [busyDeliver, setBusyDeliver] = useState(false)
  const [deliverError, setDeliverError] = useState<string | null>(null)

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
      materials: [],
      discount: 0,
    })
    setDescription('')
    setOpen(false)
  }

  const requestStatus = (order: WorkOrder, status: OrderStatus) => {
    if (status === 'entregada' && order.status !== 'entregada') {
      setLines([emptyLine()])
      setDeliverError(null)
      setDelivering(order)
      return
    }
    updateOrderStatus(order.id, status)
  }

  const onDeliver = async (e: FormEvent) => {
    e.preventDefault()
    if (!delivering) return
    const materials = lines
      .filter((l) => l.name.trim() && (l.cost > 0 || l.price > 0 || l.qty > 0))
      .map((l) => ({
        name: l.name.trim(),
        qty: Math.max(1, Number(l.qty) || 1),
        cost: Math.max(0, Number(l.cost) || 0),
        price: Math.max(0, Number(l.price) || 0),
        partId: l.partId || undefined,
      }))
    setBusyDeliver(true)
    setDeliverError(null)
    const err = await deliverOrder(delivering.id, materials)
    setBusyDeliver(false)
    if (err) {
      setDeliverError(err)
      return
    }
    setDelivering(null)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Órdenes de trabajo</h2>
          <p>Al entregar, la orden se cierra y sale de esta lista. Los gastos ajustan la utilidad del resumen.</p>
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
                  <option value="">Sin refacción</option>
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
        {openOrders.length === 0 && (
          <div className="card">
            <p className="empty">No hay órdenes abiertas. Las entregadas ya no aparecen aquí.</p>
          </div>
        )}
        {openOrders.map((o) => {
          const v = vehicleById(state.vehicles, o.vehicleId)
          const c = userById(state.users, o.clientId)
          const ingreso = orderIncome(o, state.parts)
          const gasto = orderExpense(o, state.parts)
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
                {(o.materials || []).map((m) => (
                  <li key={m.id}>
                    {m.name} × {m.qty} · gasto {formatMoney(m.cost * m.qty)}
                    {m.price > 0 ? ` · cobrado ${formatMoney(m.price * m.qty)}` : ''}
                  </li>
                ))}
              </ul>
              <p>
                Ingreso: <strong>{formatMoney(ingreso)}</strong>
                {' · '}
                Gasto: <strong>{formatMoney(gasto)}</strong>
                {o.discount > 0 && (
                  <>
                    {' · '}
                    Cupón: <strong>−{formatMoney(o.discount)}</strong>
                    {o.couponCode ? ` (${o.couponCode})` : ''}
                  </>
                )}
              </p>
              <div className="row-actions" style={{ marginTop: 12 }}>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    className="btn secondary small"
                    type="button"
                    disabled={s === o.status}
                    onClick={() => requestStatus(o, s)}
                  >
                    {s.replaceAll('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {delivering && (
        <div className="modal-backdrop" role="presentation" onClick={() => !busyDeliver && setDelivering(null)}>
          <div
            className="modal-dialog card"
            role="dialog"
            aria-modal="true"
            style={{ width: 'min(640px, 100%)', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Entregar {delivering.folio}</h2>
            <p style={{ color: 'var(--muted)', marginTop: 0 }}>
              Captura el material o refacción usada: el costo suma a Gastos del resumen y el precio cobrado a
              Ingresos; la utilidad se ajusta sola.
            </p>
            {(delivering.parts.length > 0 || (delivering.materials || []).length > 0) && (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                Ya en la orden:{' '}
                {delivering.parts
                  .map((line) => {
                    const p = partById(state.parts, line.partId)
                    return `${p?.name || line.partId} ×${line.qty}`
                  })
                  .join(', ') || '—'}
              </p>
            )}
            <form className="form" onSubmit={onDeliver}>
              {lines.map((line, idx) => (
                <div key={idx} className="deliver-line">
                  <label>
                    Material / refacción
                    <input
                      list={`parts-${idx}`}
                      value={line.name}
                      onChange={(e) => {
                        const name = e.target.value
                        const match = state.parts.find((p) => p.name === name)
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === idx
                              ? {
                                  ...l,
                                  name,
                                  partId: match?.id || '',
                                  cost: match ? match.cost : l.cost,
                                  price: match ? match.price : l.price,
                                }
                              : l,
                          ),
                        )
                      }}
                      placeholder="Aceite, balatas, filtro…"
                      required
                    />
                    <datalist id={`parts-${idx}`}>
                      {state.parts.map((p) => (
                        <option key={p.id} value={p.name} />
                      ))}
                    </datalist>
                  </label>
                  <div className="form-row" style={{ gridTemplateColumns: '80px 1fr 1fr' }}>
                    <label>
                      Cant.
                      <input
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((l, i) => (i === idx ? { ...l, qty: Number(e.target.value) } : l)),
                          )
                        }
                      />
                    </label>
                    <label>
                      Costo / gasto (MXN)
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.cost}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((l, i) => (i === idx ? { ...l, cost: Number(e.target.value) } : l)),
                          )
                        }
                      />
                    </label>
                    <label>
                      Precio cobrado (MXN)
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.price}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((l, i) => (i === idx ? { ...l, price: Number(e.target.value) } : l)),
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
              <button
                className="btn secondary small"
                type="button"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
              >
                + Otro material
              </button>
              <div className="coupon-discount" style={{ marginTop: 8 }}>
                <div className="coupon-discount-row">
                  <span>Gasto estimado de materiales</span>
                  <strong>
                    {formatMoney(lines.reduce((s, l) => s + (Number(l.cost) || 0) * (Number(l.qty) || 1), 0))}
                  </strong>
                </div>
                <div className="coupon-discount-row">
                  <span>Cobro estimado de materiales</span>
                  <strong>
                    {formatMoney(lines.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.qty) || 1), 0))}
                  </strong>
                </div>
              </div>
              {deliverError && <div className="error">{deliverError}</div>}
              <div className="row-actions">
                <button className="btn" type="submit" disabled={busyDeliver}>
                  {busyDeliver ? 'Guardando…' : 'Confirmar entrega'}
                </button>
                <button
                  className="btn secondary"
                  type="button"
                  disabled={busyDeliver}
                  onClick={() => setDelivering(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
