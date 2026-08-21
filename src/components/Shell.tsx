import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  PlusCircle,
  Search,
  TicketPercent,
  UserRound,
  Wrench,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { BrandLogo } from './BrandLogo'
import { useStore } from '../store'

const tallerNav = [
  { to: '/taller', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/taller/citas', label: 'Citas', icon: CalendarDays },
  { to: '/taller/ordenes', label: 'Órdenes', icon: ClipboardList },
  { to: '/taller/refacciones', label: 'Refacciones', icon: Package },
  { to: '/taller/cupones', label: 'Cupones', icon: TicketPercent },
  { to: '/taller/vehiculos', label: 'Vehículos', icon: Wrench },
  { to: '/taller/observaciones', label: 'Observaciones', icon: MessageSquare },
  { to: '/taller/perfil', label: 'Editar perfil', icon: UserRound },
]

const clienteNav = [
  { to: '/cliente', label: 'Mi panel', icon: LayoutDashboard, end: true },
  { to: '/cliente/agendar', label: 'Agendar cita', icon: PlusCircle },
  { to: '/cliente/citas', label: 'Mis citas', icon: CalendarDays },
  { to: '/cliente/cupones', label: 'Cupones', icon: TicketPercent },
  { to: '/cliente/refacciones', label: 'Refacciones', icon: Package },
  { to: '/cliente/observaciones', label: 'Observaciones', icon: MessageSquare },
  { to: '/cliente/vehiculo', label: 'Buscar vehículo', icon: Search },
  { to: '/cliente/perfil', label: 'Editar perfil', icon: UserRound },
]

export function Shell() {
  const { user, logout } = useStore()
  const nav = user?.role === 'taller' ? tallerNav : clienteNav

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          {user?.role === 'cliente' ? (
            <>
              <BrandLogo height={58} />
              <div>
                <h1>Garage 301</h1>
                <p>Portal del cliente</p>
              </div>
            </>
          ) : (
            <>
              <div className="brand-mark">
                <Wrench size={22} />
              </div>
              <div>
                <h1>Garage 301</h1>
                <p>Gestión del taller</p>
              </div>
            </>
          )}
        </div>
        <div className="nav-label">Menú</div>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
        <div className="sidebar-user">
          <div className="sidebar-user-row">
            {user?.avatar ? (
              <img className="avatar" src={user.avatar} alt="" />
            ) : (
              <div className="avatar fallback">{user?.name.slice(0, 1)}</div>
            )}
            <div>
              <strong>{user?.name}</strong>
              <span>@{user?.username}</span>
            </div>
          </div>
          <button className="ghost" type="button" onClick={logout}>
            <LogOut size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
