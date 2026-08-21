import { useEffect } from 'react'

export const TERMS_TEXT = `Aviso de privacidad y términos de uso — Garage 301

1. Responsable del tratamiento
Garage 301 es responsable del tratamiento de tus datos personales cuando usas este portal para registrarte, agendar citas y dar seguimiento a tu vehículo.

2. Datos que recabamos
Podemos solicitar y almacenar: nombre, usuario, correo electrónico, teléfono, domicilio, placas, marca, modelo, año, color, fotografías del vehículo, historial de citas, órdenes de trabajo, observaciones y cupones asociados a tu cuenta.

3. Finalidad del uso
Tus datos se usan exclusivamente para:
• Identificarte como cliente del taller
• Agendar, confirmar y dar seguimiento a servicios
• Comunicarte el estado de tu unidad y observaciones técnicas
• Gestionar inventario, refacciones y cupones de descuento
• Contactarte por correo o teléfono sobre tu servicio
• Cumplir obligaciones legales aplicables

4. Privacidad y confidencialidad
No vendemos ni rentamos tus datos a terceros. Solo el personal autorizado del taller puede consultar la información necesaria para atender tu vehículo. Las evidencias fotográficas y notas técnicas se resguardan dentro de la plataforma del taller.

5. Conservación
Conservamos tus datos mientras mantengas una cuenta activa o exista un historial de servicio vigente. Puedes solicitar la actualización o eliminación de datos personales escribiendo al taller, salvo información que debamos conservar por obligación legal o fiscal.

6. Seguridad de la cuenta
Eres responsable de custodiar tu usuario y contraseña. Tras intentos fallidos de acceso puede solicitarse recuperación por correo. No compartas códigos de verificación con nadie.

7. Citas, servicios y cupones
Las citas dependen de disponibilidad. Horario: lunes a viernes 9:00–17:00; sábados 9:00–14:00; domingo cerrado. Diagnósticos y presupuestos finales se confirman en el taller. Los cupones digitales son personales, no transferibles y sujetos a vigencia y reglas del taller.

8. Derechos ARCO
Puedes solicitar Acceso, Rectificación, Cancelación u Oposición al tratamiento de tus datos personales contactando a Garage 301 a través de los medios publicados por el taller.

9. Aceptación
Al marcar «Acepto términos y condiciones» en el registro confirmas haber leído este aviso de privacidad y autorizas el tratamiento de tus datos conforme a lo aquí descrito.`

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
        <h2 id="terms-title">Privacidad y términos</h2>
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
          Acepto el{' '}
          <button className="linkish" type="button" onClick={onOpen}>
            aviso de privacidad y términos
          </button>{' '}
          del taller
        </span>
      </label>
    </div>
  )
}
