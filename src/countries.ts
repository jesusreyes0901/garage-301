export const COUNTRIES = [
  { iso: 'MX', name: 'México', dial: '52' },
  { iso: 'US', name: 'Estados Unidos', dial: '1' },
  { iso: 'CA', name: 'Canadá', dial: '1' },
  { iso: 'GT', name: 'Guatemala', dial: '502' },
  { iso: 'SV', name: 'El Salvador', dial: '503' },
  { iso: 'HN', name: 'Honduras', dial: '504' },
  { iso: 'NI', name: 'Nicaragua', dial: '505' },
  { iso: 'CR', name: 'Costa Rica', dial: '506' },
  { iso: 'PA', name: 'Panamá', dial: '507' },
  { iso: 'CO', name: 'Colombia', dial: '57' },
  { iso: 'VE', name: 'Venezuela', dial: '58' },
  { iso: 'PE', name: 'Perú', dial: '51' },
  { iso: 'EC', name: 'Ecuador', dial: '593' },
  { iso: 'BO', name: 'Bolivia', dial: '591' },
  { iso: 'CL', name: 'Chile', dial: '56' },
  { iso: 'AR', name: 'Argentina', dial: '54' },
  { iso: 'UY', name: 'Uruguay', dial: '598' },
  { iso: 'PY', name: 'Paraguay', dial: '595' },
  { iso: 'BR', name: 'Brasil', dial: '55' },
  { iso: 'ES', name: 'España', dial: '34' },
] as const

export function splitPhone(value: string) {
  const raw = String(value || '').trim()
  const match = raw.match(/^\+(\d{1,4})\s*(.*)$/)
  if (match) {
    return { dial: match[1], local: match[2].replace(/\D/g, '') }
  }
  return { dial: '52', local: raw.replace(/\D/g, '') }
}

export function joinPhone(dial: string, local: string) {
  const digits = local.replace(/\D/g, '')
  if (!digits) return ''
  return `+${dial} ${digits}`
}

export function validEmail(email: string) {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email.trim())
}

export function validPhone(phone: string) {
  if (!phone.trim()) return 'Ingresa un teléfono con lada.'
  const { local } = splitPhone(phone)
  if (local.length < 7 || local.length > 15) return 'El número no coincide con la lada del país.'
  return null
}
