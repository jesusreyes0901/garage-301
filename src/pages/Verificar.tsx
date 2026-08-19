import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { useStore } from '../store'

export function Verificar() {
  const { confirmEmail, resendVerification } = useStore()
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState(
    params.get('email')
      ? 'Revisa tu bandeja de entrada (y spam). El código vence en 15 minutos.'
      : null,
  )
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await confirmEmail(email, code)
    setBusy(false)
    if (result) setError(result)
  }

  const onResend = async () => {
    setBusy(true)
    setError(null)
    const result = await resendVerification(email)
    setBusy(false)
    if (result) setError(result)
    else setInfo('Enviamos un código nuevo a tu correo.')
  }

  return (
    <div className="login-wrap">
      <section className="login-hero">
        <div className="brand brand-hero">
          <BrandLogo height={118} className="lg" />
          <div>
            <h1>Garage 301</h1>
            <p>Verificación de correo</p>
          </div>
        </div>
        <div>
          <h2>Confirma que el correo es tuyo.</h2>
          <p>Así protegemos citas, historial del auto y recuperación de cuenta.</p>
        </div>
      </section>
      <section className="login-panel">
        <div className="card login-card">
          <h2>Verifica tu correo</h2>
          <form className="form" onSubmit={onSubmit}>
            <label>
              Correo
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Código de 6 dígitos
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                required
              />
            </label>
            {error && <div className="error">{error}</div>}
            {info && <div className="ok-msg">{info}</div>}
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Verificando…' : 'Confirmar y entrar'}
            </button>
          </form>
          <p style={{ marginTop: 14 }}>
            <button className="btn secondary" type="button" disabled={busy || !email} onClick={() => void onResend()}>
              Reenviar código
            </button>
          </p>
          <p style={{ marginTop: 14 }}>
            <Link to="/login">Volver al inicio de sesión</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
