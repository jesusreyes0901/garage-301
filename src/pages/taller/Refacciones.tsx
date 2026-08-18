import { useState, type FormEvent } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import { formatMoney, partById, useStore, userById, vehicleById } from '../../store'

export function TallerRefacciones() {
  const { state, adjustStock, updatePartRequest, addPart } = useStore()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState(0)
  const [cost, setCost] = useState(0)
  const [stock, setStock] = useState(1)
  const [notice, setNotice] = useState<string | null>(null)
  const agotadas = state.parts.filter((p) => p.stock === 0)

  const onAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addPart({ name, category, price, cost, stock })
    setName('')
    setCategory('')
    setPrice(0)
    setCost(0)
    setStock(1)
    setNotice(`Se agregó la refacción ${name.trim()}.`)
  }

  const bump = (id: string, delta: number) => {
    const msg = adjustStock(id, delta)
    if (msg) setNotice(msg)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Refacciones</h2>
          <p>Agrega piezas por nombre y controla el inventario. Aviso al terminar el stock.</p>
        </div>
      </div>
      {notice && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--amber)' }}>
          <strong>{notice}</strong>
        </div>
      )}
      {agotadas.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--danger)' }}>
          <strong>Refacciones terminadas:</strong>{' '}
          {agotadas.map((p) => p.name).join(', ')}
        </div>
      )}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Agregar refacción</h3>
        <form className="form" onSubmit={onAdd}>
          <div className="form-row">
            <label>
              Nombre de la refacción
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Categoría
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Frenos, filtros..." />
            </label>
          </div>
          <div className="form-row">
            <label>
              Precio de venta (MXN)
              <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </label>
            <label>
              Costo (MXN)
              <input type="number" min={0} value={cost} onChange={(e) => setCost(Number(e.target.value))} />
            </label>
          </div>
          <label>
            Stock inicial
            <input type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} />
          </label>
          <button className="btn" type="submit">
            Guardar refacción
          </button>
        </form>
      </div>
      <div className="grid two">
        <div className="card">
          <h3>Inventario</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Pieza</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {state.parts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.sku}</td>
                    <td>
                      {p.name}
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{p.category}</div>
                    </td>
                    <td>
                      {p.stock === 0 ? (
                        <span className="badge danger">Terminó</span>
                      ) : p.stock <= p.minStock ? (
                        <span className="badge warn">{p.stock}</span>
                      ) : (
                        p.stock
                      )}
                    </td>
                    <td>{formatMoney(p.price)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn secondary small" type="button" onClick={() => bump(p.id, -1)}>
                          −
                        </button>
                        <button className="btn secondary small" type="button" onClick={() => bump(p.id, 1)}>
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Solicitudes de clientes</h3>
          {state.partRequests.length === 0 && <p className="empty">Sin solicitudes</p>}
          {state.partRequests.map((r) => {
            const p = partById(state.parts, r.partId)
            const c = userById(state.users, r.clientId)
            const v = vehicleById(state.vehicles, r.vehicleId)
            return (
              <div key={r.id} className="vehicle-card" style={{ marginBottom: 14 }}>
                <div>
                  <strong>
                    {p?.name} × {r.qty}
                  </strong>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                    {c?.name} · {v?.plate}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <StatusBadge value={r.status} />
                  </div>
                </div>
                <div className="row-actions">
                  <button className="btn small" type="button" onClick={() => updatePartRequest(r.id, 'apartada')}>
                    Apartar
                  </button>
                  <button
                    className="btn secondary small"
                    type="button"
                    onClick={() => {
                      if (p && p.stock - r.qty <= 0) {
                        setNotice(`Se terminó la refacción: ${p.name}`)
                      }
                      updatePartRequest(r.id, 'entregada')
                    }}
                  >
                    Entregar
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
