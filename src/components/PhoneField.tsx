import { COUNTRIES, joinPhone, splitPhone } from '../countries'

export function PhoneField({
  value,
  onChange,
  required,
}: {
  value: string
  onChange: (phone: string) => void
  required?: boolean
}) {
  const parts = splitPhone(value)
  const dial = COUNTRIES.some((c) => c.dial === parts.dial) ? parts.dial : '52'

  return (
    <div className="phone-field">
      <select
        aria-label="Lada del país"
        value={dial}
        onChange={(e) => onChange(joinPhone(e.target.value, parts.local))}
      >
        {COUNTRIES.map((c) => (
          <option key={c.iso} value={c.dial}>
            {c.iso} +{c.dial}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="55 1234 5678"
        value={parts.local}
        required={required}
        onChange={(e) => onChange(joinPhone(dial, e.target.value))}
      />
    </div>
  )
}
