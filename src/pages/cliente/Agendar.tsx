import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  WORK_SLOTS,
  WEEKDAYS,
  SLOT_CAPACITY,
  dayTone,
  monthCells,
  monthLabel,
  remainingTimes,
  slotTaken,
  slotTone,
  todayKey,
} from '../../schedule'
import { useStore } from '../../store'
import { SERVICES } from '../../types'

export function ClienteAgendar() {
  const { state, user, addAppointment } = useStore()
  const navigate = useNavigate()
  const mine = state.vehicles.filter((v) => v.ownerId === user?.id)
  const now = new Date()
  const [vehicleId, setVehicleId] = useState(mine[0]?.id ?? '')
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [date, setDate] = useState(todayKey())
  const [time, setTime] = useState('')
  const [service, setService] = useState<string>(SERVICES[0])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const cells = useMemo(() => monthCells(cursor.year, cursor.month), [cursor])
  const tone = dayTone(state.appointments, date)
  const freeTimes = remainingTimes(state.appointments, date)

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
    if (!user || !vehicleId) return
    if (!time) {
      setError('Elige un horario disponible.')
      return
    }
    setBusy(true)
    setError(null)
    const result = await addAppointment({
      clientId: user.id,
      vehicleId,
      date,
      time,
      service,
      notes,
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
          <p>Elige el día en el calendario y un horario con espacio.</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 880 }}>
        {mine.length === 0 ? (
          <p className="empty">No hay vehículos asociados a tu cuenta.</p>
        ) : (
          <form className="form" onSubmit={onSubmit}>
            <label>
              Vehículo
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                {mine.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} · {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </label>
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
                    {WORK_SLOTS.map((slot) => {
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
        )}
      </div>
    </>
  )
}
