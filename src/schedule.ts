import type { Appointment } from './types'

/** Lunes a viernes: 9:00–17:00 */
export const WEEKDAY_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
/** Sábados: 9:00–14:00 */
export const SATURDAY_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00']
/** @deprecated usa workSlotsForDate */
export const WORK_SLOTS = WEEKDAY_SLOTS
/** Un solo auto por horario */
export const SLOT_CAPACITY = 1
export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export type DayTone = 'green' | 'yellow' | 'red' | 'closed' | 'past'
export type SlotTone = 'green' | 'yellow' | 'red'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function toDayKey(value: string) {
  return value.slice(0, 10)
}

export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function dayOfWeek(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

export function workSlotsForDate(date: string) {
  return dayOfWeek(date) === 6 ? SATURDAY_SLOTS : WEEKDAY_SLOTS
}

export function slotOf(time: string, date?: string) {
  const hhmm = String(time || '').slice(0, 5)
  const slots = date ? workSlotsForDate(date) : WEEKDAY_SLOTS
  if (slots.includes(hhmm)) return hhmm
  const hour = `${hhmm.slice(0, 2)}:00`
  return slots.includes(hour) ? hour : hhmm
}

export function slotMinutes(time: string) {
  const [h, m] = String(time || '0:0').slice(0, 5).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

/** Horario aún reservable (no pasó la hora de inicio del slot). */
export function isSlotOpenNow(date: string, time: string) {
  const day = toDayKey(date)
  const today = todayKey()
  if (day < today) return false
  if (day > today) return true
  return slotMinutes(time) > nowMinutes()
}

/** Citas que aún ocupan bahía / horario. */
function occupiesSlot(a: Appointment) {
  return a.status !== 'cancelada' && a.status !== 'completada' && a.status !== 'no_asistio'
}

export function slotTaken(appointments: Appointment[], date: string, time: string) {
  return appointments.filter(
    (a) => occupiesSlot(a) && toDayKey(a.date) === date && slotOf(a.time, date) === time,
  ).length
}

export function slotTone(taken: number): SlotTone {
  if (taken >= SLOT_CAPACITY) return 'red'
  if (taken > 0) return 'yellow'
  return 'green'
}

export function remainingTimes(appointments: Appointment[], date: string) {
  return workSlotsForDate(date).filter(
    (time) => isSlotOpenNow(date, time) && slotTaken(appointments, date, time) < SLOT_CAPACITY,
  )
}

export function dayTone(appointments: Appointment[], date: string): DayTone {
  const [y, m, d] = date.split('-').map(Number)
  const day = new Date(y, m - 1, d)
  const startToday = new Date()
  startToday.setHours(0, 0, 0, 0)
  if (day < startToday) return 'past'
  if (day.getDay() === 0) return 'closed'

  const slots = workSlotsForDate(date)
  if (toDayKey(date) === todayKey()) {
    const last = slots[slots.length - 1]
    if (nowMinutes() >= slotMinutes(last)) return 'past'
  }

  const left = remainingTimes(appointments, date)
  if (left.length === 0) return 'red'
  if (left.length === slots.filter((t) => isSlotOpenNow(date, t)).length) return 'green'
  return 'yellow'
}

export function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1)
  const mondayIndex = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < mondayIndex; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${year}-${pad(month + 1)}-${pad(day)}`)
  }
  while (cells.length % 7) cells.push(null)
  return cells
}

export function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}
