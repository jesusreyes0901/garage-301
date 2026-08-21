import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/StatusBadge'
import { formatDay, useStore, vehicleById } from '../../store'
import type { Appointment } from '../../types'

export function ClienteCitas() {
  const { state, user } = useStore()
  const mine = state.appointments.filter((a) => a.clientId === user?.id)
  const proximas = mine.filter((a) => a.status === 'pendiente')
  const historial = mine.filter((a) => a.status !== 'pendiente')

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Mis citas</h2>
          <p>Las confirmadas quedan en tu historial y pasan a orden de trabajo.</p>
        </div>
        <Link className="btn" to="/cliente/agendar">
          Agendar otra
        </Link>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Próximas</h3>
        <CitasTable items={proximas} empty="Sin citas pendientes" />
      </div>
      <div className="card">
        <h3>Historial</h3>
        <CitasTable items={historial} empty="Aún no hay citas confirmadas" />
      </div>
    </>
  )
}

function CitasTable({ items, empty }: { items: Appointment[]; empty: string }) {
  const { state } = useStore()
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Vehículo</th>
            <th>Servicio</th>
            <th>Notas</th>
            <th>Estado</th>
            <th>Orden</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="empty">
                {empty}
              </td>
            </tr>
          )}
          {items.map((a) => {
            const v = vehicleById(state.vehicles, a.vehicleId)
            const orden = state.orders.find((o) => o.id === a.orderId)
            return (
              <tr key={a.id}>
                <td>
                  {formatDay(a.date)} {a.time}
                </td>
                <td>
                  {v?.plate ?? 'Sin vehículo'}
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                    {v
                      ? `${v.brand} ${v.model} ${v.year}`
                      : a.vehicleBrand
                        ? `${a.vehicleBrand} ${a.vehicleModel} ${a.vehicleYear ?? ''}`.trim()
                        : 'Se indicará en el taller'}
                  </div>
                </td>
                <td>{a.service}</td>
                <td>{a.notes || '—'}</td>
                <td>
                  <StatusBadge value={a.status} />
                </td>
                <td>{orden?.folio ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
