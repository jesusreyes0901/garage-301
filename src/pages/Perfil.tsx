import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { PasswordField } from '../components/PasswordField'
import { useStore } from '../store'

function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Solo se permiten imágenes.'))
      return
    }
    if (file.size > 2_000_000) {
      reject(new Error('La foto no debe superar 2 MB.'))
      return
    }
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const size = 256
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('No se pudo procesar la imagen.'))
        return
      }
      const min = Math.min(img.width, img.height)
      const sx = (img.width - min) / 2
      const sy = (img.height - min) / 2
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen.'))
    }
    img.src = url
  })
}

export function Perfil() {
  const { user, updateProfile } = useStore()
  const [name, setName] = useState(user?.name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [address, setAddress] = useState(user?.address ?? '')
  const [avatar, setAvatar] = useState(user?.avatar ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name)
    setUsername(user.username)
    setEmail(user.email)
    setPhone(user.phone)
    setAddress(user.address)
    setAvatar(user.avatar)
  }, [user])

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setError(null)
      setAvatar(await fileToAvatar(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la foto.')
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (newPassword && newPassword !== confirmPassword) {
      setError('La nueva contraseña y su confirmación no coinciden.')
      return
    }
    setBusy(true)
    const result = await updateProfile({
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      avatar,
      newPassword,
    })
    setBusy(false)
    if (result) {
      setError(result)
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setMessage('Perfil actualizado.')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>{user?.role === 'taller' ? 'Perfil del mecánico' : 'Editar perfil'}</h2>
          <p>Foto, datos de cuenta y, si quieres, una nueva contraseña.</p>
        </div>
      </div>
      {user?.role === 'taller' && (
        <div className="card mechanic-badge">
          <BrandLogo height={128} className="lg" />
          <div>
            <h3>Garage 301</h3>
            <p style={{ color: 'var(--muted)', margin: '6px 0 0' }}>Perfil del mecánico</p>
            <p style={{ margin: '10px 0 0' }}>
              {user.name} · @{user.username}
            </p>
          </div>
        </div>
      )}
      <div className="card" style={{ maxWidth: 720 }}>
        <form className="form" onSubmit={onSubmit}>
          <div className="profile-photo-row">
            {avatar ? (
              <img className="avatar lg" src={avatar} alt="Foto de perfil" />
            ) : (
              <div className="avatar lg fallback">{name.slice(0, 1)}</div>
            )}
            <div>
              <label className="btn secondary" style={{ display: 'inline-block', cursor: 'pointer' }}>
                Subir foto
                <input type="file" accept="image/*" hidden onChange={onPhoto} />
              </label>
              {avatar && (
                <button className="btn secondary" type="button" style={{ marginLeft: 8 }} onClick={() => setAvatar('')}>
                  Quitar
                </button>
              )}
              <p style={{ color: 'var(--muted)', fontSize: 13, margin: '8px 0 0' }}>
                JPG o PNG. Se recorta a cuadrado.
              </p>
            </div>
          </div>
          <div className="form-row">
            <label>
              Nombre
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Usuario
              <input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </label>
          </div>
          <div className="form-row">
            <label>
              Correo
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Teléfono
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
          </div>
          <label>
            Dirección
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <div className="form-row">
            <label>
              Nueva contraseña (opcional)
              <PasswordField
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres, letras y números"
              />
            </label>
            <label>
              Confirmar nueva contraseña
              <PasswordField
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
          </div>
          {error && <div className="error">{error}</div>}
          {message && <div className="ok-msg">{message}</div>}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </>
  )
}
