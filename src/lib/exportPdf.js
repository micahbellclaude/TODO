import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

function fmt(min) {
  if (!min && min !== 0) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function exportWeekPdf({ week, tasks, wins, leftSections, intakeItems }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  let y = margin

  const accent = [255, 107, 0]
  const dark = [26, 25, 23]
  const muted = [107, 104, 96]

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...dark)
  doc.text('WEEKLY REPORT', margin, y)

  const label = `${format(new Date(week.start_date + 'T00:00:00'), 'MMM d')} – ${format(new Date(week.end_date + 'T00:00:00'), 'MMM d, yyyy')}`
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...muted)
  doc.text(label, margin, y + 6)

  // Accent line
  doc.setDrawColor(...accent)
  doc.setLineWidth(0.8)
  doc.line(margin, y + 10, pageW - margin, y + 10)
  y += 18

  // Summary row
  const activeTasks = tasks.filter(t => t.status !== 'removed')
  const doneTasks = activeTasks.filter(t => t.status === 'done')
  const projMin = activeTasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0)
  const actMin = activeTasks.reduce((s, t) => s + (t.actual_minutes || 0), 0)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...dark)
  doc.text(`${doneTasks.length}/${activeTasks.length} tasks completed`, margin, y)
  doc.text(`Projected: ${fmt(projMin)}  ·  Actual: ${fmt(actMin)}`, pageW / 2, y, { align: 'center' })
  doc.text(`${wins.length} win${wins.length !== 1 ? 's' : ''}`, pageW - margin, y, { align: 'right' })
  y += 8

  // Tasks table
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...dark)
  doc.text('TASKS', margin, y)
  y += 3

  const taskRows = activeTasks.map(t => [
    t.title,
    t.estimated_time || '—',
    fmt(t.actual_minutes),
    t.status.toUpperCase(),
    t.status === 'waiting' && t.waiting_note ? t.waiting_note : '',
  ])

  autoTable(doc, {
    startY: y,
    head: [['Task', 'Est.', 'Actual', 'Status', 'Note']],
    body: taskRows,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: dark, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: dark },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 40 },
    },
    alternateRowStyles: { fillColor: [245, 244, 240] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const status = data.cell.raw
        if (status === 'DONE') data.cell.styles.textColor = muted
        if (status === 'IN_PROGRESS') data.cell.styles.textColor = accent
      }
    },
  })

  y = doc.lastAutoTable.finalY + 10

  // Wins
  if (wins.length > 0) {
    if (y > 240) { doc.addPage(); y = margin }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...dark)
    doc.text('WINS OF THE WEEK', margin, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [['Client', 'Amount', 'G/N', 'Timeframe', 'Products']],
      body: wins.map(w => [
        w.client_name,
        w.dollar_amount ? `$${Number(w.dollar_amount).toLocaleString()}` : '—',
        (w.gross_or_net || 'gross').toUpperCase(),
        w.campaign_timeframe || '—',
        w.products_used || '—',
      ]),
      margin: { left: margin, right: margin },
      headStyles: { fillColor: accent, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: dark },
      alternateRowStyles: { fillColor: [245, 244, 240] },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  // Left sections
  for (const section of leftSections.sort((a, b) => a.sort_order - b.sort_order)) {
    if (section.type === 'wins') continue // already rendered above

    if (y > 240) { doc.addPage(); y = margin }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...dark)
    doc.text(section.title.toUpperCase(), margin, y)
    y += 5

    if (section.type === 'prospecting') {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri']
      const row = days.map(d => section.prospecting_days?.[d] ? '✓' : '·').join('    ')
      const labels = days.map(d => d.toUpperCase()).join('   ')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...muted)
      doc.text(labels, margin, y)
      y += 4
      doc.setTextColor(...dark)
      doc.setFontSize(11)
      doc.text(row, margin, y)
      y += 8
    } else if (section.content) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...dark)
      const lines = doc.splitTextToSize(section.content, pageW - margin * 2)
      doc.text(lines, margin, y)
      y += lines.length * 4 + 4
    } else {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(...muted)
      doc.text('(empty)', margin, y)
      y += 6
    }
  }

  // Unsorted intake
  const unsorted = intakeItems.filter(i => i.status === 'pending')
  if (unsorted.length > 0) {
    if (y > 240) { doc.addPage(); y = margin }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...dark)
    doc.text('UNSORTED INTAKE', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    for (const item of unsorted) {
      doc.setTextColor(...muted)
      doc.text(`· ${item.title}`, margin + 2, y)
      y += 4.5
    }
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...muted)
    doc.text(`TODO — ${label}`, margin, doc.internal.pageSize.getHeight() - 10)
    doc.text(`${i} / ${pageCount}`, pageW - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' })
  }

  const filename = `todo-week-${week.start_date}.pdf`
  doc.save(filename)
}
