import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { BrandModelFields } from '../components/BrandModelFields'
import { PasswordField } from '../components/PasswordField'
import { PhoneField } from '../components/PhoneField'
import { validEmail, validPhone } from '../countries'
import { compressImage } from '../image'
import { useStore } from '../store'

export function Registro() {
  const { register } = useStore()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [plate, setPlate] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState(2018)
  const [color, setColor] = useState('')
  const [photo, setPhoto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!validEmail(email)) {
      setError('Escribe un correo válido, por ejemplo  nombre@gmail.com')
      return
    }
    const phoneError = validPhone(phone)
    if (phoneError) {
      setError(phoneError)
      return
    }
    setBusy(true)
    setError(null)
    const result = await register({
      name,
      username,
      email,
      phone,
      password,
      vehicle: plate.trim() ? { plate, brand, model, year, color, photo } : undefined,
    })
    setBusy(false)
    if (result?.startsWith('VERIFY|')) {
      const [, mail, mailed] = result.split('|')
      navigate(`/verificar?email=${encodeURIComponent(mail)}&envio=${mailed}`)
      return
    }
    if (result) setError(result)
  }

  return (
    <div className="login-wrap">
      <section className="login-hero">
        <div className="brand brand-hero">
          <BrandLogo height={118} className="lg" />
          <div>
            <h1>Garage 301</h1>
            <p>Portal del cliente</p>
          </div>
        </div>
        <div>
          <h2>Crea tu cuenta para agendar, seguir tu auto y dejar evidencias.</h2>
          <p>El registro es solo para clientes. Puedes dar de alta tu vehículo con foto y placa.</p>
        </div>
      </section>
      <section className="login-panel">
        <div className="card login-card" style={{ width: 'min(520px, 100%)' }}>
          <h2>Registro de cliente</h2>
          <form className="form" onSubmit={onSubmit} autoComplete="off">
            <div className="form-row">
              <label>
                Nombre
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" required />
              </label>
              <label>
                Usuario
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  name="cliente-new-username"
                  required
                />
              </label>
            </div>
            <label>
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                name="cliente-new-email"
                placeholder="nombre@gmail.com"
                required
              />
            </label>
            <label>
              Teléfono con lada
              <PhoneField value={phone} onChange={setPhone} required />
            </label>
            <div className="form-row">
              <label>
                Contraseña
                <PasswordField
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
              <label>
                Confirmar
                <PasswordField
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
            </div>
            <h3 style={{ marginTop: 8 }}>Tu vehículo (opcional)</h3>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: 13 }}>
              La placa y una foto ayudan a identificar la unidad en observaciones.
            </p>
            <div className="form-row">
              <label>
                Placa
                <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="ABC-1234" />
              </label>
              <label>
                Foto del auto / placa
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    try {
                      setPhoto(await compressImage(file, { maxEdge: 900 }))
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'No se pudo cargar la foto.')
                    }
                  }}
                />
              </label>
            </div>
            {photo && (
              <img className="vehicle-thumb" src={photo} alt="Vehículo" style={{ width: 96, height: 96 }} />
            )}
            <BrandModelFields
              brand={brand}
              model={model}
              year={year}
              onBrand={setBrand}
              onModel={setModel}
              onYear={(v) => setYear(Number(v) || year)}
              yearMin={1980}
            />
            <div className="form-row">
              <label>
                Color
                <input value={color} onChange={(e) => setColor(e.target.value)} />
              </label>
            </div>
            {error && <div className="error">{error}</div>}
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Creando cuenta…' : 'Registrarme'}
            </button>
          </form>
          <p style={{ marginTop: 14 }}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
