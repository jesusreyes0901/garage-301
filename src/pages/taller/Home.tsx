import { CalendarDays, ClipboardList, Package, TrendingUp, Users, Wallet, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/StatusBadge'
import {
  formatDay,
  formatMoney,
  orderExpense,
  orderIncome,
  useStore,
  userById,
  vehicleById,
} from '../../store'

export function TallerHome() {
  const { state } = useStore()
  const today = new Date().toISOString().slice(0, 10)
  const clientes = state.users.filter((u) => u.role === 'cliente')
  const citasHoy = state.appointments.filter((a) => a.date === today && a.status !== 'cancelada')
  const enTaller = state.vehicles.filter((v) => v.status === 'en_taller')
  const alertas = state.parts.filter((p) => p.stock <= p.minStock)
  const agotadas = state.parts.filter((p) => p.stock === 0)
  const ordenesAbiertas = state.orders.filter((o) => o.status !== 'entregada')
  const ingresos = state.orders.reduce((sum, o) => sum + orderIncome(o, state.parts), 0)
  const gastos = state.orders.reduce((sum, o) => sum + orderExpense(o, state.parts), 0)
  const utilidad = ingresos - gastos
  const margen = ingresos > 0 ? Math.round((utilidad / ingresos) * 100) : 0

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Panel del taller</h2>
          <p>Operación del día: citas, órdenes, inventario y utilidad del taller.</p>
        </div>
        <div className="row-actions">
          <Link className="btn secondary" to="/taller/clientes">
            Clientes
          </Link>
          <Link className="btn" to="/taller/ordenes">
            Nueva orden
          </Link>
        </div>
      </div>
      <Link className="card" to="/taller/clientes" style={{ display: 'block', marginBottom: 16 }}>
        <div className="vehicle-card">
          <div>
            <h3 style={{ marginBottom: 6 }}>
              <Users size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Clientes
            </h3>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Alta, correo, teléfono, autos y baja del sistema. {clientes.length}{' '}
              {clientes.length === 1 ? 'cliente registrado' : 'clientes registrados'}.
            </p>
          </div>
          <span className="btn small">Abrir</span>
        </div>
      </Link>
      <div className="grid stats">
        <div className="card stat">
          <div className="label">
            <Wallet size={16} /> Ingresos
          </div>
          <div className="value">{formatMoney(ingresos)}</div>
          <div className="hint">Mano de obra, refacciones y cobros de entrega</div>
        </div>
        <div className="card stat">
          <div className="label">
            <Package size={16} /> Gastos
          </div>
          <div className="value">{formatMoney(gastos)}</div>
          <div className="hint">Costos capturados al entregar órdenes</div>
        </div>
        <div className="card stat">
          <div className="label">
            <TrendingUp size={16} /> Utilidad
          </div>
          <div className="value">{margen}%</div>
          <div className="hint">{formatMoney(utilidad)} · se actualiza al entregar</div>
        </div>
        <div className="card stat">
          <div className="label">
            <CalendarDays size={16} /> Citas hoy
          </div>
          <div className="value">{citasHoy.length}</div>
        </div>
      </div>
      <div className="grid stats" style={{ marginTop: 16 }}>
        <div className="card stat">
          <div className="label">
            <ClipboardList size={16} /> Órdenes abiertas
          </div>
          <div className="value">{ordenesAbiertas.length}</div>
        </div>
        <div className="card stat">
          <div className="label">
            <Wrench size={16} /> Vehículos en taller
          </div>
          <div className="value">{enTaller.length}</div>
        </div>
        <div className="card stat">
          <div className="label">
            <Package size={16} /> Alertas de stock
          </div>
          <div className="value">{alertas.length}</div>
          <div className="hint">Por debajo del mínimo</div>
        </div>
        <div className="card stat">
          <div className="label">Refacciones agotadas</div>
          <div className="value">{agotadas.length}</div>
        </div>
      </div>
      {agotadas.length > 0 && (
        <div className="card" style={{ marginTop: 16, borderColor: 'var(--danger)' }}>
          <strong>Se terminaron estas refacciones:</strong>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
            {agotadas.map((p) => p.name).join(', ')}
          </p>
        </div>
      )}
      <div className="grid two" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Agenda de hoy</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {citasHoy.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">
                      Sin citas para hoy
                    </td>
                  </tr>
                )}
                {citasHoy.map((a) => {
                  const v = vehicleById(state.vehicles, a.vehicleId)
                  const c = userById(state.users, a.clientId)
                  return (
                    <tr key={a.id}>
                      <td>{a.time}</td>
                      <td>{c?.name}</td>
                      <td>
                        {v?.brand} {v?.model} · {v?.plate}
                      </td>
                      <td>{a.service}</td>
                      <td>
                        <StatusBadge value={a.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Inventario bajo</h3>
          {alertas.length === 0 && <p className="empty">Stock en niveles adecuados</p>}
          {alertas.map((p) => (
            <div key={p.id} className="vehicle-card" style={{ marginBottom: 12 }}>
              <div>
                <strong>{p.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {p.sku} · mínimo {p.minStock}
                </div>
              </div>
              <span className={`badge ${p.stock === 0 ? 'danger' : 'warn'}`}>
                {p.stock === 0 ? 'Terminó' : `${p.stock} pzas`}
              </span>
            </div>
          ))}
          <h3 style={{ marginTop: 18 }}>Órdenes recientes</h3>
          {ordenesAbiertas.map((o) => {
            const v = vehicleById(state.vehicles, o.vehicleId)
            return (
              <div key={o.id} className="vehicle-card" style={{ marginBottom: 12 }}>
                <div>
                  <strong>{o.folio}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                    {v?.plate} · {formatDay(o.createdAt.slice(0, 10))} · {formatMoney(orderIncome(o, state.parts))}
                  </div>
                </div>
                <StatusBadge value={o.status} />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
