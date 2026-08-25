import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import {
  downloadOrderReceipt,
  downloadPdfFromBase64,
  formatMoney,
  orderExpense,
  orderIncome,
  partById,
  useStore,
  userById,
  vehicleById,
} from '../../store'
import { orderCharge, type OrderStatus, type WorkOrder } from '../../types'

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
  const { state, addOrder, updateOrderStatus, deliverOrder, deleteOrders } = useStore()
  const openOrders = state.orders.filter((o) => o.status !== 'entregada')
  const delivered = [...state.orders.filter((o) => o.status === 'entregada')].slice(-12).reverse()
  const [open, setOpen] = useState(false)
  const [vehicleId, setVehicleId] = useState(state.vehicles[0]?.id ?? '')
  const [mechanic, setMechanic] = useState('Miguel Torres')
  const [description, setDescription] = useState('')
  const [labor, setLabor] = useState(600)
  const [partId, setPartId] = useState(state.parts[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const [delivering, setDelivering] = useState<WorkOrder | null>(null)
  const [deliverLabor, setDeliverLabor] = useState(0)
  const [deliverCoupon, setDeliverCoupon] = useState('')
  const [deliverPercent, setDeliverPercent] = useState(0)
  const [lines, setLines] = useState<MaterialDraft[]>([emptyLine()])
  const [busyDeliver, setBusyDeliver] = useState(false)
  const [deliverError, setDeliverError] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string[] | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [busyDelete, setBusyDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
      const existing = (order.materials || []).filter((m) => m.name)
      setLines(
        existing.length
          ? existing.map((m) => ({
              name: m.name,
              qty: m.qty,
              cost: m.cost,
              price: m.price,
              partId: m.partId || '',
            }))
          : [emptyLine()],
      )
      setDeliverLabor(order.labor || 0)
      setDeliverCoupon(order.couponCode || '')
      const fromCoupon = state.coupons.find(
        (c) => c.code.toUpperCase() === String(order.couponCode || '').toUpperCase(),
      )
      setDeliverPercent(fromCoupon?.discountPercent || order.discountPercent || 0)
      setDeliverError(null)
      setDelivering(order)
      return
    }
    updateOrderStatus(order.id, status)
  }

  const clientCoupons = delivering
    ? state.coupons.filter(
        (c) =>
          c.active &&
          (!c.clientId || c.clientId === delivering.clientId) &&
          (!c.expiresAt || c.expiresAt >= new Date().toISOString().slice(0, 10)),
      )
    : []
  const preview = orderCharge(deliverLabor, lines, deliverPercent)
  const orderCouponMissing =
    Boolean(delivering?.couponCode) &&
    !clientCoupons.some((c) => c.code.toUpperCase() === delivering!.couponCode!.toUpperCase())

  const onDeliver = async (e: FormEvent) => {
    e.preventDefault()
    if (!delivering) return
    const materials = lines
      .filter((l) => l.name.trim())
      .map((l) => ({
        name: l.name.trim(),
        qty: Math.max(1, Number(l.qty) || 1),
        cost: Math.max(0, Number(l.cost) || 0),
        price: Math.max(0, Number(l.price) || 0),
        partId: l.partId || undefined,
      }))
    setBusyDeliver(true)
    setDeliverError(null)
    const waWin = window.open('', '_blank')
    const result = await deliverOrder(delivering.id, {
      materials,
      labor: deliverLabor,
      couponCode: deliverCoupon || undefined,
      discountPercent: deliverPercent,
    })
    setBusyDeliver(false)
    if (result.error) {
      waWin?.close()
      setDeliverError(result.error)
      return
    }
    if (result.pdfBase64) downloadPdfFromBase64(result.pdfBase64, result.pdfName || `recibo-${delivering.folio}.pdf`)
    if (!result.whatsappSent && result.whatsappUrl) {
      if (waWin) waWin.location.href = result.whatsappUrl
      else window.open(result.whatsappUrl, '_blank')
    } else {
      waWin?.close()
    }
    setDelivering(null)
  }

  const onDelete = async () => {
    if (!removing?.length) return
    setBusyDelete(true)
    setDeleteError(null)
    const err = await deleteOrders(removing)
    setBusyDelete(false)
    if (err) {
      setDeleteError(err)
      return
    }
    setSelected((prev) => prev.filter((id) => !removing.includes(id)))
    setRemoving(null)
  }

  const toggleSelected = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const allSelected = openOrders.length > 0 && openOrders.every((o) => selected.includes(o.id))

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Órdenes de trabajo</h2>
          <p>
            Al entregar el auto captura mano de obra, materiales y cupón. Se genera el recibo en PDF
            (descarga y WhatsApp). Las entregadas quedan abajo para volver a bajar el PDF.
          </p>
        </div>
        <button className="btn" type="button" onClick={() => setOpen((v) => !v)}>
          {open ? 'Cerrar' : 'Nueva orden'}
        </button>
      </div>
      {openOrders.length > 0 && (
        <div className="bulk-bar card">
          <label className="checkbox-row" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => setSelected(allSelected ? [] : openOrders.map((o) => o.id))}
            />
            <span>
              {selected.length > 0
                ? `${selected.length} orden${selected.length === 1 ? '' : 'es'} seleccionada${selected.length === 1 ? '' : 's'}`
                : 'Seleccionar varias órdenes'}
            </span>
          </label>
          <button
            className="btn danger small"
            type="button"
            disabled={selected.length === 0}
            onClick={() => {
              setDeleteError(null)
              setRemoving([...selected])
            }}
          >
            <Trash2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Eliminar seleccionadas
          </button>
        </div>
      )}
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
              <label className="checkbox-row" style={{ marginBottom: 10 }}>
                <input
                  type="checkbox"
                  checked={selected.includes(o.id)}
                  onChange={() => toggleSelected(o.id)}
                />
                <span>Seleccionar esta orden</span>
              </label>
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
              <div className="order-remove">
                <p>Si se confundieron o el cliente no quiere continuar la reparación:</p>
                <button
                  className="btn danger small"
                  type="button"
                  onClick={() => {
                    setDeleteError(null)
                    setRemoving([o.id])
                  }}
                >
                  <Trash2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Eliminar orden
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {delivered.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Entregadas — recibos PDF</h3>
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>
            El cliente también puede descargarlas en Recibos. Si WhatsApp no está configurado, el PDF
            se descarga aquí y se abre wa.me con el desglose.
          </p>
          {pdfError && <div className="error">{pdfError}</div>}
          {delivered.map((o) => {
            const v = vehicleById(state.vehicles, o.vehicleId)
            const c = userById(state.users, o.clientId)
            const charge = orderCharge(o.labor, o.materials || [], o.discountPercent || 0)
            return (
              <div className="vehicle-card" key={o.id} style={{ marginBottom: 12 }}>
                <div>
                  <strong>{o.folio}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                    {v?.plate || 'Sin placa'} · {c?.name || 'Cliente'} · {formatMoney(charge.total)}
                    {o.couponCode ? ` · cupón ${o.couponCode}` : ''}
                  </div>
                </div>
                <button
                  className="btn secondary small"
                  type="button"
                  onClick={() => {
                    setPdfError(null)
                    void downloadOrderReceipt(o.id, o.folio).catch((err) =>
                      setPdfError(err instanceof Error ? err.message : 'No se pudo descargar el PDF.'),
                    )
                  }}
                >
                  Descargar PDF
                </button>
              </div>
            )
          })}
        </div>
      )}

      {delivering && (
        <div className="modal-backdrop" role="presentation" onClick={() => !busyDeliver && setDelivering(null)}>
          <div
            className="modal-dialog card deliver-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Entregar {delivering.folio}</h2>
            <p style={{ color: 'var(--muted)', marginTop: 0 }}>
              Captura mano de obra, materiales y cupón. Al confirmar se descarga el PDF y se manda por WhatsApp al
              cliente si hay API o se abre wa.me.
            </p>
            <form className="form" onSubmit={onDeliver}>
              <div className="form-row">
                <label>
                  Mano de obra (MXN)
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={deliverLabor}
                    onChange={(e) => setDeliverLabor(Number(e.target.value))}
                    required
                  />
                </label>
                <label>
                  Cupón
                  <select
                    value={deliverCoupon}
                    onChange={(e) => {
                      const code = e.target.value
                      setDeliverCoupon(code)
                      const found = clientCoupons.find((c) => c.code.toUpperCase() === code.toUpperCase())
                      if (found) setDeliverPercent(found.discountPercent || 0)
                      else if (
                        delivering.couponCode &&
                        code.toUpperCase() === delivering.couponCode.toUpperCase()
                      ) {
                        setDeliverPercent(delivering.discountPercent || 0)
                      } else setDeliverPercent(0)
                    }}
                  >
                    <option value="">Sin cupón</option>
                    {orderCouponMissing && (
                      <option value={delivering.couponCode}>
                        {delivering.couponCode} · de la cita
                      </option>
                    )}
                    {clientCoupons.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} · {c.discountPercent}% · {c.serviceType}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Porcentaje de descuento
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  value={deliverPercent}
                  onChange={(e) => setDeliverPercent(Number(e.target.value))}
                />
              </label>
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
              {lines.map((line, idx) => (
                <div key={idx} className="deliver-line">
                  <div className="deliver-line-head">
                    <strong>Material {idx + 1}</strong>
                    {lines.length > 1 && (
                      <button
                        className="btn secondary small"
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <label>
                    Nombre del material o refacción
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
                      placeholder="Aceite, balatas, filtro… (opcional si no usaste)"
                    />
                    <datalist id={`parts-${idx}`}>
                      {state.parts.map((p) => (
                        <option key={p.id} value={p.name} />
                      ))}
                    </datalist>
                  </label>
                  <div className="deliver-fields">
                    <label>
                      Cantidad
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
                  <span>Mano de obra</span>
                  <strong>{formatMoney(deliverLabor)}</strong>
                </div>
                <div className="coupon-discount-row">
                  <span>Materiales / refacciones</span>
                  <strong>{formatMoney(preview.materialsTotal)}</strong>
                </div>
                <div className="coupon-discount-row">
                  <span>Subtotal</span>
                  <strong>{formatMoney(preview.subtotal)}</strong>
                </div>
                {preview.discount > 0 && (
                  <div className="coupon-discount-row save">
                    <span>
                      Cupón {deliverCoupon || ''} ({preview.percent}%)
                    </span>
                    <strong>−{formatMoney(preview.discount)}</strong>
                  </div>
                )}
                <div className="coupon-discount-row total">
                  <span>Total a cobrar</span>
                  <strong>{formatMoney(preview.total)}</strong>
                </div>
                <div className="coupon-discount-row">
                  <span>Gasto de materiales (taller)</span>
                  <strong>
                    {formatMoney(lines.reduce((s, l) => s + (Number(l.cost) || 0) * (Number(l.qty) || 1), 0))}
                  </strong>
                </div>
              </div>
              {deliverError && <div className="error">{deliverError}</div>}
              <div className="row-actions">
                <button className="btn" type="submit" disabled={busyDeliver}>
                  {busyDeliver ? 'Generando recibo…' : 'Entregar y generar PDF'}
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

      {removing && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="card modal-dialog">
            <h3>
              {removing.length === 1 ? 'Eliminar orden' : `Eliminar ${removing.length} órdenes`}
            </h3>
            <p style={{ color: 'var(--muted)', margin: 0 }}>
              Se quitan del sistema y no cuentan como entregadas. Las citas ligadas se cancelan.
            </p>
            {deleteError && <div className="error">{deleteError}</div>}
            <div className="row-actions">
              <button className="btn danger" type="button" disabled={busyDelete} onClick={() => void onDelete()}>
                {busyDelete ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
              <button
                className="btn secondary"
                type="button"
                disabled={busyDelete}
                onClick={() => setRemoving(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
