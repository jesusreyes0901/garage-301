import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { PasswordField } from '../components/PasswordField'
import { useStore } from '../store'

export function AccesoTaller() {
  const { login } = useStore()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await login(identifier, password, 'taller')
    setBusy(false)
    if (result.ok) return
    setPassword('')
    if (result.needsVerify) {
      navigate(`/verificar?email=${encodeURIComponent(result.email || identifier)}`)
      return
    }
    if (result.recover) {
      const email = result.email || identifier
      navigate(`/recuperacion?email=${encodeURIComponent(email)}&auto=1&from=taller`)
      return
    }
    setError(result.message)
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
            <p>Portal interno del taller</p>
          </div>
        </div>
        <div>
          <h2>Operación diaria: citas, órdenes, inventario y bahías.</h2>
          <p>
            Este acceso es exclusivo del personal. Aquí puedes entrar o crear la cuenta del taller.
          </p>
          <div className="features">
            <div className="feature">
              <strong>Citas</strong>
              <span>Confirma y avanza las visitas del día.</span>
            </div>
            <div className="feature">
              <strong>Órdenes</strong>
              <span>Folios, mano de obra y refacciones.</span>
            </div>
            <div className="feature">
              <strong>Inventario</strong>
              <span>Stock y solicitudes de piezas.</span>
            </div>
            <div className="feature">
              <strong>Unidades</strong>
              <span>Foto, placa y evidencias de cada auto.</span>
            </div>
          </div>
        </div>
        <p style={{ color: 'var(--muted)' }}>Uso interno · Garage 301</p>
      </section>
      <section className="login-panel">
        <div className="card login-card">
          <h2>Acceso del taller</h2>
          <p style={{ color: 'var(--muted)', margin: '0 0 18px' }}>
            Solo personal de Garage 301. Si aún no tienes cuenta, regístrate aquí.
          </p>
          <form className="form" onSubmit={onSubmit}>
            <label>
              Usuario o correo
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label>
              Contraseña
              <PasswordField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {error && <div className="error">{error}</div>}
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Verificando…' : 'Entrar al taller'}
            </button>
          </form>
          <p style={{ marginTop: 16 }}>
            <Link to="/recuperacion?from=taller">¿Olvidaste tu contraseña?</Link>
          </p>
          <p style={{ marginTop: 8 }}>
            ¿No tienes cuenta? <Link to="/registro-taller">Regístrate</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
