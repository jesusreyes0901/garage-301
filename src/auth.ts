const LOCK_KEY = 'garage301-lock'
const MAX_ATTEMPTS = 4
const SESSION_MS = 8 * 60 * 60 * 1000
export const RECOVERY_MINUTES = 10

export interface Session {
  userId: string
  token: string
  expiresAt: number
}

export type LoginResult =
  | { ok: true }
  | { ok: false; message: string; recover?: boolean; email?: string }

interface LockState {
  [key: string]: { attempts: number }
}

function bytesToHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function randomHex(bytes = 16) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt = randomHex()) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return `sha256$${salt}$${bytesToHex(digest)}`
}

export function isHashedPassword(value: string) {
  return value.startsWith('sha256$')
}

export async function passwordsMatch(password: string, stored: string) {
  if (!isHashedPassword(stored)) {
    return password === stored
  }
  const parts = stored.split('$')
  const salt = parts[1]
  const hashed = await hashPassword(password, salt)
  return hashed === stored
}

export function createSession(userId: string): Session {
  return {
    userId,
    token: randomHex(24),
    expiresAt: Date.now() + SESSION_MS,
  }
}

export function sessionIsValid(session: Session | null) {
  return Boolean(session && session.token && session.expiresAt > Date.now())
}

function readLock(): LockState {
  try {
    return JSON.parse(sessionStorage.getItem(LOCK_KEY) || '{}') as LockState
  } catch {
    return {}
  }
}

export function recoveryRequired(identifier: string) {
  const key = identifier.trim().toLowerCase()
  return (readLock()[key]?.attempts ?? 0) >= MAX_ATTEMPTS
}

export function registerFailedLogin(identifier: string): { message: string; recover: boolean } {
  const key = identifier.trim().toLowerCase()
  const all = readLock()
  const attempts = (all[key]?.attempts ?? 0) + 1
  all[key] = { attempts }
  sessionStorage.setItem(LOCK_KEY, JSON.stringify(all))
  if (attempts >= MAX_ATTEMPTS) {
    return {
      message: 'Superaste 4 intentos. Te enviamos a recuperación de cuenta.',
      recover: true,
    }
  }
  return {
    message: `Correo, usuario o contraseña incorrectos. Intentos restantes: ${MAX_ATTEMPTS - attempts}.`,
    recover: false,
  }
}

export function clearFailedLogin(identifier: string) {
  const key = identifier.trim().toLowerCase()
  const all = readLock()
  delete all[key]
  sessionStorage.setItem(LOCK_KEY, JSON.stringify(all))
}

export function passwordStrengthError(password: string) {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'La contraseña debe incluir letras y números.'
  }
  return null
}

export function randomRecoveryCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
  return String(n).padStart(6, '0')
}

export async function deliverRecoveryCode(email: string, code: string) {
  const subject = 'Código de recuperación Garage 301'
  const message = `Hola,\n\nTu código de Garage 301 es: ${code}\nVence en ${RECOVERY_MINUTES} minutos.\n\nSi no pediste este código, ignora el correo.`
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _subject: subject, name: 'Garage 301', message }),
    })
    if (res.ok) return
  } catch {
    /* el envío web puede fallar; se usa el correo local */
  }
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
  const link = document.createElement('a')
  link.href = href
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
