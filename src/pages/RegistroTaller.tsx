import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { PasswordField } from '../components/PasswordField'
import { useStore } from '../store'

export function RegistroTaller() {
  const { register } = useStore()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
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
      role: 'taller',
    })
    setBusy(false)
    if (result) setError(result)
  }

  return (
    <div className="login-wrap">
      <section className="login-hero">
        <div className="brand">
          <div className="brand-mark">
            <Wrench size={22} />
          </div>
          <div>
            <h1>Garage 301</h1>
            <p>Alta de personal</p>
          </div>
        </div>
        <div>
          <h2>Crea la cuenta del taller para operar citas, órdenes e inventario.</h2>
          <p>Este registro es interno. Las cuentas de cliente se crean en el portal público.</p>
        </div>
      </section>
      <section className="login-panel">
        <div className="card login-card">
          <h2>Registro del taller</h2>
          <form className="form" onSubmit={onSubmit} autoComplete="off">
            <div className="form-row">
              <label>
                Nombre
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  required
                />
              </label>
              <label>
                Usuario
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  name="taller-new-username"
                  required
                />
              </label>
            </div>
            <label>
              Correo
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                name="taller-new-email"
                required
              />
            </label>
            <label>
              Teléfono
              <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" />
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
            {error && <div className="error">{error}</div>}
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Creando cuenta…' : 'Crear cuenta del taller'}
            </button>
          </form>
          <p style={{ marginTop: 14 }}>
            ¿Ya tienes cuenta? <Link to="/acceso-taller">Entrar al taller</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
