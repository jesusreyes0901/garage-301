import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { formatDay, useStore, userById, vehicleById } from '../../store'

export function TallerCitas() {
  const { state, confirmAppointment, deleteAppointment, deleteAppointments } = useStore()
  const sorted = [...state.appointments].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const [selected, setSelected] = useState<string[]>([])
  const [removing, setRemoving] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allSelected = sorted.length > 0 && sorted.every((a) => selected.includes(a.id))

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const onDelete = async () => {
    if (!removing?.length) return
    setBusy(true)
    setError(null)
    const err = await deleteAppointments(removing)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    setSelected((prev) => prev.filter((id) => !removing.includes(id)))
    setRemoving(null)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Citas</h2>
          <p>
            Confirmar crea la orden. Marca varias citas para cancelarlas juntas, sin ir una por una.
          </p>
        </div>
      </div>
      {sorted.length > 0 && (
        <div className="bulk-bar card">
          <label className="checkbox-row" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => setSelected(allSelected ? [] : sorted.map((a) => a.id))}
            />
            <span>
              {selected.length > 0
                ? `${selected.length} cita${selected.length === 1 ? '' : 's'} seleccionada${selected.length === 1 ? '' : 's'}`
                : 'Seleccionar varias citas'}
            </span>
          </label>
          <button
            className="btn danger small"
            type="button"
            disabled={selected.length === 0}
            onClick={() => {
              setError(null)
              setRemoving([...selected])
            }}
          >
            <Trash2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Eliminar seleccionadas
          </button>
        </div>
      )}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
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
                  <td colSpan={8} className="empty">
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
                      <input
                        type="checkbox"
                        checked={selected.includes(a.id)}
                        onChange={() => toggle(a.id)}
                        aria-label={`Seleccionar cita de ${c?.name || a.date}`}
                      />
                    </td>
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
      {removing && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="card modal-dialog">
            <h3>{removing.length === 1 ? 'Eliminar cita' : `Eliminar ${removing.length} citas`}</h3>
            <p style={{ color: 'var(--muted)', margin: 0 }}>
              Se quitan de la agenda. El horario queda libre otra vez.
            </p>
            {error && <div className="error">{error}</div>}
            <div className="row-actions">
              <button className="btn danger" type="button" disabled={busy} onClick={() => void onDelete()}>
                {busy ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
              <button className="btn secondary" type="button" disabled={busy} onClick={() => setRemoving(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
