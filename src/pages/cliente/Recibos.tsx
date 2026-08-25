import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { downloadOrderReceipt, formatMoney, useStore, vehicleById } from '../../store'
import { orderCharge } from '../../types'

export function ClienteRecibos() {
  const { state, user } = useStore()
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const mine = [...state.orders.filter((o) => o.clientId === user?.id && o.status === 'entregada')].reverse()

  const download = async (id: string, folio: string) => {
    setError(null)
    setBusyId(id)
    try {
      await downloadOrderReceipt(id, folio)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar el PDF.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Recibos</h2>
          <p>
            Cuando el taller entrega tu auto, aquí puedes descargar el PDF con mano de obra, materiales y
            el descuento del cupón.
          </p>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {mine.length === 0 && (
        <div className="card">
          <p className="empty">Aún no hay entregas. El recibo aparece cuando el taller marca tu auto como entregado.</p>
        </div>
      )}
      {mine.map((o) => {
        const v = vehicleById(state.vehicles, o.vehicleId)
        const charge = orderCharge(o.labor, o.materials || [], o.discountPercent || 0)
        return (
          <div className="card" key={o.id} style={{ marginBottom: 16 }}>
            <div className="vehicle-card">
              <div>
                <div className="plate">{o.folio}</div>
                <strong>
                  {v ? `${v.brand} ${v.model} · ${v.plate}` : 'Vehículo'}
                </strong>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{o.description}</div>
              </div>
              <button
                className="btn"
                type="button"
                disabled={busyId === o.id}
                onClick={() => void download(o.id, o.folio)}
              >
                <FileDown size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                {busyId === o.id ? 'Descargando…' : 'Descargar PDF'}
              </button>
            </div>
            <div className="coupon-discount" style={{ marginTop: 14 }}>
              <div className="coupon-discount-row">
                <span>Mano de obra</span>
                <strong>{formatMoney(o.labor)}</strong>
              </div>
              {(o.materials || [])
                .filter((m) => m.name)
                .map((m) => (
                  <div className="coupon-discount-row" key={m.id || `${m.name}-${m.qty}`}>
                    <span>
                      {m.name} ×{m.qty}
                    </span>
                    <strong>{formatMoney((m.price || 0) * (m.qty || 1))}</strong>
                  </div>
                ))}
              <div className="coupon-discount-row">
                <span>Subtotal</span>
                <strong>{formatMoney(charge.subtotal)}</strong>
              </div>
              {charge.discount > 0 && (
                <div className="coupon-discount-row save">
                  <span>
                    Cupón {o.couponCode || ''} ({charge.percent}%)
                  </span>
                  <strong>−{formatMoney(charge.discount)}</strong>
                </div>
              )}
              <div className="coupon-discount-row total">
                <span>Total</span>
                <strong>{formatMoney(charge.total)}</strong>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
