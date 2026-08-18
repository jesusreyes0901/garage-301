import { CalendarPlus, MessageSquare, Package, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/StatusBadge'
import { formatDay, useStore, vehicleById } from '../../store'

export function ClienteHome() {
  const { state, user } = useStore()
  const myVehicles = state.vehicles.filter((v) => v.ownerId === user?.id)
  const myAppointments = state.appointments.filter((a) => a.clientId === user?.id)
  const myObs = state.observations.filter((o) => myVehicles.some((v) => v.id === o.vehicleId))
  const myParts = state.partRequests.filter((r) => r.clientId === user?.id)

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Hola, {user?.name.split(' ')[0]}</h2>
          <p>Agenda, sigue tus unidades y consulta refacciones desde tu panel.</p>
        </div>
        <Link className="btn" to="/cliente/agendar">
          Agendar cita
        </Link>
      </div>
      <div className="grid stats">
        <div className="card stat">
          <div className="label">Mis vehículos</div>
          <div className="value">{myVehicles.length}</div>
        </div>
        <div className="card stat">
          <div className="label">Citas</div>
          <div className="value">{myAppointments.length}</div>
        </div>
        <div className="card stat">
          <div className="label">Solicitudes de piezas</div>
          <div className="value">{myParts.length}</div>
        </div>
        <div className="card stat">
          <div className="label">Observaciones</div>
          <div className="value">{myObs.length}</div>
        </div>
      </div>
      <div className="grid two" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Mis vehículos</h3>
          {myVehicles.map((v) => (
            <div className="vehicle-card" key={v.id} style={{ marginBottom: 14 }}>
              <div>
                <div className="plate">{v.plate}</div>
                <strong>
                  {v.brand} {v.model} {v.year}
                </strong>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{v.mileage.toLocaleString('es-MX')} km</div>
              </div>
              <StatusBadge value={v.status} />
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Próximas citas</h3>
          {myAppointments.length === 0 && <p className="empty">Aún no tienes citas</p>}
          {myAppointments.map((a) => {
            const v = vehicleById(state.vehicles, a.vehicleId)
            return (
              <div className="vehicle-card" key={a.id} style={{ marginBottom: 12 }}>
                <div>
                  <strong>{a.service}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                    {formatDay(a.date)} {a.time} · {v?.plate}
                  </div>
                </div>
                <StatusBadge value={a.status} />
              </div>
            )
          })}
          <div className="kpi-row" style={{ marginTop: 16 }}>
            <Link className="btn secondary" to="/cliente/refacciones">
              <Package size={16} style={{ verticalAlign: 'middle' }} /> Refacciones
            </Link>
            <Link className="btn secondary" to="/cliente/observaciones">
              <MessageSquare size={16} style={{ verticalAlign: 'middle' }} /> Observaciones
            </Link>
            <Link className="btn secondary" to="/cliente/vehiculo">
              <Search size={16} style={{ verticalAlign: 'middle' }} /> Buscar
            </Link>
            <Link className="btn secondary" to="/cliente/agendar">
              <CalendarPlus size={16} style={{ verticalAlign: 'middle' }} /> Agendar
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
