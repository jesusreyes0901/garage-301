import { useEffect } from 'react'

const TERMS_TEXT = `Términos y condiciones de uso — Garage 301

1. Uso del portal
Al iniciar sesión aceptas utilizar esta plataforma solo para agendar servicios, consultar el estado de tu vehículo y comunicarte con el taller de forma legítima.

2. Datos personales
Tu nombre, correo, teléfono y datos del vehículo se usan exclusivamente para la operación del taller (citas, órdenes, observaciones e inventario). No se venden a terceros.

3. Citas y horarios
Las citas están sujetas a disponibilidad. El taller puede confirmar, reagendar o cancelar por causas operativas. Horario laboral: lunes a viernes 9:00–17:00; sábados 9:00–14:00; domingo cerrado.

4. Vehículos y servicios
La información de marca, modelo y año que indiques debe ser veraz. Los diagnósticos y presupuestos definitivos se confirman en el taller.

5. Cupones y descuentos
Los cupones digitales (incluyendo beneficios por afinaciones) son personales, no transferibles y sujetos a vigencia y reglas publicadas por el taller.

6. Responsabilidad
Garage 301 no se hace responsable por uso indebido de la cuenta. Debes custodiar tu usuario y contraseña.

7. Aceptación
Al marcar la casilla «Acepto términos y condiciones» confirmas haber leído y aceptado estas condiciones para usar el portal.`

type Props = {
  open: boolean
  onClose: () => void
}

export function TermsDialog({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-dialog card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="terms-title">Términos y condiciones</h2>
        <div className="terms-body">{TERMS_TEXT}</div>
        <button className="btn" type="button" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  )
}

export function TermsAcceptRow({
  checked,
  onChange,
  onOpen,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  onOpen: () => void
}) {
  return (
    <div className="terms-accept">
      <label className="checkbox-row">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required />
        <span>
          Acepto los{' '}
          <button className="linkish" type="button" onClick={onOpen}>
            términos y condiciones
          </button>
        </span>
      </label>
    </div>
  )
}
