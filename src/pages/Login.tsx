import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { PasswordField } from '../components/PasswordField'
import { TermsAcceptRow, TermsDialog } from '../components/TermsDialog'
import { useStore } from '../store'

export function Login() {
  const { login } = useStore()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones para continuar.')
      return
    }
    setBusy(true)
    setError(null)
    const result = await login(identifier, password, 'cliente')
    setBusy(false)
    if (result.ok) return
    setPassword('')
    if (result.needsVerify) {
      navigate(`/verificar?email=${encodeURIComponent(result.email || identifier)}`)
      return
    }
    if (result.recover) {
      const email = result.email || identifier
      navigate(`/recuperacion?email=${encodeURIComponent(email)}&auto=1`)
      return
    }
    setError(result.message)
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
          <h2>Agenda, sigue tu auto y consulta refacciones.</h2>
          <p>
            Acceso para clientes. Tras 4 intentos fallidos se pide recuperación por código al
            correo.
          </p>
          <div className="features">
            <div className="feature">
              <strong>Citas</strong>
              <span>Agenda, confirma y da seguimiento al servicio.</span>
            </div>
            <div className="feature">
              <strong>Refacciones</strong>
              <span>Inventario, stock mínimo y solicitudes del cliente.</span>
            </div>
            <div className="feature">
              <strong>Observaciones</strong>
              <span>Bitácora compartida entre taller y dueño.</span>
            </div>
            <div className="feature">
              <strong>Vehículos</strong>
              <span>Búsqueda por placas, VIN o modelo.</span>
            </div>
          </div>
        </div>
        <p style={{ color: 'var(--muted)' }}>Garage 301 · rojo, plateado y negro</p>
      </section>
      <section className="login-panel">
        <div className="card login-card">
          <h2>Iniciar sesión</h2>
          <p style={{ color: 'var(--muted)', margin: '0 0 18px' }}>
            Ingresa tu usuario o correo de cliente.
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
            <TermsAcceptRow
              checked={acceptedTerms}
              onChange={setAcceptedTerms}
              onOpen={() => setTermsOpen(true)}
            />
            {error && <div className="error">{error}</div>}
            <button className="btn" type="submit" disabled={busy || !acceptedTerms}>
              {busy ? 'Verificando…' : 'Entrar'}
            </button>
          </form>
          <p style={{ marginTop: 16 }}>
            <Link to="/recuperacion">¿Olvidaste tu contraseña?</Link>
          </p>
          <p style={{ marginTop: 8 }}>
            ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
          </p>
        </div>
      </section>
      <TermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  )
}
