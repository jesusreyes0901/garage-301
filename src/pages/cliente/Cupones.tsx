import { useMemo } from 'react'
import { TicketPercent } from 'lucide-react'
import { formatDay, formatMoney, useStore } from '../../store'
import type { Coupon } from '../../types'

export function countAfinaciones(
  appointments: { clientId: string; service: string; status: string; orderId?: string }[],
  orders: { clientId: string; description: string; status: string }[],
  clientId: string,
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
  return Math.max(0, appts - linked) + ords
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
    () => (user ? countAfinaciones(state.appointments, state.orders, user.id) : 0),
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
          <p>Descuentos digitales del taller. Con 5 o más afinaciones desbloqueas beneficios.</p>
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
              : `Te faltan ${5 - afinaciones} para el cupón de fidelidad`}
          </div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Cupones disponibles</h3>
        {visible.length === 0 && (
          <p className="empty">Aún no tienes cupones activos. Sigue agendando afinaciones.</p>
        )}
        {visible.map((c) => (
          <CouponView key={c.id} coupon={c} />
        ))}
      </div>
      {locked.length > 0 && (
        <div className="card">
          <h3>Por desbloquear</h3>
          {locked.map((c) => (
            <div className="coupon-card" key={c.id} style={{ opacity: 0.7 }}>
              <div className="code">{c.code}</div>
              <strong>{c.title}</strong>
              <p style={{ margin: '6px 0', color: 'var(--muted)', fontSize: 13 }}>
                Necesitas {c.minAfinaciones} afinaciones (llevas {afinaciones}).
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function CouponView({ coupon: c }: { coupon: Coupon }) {
  return (
    <div className="coupon-card">
      <div className="code">{c.code}</div>
      <strong>{c.title}</strong>
      <p style={{ margin: '6px 0', color: 'var(--muted)', fontSize: 13 }}>{c.description}</p>
      <div style={{ fontSize: 13 }}>
        {c.discountPercent > 0 && <strong>{c.discountPercent}% de descuento</strong>}
        {c.discountPercent > 0 && c.discountAmount > 0 && ' · '}
        {c.discountAmount > 0 && <strong>{formatMoney(c.discountAmount)} de descuento</strong>}
        <span style={{ color: 'var(--muted)' }}> en {c.serviceType}</span>
        {c.expiresAt && (
          <span style={{ color: 'var(--muted)' }}> · vigente hasta {formatDay(c.expiresAt)}</span>
        )}
      </div>
    </div>
  )
}
