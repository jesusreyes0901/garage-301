import type { AppointmentStatus, OrderStatus, VehicleStatus } from '../types'

export function StatusBadge({
  value,
}: {
  value: AppointmentStatus | OrderStatus | VehicleStatus | string
}) {
  const map: Record<string, { cls: string; label: string }> = {
    pendiente: { cls: 'warn', label: 'Pendiente' },
    confirmada: { cls: 'info', label: 'Confirmada' },
    en_proceso: { cls: '', label: 'En proceso' },
    completada: { cls: 'ok', label: 'Completada' },
    cancelada: { cls: 'danger', label: 'Cancelada' },
    no_asistio: { cls: 'danger', label: 'No asistió' },
    abierta: { cls: 'info', label: 'Abierta' },
    espera_refaccion: { cls: 'warn', label: 'Espera refacción' },
    lista: { cls: 'ok', label: 'Lista' },
    entregada: { cls: 'ok', label: 'Entregada' },
    activo: { cls: 'ok', label: 'Activo' },
    en_taller: { cls: '', label: 'En taller' },
    entregado: { cls: 'info', label: 'Entregado' },
    solicitada: { cls: 'warn', label: 'Solicitada' },
    apartada: { cls: 'info', label: 'Apartada' },
    rechazada: { cls: 'danger', label: 'Rechazada' },
  }
  const item = map[value] ?? { cls: '', label: value }
  return <span className={`badge ${item.cls}`}>{item.label}</span>
}
