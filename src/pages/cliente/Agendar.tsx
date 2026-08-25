import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  WEEKDAYS,
  dayTone,
  isSlotOpenNow,
  monthCells,
  monthLabel,
  remainingTimes,
  slotTaken,
  slotTone,
  todayKey,
  workSlotsForDate,
} from '../../schedule'
import { BrandModelFields } from '../../components/BrandModelFields'
import { useStore } from '../../store'
import { SERVICES } from '../../types'

export function ClienteAgendar() {
  const { state, user, addAppointment } = useStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const couponFromUrl = (searchParams.get('cupon') || '').trim().toUpperCase()
  const reagendarId = (searchParams.get('reagendar') || '').trim()
  const reagendar = state.appointments.find((a) => a.id === reagendarId && a.clientId === user?.id)
  const now = new Date()
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [date, setDate] = useState(todayKey())
  const [time, setTime] = useState('')
  const [service, setService] = useState<string>(SERVICES[0])
  const [notes, setNotes] = useState('')
  const [couponCode, setCouponCode] = useState(couponFromUrl)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const activeCoupon = useMemo(() => {
    if (!couponCode || !user) return null
    const today = todayKey()
    return (
      state.coupons.find((c) => {
        if (!c.active || c.code.toUpperCase() !== couponCode.toUpperCase()) return false
        if (c.expiresAt && c.expiresAt < today) return false
        if (c.clientId && c.clientId !== user.id) return false
        return true
      }) || null
    )
  }, [couponCode, state.coupons, user])

  useEffect(() => {
    if (!couponFromUrl) return
    setCouponCode(couponFromUrl)
    const found = state.coupons.find((c) => c.code.toUpperCase() === couponFromUrl)
    if (found?.serviceType) setService(found.serviceType)
  }, [couponFromUrl, state.coupons])

  useEffect(() => {
    if (!reagendar) return
    if (reagendar.vehicleBrand) setBrand(reagendar.vehicleBrand)
    if (reagendar.vehicleModel) setModel(reagendar.vehicleModel)
    if (reagendar.vehicleYear) setYear(String(reagendar.vehicleYear))
    if (reagendar.service) setService(reagendar.service)
    if (reagendar.couponCode) setCouponCode(reagendar.couponCode)
  }, [reagendar])

  const cells = useMemo(() => monthCells(cursor.year, cursor.month), [cursor])
  const tone = dayTone(state.appointments, date)
  const freeTimes = remainingTimes(state.appointments, date)
  const daySlots = workSlotsForDate(date)
  const isSaturday = new Date(`${date}T12:00:00`).getDay() === 6

  const shiftMonth = (delta: number) => {
    setCursor((c) => {
      const next = new Date(c.year, c.month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const onPickDay = (day: string) => {
    const next = dayTone(state.appointments, day)
    if (next === 'past' || next === 'closed' || next === 'red') return
    setDate(day)
    setTime('')
    setError(null)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!time) {
      setError('Elige un horario disponible.')
      return
    }
    if (!isSlotOpenNow(date, time)) {
      setError('Ese horario ya pasó. Elige otro o un día posterior.')
      return
    }
    if (!brand.trim() || !model.trim() || !year.trim()) {
      setError('Indica marca, modelo y año del vehículo.')
      return
    }
    const yearNum = Number(year)
    if (!Number.isFinite(yearNum) || yearNum < 1950 || yearNum > now.getFullYear() + 1) {
      setError('Escribe un año válido del vehículo.')
      return
    }
    if (couponCode && !activeCoupon && !reagendar) {
      setError('El cupón no es válido o ya no está vigente.')
      return
    }
    if (activeCoupon && activeCoupon.serviceType !== service) {
      setError(`Este cupón solo aplica para: ${activeCoupon.serviceType}`)
      return
    }
    setBusy(true)
    setError(null)
    const discountNote = activeCoupon
      ? `Cupón ${activeCoupon.code}: ${activeCoupon.discountPercent}% en ${activeCoupon.serviceType}`
      : ''
    const waWin = window.open('', '_blank')
    const result = await addAppointment({
      clientId: user.id,
      vehicleId: '',
      date,
      time,
      service,
      notes: [notes.trim(), discountNote].filter(Boolean).join('\n'),
      vehicleBrand: brand.trim(),
      vehicleModel: model.trim(),
      vehicleYear: yearNum,
      couponCode: activeCoupon?.code || reagendar?.couponCode,
      discount: 0,
      rescheduleFrom: reagendar?.id,
    })
    setBusy(false)
    if (result.error) {
      waWin?.close()
      setError(result.error)
      return
    }
    if (!result.whatsappSent && result.whatsappUrl) {
      if (waWin) waWin.location.href = result.whatsappUrl
      else window.open(result.whatsappUrl, '_blank')
    } else {
      waWin?.close()
    }
    navigate('/cliente/citas')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>{reagendar ? 'Reagendar cita' : 'Agendar cita'}</h2>
          <p>
            {reagendar
              ? `Vas a cambiar tu cita del ${reagendar.date} a las ${reagendar.time}. Elige un horario nuevo.`
              : activeCoupon
                ? `Cupón ${activeCoupon.code} aplicado. Un auto por horario.`
                : 'Un auto por horario. Sábados 9:00–14:00 · Lun–Vie 9:00–17:00.'}{' '}
            Al confirmar te llega WhatsApp, un aviso 1 hora antes y, si no llegas, otro mensaje para reagendar. Revisa tu teléfono en Editar perfil.
          </p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 880 }}>
        <form className="form" onSubmit={onSubmit}>
          {activeCoupon && (
            <div className="coupon-card" style={{ marginBottom: 4 }}>
              <div className="code">{activeCoupon.code}</div>
              <strong>
                {activeCoupon.discountPercent}% de descuento en {activeCoupon.serviceType}
              </strong>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                El porcentaje se aplica cuando el taller arma la cotización. Aquí no se muestra un precio.
              </p>
            </div>
          )}
          <BrandModelFields
            brand={brand}
            model={model}
            year={year}
            onBrand={setBrand}
            onModel={setModel}
            onYear={setYear}
            required
          />
          <div className="schedule-layout">
            <div>
              <div className="cal-head">
                <button className="btn secondary small" type="button" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">
                  <ChevronLeft size={16} />
                </button>
                <strong>{monthLabel(cursor.year, cursor.month)}</strong>
                <button className="btn secondary small" type="button" onClick={() => shiftMonth(1)} aria-label="Mes siguiente">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="cal-week">
                {WEEKDAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="cal-grid">
                {cells.map((day, i) => {
                  if (!day) return <span key={`e-${i}`} />
                  const t = dayTone(state.appointments, day)
                  const n = Number(day.slice(8))
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`cal-day ${t}${date === day ? ' selected' : ''}`}
                      onClick={() => onPickDay(day)}
                      disabled={t === 'past' || t === 'closed' || t === 'red'}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
              <div className="cal-legend">
                <span>
                  <i className="dot green" /> Día libre
                </span>
                <span>
                  <i className="dot yellow" /> Con citas / se llena
                </span>
                <span>
                  <i className="dot red" /> Sin espacio
                </span>
              </div>
            </div>
            <div className="slot-panel">
              <h3>
                {new Date(`${date}T12:00:00`).toLocaleDateString('es-MX', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
              {isSaturday && (tone === 'green' || tone === 'yellow') && (
                <p className="slot-note">Sábado: 9:00 a 14:00 · 1 auto por hora.</p>
              )}
              {tone === 'past' && (
                <p className="empty">
                  {date === todayKey()
                    ? 'Ya pasó el horario de atención de hoy.'
                    : 'Esa fecha ya pasó.'}
                </p>
              )}
              {tone === 'closed' && <p className="empty">Domingo cerrado.</p>}
              {tone === 'red' && <p className="empty">Este día ya no tiene horarios libres.</p>}
              {tone === 'yellow' && (
                <p className="slot-note">Quedan libres: {freeTimes.join(', ') || 'ninguno'}.</p>
              )}
              {tone === 'green' && <p className="slot-note">Día disponible. Elige un horario (1 auto).</p>}
              {(tone === 'green' || tone === 'yellow') && (
                <div className="slot-grid">
                  {daySlots.map((slot) => {
                    const taken = slotTaken(state.appointments, date, slot)
                    const open = isSlotOpenNow(date, slot)
                    const st = !open ? 'red' : slotTone(taken)
                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`slot-btn ${st}${time === slot ? ' selected' : ''}`}
                        disabled={st === 'red'}
                        onClick={() => setTime(slot)}
                      >
                        <strong>{slot}</strong>
                        <span>{!open ? 'Pasó' : st === 'red' ? 'Ocupado' : 'Libre'}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <label>
            Servicio
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              disabled={Boolean(activeCoupon)}
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Observaciones para el mecánico
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          {error && <div className="error">{error}</div>}
          {!user?.phone && (
            <div className="error">Agrega tu teléfono en Editar perfil para recibir el WhatsApp de la cita.</div>
          )}
          <button className="btn" type="submit" disabled={busy || !time}>
            {busy ? 'Agendando…' : reagendar ? 'Confirmar nuevo horario' : activeCoupon ? 'Confirmar cita con cupón' : 'Confirmar solicitud'}
          </button>
        </form>
      </div>
    </>
  )
}
