import { useState, type FormEvent } from 'react'
import { TicketPercent } from 'lucide-react'
import { formatDay, useStore, userById } from '../../store'
import { SERVICES } from '../../types'
import type { Coupon } from '../../types'

const emptyForm = {
  code: '',
  title: '',
  description: '',
  discountPercent: 15,
  serviceType: 'Afinación mayor',
  minAfinaciones: 5,
  active: true,
  clientId: '',
  expiresAt: '',
}

export function TallerCupones() {
  const { state, saveCoupon, deleteCoupon } = useStore()
  const clients = state.users.filter((u) => u.role === 'cliente')
  const [form, setForm] = useState({ ...emptyForm })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onEdit = (c: Coupon) => {
    setEditingId(c.id)
    setForm({
      code: c.code,
      title: c.title,
      description: c.description,
      discountPercent: c.discountPercent,
      serviceType: c.serviceType,
      minAfinaciones: c.minAfinaciones,
      active: c.active,
      clientId: c.clientId || '',
      expiresAt: c.expiresAt || '',
    })
  }

  const reset = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setError(null)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await saveCoupon({
      id: editingId || undefined,
      code: form.code,
      title: form.title,
      description: form.description,
      discountPercent: Number(form.discountPercent) || 0,
      discountAmount: 0,
      serviceType: form.serviceType,
      minAfinaciones: Number(form.minAfinaciones) || 0,
      active: form.active,
      clientId: form.clientId || undefined,
      expiresAt: form.expiresAt || null,
    })
    setBusy(false)
    if (result) {
      setError(result)
      return
    }
    reset()
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Cupones digitales</h2>
          <p>
            Crea cupones con un porcentaje sobre el servicio. El monto en pesos se aplica al entregar el auto en el recibo. El de fidelidad se activa a las 5 afinaciones.
          </p>
        </div>
      </div>
      <div className="grid two">
        <div className="card">
          <h3>{editingId ? 'Editar cupón' : 'Nuevo cupón'}</h3>
          <form className="form" onSubmit={onSubmit}>
            <div className="form-row">
              <label>
                Código
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="AFINACION5"
                  required
                />
              </label>
              <label>
                Servicio
                <select
                  value={form.serviceType}
                  onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}
                >
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Título
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </label>
            <label>
              Descripción
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <label>
              Descuento %
              <input
                type="number"
                min={1}
                max={100}
                value={form.discountPercent}
                onChange={(e) => setForm((f) => ({ ...f, discountPercent: Number(e.target.value) }))}
                required
              />
            </label>
            <div className="form-row">
              <label>
                Mín. afinaciones
                <input
                  type="number"
                  min={0}
                  value={form.minAfinaciones}
                  onChange={(e) => setForm((f) => ({ ...f, minAfinaciones: Number(e.target.value) }))}
                />
              </label>
              <label>
                Vigencia (opcional)
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                />
              </label>
            </div>
            <label>
              Cliente específico (opcional)
              <select
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
              >
                <option value="">Todos los clientes elegibles</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · @{c.username}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              <span>Cupón activo y visible</span>
            </label>
            {error && <div className="error">{error}</div>}
            <div className="row-actions">
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear cupón'}
              </button>
              {editingId && (
                <button className="btn secondary" type="button" onClick={reset}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
        <div className="card">
          <h3>
            <TicketPercent size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Cupones publicados
          </h3>
          {state.coupons.length === 0 && <p className="empty">Aún no hay cupones</p>}
          {state.coupons.map((c) => {
            const client = c.clientId ? userById(state.users, c.clientId) : null
            return (
              <div className="coupon-card" key={c.id}>
                <div className="code">{c.code}</div>
                <strong>{c.title}</strong>
                <p style={{ margin: '6px 0', color: 'var(--muted)', fontSize: 13 }}>{c.description}</p>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {c.discountPercent > 0 && <span>{c.discountPercent}% de descuento · </span>}
                  {c.serviceType}
                  {c.minAfinaciones > 0 && <> · mín. {c.minAfinaciones} afinaciones</>}
                  {c.expiresAt && <> · vence {formatDay(c.expiresAt)}</>}
                  {!c.active && <> · inactivo</>}
                  <br />
                  {client ? `Cliente: ${client.name}` : 'Público / elegibles'}
                </div>
                <div className="row-actions" style={{ marginTop: 10 }}>
                  <button className="btn small" type="button" onClick={() => onEdit(c)}>
                    Editar
                  </button>
                  <button className="btn secondary small" type="button" onClick={() => deleteCoupon(c.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
