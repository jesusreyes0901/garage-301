import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { LoginResult } from './auth'
import type {
  Appointment,
  AppState,
  Coupon,
  OrderStatus,
  PartRequest,
  Role,
  ShopSettings,
  User,
  Vehicle,
  WorkOrder,
} from './types'
import { emptyShop } from './types'

const TOKEN_KEY = 'garaje301-token'
const emptyState = (): AppState => ({
  users: [],
  vehicles: [],
  appointments: [],
  orders: [],
  parts: [],
  partRequests: [],
  observations: [],
  coupons: [],
  shop: emptyShop(),
})

const API_ROOT = import.meta.env.DEV ? 'http://127.0.0.1:3001' : ''

async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`${API_ROOT}${path}`, { ...options, headers })
  } catch {
    throw new Error(
      'No se pudo conectar con la API. En una terminal del proyecto ejecuta: npm.cmd run dev',
    )
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      data.error || `Error del servidor (${res.status}). Intenta de nuevo en unos segundos.`,
    )
  }
  return data
}

export type ProfilePatch = {
  name: string
  username: string
  email: string
  phone: string
  address: string
  avatar: string
  newPassword: string
}

export type ClientInput = {
  id?: string
  name: string
  username: string
  email: string
  phone: string
  address?: string
  password?: string
  vehicle?: {
    plate: string
    brand: string
    model: string
    year: number
    color: string
    photo?: string
    vin?: string
    mileage?: number
  }
}

export type VehicleInput = Omit<Vehicle, 'id'> & { id?: string }

export type RegisterInput = {
  name: string
  username: string
  email: string
  phone: string
  password: string
  role?: Role
  vehicle?: {
    plate: string
    brand: string
    model: string
    year: number
    color: string
    photo: string
  }
}

interface StoreValue {
  state: AppState
  user: User | null
  login: (identifier: string, password: string, expectedRole: Role) => Promise<LoginResult>
  register: (input: RegisterInput) => Promise<string | null>
  confirmEmail: (email: string, code: string) => Promise<string | null>
  resendVerification: (email: string) => Promise<string | null>
  requestRecovery: (identifier: string) => Promise<string | null>
  confirmRecovery: (email: string, code: string, newPassword: string) => Promise<string | null>
  logout: () => void
  updateProfile: (patch: ProfilePatch) => Promise<string | null>
  addAppointment: (
    a: Omit<Appointment, 'id' | 'status'> & { status?: Appointment['status']; rescheduleFrom?: string },
  ) => Promise<{ error: string | null; whatsappSent?: boolean; whatsappUrl?: string }>
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void
  deleteAppointment: (id: string) => void
  deleteAppointments: (ids: string[]) => Promise<string | null>
  confirmAppointment: (id: string) => void
  addObservation: (vehicleId: string, text: string, photos?: string[]) => void
  addPartRequest: (vehicleId: string, partId: string, qty: number) => void
  updatePartRequest: (id: string, status: PartRequest['status']) => void
  addOrder: (o: Omit<WorkOrder, 'id' | 'folio' | 'createdAt'>) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
  deleteOrder: (id: string) => Promise<string | null>
  deleteOrders: (ids: string[]) => Promise<string | null>
  deliverOrder: (
    id: string,
    materials: { name: string; qty: number; cost: number; price: number; partId?: string }[],
  ) => Promise<string | null>
  updateVehicleStatus: (id: string, status: Vehicle['status']) => void
  setVehiclePhoto: (id: string, photo: string) => void
  adjustStock: (partId: string, delta: number) => string | null
  addPart: (p: { name: string; category?: string; price: number; cost: number; stock: number }) => void
  addVehicle: (v: Omit<Vehicle, 'id'>) => void
  saveVehicle: (v: VehicleInput) => Promise<string | null>
  deleteVehicle: (id: string) => Promise<string | null>
  saveClient: (input: ClientInput) => Promise<string | null>
  deleteClient: (id: string) => Promise<string | null>
  saveCoupon: (
    input: Omit<Coupon, 'id' | 'createdAt' | 'createdBy'> & { id?: string },
  ) => Promise<string | null>
  saveShop: (shop: ShopSettings) => Promise<string | null>
  deleteCoupon: (id: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState)
  const [user, setUser] = useState<User | null>(null)

  const apply = useCallback((data: { state?: AppState; user?: User | null; token?: string }) => {
    if (data.state) {
      setState({
        ...emptyState(),
        ...data.state,
        coupons: data.state.coupons ?? [],
        shop: data.state.shop ?? emptyShop(),
      })
    }
    if (data.user) setUser(data.user)
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token)
  }, [])

  const mutate = useCallback(
    (path: string, options: RequestInit) => {
      void api(path, options).then(apply).catch((err) => console.error(err))
    },
    [apply],
  )

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    void api('/api/state')
      .then(apply)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      })
  }, [apply])

  const login = useCallback(
    async (identifier: string, password: string, expectedRole: Role): Promise<LoginResult> => {
      try {
        const data = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier, password, expectedRole }),
        })
        if (!data.ok) {
          return {
            ok: false,
            message: data.message,
            recover: data.recover,
            needsVerify: data.needsVerify,
            email: data.email,
          }
        }
        apply(data)
        return { ok: true }
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : 'No hay conexión con MySQL.',
        }
      }
    },
    [apply],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      try {
        const data = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(input) })
        if (data.error) return data.error as string
        if (data.verifyEmail) return `VERIFY|${data.verifyEmail}|${data.mailed ? '1' : '0'}`
        apply(data)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'No hay conexión con MySQL.'
      }
    },
    [apply],
  )

  const confirmEmail = useCallback(
    async (email: string, code: string) => {
      try {
        const data = await api('/api/auth/verify', {
          method: 'POST',
          body: JSON.stringify({ email, code }),
        })
        if (data.error) return data.error as string
        apply(data)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'No se pudo verificar el correo.'
      }
    },
    [apply],
  )

  const resendVerification = useCallback(async (email: string) => {
    try {
      const data = await api('/api/auth/verify/resend', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      return data.error || null
    } catch (err) {
      return err instanceof Error ? err.message : 'No se pudo reenviar el código.'
    }
  }, [])

  const requestRecovery = useCallback(async (identifier: string) => {
    try {
      const data = await api('/api/auth/recovery', {
        method: 'POST',
        body: JSON.stringify({ identifier }),
      })
      return data.error || null
    } catch (err) {
      return err instanceof Error ? err.message : 'No hay conexión con MySQL.'
    }
  }, [])

  const confirmRecovery = useCallback(
    async (email: string, code: string, newPassword: string) => {
      try {
        const data = await api('/api/auth/recovery/confirm', {
          method: 'POST',
          body: JSON.stringify({ email, code, newPassword }),
        })
        if (data.error) return data.error as string
        apply(data)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'No hay conexión con MySQL.'
      }
    },
    [apply],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    setState(emptyState())
  }, [])

  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    try {
      const data = await api('/api/profile', { method: 'PUT', body: JSON.stringify(patch) })
      if (data.error) return data.error as string
      apply(data)
      return null
    } catch (err) {
      return err instanceof Error ? err.message : 'No se pudo guardar el perfil.'
    }
  }, [apply])

  const addAppointment = useCallback(
    async (a: Omit<Appointment, 'id' | 'status'> & { status?: Appointment['status']; rescheduleFrom?: string }) => {
      try {
        const data = await api('/api/appointments', { method: 'POST', body: JSON.stringify(a) })
        if (data.error) return { error: data.error as string }
        apply(data)
        return {
          error: null,
          whatsappSent: Boolean(data.whatsappSent),
          whatsappUrl: String(data.whatsappUrl || ''),
        }
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : 'No se pudo agendar la cita.',
        }
      }
    },
    [apply],
  )

  const updateAppointmentStatus = useCallback((id: string, status: Appointment['status']) => {
    mutate(`/api/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
  }, [mutate])

  const deleteAppointment = useCallback((id: string) => {
    mutate(`/api/appointments/${id}`, { method: 'DELETE' })
  }, [mutate])

  const deleteAppointments = useCallback(
    async (ids: string[]) => {
      try {
        const data = await api('/api/appointments/bulk-delete', {
          method: 'POST',
          body: JSON.stringify({ ids }),
        })
        if (data.error) return data.error as string
        apply(data)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'No se pudieron eliminar las citas.'
      }
    },
    [apply],
  )

  const confirmAppointment = useCallback((id: string) => {
    mutate(`/api/appointments/${id}/confirm`, { method: 'POST' })
  }, [mutate])

  const addObservation = useCallback((vehicleId: string, text: string, photos: string[] = []) => {
    mutate('/api/observations', {
      method: 'POST',
      body: JSON.stringify({ vehicleId, text, photos }),
    })
  }, [mutate])

  const addPartRequest = useCallback((vehicleId: string, partId: string, qty: number) => {
    mutate('/api/part-requests', {
      method: 'POST',
      body: JSON.stringify({ vehicleId, partId, qty }),
    })
  }, [mutate])

  const updatePartRequest = useCallback((id: string, status: PartRequest['status']) => {
    mutate(`/api/part-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
  }, [mutate])

  const addOrder = useCallback((o: Omit<WorkOrder, 'id' | 'folio' | 'createdAt'>) => {
    mutate('/api/orders', { method: 'POST', body: JSON.stringify(o) })
  }, [mutate])

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    mutate(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
  }, [mutate])

  const deleteOrder = useCallback(
    async (id: string) => {
      try {
        const data = await api(`/api/orders/${id}`, { method: 'DELETE' })
        if (data.error) return data.error as string
        apply(data)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'No se pudo eliminar la orden.'
      }
    },
    [apply],
  )

  const deleteOrders = useCallback(
    async (ids: string[]) => {
      try {
        const data = await api('/api/orders/bulk-delete', {
          method: 'POST',
          body: JSON.stringify({ ids }),
        })
        if (data.error) return data.error as string
        apply(data)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'No se pudieron eliminar las órdenes.'
      }
    },
    [apply],
  )

  const deliverOrder = useCallback(
    async (
      id: string,
      materials: { name: string; qty: number; cost: number; price: number; partId?: string }[],
    ) => {
      try {
        const data = await api(`/api/orders/${id}/deliver`, {
          method: 'POST',
          body: JSON.stringify({ materials }),
        })
        if (data.error) return data.error as string
        apply(data)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'No se pudo entregar la orden.'
      }
    },
    [apply],
  )

  const updateVehicleStatus = useCallback((id: string, status: Vehicle['status']) => {
    mutate(`/api/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
  }, [mutate])

  const setVehiclePhoto = useCallback((id: string, photo: string) => {
    mutate(`/api/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify({ photo }) })
  }, [mutate])

  const adjustStock = useCallback((partId: string, delta: number) => {
    const current = state.parts.find((p) => p.id === partId)
    const nextStock = Math.max(0, (current?.stock ?? 0) + delta)
    mutate(`/api/parts/${partId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ delta }),
    })
    if (current && nextStock === 0 && delta < 0) return `Se terminó la refacción: ${current.name}`
    return null
  }, [mutate, state.parts])

  const addPart = useCallback(
    (p: { name: string; category?: string; price: number; cost: number; stock: number }) => {
      mutate('/api/parts', { method: 'POST', body: JSON.stringify(p) })
    },
    [mutate],
  )

  const addVehicle = useCallback((v: Omit<Vehicle, 'id'>) => {
    mutate('/api/vehicles', { method: 'POST', body: JSON.stringify(v) })
  }, [mutate])

  const saveVehicle = useCallback(
    async (v: VehicleInput) => {
      try {
        const path = v.id ? `/api/vehicles/${v.id}` : '/api/vehicles'
        const method = v.id ? 'PATCH' : 'POST'
        const data = await api(path, { method, body: JSON.stringify(v) })
        if (data.error) return data.error as string
        apply(data)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'No se pudo guardar el vehículo.'
      }
    },
    [apply],
  )

  const deleteVehicle = useCallback(
    async (id: string) => {
      try {
        const data = await api(`/api/vehicles/${id}`, { method: 'DELETE' })
        if (data.error) return data.error as string
        apply(data)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'No se pudo quitar el vehículo.'
      }
    },
    [apply],
  )

  const saveClient = useCallback(
    async (input: ClientInput) => {
      try {
        const path = input.id ? `/api/clients/${input.id}` : '/api/clients'
        const method = input.id ? 'PATCH' : 'POST'
        const data = await api(path, { method, body: JSON.stringify(input) })
        if (data.error) return data.error as string
        apply(data)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'No se pudo guardar el cliente.'
      }
    },
    [apply],
  )

  const deleteClient = useCallback(
    async (id: string) => {
      try {
        const data = await api(`/api/clients/${id}`, { method: 'DELETE' })
        if (data.error) return data.error as string
        apply(data)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'No se pudo sacar al cliente del sistema.'
      }
    },
    [apply],
  )

  const saveCoupon = useCallback(
    async (input: Omit<Coupon, 'id' | 'createdAt' | 'createdBy'> & { id?: string }) => {
      try {
        const path = input.id ? `/api/coupons/${input.id}` : '/api/coupons'
        const method = input.id ? 'PATCH' : 'POST'
        const data = await api(path, { method, body: JSON.stringify(input) })
        if (data.error) return data.error as string
        apply(data)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'No se pudo guardar el cupón.'
      }
    },
    [apply],
  )

  const deleteCoupon = useCallback(
    (id: string) => {
      mutate(`/api/coupons/${id}`, { method: 'DELETE' })
    },
    [mutate],
  )

  const saveShop = useCallback(
    async (shop: ShopSettings) => {
      try {
        const data = await api('/api/shop', { method: 'PUT', body: JSON.stringify(shop) })
        if (data.error) return data.error as string
        apply(data)
        return null
      } catch (err) {
        return err instanceof Error ? err.message : 'No se pudo guardar la ubicación.'
      }
    },
    [apply],
  )

  const value = useMemo(
    () => ({
      state,
      user,
      login,
      register,
      confirmEmail,
      resendVerification,
      requestRecovery,
      confirmRecovery,
      logout,
      updateProfile,
      addAppointment,
      updateAppointmentStatus,
      deleteAppointment,
      deleteAppointments,
      confirmAppointment,
      addObservation,
      addPartRequest,
      updatePartRequest,
      addOrder,
      updateOrderStatus,
      deleteOrder,
      deleteOrders,
      deliverOrder,
      updateVehicleStatus,
      setVehiclePhoto,
      adjustStock,
      addPart,
      addVehicle,
      saveVehicle,
      deleteVehicle,
      saveClient,
      deleteClient,
      saveCoupon,
      deleteCoupon,
      saveShop,
    }),
    [
      state,
      user,
      login,
      register,
      confirmEmail,
      resendVerification,
      requestRecovery,
      confirmRecovery,
      logout,
      updateProfile,
      addAppointment,
      updateAppointmentStatus,
      deleteAppointment,
      deleteAppointments,
      confirmAppointment,
      addObservation,
      addPartRequest,
      updatePartRequest,
      addOrder,
      updateOrderStatus,
      deleteOrder,
      deleteOrders,
      deliverOrder,
      updateVehicleStatus,
      setVehiclePhoto,
      adjustStock,
      addPart,
      addVehicle,
      saveVehicle,
      deleteVehicle,
      saveClient,
      deleteClient,
      saveCoupon,
      deleteCoupon,
      saveShop,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore fuera de StoreProvider')
  return ctx
}

export function userById(users: User[], id: string) {
  return users.find((u) => u.id === id)
}

export function vehicleById(vehicles: Vehicle[], id: string) {
  if (!id) return undefined
  return vehicles.find((v) => v.id === id)
}

export function partById(parts: AppState['parts'], id: string) {
  return parts.find((p) => p.id === id)
}

export function orderIncome(o: WorkOrder, parts: AppState['parts']) {
  const partsIncome = o.parts.reduce((sum, line) => {
    const p = partById(parts, line.partId)
    return sum + (p?.price ?? 0) * line.qty
  }, 0)
  const materialsIncome = (o.materials || []).reduce((sum, m) => sum + (m.price || 0) * m.qty, 0)
  return Math.max(0, o.labor + partsIncome + materialsIncome - (o.discount || 0))
}

export function orderExpense(o: WorkOrder, parts: AppState['parts']) {
  const partsCost = o.parts.reduce((sum, line) => {
    const p = partById(parts, line.partId)
    return sum + (p?.cost ?? 0) * line.qty
  }, 0)
  const materialsCost = (o.materials || []).reduce((sum, m) => sum + (m.cost || 0) * m.qty, 0)
  return partsCost + materialsCost
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
