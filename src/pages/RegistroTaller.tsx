import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { PasswordField } from '../components/PasswordField'
import { PhoneField } from '../components/PhoneField'
import { validEmail, validPhone } from '../countries'
import { useStore } from '../store'

export function RegistroTaller() {
  const { register } = useStore()
  const navigate = useNavigate()
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
    if (!validEmail(email)) {
      setError('Escribe un correo válido, por ejemplo  taller@garage301.com')
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
      role: 'taller',
    })
    setBusy(false)
    if (result?.startsWith('VERIFY:')) {
      navigate(`/verificar?email=${encodeURIComponent(result.slice(7))}`)
      return
    }
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
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                name="taller-new-email"
                placeholder="taller@garage301.com"
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
