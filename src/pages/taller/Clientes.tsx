import { useMemo, useState, type FormEvent } from 'react'
import { CarFront, Mail, Phone, Search, Trash2, Users } from 'lucide-react'
import { BrandModelFields } from '../../components/BrandModelFields'
import { PasswordField } from '../../components/PasswordField'
import { PhoneField } from '../../components/PhoneField'
import { PlateTag, VehicleThumb } from '../../components/VehicleCards'
import { validEmail, validPhone } from '../../countries'
import { compressImage } from '../../image'
import { useStore } from '../../store'
import type { User, Vehicle } from '../../types'

const emptyClient = {
  name: '',
  username: '',
  email: '',
  phone: '',
  address: '',
  password: '',
}

const emptyVehicle = {
  plate: '',
  brand: '',
  model: '',
  year: String(new Date().getFullYear()),
  color: '',
  vin: '',
  mileage: '0',
  photo: '',
}

type ClientForm = typeof emptyClient
type VehicleForm = typeof emptyVehicle
type ConfirmTarget =
  | { type: 'client'; id: string; label: string }
  | { type: 'vehicle'; id: string; label: string }

export function TallerClientes() {
  const { state, saveClient, deleteClient, saveVehicle, deleteVehicle } = useStore()
  const [q, setQ] = useState('')
  const [clientForm, setClientForm] = useState<ClientForm>({ ...emptyClient })
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>({ ...emptyVehicle })
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
  const [vehicleOwnerId, setVehicleOwnerId] = useState<string>('')
  const [includeVehicle, setIncludeVehicle] = useState(true)
  const [panel, setPanel] = useState<'client' | 'vehicle'>('client')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmTarget | null>(null)

  const clients = useMemo(() => {
    const s = q.trim().toLowerCase()
    return state.users
      .filter((u) => u.role === 'cliente')
      .filter((u) => {
        if (!s) return true
        const cars = state.vehicles
          .filter((v) => v.ownerId === u.id)
          .map((v) => `${v.plate} ${v.brand} ${v.model}`)
          .join(' ')
        return [u.name, u.username, u.email, u.phone, u.address, cars].join(' ').toLowerCase().includes(s)
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [q, state.users, state.vehicles])

  const carsOf = (clientId: string) => state.vehicles.filter((v) => v.ownerId === clientId)

  const resetClient = () => {
    setEditingClientId(null)
    setClientForm({ ...emptyClient })
    setVehicleForm({ ...emptyVehicle })
    setIncludeVehicle(true)
    setError(null)
    setPanel('client')
  }

  const resetVehicle = () => {
    setEditingVehicleId(null)
    setVehicleOwnerId('')
    setVehicleForm({ ...emptyVehicle })
    setError(null)
    setPanel('client')
  }

  const onEditClient = (c: User) => {
    setPanel('client')
    setEditingClientId(c.id)
    setIncludeVehicle(false)
    setClientForm({
      name: c.name,
      username: c.username,
      email: c.email,
      phone: c.phone,
      address: c.address,
      password: '',
    })
    setError(null)
    setMessage(null)
  }

  const onAddVehicle = (ownerId: string) => {
    setPanel('vehicle')
    setEditingVehicleId(null)
    setVehicleOwnerId(ownerId)
    setVehicleForm({ ...emptyVehicle })
    setError(null)
    setMessage(null)
  }

  const onEditVehicle = (v: Vehicle) => {
    setPanel('vehicle')
    setEditingVehicleId(v.id)
    setVehicleOwnerId(v.ownerId)
    setVehicleForm({
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      year: String(v.year),
      color: v.color,
      vin: v.vin,
      mileage: String(v.mileage),
      photo: v.photo,
    })
    setError(null)
    setMessage(null)
  }

  const onSubmitClient = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!validEmail(clientForm.email)) {
      setError('Escribe un correo válido, por ejemplo  nombre@gmail.com')
      return
    }
    const phoneError = validPhone(clientForm.phone)
    if (phoneError) {
      setError(phoneError)
      return
    }
    if (!editingClientId && !clientForm.password) {
      setError('Define una contraseña para que el cliente pueda entrar.')
      return
    }
    const wantsCar = !editingClientId && includeVehicle && vehicleForm.plate.trim()
    if (wantsCar && (!vehicleForm.brand.trim() || !vehicleForm.model.trim())) {
      setError('Si das de alta el auto, indica marca y modelo.')
      return
    }
    setBusy(true)
    const result = await saveClient({
      id: editingClientId || undefined,
      name: clientForm.name.trim(),
      username: clientForm.username.trim(),
      email: clientForm.email.trim(),
      phone: clientForm.phone.trim(),
      address: clientForm.address.trim(),
      password: clientForm.password || undefined,
      vehicle:
        wantsCar
          ? {
              plate: vehicleForm.plate,
              brand: vehicleForm.brand,
              model: vehicleForm.model,
              year: Number(vehicleForm.year) || new Date().getFullYear(),
              color: vehicleForm.color,
              photo: vehicleForm.photo,
              vin: vehicleForm.vin,
              mileage: Number(vehicleForm.mileage) || 0,
            }
          : undefined,
    })
    setBusy(false)
    if (result) {
      setError(result)
      return
    }
    setMessage(editingClientId ? 'Datos del cliente actualizados.' : 'Cliente dado de alta.')
    setEditingClientId(null)
    setClientForm({ ...emptyClient })
    setVehicleForm({ ...emptyVehicle })
    setIncludeVehicle(true)
    setPanel('client')
  }

  const onSubmitVehicle = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!vehicleOwnerId) {
      setError('Elige el cliente dueño del vehículo.')
      return
    }
    if (!vehicleForm.plate.trim()) {
      setError('La placa es obligatoria.')
      return
    }
    if (!vehicleForm.brand.trim() || !vehicleForm.model.trim()) {
      setError('Indica marca y modelo.')
      return
    }
    setBusy(true)
    const current = editingVehicleId ? state.vehicles.find((v) => v.id === editingVehicleId) : undefined
    const result = await saveVehicle({
      id: editingVehicleId || undefined,
      plate: vehicleForm.plate,
      brand: vehicleForm.brand,
      model: vehicleForm.model,
      year: Number(vehicleForm.year) || new Date().getFullYear(),
      color: vehicleForm.color,
      vin: vehicleForm.vin,
      ownerId: vehicleOwnerId,
      mileage: Number(vehicleForm.mileage) || 0,
      status: current?.status ?? 'activo',
      photo: vehicleForm.photo,
    })
    setBusy(false)
    if (result) {
      setError(result)
      return
    }
    setMessage(editingVehicleId ? 'Vehículo actualizado.' : 'Vehículo agregado.')
    setEditingVehicleId(null)
    setVehicleOwnerId('')
    setVehicleForm({ ...emptyVehicle })
    setPanel('client')
  }

  const onConfirmDelete = async () => {
    if (!confirm) return
    setBusy(true)
    setError(null)
    const result =
      confirm.type === 'client' ? await deleteClient(confirm.id) : await deleteVehicle(confirm.id)
    setBusy(false)
    if (result) {
      setError(result)
      setConfirm(null)
      return
    }
    setMessage(confirm.type === 'client' ? 'Cliente sacado del sistema.' : 'Vehículo eliminado.')
    if (confirm.type === 'client' && editingClientId === confirm.id) resetClient()
    if (confirm.type === 'vehicle' && editingVehicleId === confirm.id) resetVehicle()
    setConfirm(null)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Clientes</h2>
          <p>
            Correo, teléfono, dirección y vehículos. Si alguien ya no quiere el servicio, quítalo del
            sistema desde aquí.
          </p>
        </div>
        <div className="search">
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nombre, correo, teléfono o placa…"
          />
        </div>
      </div>
      {message && <div className="ok-msg" style={{ marginBottom: 16 }}>{message}</div>}

      <div className="grid two">
        <div className="card">
          {panel === 'client' ? (
            <>
              <h3>{editingClientId ? 'Editar cliente' : 'Nuevo cliente'}</h3>
              <form className="form" onSubmit={onSubmitClient} autoComplete="off">
                <div className="form-row">
                  <label>
                    Nombre
                    <input
                      value={clientForm.name}
                      onChange={(e) => setClientForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Usuario
                    <input
                      value={clientForm.username}
                      onChange={(e) => setClientForm((f) => ({ ...f, username: e.target.value }))}
                      required
                    />
                  </label>
                </div>
                <label>
                  Correo electrónico
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="nombre@gmail.com"
                    required
                  />
                </label>
                <label>
                  Teléfono con lada
                  <PhoneField
                    value={clientForm.phone}
                    onChange={(phone) => setClientForm((f) => ({ ...f, phone }))}
                    required
                  />
                </label>
                <label>
                  Dirección
                  <input
                    value={clientForm.address}
                    onChange={(e) => setClientForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </label>
                <label>
                  {editingClientId ? 'Nueva contraseña (opcional)' : 'Contraseña de acceso'}
                  <PasswordField
                    value={clientForm.password}
                    onChange={(e) => setClientForm((f) => ({ ...f, password: e.target.value }))}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres, letras y números"
                    required={!editingClientId}
                  />
                </label>
                {!editingClientId && (
                  <>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={includeVehicle}
                        onChange={(e) => setIncludeVehicle(e.target.checked)}
                      />
                      <span>Dar de alta también su vehículo</span>
                    </label>
                    {includeVehicle && (
                      <VehicleFields
                        form={vehicleForm}
                        setForm={setVehicleForm}
                        setError={setError}
                      />
                    )}
                  </>
                )}
                {error && <div className="error">{error}</div>}
                <div className="row-actions">
                  <button className="btn" type="submit" disabled={busy}>
                    {busy ? 'Guardando…' : editingClientId ? 'Guardar cambios' : 'Agregar cliente'}
                  </button>
                  {editingClientId && (
                    <button className="btn secondary" type="button" onClick={resetClient}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : (
            <>
              <h3>{editingVehicleId ? 'Editar vehículo' : 'Agregar vehículo'}</h3>
              <form className="form" onSubmit={onSubmitVehicle} autoComplete="off">
                <label>
                  Cliente
                  <select
                    value={vehicleOwnerId}
                    onChange={(e) => setVehicleOwnerId(e.target.value)}
                    required
                  >
                    <option value="">Elige un cliente</option>
                    {state.users
                      .filter((u) => u.role === 'cliente')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · {c.email}
                        </option>
                      ))}
                  </select>
                </label>
                <VehicleFields form={vehicleForm} setForm={setVehicleForm} setError={setError} />
                {error && <div className="error">{error}</div>}
                <div className="row-actions">
                  <button className="btn" type="submit" disabled={busy}>
                    {busy ? 'Guardando…' : editingVehicleId ? 'Guardar vehículo' : 'Agregar vehículo'}
                  </button>
                  <button className="btn secondary" type="button" onClick={resetVehicle}>
                    Cancelar
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="card">
          <h3>
            <Users size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
          </h3>
          {clients.length === 0 && <p className="empty">No hay coincidencias</p>}
          {clients.map((c) => {
            const cars = carsOf(c.id)
            return (
              <div className="client-card" key={c.id}>
                <div className="client-card-head">
                  {c.avatar ? (
                    <img className="avatar" src={c.avatar} alt="" />
                  ) : (
                    <div className="avatar fallback">{c.name.slice(0, 1)}</div>
                  )}
                  <div>
                    <strong>{c.name}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>@{c.username}</div>
                  </div>
                </div>
                <div className="client-meta">
                  <span>
                    <Mail size={14} /> {c.email || 'Sin correo'}
                  </span>
                  <span>
                    <Phone size={14} /> {c.phone || 'Sin teléfono'}
                  </span>
                  {c.address ? <span>{c.address}</span> : null}
                </div>
                <div className="client-cars">
                  {cars.length === 0 && (
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>Sin vehículos</p>
                  )}
                  {cars.map((v) => (
                    <div className="client-car-row" key={v.id}>
                      <VehicleThumb vehicle={v} size={44} />
                      <div>
                        <PlateTag plate={v.plate} />
                        <div style={{ fontSize: 13 }}>
                          {v.brand} {v.model} {v.year}
                          {v.color ? ` · ${v.color}` : ''}
                        </div>
                      </div>
                      <div className="row-actions">
                        <button className="btn secondary small" type="button" onClick={() => onEditVehicle(v)}>
                          Editar
                        </button>
                        <button
                          className="btn danger small"
                          type="button"
                          onClick={() =>
                            setConfirm({
                              type: 'vehicle',
                              id: v.id,
                              label: `${v.plate} · ${v.brand} ${v.model}`,
                            })
                          }
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="row-actions" style={{ marginTop: 12 }}>
                  <button className="btn small" type="button" onClick={() => onEditClient(c)}>
                    Editar datos
                  </button>
                  <button className="btn secondary small" type="button" onClick={() => onAddVehicle(c.id)}>
                    <CarFront size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Auto
                  </button>
                  <button
                    className="btn danger small"
                    type="button"
                    onClick={() =>
                      setConfirm({ type: 'client', id: c.id, label: `${c.name} · ${c.email}` })
                    }
                  >
                    <Trash2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Quitar del sistema
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {confirm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="card modal-dialog">
            <h3>{confirm.type === 'client' ? 'Sacar del sistema' : 'Quitar vehículo'}</h3>
            <p style={{ color: 'var(--muted)', margin: 0 }}>
              {confirm.type === 'client'
                ? `Se eliminará la cuenta de ${confirm.label}, sus vehículos, citas y órdenes. Esta acción no se puede deshacer.`
                : `Se eliminará ${confirm.label} del inventario de unidades.`}
            </p>
            <div className="row-actions">
              <button className="btn danger" type="button" disabled={busy} onClick={() => void onConfirmDelete()}>
                {busy ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
              <button className="btn secondary" type="button" disabled={busy} onClick={() => setConfirm(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function VehicleFields({
  form,
  setForm,
  setError,
}: {
  form: VehicleForm
  setForm: (updater: (prev: VehicleForm) => VehicleForm) => void
  setError: (v: string | null) => void
}) {
  return (
    <>
      <div className="form-row">
        <label>
          Placa
          <input
            value={form.plate}
            onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value.toUpperCase() }))}
            placeholder="ABC-1234"
          />
        </label>
        <label>
          Color
          <input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
        </label>
      </div>
      <BrandModelFields
        brand={form.brand}
        model={form.model}
        year={form.year}
        onBrand={(v) => setForm((f) => ({ ...f, brand: v }))}
        onModel={(v) => setForm((f) => ({ ...f, model: v }))}
        onYear={(v) => setForm((f) => ({ ...f, year: v }))}
        yearMin={1980}
      />
      <div className="form-row">
        <label>
          VIN (opcional)
          <input value={form.vin} onChange={(e) => setForm((f) => ({ ...f, vin: e.target.value }))} />
        </label>
        <label>
          Kilometraje
          <input
            type="number"
            min={0}
            value={form.mileage}
            onChange={(e) => setForm((f) => ({ ...f, mileage: e.target.value }))}
          />
        </label>
      </div>
      <label>
        Foto del vehículo
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            try {
              const photo = await compressImage(file, { maxEdge: 900 })
              setForm((f) => ({ ...f, photo }))
            } catch (err) {
              setError(err instanceof Error ? err.message : 'No se pudo cargar la foto.')
            }
          }}
        />
      </label>
      {form.photo && (
        <img className="vehicle-thumb" src={form.photo} alt="Vehículo" style={{ width: 96, height: 96 }} />
      )}
    </>
  )
}
