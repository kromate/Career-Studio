import type { ParsedResume } from '@/types'

function safeFilename(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'resume'
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function exportResumePdf(parsed: ParsedResume, name: string): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - margin * 2
  let y = margin

  for (const line of parsed.lines) {
    const isHeading = line.kind === 'heading'
    const isHeader = line.section === 'header'
    const fontSize = isHeading ? 11 : isHeader && line.index === 0 ? 17 : 9.5
    const lineHeight = isHeading ? 18 : 14
    const prefix = line.kind === 'bullet' ? '• ' : ''
    pdf.setFont('helvetica', isHeading || (isHeader && line.index === 0) ? 'bold' : 'normal')
    pdf.setFontSize(fontSize)
    if (isHeading) y += 8
    const wrapped = pdf.splitTextToSize(`${prefix}${line.text}`, contentWidth)

    for (const wrappedLine of wrapped) {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage()
        y = margin
      }
      pdf.text(wrappedLine, margin, y)
      y += lineHeight
    }
  }

  pdf.save(`${safeFilename(name)}.pdf`)
}

export async function exportResumeDocx(parsed: ParsedResume, name: string): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
  } = await import('docx')
  const paragraphs = parsed.lines.map((line) => {
    if (line.kind === 'heading') {
      return new Paragraph({
        text: line.text.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 60 },
      })
    }
    if (line.kind === 'bullet') {
      return new Paragraph({
        children: [new TextRun({ text: line.text, size: 20 })],
        bullet: { level: 0 },
        spacing: { after: 60 },
      })
    }
    if (line.section === 'header' && line.index === 0) {
      return new Paragraph({
        children: [new TextRun({ text: line.text, bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      })
    }
    return new Paragraph({
      children: [new TextRun({ text: line.text, size: 20 })],
      alignment: line.section === 'header' ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: line.section === 'header' ? 50 : 70 },
    })
  })
  const document = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  })
  const blob = await Packer.toBlob(document)
  downloadBlob(blob, `${safeFilename(name)}.docx`)
}
