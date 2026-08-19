import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mysql from 'mysql2/promise'

const ON_CLOUD = Boolean(
  process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_ENVIRONMENT_ID ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.RENDER ||
    process.env.RENDER_SERVICE_ID,
)
if (!ON_CLOUD) dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = Number(process.env.PORT || 3001)
const JWT_SECRET = process.env.JWT_SECRET || 'garage301-dev'
const MAX_ATTEMPTS = 4
const locks = new Map()

function envFirst(...keys) {
  for (const key of keys) {
    const value = process.env[key]
    if (value != null && String(value).trim() !== '') return String(value).trim()
  }
  return ''
}

function isLoopback(host) {
  return !host || host === '127.0.0.1' || host === 'localhost' || host === '::1'
}

function needsSsl(host) {
  if (envFirst('MYSQL_SSL', 'MYSQLSSL') === 'false') return false
  if (ON_CLOUD) return true
  if (envFirst('MYSQL_SSL', 'MYSQLSSL') === 'true') return true
  return /aiven|railway|amazonaws|azure|render/i.test(host || '')
}

function readMysqlConfig() {
  const urlRaw = envFirst('MYSQL_URL', 'DATABASE_URL', 'MYSQL_PRIVATE_URL', 'MYSQL_PUBLIC_URL')
  if (urlRaw) {
    try {
      const u = new URL(urlRaw.replace(/^mysql:\/\//, 'mysql://'))
      if (u.protocol.startsWith('mysql') && !isLoopback(u.hostname)) {
        const dbFromUrl = decodeURIComponent((u.pathname || '').replace(/^\//, '').split('?')[0] || '')
        return {
          host: u.hostname,
          port: Number(u.port || 3306),
          user: decodeURIComponent(u.username),
          password: decodeURIComponent(u.password),
          database: dbFromUrl || undefined,
        }
      }
    } catch {
      /* usa variables sueltas */
    }
  }
  const host = envFirst('MYSQLHOST', 'MYSQL_HOST')
  const aiven = /aiven/i.test(host)
  return {
    host: isLoopback(host) ? host || '127.0.0.1' : host,
    port: Number(envFirst('MYSQLPORT', 'MYSQL_PORT') || 3306),
    user: envFirst('MYSQLUSER', 'MYSQL_USER') || 'root',
    password: envFirst('MYSQLPASSWORD', 'MYSQL_PASSWORD'),
    database: envFirst('MYSQLDATABASE', 'MYSQL_DATABASE') || (aiven ? 'defaultdb' : 'garage301'),
  }
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    password: '',
    role: row.role,
    phone: row.phone || '',
    address: row.address || '',
    avatar: row.avatar || '',
  }
}

const WORK_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const SLOT_CAPACITY = 2

function tokenFor(user) {
  return jwt.sign({ role: user.role }, JWT_SECRET, { expiresIn: '8h', subject: String(user.id) })
}

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const raw = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!raw) return res.status(401).json({ error: 'Inicia sesión.' })
  try {
    const payload = jwt.verify(raw, JWT_SECRET)
    const id = String(payload.sub || payload.id || '')
    if (!id) return res.status(401).json({ error: 'Sesión inválida. Entra de nuevo.' })
    req.user = { id, role: payload.role }
    next()
  } catch {
    return res.status(401).json({ error: 'Sesión vencida. Entra de nuevo.' })
  }
}

function normalizeTime(value) {
  const raw = String(value || '').slice(0, 5)
  const [h, m] = raw.split(':')
  if (!h) return ''
  return `${String(Number(h)).padStart(2, '0')}:${(m || '00').padStart(2, '0')}`
}

async function getState(pool) {
  const [users] = await pool.query('SELECT * FROM users')
  const [vehicles] = await pool.query('SELECT * FROM vehicles')
  const [appointments] = await pool.query('SELECT * FROM appointments')
  const [orders] = await pool.query('SELECT * FROM work_orders')
  const [orderParts] = await pool.query('SELECT * FROM order_parts')
  const [parts] = await pool.query('SELECT * FROM parts')
  const [partRequests] = await pool.query('SELECT * FROM part_requests')
  const [observations] = await pool.query('SELECT * FROM observations')

  return {
    users: users.map(publicUser),
    vehicles: vehicles.map((v) => ({
      id: v.id,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      year: v.year,
      color: v.color,
      vin: v.vin || '',
      ownerId: v.owner_id,
      mileage: v.mileage,
      status: v.status,
      photo: v.photo || '',
    })),
    appointments: appointments.map((a) => ({
      id: a.id,
      clientId: a.client_id,
      vehicleId: a.vehicle_id || '',
      date: typeof a.date === 'string' ? a.date.slice(0, 10) : a.date.toISOString().slice(0, 10),
      time: String(a.time).slice(0, 5),
      service: a.service,
      status: a.status,
      notes: a.notes || '',
      orderId: a.order_id || undefined,
    })),
    orders: orders.map((o) => ({
      id: o.id,
      folio: o.folio,
      vehicleId: o.vehicle_id,
      clientId: o.client_id,
      mechanic: o.mechanic,
      description: o.description,
      status: o.status,
      createdAt: new Date(o.created_at).toISOString(),
      labor: Number(o.labor),
      parts: orderParts
        .filter((p) => p.order_id === o.id)
        .map((p) => ({ partId: p.part_id, qty: p.qty })),
    })),
    parts: parts.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      stock: p.stock,
      minStock: p.min_stock,
      price: Number(p.price),
      cost: Number(p.cost),
    })),
    partRequests: partRequests.map((r) => ({
      id: r.id,
      clientId: r.client_id,
      vehicleId: r.vehicle_id,
      partId: r.part_id,
      qty: r.qty,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
    })),
    observations: observations.map((o) => ({
      id: o.id,
      vehicleId: o.vehicle_id,
      authorId: o.author_id,
      text: o.text,
      photos: o.photos ? JSON.parse(o.photos) : [],
      createdAt: new Date(o.created_at).toISOString(),
    })),
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  username VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(120) NOT NULL,
  role ENUM('taller','cliente') NOT NULL,
  phone VARCHAR(48) DEFAULT '',
  address VARCHAR(200) DEFAULT '',
  avatar LONGTEXT,
  recovery_hash VARCHAR(120) DEFAULT NULL,
  recovery_expires DATETIME DEFAULT NULL,
  recovery_tries INT DEFAULT 0,
  email_verified TINYINT NOT NULL DEFAULT 1,
  verify_hash VARCHAR(120) DEFAULT NULL,
  verify_expires DATETIME DEFAULT NULL,
  verify_tries INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(32) PRIMARY KEY,
  plate VARCHAR(20) NOT NULL UNIQUE,
  brand VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  year INT NOT NULL,
  color VARCHAR(40) DEFAULT '',
  vin VARCHAR(64) DEFAULT '',
  owner_id VARCHAR(32) NOT NULL,
  mileage INT DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  photo LONGTEXT,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS parts (
  id VARCHAR(32) PRIMARY KEY,
  sku VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) DEFAULT 'General',
  stock INT DEFAULT 0,
  min_stock INT DEFAULT 1,
  price DECIMAL(10,2) DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0
);
CREATE TABLE IF NOT EXISTS work_orders (
  id VARCHAR(32) PRIMARY KEY,
  folio VARCHAR(20) NOT NULL UNIQUE,
  vehicle_id VARCHAR(32) DEFAULT NULL,
  client_id VARCHAR(32) NOT NULL,
  mechanic VARCHAR(120) DEFAULT '',
  description TEXT,
  status VARCHAR(30) NOT NULL,
  created_at DATETIME NOT NULL,
  labor DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (client_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS order_parts (
  order_id VARCHAR(32) NOT NULL,
  part_id VARCHAR(32) NOT NULL,
  qty INT NOT NULL,
  PRIMARY KEY (order_id, part_id),
  FOREIGN KEY (order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (part_id) REFERENCES parts(id)
);
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(32) PRIMARY KEY,
  client_id VARCHAR(32) NOT NULL,
  vehicle_id VARCHAR(32) DEFAULT NULL,
  date DATE NOT NULL,
  time VARCHAR(8) NOT NULL,
  service VARCHAR(120) NOT NULL,
  status VARCHAR(30) NOT NULL,
  notes TEXT,
  order_id VARCHAR(32) DEFAULT NULL,
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);
CREATE TABLE IF NOT EXISTS part_requests (
  id VARCHAR(32) PRIMARY KEY,
  client_id VARCHAR(32) NOT NULL,
  vehicle_id VARCHAR(32) NOT NULL,
  part_id VARCHAR(32) NOT NULL,
  qty INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (part_id) REFERENCES parts(id)
);
CREATE TABLE IF NOT EXISTS observations (
  id VARCHAR(32) PRIMARY KEY,
  vehicle_id VARCHAR(32) NOT NULL,
  author_id VARCHAR(32) NOT NULL,
  text TEXT,
  photos LONGTEXT,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);
`

async function seedIfEmpty(pool) {
  const [rows] = await pool.query('SELECT COUNT(*) AS n FROM users')
  if (rows[0].n > 0) return
  const hashTaller = await bcrypt.hash('taller123', 10)
  const hashCliente = await bcrypt.hash('cliente123', 10)
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  await pool.query(
    `INSERT INTO users (id,name,username,email,password,role,phone,address) VALUES
    ('u-taller','Carlos Mendoza','cmendoza','admin@taller.com',?,'taller','555-100-2000','Av. Industria 301, Garage 301'),
    ('u-cliente','Ana Ruiz','anaruiz','ana@correo.com',?,'cliente','555-310-4488','Calle Roble 14'),
    ('u-cliente-2','Luis Herrera','lherrera','luis@correo.com',?,'cliente','555-220-1199','Insurgentes 890')`,
    [hashTaller, hashCliente, hashCliente],
  )
  await pool.query(`INSERT INTO vehicles (id,plate,brand,model,year,color,vin,owner_id,mileage,status,photo) VALUES
    ('v1','ABC-1234','Nissan','Sentra',2020,'Plata','3N1AB8CV5LY123456','u-cliente',64210,'en_taller',''),
    ('v2','XYZ-7788','Volkswagen','Jetta',2018,'Negro','3VW2B7AJ8JM654321','u-cliente',98140,'activo',''),
    ('v3','HND-4410','Honda','Civic',2022,'Rojo','19XFC2F59NE987654','u-cliente-2',21500,'en_taller','')`)
  await pool.query(`INSERT INTO parts (id,sku,name,category,stock,min_stock,price,cost) VALUES
    ('p1','FRN-001','Kit balatas delanteras Sentra','Frenos',6,3,1280,780),
    ('p2','FRN-014','Disco de freno 280 mm','Frenos',4,2,890,520),
    ('p3','ACE-010','Aceite sintético 5W-30 4L','Lubricantes',18,8,620,380),
    ('p4','FIL-022','Filtro de aire Civic','Filtros',1,3,340,180),
    ('p5','SUS-008','Amortiguador delantero Jetta','Suspensión',2,2,2150,1320),
    ('p6','ELE-031','Batería 12V 600 CCA','Eléctrico',5,2,1890,1100)`)
  await pool.query(`INSERT INTO work_orders (id,folio,vehicle_id,client_id,mechanic,description,status,created_at,labor) VALUES
    ('o1','OT-1042','v1','u-cliente','Miguel Torres','Cambio de balatas delanteras y rectificado de discos','en_proceso',NOW(),850),
    ('o2','OT-1043','v3','u-cliente-2','Sofía Díaz','Afinación mayor + diagnóstico de sensores','entregada',NOW(),1200)`)
  await pool.query(`INSERT INTO order_parts (order_id,part_id,qty) VALUES ('o1','p1',1),('o1','p2',2),('o2','p4',1)`)
  await pool.query(
    `INSERT INTO appointments (id,client_id,vehicle_id,date,time,service,status,notes,order_id) VALUES
    ('a1','u-cliente','v1',?,'09:30','Frenos','confirmada','Chirrido al frenar en frío','o1'),
    ('a2','u-cliente-2','v3',?,'11:00','Afinación mayor','en_proceso','Mantenimiento de 20,000 km',NULL),
    ('a3','u-cliente','v2',?,'16:00','Cambio de aceite','pendiente','',NULL)`,
    [today, today, tomorrow],
  )
  await pool.query(
    `INSERT INTO part_requests (id,client_id,vehicle_id,part_id,qty,status,created_at) VALUES
    ('r1','u-cliente','v1','p1',1,'apartada',NOW())`,
  )
  await pool.query(
    `INSERT INTO observations (id,vehicle_id,author_id,text,photos,created_at) VALUES
    ('ob1','v1','u-taller','Discos rayados. Se recomienda rectificado y no solo cambio de balatas.','[]',DATE_SUB(NOW(), INTERVAL 1 HOUR)),
    ('ob2','v1','u-cliente','El ruido se nota más al bajar pendientes. Favor de revisar el líquido de frenos.','[]',DATE_SUB(NOW(), INTERVAL 30 MINUTE))`,
  )
  console.log('MySQL: datos de prueba cargados (taller123 / cliente123).')
}

async function wipeDemoSeed(pool) {
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE id IN ('u-taller','u-cliente','u-cliente-2')",
  )
  if (!rows.length) return
  await pool.query("DELETE FROM observations WHERE id IN ('ob1','ob2')")
  await pool.query("DELETE FROM part_requests WHERE id = 'r1'")
  await pool.query("DELETE FROM appointments WHERE id IN ('a1','a2','a3')")
  await pool.query("DELETE FROM order_parts WHERE order_id IN ('o1','o2')")
  await pool.query("DELETE FROM work_orders WHERE id IN ('o1','o2')")
  await pool.query("DELETE FROM vehicles WHERE id IN ('v1','v2','v3')")
  await pool.query("DELETE FROM parts WHERE id IN ('p1','p2','p3','p4','p5','p6')")
  await pool.query("DELETE FROM users WHERE id IN ('u-taller','u-cliente','u-cliente-2')")
  console.log('Datos de demostración eliminados. El taller queda con tus cuentas reales.')
}

async function applySchema(pool) {
  const statements = SCHEMA.split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const sql of statements) {
    await pool.query(sql)
  }
}

async function migrate(pool) {
  const alters = [
    'ALTER TABLE users ADD COLUMN email_verified TINYINT NOT NULL DEFAULT 1',
    'ALTER TABLE users ADD COLUMN verify_hash VARCHAR(120) DEFAULT NULL',
    'ALTER TABLE users ADD COLUMN verify_expires DATETIME DEFAULT NULL',
    'ALTER TABLE users ADD COLUMN verify_tries INT DEFAULT 0',
    'ALTER TABLE users MODIFY phone VARCHAR(48) DEFAULT ""',
    'ALTER TABLE appointments MODIFY vehicle_id VARCHAR(32) NULL',
    'ALTER TABLE work_orders MODIFY vehicle_id VARCHAR(32) NULL',
  ]
  for (const sql of alters) {
    try {
      await pool.query(sql)
    } catch {
      /* columna o tipo ya aplicado */
    }
  }
}

function validEmail(email) {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)
}

function validPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 18
}

async function sendGarageEmail(to, subject, message) {
  console.log(`Correo (${subject}) para ${to}: ${message}`)
  const key = process.env.RESEND_API_KEY
  if (key) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Garage 301 <onboarding@resend.dev>',
          to,
          subject,
          text: message,
        }),
      })
      return
    } catch {
      /* continúa con FormSubmit */
    }
  }
  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _subject: subject, message }),
    })
  } catch {
    /* el código queda en los logs del servidor */
  }
}

async function issueVerifyCode(pool, userId, email) {
  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  const hash = await bcrypt.hash(code, 10)
  await pool.query(
    'UPDATE users SET verify_hash=?, verify_expires=DATE_ADD(NOW(), INTERVAL 15 MINUTE), verify_tries=0, email_verified=0 WHERE id=?',
    [hash, userId],
  )
  await sendGarageEmail(
    email,
    'Verifica tu correo — Garage 301',
    `Hola,\n\nTu código de verificación de Garage 301 es: ${code}\nVence en 15 minutos.\n\nSi no creaste esta cuenta, ignora este mensaje.`,
  )
}

async function start() {
  const mysqlKeys = Object.keys(process.env)
    .filter((k) => /MYSQL|DATABASE_URL/i.test(k))
    .sort()
  console.log('Variables MySQL visibles:', mysqlKeys.join(', ') || '(ninguna)')

  const parsed = readMysqlConfig()
  const dbName = parsed.database || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'garage301'
  const dbConfig = {
    host: parsed.host,
    port: parsed.port,
    user: parsed.user,
    password: parsed.password,
    multipleStatements: false,
    connectTimeout: 20000,
  }
  if (ON_CLOUD || needsSsl(dbConfig.host)) {
    dbConfig.ssl = { rejectUnauthorized: false }
  }

  if (ON_CLOUD && isLoopback(dbConfig.host)) {
    console.error('\nNo llegó el host de MySQL (sigue en 127.0.0.1).')
    console.error('En Render → Environment agrega MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE=defaultdb.')
    console.error('Cópialos de Aiven → Overview. El puerto de Aiven NO suele ser 3306.')
    console.error('Variables vistas:', mysqlKeys.join(', ') || '(ninguna)')
    process.exit(1)
  }

  console.log(
    `Conectando MySQL host=${dbConfig.host} puerto=${dbConfig.port} db=${dbName} user=${dbConfig.user} ssl=${Boolean(dbConfig.ssl)}`,
  )

  try {
    if (!ON_CLOUD && !needsSsl(dbConfig.host)) {
      const admin = await mysql.createConnection(dbConfig)
      await admin.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      )
      await admin.end()
    }
  } catch (err) {
    console.error('\nNo se pudo conectar a MySQL.')
    console.error('Host:', dbConfig.host, 'Usuario:', dbConfig.user, 'Puerto:', dbConfig.port)
    console.error(err.message)
    process.exit(1)
  }

  const pool = mysql.createPool({ ...dbConfig, database: dbName, waitForConnections: true })
  let lastErr
  for (let i = 1; i <= 8; i++) {
    try {
      await pool.query('SELECT 1')
      lastErr = null
      break
    } catch (err) {
      lastErr = err
      console.error(`Esperando MySQL (${i}/8) ${dbConfig.host}:${dbConfig.port}…`, err.message)
      await new Promise((r) => setTimeout(r, 3000))
    }
  }
  if (lastErr) {
    console.error('\nNo se pudo abrir la base de datos', dbName)
    console.error('Host:', dbConfig.host, 'Puerto:', dbConfig.port, 'Usuario:', dbConfig.user)
    console.error(lastErr.message)
    process.exit(1)
  }
  await applySchema(pool)
  await migrate(pool)
  if (ON_CLOUD) await wipeDemoSeed(pool)
  else await seedIfEmpty(pool)

  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '8mb' }))

  app.get('/api/health', async (_req, res) => {
    res.json({ ok: true, database: dbName })
  })

  app.post('/api/auth/login', async (req, res) => {
    const identifier = String(req.body.identifier || '').trim()
    const password = String(req.body.password || '')
    const expectedRole = req.body.expectedRole
    const key = identifier.toLowerCase()
    const lock = locks.get(key)
    if (lock?.attempts >= MAX_ATTEMPTS) {
      const [users] = await pool.query('SELECT * FROM users WHERE email=? OR username=? LIMIT 1', [key, key])
      const found = users[0]
      return res.json({
        ok: false,
        recover: true,
        email: found?.email || identifier,
        message: 'Superaste 4 intentos. Recupera tu cuenta con el código al correo.',
      })
    }
    const [users] = await pool.query('SELECT * FROM users WHERE email=? OR username=? LIMIT 1', [key, key])
    const found = users[0]
    const match = found ? await bcrypt.compare(password, found.password) : false
    if (!found || !match) {
      const attempts = (lock?.attempts || 0) + 1
      locks.set(key, { attempts })
      if (attempts >= MAX_ATTEMPTS) {
        return res.json({
          ok: false,
          recover: true,
          email: found?.email || identifier,
          message: 'Superaste 4 intentos. Recupera tu cuenta con el código al correo.',
        })
      }
      return res.json({
        ok: false,
        message: `Correo, usuario o contraseña incorrectos. Intentos restantes: ${MAX_ATTEMPTS - attempts}.`,
      })
    }
    if (found.role !== expectedRole) {
      return res.json({
        ok: false,
        message:
          expectedRole === 'cliente'
            ? 'Este portal es solo para clientes. El personal entra por el acceso del taller.'
            : 'Este acceso es exclusivo del personal de Garage 301.',
      })
    }
    if (Number(found.email_verified) === 0) {
      return res.json({
        ok: false,
        needsVerify: true,
        email: found.email,
        message: 'Verifica tu correo para entrar. Te enviamos un código de 6 dígitos.',
      })
    }
    locks.delete(key)
    const state = await getState(pool)
    res.json({ ok: true, token: tokenFor(found), user: publicUser(found), state })
  })

  app.post('/api/auth/register', async (req, res) => {
    const name = String(req.body.name || '').trim()
    const username = String(req.body.username || '').trim().toLowerCase()
    const email = String(req.body.email || '').trim().toLowerCase()
    const phone = String(req.body.phone || '').trim()
    const password = String(req.body.password || '')
    const role = req.body.role === 'taller' ? 'taller' : 'cliente'
    if (!name) return res.json({ error: 'El nombre es obligatorio.' })
    if (username.length < 3) return res.json({ error: 'El usuario debe tener al menos 3 caracteres.' })
    if (!/^[a-z0-9._-]+$/.test(username)) return res.json({ error: 'Usuario inválido.' })
    if (!validEmail(email)) return res.json({ error: 'Escribe un correo válido, por ejemplo  nombre@gmail.com' })
    if (!validPhone(phone)) return res.json({ error: 'El teléfono debe incluir lada de país y número local.' })
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return res.json({ error: 'La contraseña debe tener al menos 8 caracteres, con letras y números.' })
    }
    const [taken] = await pool.query('SELECT id FROM users WHERE username=? OR email=? LIMIT 1', [username, email])
    if (taken.length) return res.json({ error: 'Ese usuario o correo ya está registrado.' })
    const id = uid('u')
    const hash = await bcrypt.hash(password, 10)
    await pool.query(
      'INSERT INTO users (id,name,username,email,password,role,phone,address,avatar,email_verified) VALUES (?,?,?,?,?,?,?,?,?,0)',
      [id, name, username, email, hash, role, phone, '', ''],
    )
    const vehicle = req.body.vehicle
    if (role === 'cliente' && vehicle?.plate) {
      const plate = String(vehicle.plate).trim().toUpperCase()
      const [exists] = await pool.query('SELECT id FROM vehicles WHERE plate=?', [plate])
      if (exists.length) return res.json({ error: 'Esa placa ya está registrada.' })
      await pool.query(
        'INSERT INTO vehicles (id,plate,brand,model,year,color,vin,owner_id,mileage,status,photo) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [
          uid('v'),
          plate,
          String(vehicle.brand || '').trim(),
          String(vehicle.model || '').trim(),
          Number(vehicle.year) || 2018,
          String(vehicle.color || '').trim() || 'Sin especificar',
          '',
          id,
          0,
          'activo',
          vehicle.photo || '',
        ],
      )
    }
    await issueVerifyCode(pool, id, email)
    res.json({ verifyEmail: email })
  })

  app.post('/api/auth/verify', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase()
    const code = String(req.body.code || '').trim()
    const [users] = await pool.query('SELECT * FROM users WHERE email=? LIMIT 1', [email])
    const found = users[0]
    if (!found) return res.json({ error: 'No encontramos ese correo.' })
    if (Number(found.email_verified) === 1) {
      const state = await getState(pool)
      return res.json({ token: tokenFor(found), user: publicUser(found), state })
    }
    if (!found.verify_hash) return res.json({ error: 'Pide un código nuevo.' })
    if (found.verify_expires && new Date(found.verify_expires) < new Date()) {
      return res.json({ error: 'El código ya venció. Reenvíalo.' })
    }
    if (found.verify_tries >= 5) return res.json({ error: 'Demasiados intentos. Reenvía un código nuevo.' })
    const ok = await bcrypt.compare(code, found.verify_hash)
    if (!ok) {
      await pool.query('UPDATE users SET verify_tries=verify_tries+1 WHERE id=?', [found.id])
      return res.json({ error: 'El código no es correcto.' })
    }
    await pool.query(
      'UPDATE users SET email_verified=1, verify_hash=NULL, verify_expires=NULL, verify_tries=0 WHERE id=?',
      [found.id],
    )
    const state = await getState(pool)
    res.json({ token: tokenFor(found), user: publicUser(found), state })
  })

  app.post('/api/auth/verify/resend', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase()
    if (!validEmail(email)) return res.json({ error: 'Correo no válido.' })
    const [users] = await pool.query('SELECT * FROM users WHERE email=? LIMIT 1', [email])
    const found = users[0]
    if (found && Number(found.email_verified) === 0) await issueVerifyCode(pool, found.id, found.email)
    res.json({ ok: true })
  })

  app.post('/api/auth/recovery', async (req, res) => {
    const id = String(req.body.identifier || '').trim().toLowerCase()
    if (!id) return res.json({ error: 'Ingresa tu correo o usuario.' })
    const [users] = await pool.query('SELECT * FROM users WHERE email=? OR username=? LIMIT 1', [id, id])
    const found = users[0]
    if (found) {
      const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
      const hash = await bcrypt.hash(code, 10)
      await pool.query(
        'UPDATE users SET recovery_hash=?, recovery_expires=DATE_ADD(NOW(), INTERVAL 10 MINUTE), recovery_tries=0 WHERE id=?',
        [hash, found.id],
      )
      console.log(`Código de recuperación para ${found.email}: ${code}`)
      await sendGarageEmail(
        found.email,
        'Código de recuperación Garage 301',
        `Tu código de Garage 301 es: ${code}\nVence en 10 minutos.`,
      )
    }
    res.json({ ok: true })
  })

  app.post('/api/auth/recovery/confirm', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase()
    const code = String(req.body.code || '').trim()
    const newPassword = String(req.body.newPassword || '')
    const [users] = await pool.query('SELECT * FROM users WHERE email=? LIMIT 1', [email])
    const found = users[0]
    if (!found?.recovery_hash) return res.json({ error: 'Pide un código primero.' })
    if (found.recovery_expires && new Date(found.recovery_expires) < new Date()) {
      return res.json({ error: 'El código ya venció. Solicita uno nuevo.' })
    }
    if (found.recovery_tries >= 4) return res.json({ error: 'Demasiados intentos con el código. Solicita uno nuevo.' })
    const ok = await bcrypt.compare(code, found.recovery_hash)
    if (!ok) {
      await pool.query('UPDATE users SET recovery_tries=recovery_tries+1 WHERE id=?', [found.id])
      return res.json({ error: 'El código no es correcto.' })
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.json({ error: 'La contraseña debe tener al menos 8 caracteres, con letras y números.' })
    }
    const hash = await bcrypt.hash(newPassword, 10)
    await pool.query(
      'UPDATE users SET password=?, recovery_hash=NULL, recovery_expires=NULL, recovery_tries=0 WHERE id=?',
      [hash, found.id],
    )
    locks.delete(email)
    locks.delete(found.username)
    const state = await getState(pool)
    res.json({ token: tokenFor(found), user: publicUser({ ...found, password: hash }), state })
  })

  app.get('/api/state', auth, async (req, res) => {
    const [users] = await pool.query('SELECT * FROM users WHERE id=? LIMIT 1', [req.user.id])
    res.json({
      state: await getState(pool),
      user: users[0] ? publicUser(users[0]) : null,
    })
  })

  app.put('/api/profile', auth, async (req, res) => {
    const name = String(req.body.name || '').trim()
    const username = String(req.body.username || '').trim().toLowerCase()
    const email = String(req.body.email || '').trim().toLowerCase()
    if (!name) return res.json({ error: 'El nombre es obligatorio.' })
    const [meRows] = await pool.query('SELECT * FROM users WHERE id=? LIMIT 1', [String(req.user.id)])
    const me = meRows[0]
    if (!me) return res.status(401).json({ error: 'Sesión inválida. Entra de nuevo.' })
    if (username.length < 3) return res.json({ error: 'El usuario debe tener al menos 3 caracteres.' })
    if (!/^[a-z0-9._-]+$/.test(username)) {
      return res.json({ error: 'El usuario solo puede tener letras, números, punto, guion o guion bajo.' })
    }
    if (!email.includes('@')) return res.json({ error: 'El correo no es válido.' })
    if (username !== me.username) {
      const [takenUser] = await pool.query('SELECT id FROM users WHERE username=? AND id<>? LIMIT 1', [
        username,
        me.id,
      ])
      if (takenUser.length) return res.json({ error: 'Ese usuario ya está en uso.' })
    }
    if (email !== me.email) {
      const [takenEmail] = await pool.query('SELECT id FROM users WHERE email=? AND id<>? LIMIT 1', [email, me.id])
      if (takenEmail.length) return res.json({ error: 'Ese correo ya está en uso.' })
    }
    const fields = [name, username, email, String(req.body.phone || '').trim(), String(req.body.address || '').trim(), req.body.avatar || '']
    if (req.body.newPassword) {
      const np = String(req.body.newPassword)
      if (np.length < 8 || !/[A-Za-z]/.test(np) || !/\d/.test(np)) {
        return res.json({ error: 'La contraseña debe tener al menos 8 caracteres, con letras y números.' })
      }
      const hash = await bcrypt.hash(np, 10)
      await pool.query(
        'UPDATE users SET name=?, username=?, email=?, phone=?, address=?, avatar=?, password=? WHERE id=?',
        [...fields, hash, req.user.id],
      )
    } else {
      await pool.query(
        'UPDATE users SET name=?, username=?, email=?, phone=?, address=?, avatar=? WHERE id=?',
        [...fields, req.user.id],
      )
    }
    const [users] = await pool.query('SELECT * FROM users WHERE id=?', [req.user.id])
    res.json({ user: publicUser(users[0]), state: await getState(pool) })
  })

  app.post('/api/appointments', auth, async (req, res) => {
    const date = String(req.body.date || '').slice(0, 10)
    const time = normalizeTime(req.body.time)
    if (!date || !WORK_SLOTS.includes(time)) {
      return res.json({ error: 'Elige un día y un horario del calendario.' })
    }
    const day = new Date(`${date}T12:00:00`)
    if (Number.isNaN(day.getTime()) || day.getDay() === 0) {
      return res.json({ error: 'El taller no agenda en domingo.' })
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (day < today) return res.json({ error: 'No se puede agendar en una fecha pasada.' })
    const hour = time.slice(0, 2)
    const [busy] = await pool.query(
      `SELECT COUNT(*) AS n FROM appointments
       WHERE date=? AND LEFT(time,2)=? AND status<>'cancelada'`,
      [date, hour],
    )
    if (busy[0].n >= SLOT_CAPACITY) {
      return res.json({ error: 'Ese horario ya no tiene espacio. Elige otro en verde o amarillo.' })
    }
    const vehicleId = String(req.body.vehicleId || '').trim() || null
    const id = uid('a')
    await pool.query(
      'INSERT INTO appointments (id,client_id,vehicle_id,date,time,service,status,notes) VALUES (?,?,?,?,?,?,?,?)',
      [
        id,
        req.user.role === 'cliente' ? req.user.id : req.body.clientId,
        vehicleId,
        date,
        time,
        req.body.service,
        req.body.status || 'pendiente',
        req.body.notes || '',
      ],
    )
    res.json({ state: await getState(pool) })
  })

  app.patch('/api/appointments/:id', auth, async (req, res) => {
    if (req.body.status) {
      await pool.query('UPDATE appointments SET status=? WHERE id=?', [req.body.status, req.params.id])
    }
    res.json({ state: await getState(pool) })
  })

  app.delete('/api/appointments/:id', auth, async (req, res) => {
    await pool.query('DELETE FROM appointments WHERE id=?', [req.params.id])
    res.json({ state: await getState(pool) })
  })

  app.post('/api/appointments/:id/confirm', auth, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM appointments WHERE id=?', [req.params.id])
    const cita = rows[0]
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' })
    if (cita.order_id) {
      await pool.query('UPDATE appointments SET status=? WHERE id=?', ['confirmada', cita.id])
      return res.json({ state: await getState(pool) })
    }
    const [count] = await pool.query('SELECT COUNT(*) AS n FROM work_orders')
    const orderId = uid('o')
    const folio = `OT-${1040 + count[0].n + 1}`
    const [me] = await pool.query('SELECT name FROM users WHERE id=?', [req.user.id])
    const desc = cita.notes ? `${cita.service}. ${cita.notes}` : cita.service
    await pool.query(
      'INSERT INTO work_orders (id,folio,vehicle_id,client_id,mechanic,description,status,created_at,labor) VALUES (?,?,?,?,?,?,?,NOW(),?)',
      [orderId, folio, cita.vehicle_id || null, cita.client_id, me[0]?.name || 'Taller', desc, 'en_proceso', 600],
    )
    await pool.query('UPDATE appointments SET status=?, order_id=? WHERE id=?', ['confirmada', orderId, cita.id])
    if (cita.vehicle_id) {
      await pool.query('UPDATE vehicles SET status=? WHERE id=?', ['en_taller', cita.vehicle_id])
    }
    res.json({ state: await getState(pool) })
  })

  app.post('/api/observations', auth, async (req, res) => {
    await pool.query(
      'INSERT INTO observations (id,vehicle_id,author_id,text,photos,created_at) VALUES (?,?,?,?,?,NOW())',
      [uid('ob'), req.body.vehicleId, req.user.id, req.body.text || '', JSON.stringify(req.body.photos || [])],
    )
    res.json({ state: await getState(pool) })
  })

  app.post('/api/part-requests', auth, async (req, res) => {
    await pool.query(
      'INSERT INTO part_requests (id,client_id,vehicle_id,part_id,qty,status,created_at) VALUES (?,?,?,?,?,?,NOW())',
      [uid('r'), req.user.id, req.body.vehicleId, req.body.partId, req.body.qty || 1, 'solicitada'],
    )
    res.json({ state: await getState(pool) })
  })

  app.patch('/api/part-requests/:id', auth, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM part_requests WHERE id=?', [req.params.id])
    const reqRow = rows[0]
    if (req.body.status === 'entregada' && reqRow) {
      await pool.query('UPDATE parts SET stock=GREATEST(0, stock-?) WHERE id=?', [reqRow.qty, reqRow.part_id])
    }
    await pool.query('UPDATE part_requests SET status=? WHERE id=?', [req.body.status, req.params.id])
    res.json({ state: await getState(pool) })
  })

  app.post('/api/orders', auth, async (req, res) => {
    const [count] = await pool.query('SELECT COUNT(*) AS n FROM work_orders')
    const id = uid('o')
    const folio = `OT-${1040 + count[0].n + 1}`
    const status = req.body.status === 'abierta' || req.body.status === 'lista' ? 'en_proceso' : req.body.status || 'en_proceso'
    await pool.query(
      'INSERT INTO work_orders (id,folio,vehicle_id,client_id,mechanic,description,status,created_at,labor) VALUES (?,?,?,?,?,?,?,NOW(),?)',
      [id, folio, req.body.vehicleId, req.body.clientId, req.body.mechanic, req.body.description, status, req.body.labor || 0],
    )
    for (const line of req.body.parts || []) {
      await pool.query('INSERT INTO order_parts (order_id,part_id,qty) VALUES (?,?,?)', [id, line.partId, line.qty])
    }
    res.json({ state: await getState(pool) })
  })

  app.patch('/api/orders/:id', auth, async (req, res) => {
    if (req.body.status) await pool.query('UPDATE work_orders SET status=? WHERE id=?', [req.body.status, req.params.id])
    res.json({ state: await getState(pool) })
  })

  app.patch('/api/vehicles/:id', auth, async (req, res) => {
    if (req.body.status) await pool.query('UPDATE vehicles SET status=? WHERE id=?', [req.body.status, req.params.id])
    if (req.body.photo !== undefined) await pool.query('UPDATE vehicles SET photo=? WHERE id=?', [req.body.photo, req.params.id])
    res.json({ state: await getState(pool) })
  })

  app.post('/api/vehicles', auth, async (req, res) => {
    await pool.query(
      'INSERT INTO vehicles (id,plate,brand,model,year,color,vin,owner_id,mileage,status,photo) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [
        uid('v'),
        String(req.body.plate || '').trim().toUpperCase(),
        req.body.brand,
        req.body.model,
        req.body.year,
        req.body.color || '',
        req.body.vin || '',
        req.body.ownerId,
        req.body.mileage || 0,
        req.body.status || 'activo',
        req.body.photo || '',
      ],
    )
    res.json({ state: await getState(pool) })
  })

  app.post('/api/parts', auth, async (req, res) => {
    const [count] = await pool.query('SELECT COUNT(*) AS n FROM parts')
    const sku = `RF-${String(count[0].n + 1).padStart(3, '0')}`
    await pool.query(
      'INSERT INTO parts (id,sku,name,category,stock,min_stock,price,cost) VALUES (?,?,?,?,?,?,?,?)',
      [uid('p'), sku, String(req.body.name || '').trim(), req.body.category || 'General', Math.max(0, req.body.stock || 0), 1, req.body.price || 0, req.body.cost || 0],
    )
    res.json({ state: await getState(pool) })
  })

  app.patch('/api/parts/:id/stock', auth, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM parts WHERE id=?', [req.params.id])
    const current = rows[0]
    if (!current) return res.status(404).json({ error: 'No existe' })
    const nextStock = Math.max(0, current.stock + Number(req.body.delta || 0))
    await pool.query('UPDATE parts SET stock=? WHERE id=?', [nextStock, req.params.id])
    const notice =
      nextStock === 0 && Number(req.body.delta) < 0 ? `Se terminó la refacción: ${current.name}` : null
    res.json({ notice, state: await getState(pool) })
  })

  const dist = path.join(__dirname, '..', 'dist')
  if (fs.existsSync(dist)) {
    app.use(express.static(dist))
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Garage 301 en el puerto ${PORT}`)
    console.log(`Base de datos MySQL: ${dbName}`)
  })
}

start()
