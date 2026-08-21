import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/StatusBadge'
import { formatDay, useStore, userById, vehicleById } from '../../store'

export function TallerCitas() {
  const { state, confirmAppointment, deleteAppointment } = useStore()
  const sorted = [...state.appointments].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Citas</h2>
          <p>Confirmar crea la orden y queda en el historial del cliente. Cancelar elimina la cita.</p>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Servicio</th>
                <th>Notas</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    No hay citas
                  </td>
                </tr>
              )}
              {sorted.map((a) => {
                const v = vehicleById(state.vehicles, a.vehicleId)
                const c = userById(state.users, a.clientId)
                const orden = state.orders.find((o) => o.id === a.orderId)
                return (
                  <tr key={a.id}>
                    <td>
                      {formatDay(a.date)} {a.time}
                    </td>
                    <td>{c?.name}</td>
                    <td>
                      {v?.plate ?? 'Sin vehículo'}
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                        {v
                          ? `${v.brand} ${v.model} ${v.year}`
                          : a.vehicleBrand
                            ? `${a.vehicleBrand} ${a.vehicleModel} ${a.vehicleYear ?? ''}`.trim()
                            : a.notes || 'Pendiente de unidad'}
                      </div>
                    </td>
                    <td>{a.service}</td>
                    <td>
                      {a.notes || '—'}
                      {a.couponCode ? (
                        <div style={{ color: 'var(--amber)', fontSize: 12, marginTop: 4 }}>
                          Cupón {a.couponCode}
                          {a.discount ? ` · −$${Number(a.discount).toFixed(0)}` : ''}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <StatusBadge value={a.status} />
                      {orden && (
                        <div style={{ marginTop: 6, fontSize: 12 }}>
                          <Link to="/taller/ordenes">{orden.folio}</Link>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {a.status === 'pendiente' && (
                          <button className="btn small" type="button" onClick={() => confirmAppointment(a.id)}>
                            Confirmar
                          </button>
                        )}
                        <button className="btn secondary small" type="button" onClick={() => deleteAppointment(a.id)}>
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
