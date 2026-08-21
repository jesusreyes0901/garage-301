import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  WEEKDAYS,
  SLOT_CAPACITY,
  dayTone,
  monthCells,
  monthLabel,
  remainingTimes,
  slotTaken,
  slotTone,
  todayKey,
  workSlotsForDate,
} from '../../schedule'
import { useStore } from '../../store'
import { SERVICES } from '../../types'

export function ClienteAgendar() {
  const { state, user, addAppointment } = useStore()
  const navigate = useNavigate()
  const mine = state.vehicles.filter((v) => v.ownerId === user?.id)
  const now = new Date()
  const [vehicleId, setVehicleId] = useState(mine[0]?.id ?? '')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [date, setDate] = useState(todayKey())
  const [time, setTime] = useState('')
  const [service, setService] = useState<string>(SERVICES[0])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const selectedVehicle = mine.find((v) => v.id === vehicleId)

  useEffect(() => {
    if (selectedVehicle) {
      setBrand(selectedVehicle.brand)
      setModel(selectedVehicle.model)
      setYear(String(selectedVehicle.year))
    } else {
      setBrand('')
      setModel('')
      setYear('')
    }
  }, [selectedVehicle])

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
    if (!brand.trim() || !model.trim() || !year.trim()) {
      setError('Indica marca, modelo y año del vehículo.')
      return
    }
    const yearNum = Number(year)
    if (!Number.isFinite(yearNum) || yearNum < 1950 || yearNum > now.getFullYear() + 1) {
      setError('Escribe un año válido del vehículo.')
      return
    }
    setBusy(true)
    setError(null)
    const result = await addAppointment({
      clientId: user.id,
      vehicleId: vehicleId || '',
      date,
      time,
      service,
      notes,
      vehicleBrand: brand.trim(),
      vehicleModel: model.trim(),
      vehicleYear: yearNum,
    })
    setBusy(false)
    if (result) {
      setError(result)
      return
    }
    navigate('/cliente/citas')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Agendar cita</h2>
          <p>Elige el día en el calendario y un horario con espacio. Sábados: 9:00–14:00.</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 880 }}>
          <form className="form" onSubmit={onSubmit}>
            <label>
              Vehículo registrado (opcional)
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">Sin vehículo registrado — lo indico abajo</option>
                {mine.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} · {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 120px' }}>
              <label>
                Marca
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Nissan, Honda…"
                  required
                />
              </label>
              <label>
                Modelo
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Sentra, Civic…"
                  required
                />
              </label>
              <label>
                Año
                <input
                  type="number"
                  min={1950}
                  max={now.getFullYear() + 1}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2020"
                  required
                />
              </label>
            </div>
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
                    <i className="dot yellow" /> Se está llenando
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
                  <p className="slot-note">Sábado: horario de 9:00 a 14:00.</p>
                )}
                {tone === 'past' && <p className="empty">Esa fecha ya pasó.</p>}
                {tone === 'closed' && <p className="empty">Domingo cerrado.</p>}
                {tone === 'red' && <p className="empty">Este día ya no tiene horarios libres.</p>}
                {tone === 'yellow' && (
                  <p className="slot-note">
                    El día se está llenando. Quedan: {freeTimes.join(', ')}.
                  </p>
                )}
                {tone === 'green' && <p className="slot-note">Día disponible. Elige un horario.</p>}
                {(tone === 'green' || tone === 'yellow') && (
                  <div className="slot-grid">
                    {daySlots.map((slot) => {
                      const taken = slotTaken(state.appointments, date, slot)
                      const st = slotTone(taken)
                      const left = SLOT_CAPACITY - taken
                      return (
                        <button
                          key={slot}
                          type="button"
                          className={`slot-btn ${st}${time === slot ? ' selected' : ''}`}
                          disabled={st === 'red'}
                          onClick={() => setTime(slot)}
                        >
                          <strong>{slot}</strong>
                          <span>
                            {st === 'red' ? 'Lleno' : st === 'yellow' ? `Queda ${left}` : 'Libre'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <label>
              Servicio
              <select value={service} onChange={(e) => setService(e.target.value)}>
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
            <button className="btn" type="submit" disabled={busy || !time}>
              {busy ? 'Agendando…' : 'Confirmar solicitud'}
            </button>
          </form>
      </div>
    </>
  )
}
