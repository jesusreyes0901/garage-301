import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { PasswordField } from '../components/PasswordField'
import { useStore } from '../store'

export function Recuperacion() {
  const { requestRecovery, confirmRecovery, state } = useStore()
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState<'pedir' | 'codigo'>('pedir')
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const autoSent = useRef(false)

  const resolvedEmail = () => {
    const id = email.trim().toLowerCase()
    const user = state.users.find((u) => u.email.toLowerCase() === id || u.username.toLowerCase() === id)
    return user?.email ?? email.trim()
  }

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault()
    setBusy(true)
    setError(null)
    const result = await requestRecovery(email)
    setBusy(false)
    if (result) {
      setError(result)
      return
    }
    setStep('codigo')
    setInfo(
      'Si el correo está registrado, enviamos un código de 6 dígitos. Revisa tu bandeja o el cliente de correo que se abrió.',
    )
  }

  useEffect(() => {
    const preset = params.get('email')
    if (preset) setEmail(preset)
    if (params.get('auto') === '1' && preset && !autoSent.current) {
      autoSent.current = true
      setInfo('Por 4 intentos fallidos debes recuperar la cuenta. Enviando código al correo…')
      void requestRecovery(preset).then((result) => {
        if (result) setError(result)
        else {
          setStep('codigo')
          setInfo('Código enviado al correo. Revísalo e ingrésalo aquí.')
        }
      })
    }
  }, [params, requestRecovery])

  const onConfirm = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setBusy(true)
    setError(null)
    const result = await confirmRecovery(resolvedEmail(), code, password)
    setBusy(false)
    if (result) setError(result)
  }

  const fromTaller = params.get('from') === 'taller'

  return (
    <div className="login-wrap">
      <section className="login-hero">
        {fromTaller ? (
          <div className="brand">
            <div className="brand-mark">
              <Wrench size={22} />
            </div>
            <div>
              <h1>Garaje 301</h1>
              <p>Recuperar cuenta</p>
            </div>
          </div>
        ) : (
          <div className="brand brand-hero">
            <BrandLogo height={118} className="lg" />
            <div>
              <h1>Garaje 301</h1>
              <p>Recuperar cuenta</p>
            </div>
          </div>
        )}
        <div>
          <h2>Un código al correo para volver a entrar.</h2>
          <p>
            Después de 4 intentos fallidos el acceso se bloquea hasta que valides el código y
            definas una nueva contraseña.
          </p>
        </div>
      </section>
      <section className="login-panel">
        <div className="card login-card">
          <h2>Recuperación</h2>
          {step === 'pedir' ? (
            <form className="form" onSubmit={sendCode}>
              <label>
                Correo o usuario
                <input value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              {info && <div className="ok-msg">{info}</div>}
              {error && <div className="error">{error}</div>}
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Enviando…' : 'Enviar código al correo'}
              </button>
            </form>
          ) : (
            <form className="form" onSubmit={onConfirm}>
              {info && <div className="ok-msg">{info}</div>}
              <label>
                Código de 6 dígitos
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  required
                />
              </label>
              <label>
                Nueva contraseña
                <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} required />
              </label>
              <label>
                Confirmar contraseña
                <PasswordField value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </label>
              {error && <div className="error">{error}</div>}
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Validando…' : 'Restablecer y entrar'}
              </button>
              <button className="btn secondary" type="button" onClick={() => void sendCode()}>
                Reenviar código
              </button>
            </form>
          )}
          <p style={{ marginTop: 16 }}>
            <Link to={params.get('from') === 'taller' ? '/acceso-taller' : '/login'}>
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
