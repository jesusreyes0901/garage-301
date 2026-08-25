import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { useStore } from './store'
import { Login } from './pages/Login'
import { Shell } from './components/Shell'
import { TallerHome } from './pages/taller/Home'
import { TallerCitas } from './pages/taller/Citas'
import { TallerOrdenes } from './pages/taller/Ordenes'
import { TallerRefacciones } from './pages/taller/Refacciones'
import { TallerVehiculos } from './pages/taller/Vehiculos'
import { TallerClientes } from './pages/taller/Clientes'
import { TallerObservaciones } from './pages/taller/Observaciones'
import { TallerCupones } from './pages/taller/Cupones'
import { TallerUbicacion } from './pages/taller/Ubicacion'
import { ClienteHome } from './pages/cliente/Home'
import { ClienteAgendar } from './pages/cliente/Agendar'
import { ClienteRefacciones } from './pages/cliente/Refacciones'
import { ClienteObservaciones } from './pages/cliente/Observaciones'
import { ClienteBusqueda } from './pages/cliente/Busqueda'
import { ClienteCitas } from './pages/cliente/Citas'
import { ClienteCupones } from './pages/cliente/Cupones'
import { ClienteUbicacion } from './pages/cliente/Ubicacion'
import { ClienteRecibos } from './pages/cliente/Recibos'
import { Perfil } from './pages/Perfil'
import { Registro } from './pages/Registro'
import { Recuperacion } from './pages/Recuperacion'
import { Verificar } from './pages/Verificar'
import { AccesoTaller } from './pages/AccesoTaller'
import { RegistroTaller } from './pages/RegistroTaller'
import { ClientAssistant } from './components/ClientAssistant'
import type { Role, User } from './types'

function safeNext(user: User, next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return user.role === 'taller' ? '/taller' : '/cliente'
  }
  if (user.role === 'cliente' && next.startsWith('/cliente')) return next
  if (user.role === 'taller' && next.startsWith('/taller')) return next
  return user.role === 'taller' ? '/taller' : '/cliente'
}

function LoggedRedirect() {
  const { user } = useStore()
  const [params] = useSearchParams()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={safeNext(user, params.get('next'))} replace />
}

function Guard({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useStore()
  const loc = useLocation()
  if (!user) {
    const login = role === 'taller' ? '/acceso-taller' : '/login'
    const next = encodeURIComponent(`${loc.pathname}${loc.search}`)
    return <Navigate to={`${login}?next=${next}`} replace />
  }
  if (user.role !== role) return <Navigate to={user.role === 'taller' ? '/taller' : '/cliente'} replace />
  return children
}

export default function App() {
  const { user } = useStore()
  return (
    <>
      <Routes>
      <Route path="/login" element={user ? <LoggedRedirect /> : <Login />} />
      <Route path="/registro" element={user ? <Navigate to={user.role === 'taller' ? '/taller' : '/cliente'} /> : <Registro />} />
      <Route path="/recuperacion" element={user ? <Navigate to={user.role === 'taller' ? '/taller' : '/cliente'} /> : <Recuperacion />} />
      <Route path="/verificar" element={user ? <Navigate to={user.role === 'taller' ? '/taller' : '/cliente'} /> : <Verificar />} />
      <Route
        path="/acceso-taller"
        element={user ? <Navigate to={user.role === 'taller' ? '/taller' : '/cliente'} /> : <AccesoTaller />}
      />
      <Route
        path="/registro-taller"
        element={user ? <Navigate to={user.role === 'taller' ? '/taller' : '/cliente'} /> : <RegistroTaller />}
      />
      <Route
        path="/taller"
        element={
          <Guard role="taller">
            <Shell />
          </Guard>
        }
      >
        <Route index element={<TallerHome />} />
        <Route path="citas" element={<TallerCitas />} />
        <Route path="ordenes" element={<TallerOrdenes />} />
        <Route path="refacciones" element={<TallerRefacciones />} />
        <Route path="cupones" element={<TallerCupones />} />
        <Route path="vehiculos" element={<TallerVehiculos />} />
        <Route path="clientes" element={<TallerClientes />} />
        <Route path="observaciones" element={<TallerObservaciones />} />
        <Route path="ubicacion" element={<TallerUbicacion />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>
      <Route
        path="/cliente"
        element={
          <Guard role="cliente">
            <Shell />
          </Guard>
        }
      >
        <Route index element={<ClienteHome />} />
        <Route path="agendar" element={<ClienteAgendar />} />
        <Route path="citas" element={<ClienteCitas />} />
        <Route path="cupones" element={<ClienteCupones />} />
        <Route path="refacciones" element={<ClienteRefacciones />} />
        <Route path="observaciones" element={<ClienteObservaciones />} />
        <Route path="vehiculo" element={<ClienteBusqueda />} />
        <Route path="ubicacion" element={<ClienteUbicacion />} />
        <Route path="recibos" element={<ClienteRecibos />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? (user.role === 'taller' ? '/taller' : '/cliente') : '/login'} />} />
      </Routes>
      <ClientAssistant />
    </>
  )
}
