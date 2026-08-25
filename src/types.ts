export type Role = 'taller' | 'cliente'

export type AppointmentStatus =
  | 'pendiente'
  | 'confirmada'
  | 'en_proceso'
  | 'completada'
  | 'cancelada'
  | 'no_asistio'

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

export interface ShopSettings {
  name: string
  address: string
  mapsUrl: string
  lat: string
  lng: string
  notes: string
  whatsapp: string
}

export function emptyShop(): ShopSettings {
  return {
    name: 'Garaje 301',
    address: '',
    mapsUrl: '',
    lat: '',
    lng: '',
    notes: '',
    whatsapp: '',
  }
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
  shop: ShopSettings
}

export const SERVICES = [
  'Afinación mayor',
  'Afinación menor',
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
  'Afinación menor': 1100,
  'Cambio de aceite': 650,
  Frenos: 2200,
  Suspensión: 2800,
  'Diagnóstico computarizado': 500,
  'Sistema eléctrico': 900,
  'Cambio de clutch': 4500,
  Otro: 800,
}

export function couponPercent(coupon: { discountPercent?: number }) {
  const p = Math.round(Number(coupon.discountPercent) || 0)
  return Math.min(100, Math.max(0, p))
}

/** Descuento en pesos a partir de un subtotal real (cotización / orden). Solo % */
export function couponDiscountBreakdown(coupon: { discountPercent: number; discountAmount?: number }, base = 0) {
  const percent = couponPercent(coupon)
  const discount = Math.min(base, Math.round((base * percent) / 100))
  return {
    base,
    percent,
    discount,
    final: Math.max(0, base - discount),
  }
}
