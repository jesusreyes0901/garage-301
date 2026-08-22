import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Headphones, Volume2, VolumeX, X } from 'lucide-react'
import { useStore } from '../store'

type Option = { label: string; next?: string; to?: string }

type Topic = {
  title: string
  say: string
  options: Option[]
}

const GUEST_MENU: Option[] = [
  { label: 'Registrarme', next: 'registro' },
  { label: 'Iniciar sesión', next: 'login' },
  { label: 'Olvidé mi contraseña', next: 'recuperacion' },
  { label: 'Código del correo', next: 'verificar' },
]

const PANEL_MENU: Option[] = [
  { label: 'Mi panel', next: 'panel-resumen', to: '/cliente' },
  { label: 'Agendar cita', next: 'agendar', to: '/cliente/agendar' },
  { label: 'Mis citas', next: 'citas', to: '/cliente/citas' },
  { label: 'Cupones', next: 'cupones', to: '/cliente/cupones' },
  { label: 'Refacciones', next: 'refacciones', to: '/cliente/refacciones' },
  { label: 'Observaciones', next: 'observaciones', to: '/cliente/observaciones' },
  { label: 'Buscar vehículo', next: 'vehiculo', to: '/cliente/vehiculo' },
  { label: 'Editar perfil', next: 'perfil', to: '/cliente/perfil' },
]

const backPanel: Option = { label: 'Menú de mi panel', next: 'panel' }
const backGuest: Option = { label: 'Otras opciones', next: 'guest' }

const TOPICS: Record<string, Topic> = {
  guest: {
    title: 'Asistente Garage 301',
    say: 'Hola. Soy tu asistente de Garage 301. Aún no has iniciado sesión. Elige si quieres registrarte, entrar o recuperar tu contraseña, y te explico en voz alta.',
    options: GUEST_MENU,
  },
  registro: {
    title: 'Cómo registrarte',
    say: 'Pulsa Regístrate. Escribe nombre, usuario, correo, teléfono con lada y una contraseña de al menos 8 caracteres, con letras y números. Si quieres, agrega placa y foto de tu auto. Acepta el aviso y pulsa Registrarme. Te llega un código de 6 dígitos al correo.',
    options: [
      { label: 'Ir a registrarme', to: '/registro' },
      { label: 'No me llega el código', next: 'verificar' },
      { label: 'Cómo iniciar sesión', next: 'login' },
      backGuest,
    ],
  },
  login: {
    title: 'Cómo iniciar sesión',
    say: 'En Iniciar sesión escribe tu usuario o correo y tu contraseña. Pulsa Entrar. Si fallas 4 veces, pide un código al correo. Cuando entres, este asistente cambiará al menú de tu panel: citas, cupones, auto y más.',
    options: [
      { label: 'Ir a iniciar sesión', to: '/login' },
      { label: 'Quiero registrarme', next: 'registro', to: '/registro' },
      { label: 'Olvidé la contraseña', next: 'recuperacion', to: '/recuperacion' },
      backGuest,
    ],
  },
  recuperacion: {
    title: 'Recuperar contraseña',
    say: 'Pulsa Olvidaste tu contraseña. Escribe correo o usuario y pide el código. Revisa bandeja y spam. Con el código de 6 dígitos eliges una contraseña nueva, de al menos 8 caracteres, con letras y números.',
    options: [
      { label: 'Ir a recuperar', to: '/recuperacion' },
      { label: 'Cómo iniciar sesión', next: 'login' },
      backGuest,
    ],
  },
  verificar: {
    title: 'Código del correo',
    say: 'Después de registrarte llega un código de 6 dígitos. Escríbelo en Verificar. Revisa spam y promociones. Si no llega, pulsa reenviar. El código vence en unos minutos.',
    options: [
      { label: 'Ir a verificar', to: '/verificar' },
      { label: 'Volver al registro', next: 'registro', to: '/registro' },
      backGuest,
    ],
  },
  panel: {
    title: 'Menú de tu panel',
    say: 'Ya estás dentro. Elige una sección del menú y te explico cómo usarla. Luego puedes pedir más detalle de esa misma pantalla.',
    options: PANEL_MENU,
  },
  'panel-resumen': {
    title: 'Qué ves en Mi panel',
    say: 'Arriba salen tus vehículos, citas, solicitudes y observaciones. Si tienes cupones, aparecen en una tarjeta. A la izquierda está el menú. El botón Agendar cita te lleva directo al calendario.',
    options: [
      { label: 'Ir a mi panel', to: '/cliente' },
      { label: 'Cómo agendar', next: 'agendar', to: '/cliente/agendar' },
      { label: 'Ver cupones del inicio', next: 'cupones', to: '/cliente/cupones' },
      backPanel,
    ],
  },
  agendar: {
    title: 'Agendar cita',
    say: 'Esta pantalla sirve para pedir un horario. Elige el día, luego la hora, el servicio y los datos de tu auto. Si quieres más detalle, elige qué parte no entiendes.',
    options: [
      { label: 'Colores del calendario', next: 'agendar-colores' },
      { label: 'Elegir horario', next: 'agendar-hora' },
      { label: 'Datos del auto', next: 'agendar-auto' },
      { label: 'Usar un cupón', next: 'agendar-cupon' },
      { label: 'Confirmar la cita', next: 'agendar-confirmar' },
      backPanel,
    ],
  },
  'agendar-colores': {
    title: 'Colores del calendario',
    say: 'Verde: hay horarios libres. Amarillo: queda poco espacio. Rojo o apagado: ese día no se puede, está lleno, es domingo o ya pasó. Toca solo un día verde o amarillo. Los sábados el taller atiende hasta las 2 de la tarde.',
    options: [
      { label: 'Elegir horario', next: 'agendar-hora' },
      { label: 'Volver a agendar', next: 'agendar', to: '/cliente/agendar' },
      backPanel,
    ],
  },
  'agendar-hora': {
    title: 'Elegir horario',
    say: 'Cuando eliges el día, a la derecha salen las horas. Verde está libre. Si ya pasó la hora de hoy, no se puede. Toca un horario libre y se marca. Luego sigue con el servicio y tu auto.',
    options: [
      { label: 'Datos del auto', next: 'agendar-auto' },
      { label: 'Volver a agendar', next: 'agendar', to: '/cliente/agendar' },
      backPanel,
    ],
  },
  'agendar-auto': {
    title: 'Datos del auto',
    say: 'Indica marca, modelo y año. Puedes escribirlos o elegir de la lista. Así el taller sabe qué unidad va a recibir, aunque aún no esté dada de alta con placa.',
    options: [
      { label: 'Usar un cupón', next: 'agendar-cupon' },
      { label: 'Confirmar la cita', next: 'agendar-confirmar' },
      { label: 'Volver a agendar', next: 'agendar', to: '/cliente/agendar' },
      backPanel,
    ],
  },
  'agendar-cupon': {
    title: 'Cupón al agendar',
    say: 'Si tienes un cupón, escríbelo o entra desde Cupones con Usar cupón. Tiene que coincidir con el servicio, por ejemplo afinación. El descuento se muestra antes de confirmar. Al usarlo, ese cupón se consume.',
    options: [
      { label: 'Ver mis cupones', next: 'cupones', to: '/cliente/cupones' },
      { label: 'Confirmar la cita', next: 'agendar-confirmar' },
      { label: 'Volver a agendar', next: 'agendar', to: '/cliente/agendar' },
      backPanel,
    ],
  },
  'agendar-confirmar': {
    title: 'Confirmar la cita',
    say: 'Revisa día, hora, servicio y auto. Pulsa el botón para agendar. Te manda a Mis citas. Queda en Pendiente hasta que el taller la confirme y cree la orden.',
    options: [
      { label: 'Ir a mis citas', next: 'citas', to: '/cliente/citas' },
      { label: 'Volver a agendar', next: 'agendar', to: '/cliente/agendar' },
      backPanel,
    ],
  },
  citas: {
    title: 'Mis citas',
    say: 'Aquí ves tus citas. Elige qué quieres entender: los estados, las próximas, el historial o cómo pedir otra.',
    options: [
      { label: 'Qué significa cada estado', next: 'citas-estados' },
      { label: 'Próximas e historial', next: 'citas-listas' },
      { label: 'Agendar otra cita', next: 'agendar', to: '/cliente/agendar' },
      { label: 'La orden de trabajo', next: 'citas-orden' },
      backPanel,
    ],
  },
  'citas-estados': {
    title: 'Estados de la cita',
    say: 'Pendiente: el taller aún no confirma. Confirmada: ya hay orden de trabajo. Completada: ya te entregaron. Cancelada: esa cita ya no cuenta y el horario se liberó.',
    options: [
      { label: 'Próximas e historial', next: 'citas-listas' },
      { label: 'Volver a mis citas', next: 'citas', to: '/cliente/citas' },
      backPanel,
    ],
  },
  'citas-listas': {
    title: 'Próximas e historial',
    say: 'Arriba están las próximas, casi siempre en pendiente. Abajo el historial: las que ya confirmaron o cerraron. Ahí ves fecha, auto, servicio y si ya hay folio de orden.',
    options: [
      { label: 'La orden de trabajo', next: 'citas-orden' },
      { label: 'Volver a mis citas', next: 'citas', to: '/cliente/citas' },
      backPanel,
    ],
  },
  'citas-orden': {
    title: 'Orden de trabajo',
    say: 'Cuando el taller confirma tu cita, se crea una orden con folio, por ejemplo OT-1041. Eso significa que tu auto ya está en el flujo de reparación. El seguimiento fino lo ves también en observaciones.',
    options: [
      { label: 'Ir a observaciones', next: 'observaciones', to: '/cliente/observaciones' },
      { label: 'Volver a mis citas', next: 'citas', to: '/cliente/citas' },
      backPanel,
    ],
  },
  cupones: {
    title: 'Cupones',
    say: 'Los cupones te descuentan un servicio. Elige si quieres saber cómo verlos, cómo usarlos, o qué son las 5 afinaciones.',
    options: [
      { label: 'Cómo ver mis cupones', next: 'cupones-ver' },
      { label: 'Cómo usar uno', next: 'cupones-usar' },
      { label: 'Las 5 afinaciones', next: 'cupones-fidelidad' },
      { label: 'Por qué no veo un cupón', next: 'cupones-oculto' },
      backPanel,
    ],
  },
  'cupones-ver': {
    title: 'Ver cupones',
    say: 'En Cupones ves los que ya puedes usar, con el porcentaje o el monto. También pueden aparecer en tu panel de inicio. Si uno pide más afinaciones, sale bloqueado hasta que las completes.',
    options: [
      { label: 'Cómo usar uno', next: 'cupones-usar' },
      { label: 'Ir a cupones', to: '/cliente/cupones' },
      { label: 'Volver a cupones', next: 'cupones' },
      backPanel,
    ],
  },
  'cupones-usar': {
    title: 'Usar un cupón',
    say: 'Pulsa Usar cupón. Te lleva a agendar con el código puesto y el servicio correcto. Confirma la cita. El cupón se gasta en ese momento. El de 5 afinaciones reinicia el contador para juntar otras 5.',
    options: [
      { label: 'Agendar ahora', next: 'agendar', to: '/cliente/agendar' },
      { label: 'Las 5 afinaciones', next: 'cupones-fidelidad' },
      { label: 'Volver a cupones', next: 'cupones', to: '/cliente/cupones' },
      backPanel,
    ],
  },
  'cupones-fidelidad': {
    title: '5 afinaciones',
    say: 'Cada afinación confirmada suma 1. Al llegar a 5 se activa el cupón de descuento en afinación. Al usarlo, el contador vuelve a cero y empiezas otro ciclo.',
    options: [
      { label: 'Cómo usar uno', next: 'cupones-usar' },
      { label: 'Volver a cupones', next: 'cupones', to: '/cliente/cupones' },
      backPanel,
    ],
  },
  'cupones-oculto': {
    title: 'No veo un cupón',
    say: 'Puede estar vencido, ser de otro cliente, o pedirte más afinaciones. También deja de verse si ya lo usaste al agendar. Si el taller te asignó uno especial, aparece con tu nombre.',
    options: [
      { label: 'Las 5 afinaciones', next: 'cupones-fidelidad' },
      { label: 'Volver a cupones', next: 'cupones', to: '/cliente/cupones' },
      backPanel,
    ],
  },
  refacciones: {
    title: 'Refacciones',
    say: 'Aquí ves piezas, existencias y precios. Puedes pedir una para tu auto. Elige qué detalle quieres.',
    options: [
      { label: 'Ver el catálogo', next: 'refacciones-catalogo' },
      { label: 'Solicitar una pieza', next: 'refacciones-pedir' },
      { label: 'Estados de mi solicitud', next: 'refacciones-estados' },
      backPanel,
    ],
  },
  'refacciones-catalogo': {
    title: 'Catálogo',
    say: 'La tabla muestra nombre, código, cuántas piezas hay y el precio. Si dice agotado, el taller no tiene en este momento. Aun así puedes preguntar en observaciones.',
    options: [
      { label: 'Solicitar una pieza', next: 'refacciones-pedir' },
      { label: 'Ir a refacciones', to: '/cliente/refacciones' },
      { label: 'Volver a refacciones', next: 'refacciones' },
      backPanel,
    ],
  },
  'refacciones-pedir': {
    title: 'Solicitar pieza',
    say: 'Elige tu vehículo, la pieza y la cantidad. Pulsa solicitar. El taller ve el pedido y lo puede apartar, entregar o rechazar. Tú lo sigues en la lista de solicitudes.',
    options: [
      { label: 'Estados de mi solicitud', next: 'refacciones-estados' },
      { label: 'Ir a refacciones', to: '/cliente/refacciones' },
      { label: 'Volver a refacciones', next: 'refacciones' },
      backPanel,
    ],
  },
  'refacciones-estados': {
    title: 'Estados de la solicitud',
    say: 'Solicitada: el taller aún no responde. Apartada: te la guardaron. Entregada: ya te la dieron y descontaron del stock. Rechazada: no se pudo, por falta de pieza o por decisión del taller.',
    options: [
      { label: 'Solicitar una pieza', next: 'refacciones-pedir' },
      { label: 'Volver a refacciones', next: 'refacciones', to: '/cliente/refacciones' },
      backPanel,
    ],
  },
  observaciones: {
    title: 'Observaciones',
    say: 'Sirve para hablar con el taller con texto y fotos. Elige si quieres enviar una nota, subir fotos, o ver lo que ya escribieron.',
    options: [
      { label: 'Escribir al taller', next: 'observaciones-escribir' },
      { label: 'Subir fotos', next: 'observaciones-fotos' },
      { label: 'Ver evidencias', next: 'observaciones-ver' },
      backPanel,
    ],
  },
  'observaciones-escribir': {
    title: 'Escribir al taller',
    say: 'Elige el auto, escribe la nota y envía. La placa identifica la unidad. Usa esto para ruidos, dudas o para responder al mecánico.',
    options: [
      { label: 'Subir fotos', next: 'observaciones-fotos' },
      { label: 'Ir a observaciones', to: '/cliente/observaciones' },
      { label: 'Volver a observaciones', next: 'observaciones' },
      backPanel,
    ],
  },
  'observaciones-fotos': {
    title: 'Subir fotos',
    say: 'Puedes adjuntar fotos de tablero, fugas o daños. Se comprimen para que pesen poco. El taller también puede subir evidencias de la reparación. Toca la miniatura para verla grande.',
    options: [
      { label: 'Ver evidencias', next: 'observaciones-ver' },
      { label: 'Ir a observaciones', to: '/cliente/observaciones' },
      { label: 'Volver a observaciones', next: 'observaciones' },
      backPanel,
    ],
  },
  'observaciones-ver': {
    title: 'Ver evidencias',
    say: 'A la derecha está el historial. Cada nota muestra quién la escribió, la hora y las fotos. Toca la foto o la placa para abrir el detalle del auto.',
    options: [
      { label: 'Buscar ese vehículo', next: 'vehiculo', to: '/cliente/vehiculo' },
      { label: 'Volver a observaciones', next: 'observaciones', to: '/cliente/observaciones' },
      backPanel,
    ],
  },
  vehiculo: {
    title: 'Buscar vehículo',
    say: 'Aquí están tus autos. Puedes buscarlos, ver el detalle o dar de alta otro. Elige qué quieres hacer.',
    options: [
      { label: 'Buscar por placa o modelo', next: 'vehiculo-buscar' },
      { label: 'Agregar otro auto', next: 'vehiculo-alta' },
      { label: 'Ver detalle e historial', next: 'vehiculo-detalle' },
      { label: 'Subir foto del auto', next: 'vehiculo-foto' },
      backPanel,
    ],
  },
  'vehiculo-buscar': {
    title: 'Buscar tu auto',
    say: 'Arriba hay un buscador. Escribe placa, marca o modelo, por ejemplo ABC-1234 o Sentra. La lista se filtra sola. Toca la foto o la placa para abrir el detalle.',
    options: [
      { label: 'Ver detalle e historial', next: 'vehiculo-detalle' },
      { label: 'Ir a buscar vehículo', to: '/cliente/vehiculo' },
      { label: 'Volver a vehículo', next: 'vehiculo' },
      backPanel,
    ],
  },
  'vehiculo-alta': {
    title: 'Agregar otro auto',
    say: 'Llena placa, marca, modelo, año, color y, si puedes, una foto. La placa no se puede repetir. Al guardar, ese auto queda en tu cuenta para citas y observaciones.',
    options: [
      { label: 'Subir foto del auto', next: 'vehiculo-foto' },
      { label: 'Ir a buscar vehículo', to: '/cliente/vehiculo' },
      { label: 'Volver a vehículo', next: 'vehiculo' },
      backPanel,
    ],
  },
  'vehiculo-detalle': {
    title: 'Detalle e historial',
    say: 'Al tocar el auto ves placa, kilometraje, citas, órdenes y observaciones de esa unidad. Así no mezclas un coche con otro si tienes varios.',
    options: [
      { label: 'Ir a observaciones', next: 'observaciones', to: '/cliente/observaciones' },
      { label: 'Volver a vehículo', next: 'vehiculo', to: '/cliente/vehiculo' },
      backPanel,
    ],
  },
  'vehiculo-foto': {
    title: 'Foto del auto',
    say: 'Sube una foto del vehículo o de la placa. Ayuda al taller a reconocerlo al llegar. Usa JPG o PNG. Si no tienes foto, igual puedes darlo de alta y subirla después.',
    options: [
      { label: 'Agregar otro auto', next: 'vehiculo-alta' },
      { label: 'Volver a vehículo', next: 'vehiculo', to: '/cliente/vehiculo' },
      backPanel,
    ],
  },
  perfil: {
    title: 'Editar perfil',
    say: 'Aquí cambias tus datos de cuenta. Elige si quieres foto, correo y teléfono, o una contraseña nueva.',
    options: [
      { label: 'Cambiar foto', next: 'perfil-foto' },
      { label: 'Correo y teléfono', next: 'perfil-contacto' },
      { label: 'Cambiar contraseña', next: 'perfil-clave' },
      backPanel,
    ],
  },
  'perfil-foto': {
    title: 'Foto de perfil',
    say: 'Pulsa Subir foto y elige JPG o PNG de máximo 2 megas. Se recorta a cuadrado. Si quieres quitarla, usa Quitar y luego Guardar cambios.',
    options: [
      { label: 'Ir a editar perfil', to: '/cliente/perfil' },
      { label: 'Volver a perfil', next: 'perfil' },
      backPanel,
    ],
  },
  'perfil-contacto': {
    title: 'Correo y teléfono',
    say: 'Puedes cambiar nombre, usuario, correo, teléfono con lada y dirección. El correo y el usuario no deben estar usados por otra cuenta. Pulsa Guardar cambios para que queden en el sistema.',
    options: [
      { label: 'Cambiar contraseña', next: 'perfil-clave' },
      { label: 'Ir a editar perfil', to: '/cliente/perfil' },
      { label: 'Volver a perfil', next: 'perfil' },
      backPanel,
    ],
  },
  'perfil-clave': {
    title: 'Cambiar contraseña',
    say: 'La nueva contraseña es opcional. Si la llenas, usa al menos 8 caracteres, con letras y números, y confírmala. Si dejas esos campos vacíos, tu contraseña actual no cambia.',
    options: [
      { label: 'Ir a editar perfil', to: '/cliente/perfil' },
      { label: 'Volver a perfil', next: 'perfil' },
      backPanel,
    ],
  },
}

function sectionForPath(path: string, loggedIn: boolean): string {
  if (!loggedIn) {
    if (path.startsWith('/registro')) return 'registro'
    if (path.startsWith('/login')) return 'login'
    if (path.startsWith('/recuperacion')) return 'recuperacion'
    if (path.startsWith('/verificar')) return 'verificar'
    return 'guest'
  }
  if (path.startsWith('/cliente/agendar')) return 'agendar'
  if (path.startsWith('/cliente/citas')) return 'citas'
  if (path.startsWith('/cliente/cupones')) return 'cupones'
  if (path.startsWith('/cliente/refacciones')) return 'refacciones'
  if (path.startsWith('/cliente/observaciones')) return 'observaciones'
  if (path.startsWith('/cliente/vehiculo')) return 'vehiculo'
  if (path.startsWith('/cliente/perfil')) return 'perfil'
  if (path.startsWith('/cliente')) return 'panel'
  return 'panel'
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
  const loggedIn = user?.role === 'cliente'
  const [open, setOpen] = useState(false)
  const [topicId, setTopicId] = useState('guest')
  const [voice, setVoice] = useState(() => localStorage.getItem('garage301-assistant-voice') !== '0')
  const prevUserId = useRef<string | null>(null)

  const hidden =
    user?.role === 'taller' ||
    location.pathname.startsWith('/acceso-taller') ||
    location.pathname.startsWith('/registro-taller')

  const startId = useMemo(
    () => sectionForPath(location.pathname, loggedIn),
    [location.pathname, loggedIn],
  )

  const topic = useMemo(() => {
    const base = TOPICS[topicId] ?? (loggedIn ? TOPICS.panel : TOPICS.guest)
    if (topicId === 'panel' && user?.name) {
      const first = user.name.split(' ')[0]
      return {
        ...base,
        say: `Hola ${first}. Ya iniciaste sesión. Este es el menú de tu panel: mi panel, agendar cita, mis citas, cupones, refacciones, observaciones, buscar vehículo y editar perfil. Elige una y luego puedes pedir más detalle.`,
      }
    }
    return base
  }, [topicId, loggedIn, user?.name])

  useEffect(() => {
    const load = () => window.speechSynthesis?.getVoices()
    load()
    window.speechSynthesis?.addEventListener('voiceschanged', load)
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', load)
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    const id = user?.role === 'cliente' ? user.id : null
    const justLoggedIn = Boolean(id && prevUserId.current !== id)
    prevUserId.current = id
    if (!justLoggedIn) return
    setTopicId('panel')
    if (open && voice) {
      const first = user?.name.split(' ')[0] || ''
      speakSpanish(
        `Hola ${first}. Ya estás dentro. Elige una sección de tu panel y te explico cómo usarla.`,
      )
    }
  }, [user?.id, user?.role, user?.name, open, voice])

  if (hidden) return null

  const talk = (id: string) => {
    if (!voice) return
    if (id === 'panel' && user?.name) {
      const first = user.name.split(' ')[0]
      speakSpanish(
        `Hola ${first}. Ya iniciaste sesión. Este es el menú de tu panel: mi panel, agendar cita, mis citas, cupones, refacciones, observaciones, buscar vehículo y editar perfil. Elige una y luego puedes pedir más detalle.`,
      )
      return
    }
    const t = TOPICS[id] ?? (loggedIn ? TOPICS.panel : TOPICS.guest)
    speakSpanish(t.say)
  }

  const onOpen = () => {
    const id = loggedIn ? startId : sectionForPath(location.pathname, false)
    setTopicId(id)
    setOpen(true)
    talk(id)
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
        <span>{open ? 'Cerrar ayuda' : loggedIn ? 'Ayuda de mi panel' : '¿Dudas? Te ayudo'}</span>
      </button>
    </div>
  )
}
