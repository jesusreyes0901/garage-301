import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

function money(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)
}

function line(page, font, text, x, y, size = 11, color = rgb(0.08, 0.08, 0.08)) {
  page.drawText(String(text || ''), { x, y, size, font, color })
}

export function receiptTotals(labor, materials, percent) {
  const materialsTotal = (materials || []).reduce(
    (sum, m) => sum + Math.max(0, Number(m.price) || 0) * Math.max(1, Number(m.qty) || 1),
    0,
  )
  const subtotal = Math.max(0, Number(labor) || 0) + materialsTotal
  const pct = Math.min(100, Math.max(0, Math.round(Number(percent) || 0)))
  const discount = Math.min(subtotal, Math.round((subtotal * pct) / 100))
  return { materialsTotal, subtotal, percent: pct, discount, total: Math.max(0, subtotal - discount) }
}

export async function buildReceiptPdf(data) {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([612, 792])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()
  const totals = receiptTotals(data.labor, data.materials, data.percent)
  let y = height - 56

  line(page, bold, data.shopName || 'Garaje 301', 48, y, 20, rgb(0.88, 0.02, 0))
  y -= 18
  line(page, font, 'Recibo de servicio', 48, y, 12)
  y -= 28
  line(page, bold, `Folio ${data.folio || '—'}`, 48, y, 13)
  line(page, font, data.date || '', width - 200, y, 11)
  y -= 18
  line(page, font, `Cliente: ${data.clientName || '—'}`, 48, y)
  y -= 16
  line(page, font, `Vehiculo: ${data.vehicle || '—'}`, 48, y)
  y -= 16
  line(page, font, `Mecanico: ${data.mechanic || '—'}`, 48, y)
  y -= 22
  if (data.description) {
    line(page, font, `Trabajo: ${String(data.description).slice(0, 90)}`, 48, y, 10)
    y -= 22
  }

  page.drawLine({ start: { x: 48, y }, end: { x: width - 48, y }, thickness: 1, color: rgb(0.7, 0.7, 0.7) })
  y -= 20
  line(page, bold, 'Concepto', 48, y)
  line(page, bold, 'Importe', width - 140, y)
  y -= 18
  line(page, font, 'Mano de obra', 48, y)
  line(page, font, money(data.labor), width - 140, y)
  y -= 16
  for (const m of data.materials || []) {
    const qty = Math.max(1, Number(m.qty) || 1)
    const price = Math.max(0, Number(m.price) || 0)
    if (!String(m.name || '').trim() && price <= 0) continue
    line(page, font, `${m.name} x${qty}`, 48, y, 10)
    line(page, font, money(price * qty), width - 140, y, 10)
    y -= 14
    if (y < 120) break
  }
  y -= 8
  page.drawLine({ start: { x: 48, y }, end: { x: width - 48, y }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) })
  y -= 18
  line(page, font, 'Subtotal', 48, y)
  line(page, font, money(totals.subtotal), width - 140, y)
  y -= 16
  if (totals.discount > 0) {
    const cupon = data.couponCode ? `Cupon ${data.couponCode} (${totals.percent}%)` : `Descuento (${totals.percent}%)`
    line(page, font, cupon, 48, y)
    line(page, font, `-${money(totals.discount)}`, width - 140, y)
    y -= 18
  }
  line(page, bold, 'TOTAL', 48, y, 14)
  line(page, bold, money(totals.total), width - 140, y, 14)
  y -= 36
  line(page, font, data.shopAddress || '', 48, y, 10, rgb(0.4, 0.4, 0.4))
  y -= 14
  line(page, font, 'Gracias por su preferencia. Garaje 301', 48, y, 10, rgb(0.4, 0.4, 0.4))

  return pdf.save()
}

export function receiptWhatsAppText(data) {
  const totals = receiptTotals(data.labor, data.materials, data.percent)
  const mats = (data.materials || [])
    .filter((m) => String(m.name || '').trim())
    .map((m) => {
      const qty = Math.max(1, Number(m.qty) || 1)
      const price = Math.max(0, Number(m.price) || 0)
      return `• ${m.name} x${qty}: ${money(price * qty)}`
    })
    .join('\n')
  const cupon =
    totals.discount > 0
      ? `\nCupon ${data.couponCode || ''} (${totals.percent}%): -${money(totals.discount)}`
      : ''
  return `Garaje 301 — recibo ${data.folio}\nCliente: ${data.clientName || '—'}\n${data.vehicle ? `Auto: ${data.vehicle}\n` : ''}Mano de obra: ${money(data.labor)}${mats ? `\nMateriales:\n${mats}` : ''}\nSubtotal: ${money(totals.subtotal)}${cupon}\nTOTAL: ${money(totals.total)}`
}
