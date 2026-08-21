export type Role = 'taller' | 'cliente'

export type AppointmentStatus =
  | 'pendiente'
  | 'confirmada'
  | 'en_proceso'
  | 'completada'
  | 'cancelada'

export type OrderStatus =
  | 'abierta'
  | 'en_proceso'
  | 'espera_refaccion'
  | 'lista'
  | 'entregada'

export type VehicleStatus = 'activo' | 'en_taller' | 'entregado'

export interface User {
  id: string
  name: string
  username: string
  email: string
  password: string
  role: Role
  phone: string
  address: string
  avatar: string
  /** Afinaciones ya canjeadas; el contador visible = total − baseline */
  loyaltyBaseline?: number
  recovery?: {
    hash: string
    expiresAt: number
    tries: number
  }
}

export interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  color: string
  vin: string
  ownerId: string
  mileage: number
  status: VehicleStatus
  photo: string
}

export interface Appointment {
  id: string
  clientId: string
  vehicleId: string
  date: string
  time: string
  service: string
  status: AppointmentStatus
  notes: string
  orderId?: string
  vehicleBrand?: string
  vehicleModel?: string
  vehicleYear?: number | null
  couponCode?: string
  discount?: number
}

export interface Coupon {
  id: string
  code: string
  title: string
  description: string
  discountPercent: number
  discountAmount: number
  serviceType: string
  minAfinaciones: number
  active: boolean
  clientId?: string
  createdBy: string
  createdAt: string
  expiresAt?: string | null
}

export interface OrderMaterial {
  id: string
  name: string
  qty: number
  /** Costo para el taller (gasto) */
  cost: number
  /** Precio cobrado al cliente (ingreso), opcional */
  price: number
  partId?: string
}

export interface WorkOrder {
  id: string
  folio: string
  vehicleId: string
  clientId: string
  mechanic: string
  description: string
  status: OrderStatus
  createdAt: string
  labor: number
  parts: { partId: string; qty: number }[]
  materials: OrderMaterial[]
  discount: number
  couponCode?: string
}

export interface Part {
  id: string
  sku: string
  name: string
  category: string
  stock: number
  minStock: number
  price: number
  cost: number
}

export interface PartRequest {
  id: string
  clientId: string
  vehicleId: string
  partId: string
  qty: number
  status: 'solicitada' | 'apartada' | 'entregada' | 'rechazada'
  createdAt: string
}

export interface Observation {
  id: string
  vehicleId: string
  authorId: string
  text: string
  photos: string[]
  createdAt: string
}

export interface AppState {
  users: User[]
  vehicles: Vehicle[]
  appointments: Appointment[]
  orders: WorkOrder[]
  parts: Part[]
  partRequests: PartRequest[]
  observations: Observation[]
  coupons: Coupon[]
}

export const SERVICES = [
  'Afinación mayor',
  'Cambio de aceite',
  'Frenos',
  'Suspensión',
  'Diagnóstico computarizado',
  'Sistema eléctrico',
  'Cambio de clutch',
  'Otro',
] as const

/** Precio de referencia del servicio para mostrar descuento del cupón */
export const SERVICE_BASE_PRICES: Record<string, number> = {
  'Afinación mayor': 1800,
  'Cambio de aceite': 650,
  Frenos: 2200,
  Suspensión: 2800,
  'Diagnóstico computarizado': 500,
  'Sistema eléctrico': 900,
  'Cambio de clutch': 4500,
  Otro: 800,
}

export function couponDiscountBreakdown(coupon: {
  serviceType: string
  discountPercent: number
  discountAmount: number
}) {
  const base = SERVICE_BASE_PRICES[coupon.serviceType] ?? 1000
  const fromPercent = Math.round((base * (coupon.discountPercent || 0)) / 100)
  const discount = Math.min(base, fromPercent + (coupon.discountAmount || 0))
  return {
    base,
    discount,
    final: Math.max(0, base - discount),
  }
}
