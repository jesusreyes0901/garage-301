import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TicketPercent } from 'lucide-react'
import { formatDay, formatMoney, useStore } from '../../store'
import { couponDiscountBreakdown, type Coupon } from '../../types'

export function countAfinaciones(
  appointments: { clientId: string; service: string; status: string; orderId?: string }[],
  orders: { clientId: string; description: string; status: string }[],
  clientId: string,
  loyaltyBaseline = 0,
) {
  const linked = appointments.filter(
    (a) =>
      a.clientId === clientId &&
      a.orderId &&
      /afinaci/i.test(a.service) &&
      ['confirmada', 'en_proceso', 'completada'].includes(a.status),
  ).length
  const appts = appointments.filter(
    (a) =>
      a.clientId === clientId &&
      /afinaci/i.test(a.service) &&
      ['confirmada', 'en_proceso', 'completada'].includes(a.status),
  ).length
  const ords = orders.filter(
    (o) =>
      o.clientId === clientId &&
      /afinaci/i.test(o.description) &&
      ['lista', 'entregada', 'en_proceso'].includes(o.status),
  ).length
  const total = Math.max(0, appts - linked) + ords
  return Math.max(0, total - (loyaltyBaseline || 0))
}

function couponVisible(c: Coupon, clientId: string, afinaciones: number, today: string) {
  if (!c.active) return false
  if (c.expiresAt && c.expiresAt < today) return false
  if (c.clientId && c.clientId !== clientId) return false
  if (c.minAfinaciones > afinaciones) return false
  return true
}

export function ClienteCupones() {
  const { state, user } = useStore()
  const today = new Date().toISOString().slice(0, 10)
  const afinaciones = useMemo(
    () =>
      user
        ? countAfinaciones(state.appointments, state.orders, user.id, user.loyaltyBaseline || 0)
        : 0,
    [state.appointments, state.orders, user],
  )
  const visible = useMemo(
    () =>
      user
        ? state.coupons.filter((c) => couponVisible(c, user.id, afinaciones, today))
        : [],
    [state.coupons, user, afinaciones, today],
  )
  const locked = useMemo(
    () =>
      state.coupons.filter(
        (c) =>
          c.active &&
          !c.clientId &&
          c.minAfinaciones > afinaciones &&
          (!c.expiresAt || c.expiresAt >= today),
      ),
    [state.coupons, afinaciones, today],
  )

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Mis cupones</h2>
          <p>Usa un cupón para agendar con descuento. Al usarlo, el contador de 5 afinaciones se reinicia.</p>
        </div>
      </div>
      <div className="grid stats" style={{ marginBottom: 16 }}>
        <div className="card stat">
          <div className="label">
            <TicketPercent size={16} /> Afinaciones acumuladas
          </div>
          <div className="value">{afinaciones}</div>
          <div className="hint">
            {afinaciones >= 5
              ? 'Ya calificas para descuento en afinación'
              : `Te faltan ${5 - afinaciones} en este ciclo (tras usar el cupón el contador vuelve a 0)`}
          </div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Cupones disponibles</h3>
        {visible.length === 0 && (
          <p className="empty">Aún no tienes cupones activos. Sigue agendando afinaciones.</p>
        )}
        {visible.map((c) => (
          <CouponView key={c.id} coupon={c} applied showUse />
        ))}
      </div>
      {locked.length > 0 && (
        <div className="card">
          <h3>Por desbloquear</h3>
          {locked.map((c) => (
            <CouponView
              key={c.id}
              coupon={c}
              applied={false}
              lockedHint={`Necesitas ${c.minAfinaciones} afinaciones (llevas ${afinaciones}).`}
            />
          ))}
        </div>
      )}
    </>
  )
}

export function CouponView({
  coupon: c,
  applied,
  lockedHint,
  showUse = false,
}: {
  coupon: Coupon
  applied: boolean
  lockedHint?: string
  showUse?: boolean
}) {
  const breakdown = couponDiscountBreakdown(c)
  return (
    <div className="coupon-card" style={applied ? undefined : { opacity: 0.75 }}>
      <div className="code">{c.code}</div>
      <strong>{c.title}</strong>
      <p style={{ margin: '6px 0', color: 'var(--muted)', fontSize: 13 }}>{c.description}</p>
      {lockedHint && <p style={{ margin: '6px 0', color: 'var(--muted)', fontSize: 13 }}>{lockedHint}</p>}
      {applied && (
        <div className="coupon-discount">
          <div className="coupon-discount-row">
            <span>Precio de {c.serviceType}</span>
            <span>{formatMoney(breakdown.base)}</span>
          </div>
          <div className="coupon-discount-row save">
            <span>
              Descuento aplicado
              {c.discountPercent > 0 ? ` (${c.discountPercent}%)` : ''}
              {c.discountAmount > 0 ? ` + ${formatMoney(c.discountAmount)}` : ''}
            </span>
            <span>−{formatMoney(breakdown.discount)}</span>
          </div>
          <div className="coupon-discount-row total">
            <span>Total con cupón</span>
            <strong>{formatMoney(breakdown.final)}</strong>
          </div>
        </div>
      )}
      {!applied && (
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          {c.discountPercent > 0 && <span>{c.discountPercent}% </span>}
          {c.discountAmount > 0 && <span>{formatMoney(c.discountAmount)} </span>}
          en {c.serviceType}
        </div>
      )}
      {c.expiresAt && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
          Vigente hasta {formatDay(c.expiresAt)}
        </div>
      )}
      {showUse && applied && (
        <Link
          className="btn"
          to={`/cliente/agendar?cupon=${encodeURIComponent(c.code)}`}
          style={{ marginTop: 12, display: 'inline-flex' }}
        >
          Usar cupón
        </Link>
      )}
    </div>
  )
}
