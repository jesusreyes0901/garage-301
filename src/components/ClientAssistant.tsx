import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Headphones, Volume2, VolumeX, X } from 'lucide-react'
import { useStore } from '../store'

type Option = { label: string; next?: string; to?: string }

type Topic = {
  title: string
  say: string
  options: Option[]
}

const MENU: Option[] = [
  { label: 'Registrarme', next: 'registro' },
  { label: 'Iniciar sesión', next: 'login' },
  { label: 'Olvidé mi contraseña', next: 'recuperacion' },
  { label: 'Agendar una cita', next: 'agendar' },
  { label: 'Ver mis citas', next: 'citas' },
  { label: 'Cupones', next: 'cupones' },
  { label: 'Mi auto y fotos', next: 'vehiculo' },
  { label: 'Otras dudas', next: 'otras' },
]

const TOPICS: Record<string, Topic> = {
  inicio: {
    title: 'Asistente Garage 301',
    say: 'Hola. Soy tu asistente de Garage 301. Elige una opción y te explico en voz alta, paso a paso.',
    options: MENU,
  },
  registro: {
    title: 'Cómo registrarte',
    say: 'Para registrarte pulsa Regístrate. Escribe tu nombre, un usuario, tu correo, teléfono con lada y una contraseña de al menos 8 caracteres, con letras y números. Si quieres, agrega la placa y una foto de tu auto. Acepta el aviso de privacidad y pulsa Registrarme. Te llega un código de 6 dígitos al correo para activar la cuenta.',
    options: [
      { label: 'Ir a registrarme', to: '/registro' },
      { label: 'No me llega el código', next: 'verificar' },
      { label: 'Cómo iniciar sesión', next: 'login' },
      { label: 'Otras opciones', next: 'inicio' },
    ],
  },
  login: {
    title: 'Cómo iniciar sesión',
    say: 'En Iniciar sesión escribe tu usuario o tu correo, y tu contraseña. Pulsa Entrar. Si te equivocas 4 veces, el sistema te pide recuperar la cuenta con un código al correo. Si aún no tienes cuenta, elige Registrarme.',
    options: [
      { label: 'Ir a iniciar sesión', to: '/login' },
      { label: 'Quiero registrarme', next: 'registro', to: '/registro' },
      { label: 'Olvidé la contraseña', next: 'recuperacion', to: '/recuperacion' },
      { label: 'Otras opciones', next: 'inicio' },
    ],
  },
  recuperacion: {
    title: 'Recuperar contraseña',
    say: 'Pulsa Olvidaste tu contraseña. Escribe tu correo o usuario y pide el código. Revisa bandeja de entrada y spam. Con el código de 6 dígitos eliges una contraseña nueva, de al menos 8 caracteres, con letras y números.',
    options: [
      { label: 'Ir a recuperar', to: '/recuperacion' },
      { label: 'Cómo iniciar sesión', next: 'login' },
      { label: 'Otras opciones', next: 'inicio' },
    ],
  },
  verificar: {
    title: 'Código del correo',
    say: 'Después de registrarte te llega un código de 6 dígitos. Escríbelo en Verificar. Revisa spam y promociones. Si no llega, pulsa reenviar. El código vence en unos minutos.',
    options: [
      { label: 'Ir a verificar', to: '/verificar' },
      { label: 'Volver al registro', next: 'registro', to: '/registro' },
      { label: 'Otras opciones', next: 'inicio' },
    ],
  },
  agendar: {
    title: 'Agendar una cita',
    say: 'Entra a tu panel y pulsa Agendar cita. Elige el día en verde, un horario libre, el servicio y los datos de tu auto. Si tienes cupón, puedes aplicarlo al agendar. Confirma y verás la cita en Mis citas.',
    options: [
      { label: 'Ir a agendar', to: '/cliente/agendar' },
      { label: 'Ver mis citas', next: 'citas', to: '/cliente/citas' },
      { label: 'Cómo usar un cupón', next: 'cupones' },
      { label: 'Otras opciones', next: 'inicio' },
    ],
  },
  citas: {
    title: 'Mis citas',
    say: 'En Mis citas ves fecha, hora, servicio y estado. Pendiente significa que el taller aún no confirma. Cuando confirman, se crea la orden de trabajo. Si necesitas otro horario, agenda una nueva cita en un espacio verde.',
    options: [
      { label: 'Ir a mis citas', to: '/cliente/citas' },
      { label: 'Agendar otra', next: 'agendar', to: '/cliente/agendar' },
      { label: 'Otras opciones', next: 'inicio' },
    ],
  },
  cupones: {
    title: 'Cupones',
    say: 'Los cupones aparecen en tu panel cuando aplican a tu cuenta. Algunos piden 5 afinaciones. Para usarlos, entra a Cupones o al agendar elige Usar cupón. El descuento se aplica al servicio indicado.',
    options: [
      { label: 'Ir a cupones', to: '/cliente/cupones' },
      { label: 'Agendar con cupón', next: 'agendar', to: '/cliente/agendar' },
      { label: 'Otras opciones', next: 'inicio' },
    ],
  },
  vehiculo: {
    title: 'Tu auto',
    say: 'En Buscar vehículo ves tus unidades por placa. Puedes agregar otro auto con marca, modelo, año y foto. La foto ayuda al taller a identificarlo. En Observaciones ves evidencias de la reparación.',
    options: [
      { label: 'Ir a mi vehículo', to: '/cliente/vehiculo' },
      { label: 'Ver observaciones', to: '/cliente/observaciones' },
      { label: 'Otras opciones', next: 'inicio' },
    ],
  },
  otras: {
    title: 'Más ayuda',
    say: 'También puedes pedir refacciones desde tu panel, dejar observaciones con fotos, y editar tu perfil: correo, teléfono y contraseña. Si un botón no se entiende, ábrelo y yo te oriento. Elige otra duda.',
    options: [
      { label: 'Refacciones', to: '/cliente/refacciones' },
      { label: 'Editar mi perfil', to: '/cliente/perfil' },
      { label: 'Registrarme', next: 'registro' },
      { label: 'Iniciar sesión', next: 'login' },
      { label: 'Menú principal', next: 'inicio' },
    ],
  },
}

function topicForPath(path: string): string {
  if (path.startsWith('/registro')) return 'registro'
  if (path.startsWith('/login')) return 'login'
  if (path.startsWith('/recuperacion')) return 'recuperacion'
  if (path.startsWith('/verificar')) return 'verificar'
  if (path.startsWith('/cliente/agendar')) return 'agendar'
  if (path.startsWith('/cliente/citas')) return 'citas'
  if (path.startsWith('/cliente/cupones')) return 'cupones'
  if (path.startsWith('/cliente/vehiculo') || path.startsWith('/cliente/observaciones')) return 'vehiculo'
  if (path.startsWith('/cliente')) return 'inicio'
  return 'inicio'
}

function speakSpanish(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'es-MX'
  utter.rate = 1
  const voices = window.speechSynthesis.getVoices()
  const es = voices.find((v) => /es[-_]MX/i.test(v.lang)) || voices.find((v) => v.lang.toLowerCase().startsWith('es'))
  if (es) utter.voice = es
  window.speechSynthesis.speak(utter)
}

export function ClientAssistant() {
  const { user } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [topicId, setTopicId] = useState('inicio')
  const [voice, setVoice] = useState(() => localStorage.getItem('garage301-assistant-voice') !== '0')

  const hidden = user?.role === 'taller' || location.pathname.startsWith('/acceso-taller') || location.pathname.startsWith('/registro-taller')

  const topic = TOPICS[topicId] ?? TOPICS.inicio

  const startId = useMemo(() => topicForPath(location.pathname), [location.pathname])

  useEffect(() => {
    const load = () => window.speechSynthesis?.getVoices()
    load()
    window.speechSynthesis?.addEventListener('voiceschanged', load)
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', load)
      window.speechSynthesis?.cancel()
    }
  }, [])

  if (hidden) return null

  const talk = (id: string) => {
    const t = TOPICS[id] ?? TOPICS.inicio
    if (voice) speakSpanish(t.say)
  }

  const onOpen = () => {
    setTopicId(startId)
    setOpen(true)
    talk(startId)
  }

  const onClose = () => {
    setOpen(false)
    window.speechSynthesis?.cancel()
  }

  const onOption = (opt: Option) => {
    if (opt.to) navigate(opt.to)
    if (opt.next) {
      setTopicId(opt.next)
      talk(opt.next)
    }
  }

  const toggleVoice = () => {
    const next = !voice
    setVoice(next)
    localStorage.setItem('garage301-assistant-voice', next ? '1' : '0')
    if (!next) window.speechSynthesis?.cancel()
    else speakSpanish(topic.say)
  }

  return (
    <div className="assistant">
      {open && (
        <div className="assistant-panel" role="dialog" aria-label="Asistente de ayuda">
          <div className="assistant-head">
            <strong>{topic.title}</strong>
            <div className="assistant-head-actions">
              <button type="button" onClick={toggleVoice} aria-label={voice ? 'Silenciar' : 'Activar voz'}>
                {voice ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button type="button" onClick={onClose} aria-label="Cerrar">
                <X size={16} />
              </button>
            </div>
          </div>
          <p>{topic.say}</p>
          <div className="assistant-options">
            {topic.options.map((opt) => (
              <button key={opt.label} className="btn secondary small" type="button" onClick={() => onOption(opt)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <button className="assistant-fab" type="button" onClick={open ? onClose : onOpen}>
        <Headphones size={22} />
        <span>{open ? 'Cerrar ayuda' : '¿Dudas? Te ayudo'}</span>
      </button>
    </div>
  )
}
