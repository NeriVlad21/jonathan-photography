// Text-based PDF documents for admin records and filtered reports (jsPDF).
// Text is drawn as plain strings, so submitted HTML can never render; long
// text wraps, tables repeat their header on every page, and every page gets
// "Page X of Y" plus a system-generated note.

const INK = [10, 10, 10]
const MUTED = [110, 110, 105]
const LINE = [217, 215, 207]
const YELLOW = [245, 208, 0]

// The standard PDF fonts cannot draw the peso sign; amounts read "PHP 1,234.00".
export const pdfMoney = (value) => (value === null || value === undefined || value === '' ? 'Not recorded'
  : `PHP ${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
export const pdfRate = (value) => (value === null || value === undefined ? 'Not recorded' : `${(Number(value) * 100).toFixed(2).replace(/\.00$/, '')}%`)
export const pdfDate = (value, withTime = false) => {
  if (!value) return 'Not recorded'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-PH', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' })
}
export const orNotRecorded = (value) => (value === null || value === undefined || String(value).trim() === '' ? 'Not recorded' : String(value))

const clean = (value) => String(value ?? '')
  .replace(/₱/g, 'PHP ')
  .replace(/\r\n?/g, '\n')
  .replace(/[^\n\x20-\x7E -ÿ–—‘’“”•…]/g, '')

export async function createPdf({ orientation = 'portrait', title, documentType, reference, statusLine, summaryLines = [] }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' })
  const page = { width: doc.internal.pageSize.getWidth(), height: doc.internal.pageSize.getHeight(), margin: 40 }
  const generated = new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })
  const ctx = { doc, page, y: page.margin, generated, documentType, reference }

  // Header block
  doc.setFillColor(...YELLOW); doc.rect(page.margin, page.margin, 28, 4, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...MUTED)
  doc.text('JONATHAN PHOTOGRAPHY PLATFORM', page.margin, page.margin + 18)
  doc.setFontSize(17); doc.setTextColor(...INK)
  doc.text(clean(title), page.margin, page.margin + 38)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED)
  const right = page.width - page.margin
  doc.text(clean(documentType), right, page.margin + 18, { align: 'right' })
  if (reference) { doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK); doc.text(clean(reference), right, page.margin + 32, { align: 'right' }); doc.setFont('helvetica', 'normal') }
  doc.setTextColor(...MUTED); doc.text(`Generated ${clean(generated)}`, right, page.margin + 45, { align: 'right' })
  ctx.y = page.margin + 58
  if (statusLine) { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...INK); doc.text(clean(statusLine), page.margin, ctx.y); ctx.y += 14 }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED)
  summaryLines.filter(Boolean).forEach((line) => {
    const wrapped = doc.splitTextToSize(clean(line), page.width - page.margin * 2)
    doc.text(wrapped, page.margin, ctx.y); ctx.y += wrapped.length * 11
  })
  doc.setDrawColor(...INK); doc.setLineWidth(1.2); doc.line(page.margin, ctx.y + 2, right, ctx.y + 2)
  ctx.y += 18
  return ctx
}

const ensureSpace = (ctx, needed) => {
  if (ctx.y + needed <= ctx.page.height - ctx.page.margin - 24) return false
  ctx.doc.addPage(); ctx.y = ctx.page.margin; return true
}

export function addHeading(ctx, text) {
  ensureSpace(ctx, 34)
  const { doc, page } = ctx
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...INK)
  doc.text(clean(text), page.margin, ctx.y)
  doc.setDrawColor(...LINE); doc.setLineWidth(0.6); doc.line(page.margin, ctx.y + 5, page.width - page.margin, ctx.y + 5)
  ctx.y += 18
}

/** Label/value pairs in two columns; values wrap within their column. */
export function addFields(ctx, fields) {
  const { doc, page } = ctx
  const colWidth = (page.width - page.margin * 2 - 20) / 2
  const labelWidth = 104
  const rows = []
  for (let i = 0; i < fields.length; i += 2) rows.push(fields.slice(i, i + 2))
  rows.forEach((pair) => {
    doc.setFontSize(9)
    const wrapped = pair.map(([, value]) => doc.splitTextToSize(clean(orNotRecorded(value)), colWidth - labelWidth))
    const height = Math.max(...wrapped.map((lines) => lines.length)) * 11.5 + 6
    ensureSpace(ctx, height)
    pair.forEach(([label], index) => {
      const x = page.margin + index * (colWidth + 20)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED); doc.text(clean(label), x, ctx.y)
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK); doc.text(wrapped[index], x + labelWidth, ctx.y)
    })
    ctx.y += height
  })
  ctx.y += 4
}

/** Long free text (descriptions, responses); preserves line breaks, wraps across pages. */
export function addParagraph(ctx, text) {
  const { doc, page } = ctx
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...INK)
  const lines = doc.splitTextToSize(clean(orNotRecorded(text)), page.width - page.margin * 2)
  lines.forEach((line) => { ensureSpace(ctx, 13); doc.text(line, page.margin, ctx.y); ctx.y += 13 })
  ctx.y += 8
}

/**
 * Table with a header row repeated on every page. columns: [{ label, width (fraction), align }]
 * rows: arrays of display strings. totals: optional array aligned to columns.
 */
export function addTable(ctx, columns, rows, totals) {
  const { doc, page } = ctx
  const tableWidth = page.width - page.margin * 2
  const widths = columns.map((column) => column.width * tableWidth)
  const xs = widths.reduce((acc, width, index) => [...acc, acc[index] + width], [page.margin]).slice(0, -1)
  const pad = 5
  const drawHeader = () => {
    doc.setFillColor(...INK); doc.rect(page.margin, ctx.y - 11, tableWidth, 18, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255)
    columns.forEach((column, i) => {
      const x = column.align === 'right' ? xs[i] + widths[i] - pad : xs[i] + pad
      doc.text(clean(column.label), x, ctx.y + 1, { align: column.align === 'right' ? 'right' : 'left' })
    })
    ctx.y += 16
  }
  const drawRow = (cells, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(8.5)
    const wrapped = cells.map((cell, i) => doc.splitTextToSize(clean(cell), widths[i] - pad * 2))
    const height = Math.max(...wrapped.map((lines) => lines.length)) * 10.5 + 7
    if (ensureSpace(ctx, height + 4)) { ctx.y += 11; drawHeader() }
    doc.setTextColor(...INK)
    wrapped.forEach((lines, i) => {
      const align = columns[i].align === 'right' ? 'right' : 'left'
      const x = align === 'right' ? xs[i] + widths[i] - pad : xs[i] + pad
      doc.text(lines, x, ctx.y + 2, { align })
    })
    ctx.y += height
    doc.setDrawColor(...LINE); doc.setLineWidth(0.5); doc.line(page.margin, ctx.y - 6, page.margin + tableWidth, ctx.y - 6)
  }
  ensureSpace(ctx, 60)
  ctx.y += 11
  drawHeader()
  if (!rows.length) drawRow(columns.map((_, i) => (i === 0 ? 'No records.' : '')))
  rows.forEach((cells) => drawRow(cells))
  if (totals) { doc.setFillColor(250, 246, 220); doc.rect(page.margin, ctx.y - 6, tableWidth, 18, 'F'); drawRow(totals, true) }
  ctx.y += 6
}

/** Adds "Page X of Y" + system note to every page, then saves. */
export function finishPdf(ctx, filename) {
  const { doc, page } = ctx
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i)
    doc.setDrawColor(...LINE); doc.setLineWidth(0.5); doc.line(page.margin, page.height - page.margin + 6, page.width - page.margin, page.height - page.margin + 6)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED)
    const note = `System-generated by the Jonathan Photography platform · ${clean(ctx.reference || ctx.documentType)} · Generated ${clean(ctx.generated)}`
    doc.text(doc.splitTextToSize(note, page.width - page.margin * 2 - 70)[0], page.margin, page.height - page.margin + 18)
    doc.text(`Page ${i} of ${total}`, page.width - page.margin, page.height - page.margin + 18, { align: 'right' })
  }
  doc.save(filename)
}

/** Safe, informative filenames: letters, digits, dot, dash, underscore only. */
export const pdfFilename = (...parts) => `${parts.filter(Boolean).join('-').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}.pdf`
