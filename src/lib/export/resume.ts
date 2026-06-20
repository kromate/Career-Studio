import type {
  EditableResumeDocument,
  ParsedResume,
  ResumeBuilderSectionKey,
  ResumeExperienceEntry,
  ResumeProjectEntry,
  ResumeSimpleEntry,
} from '@/types'

type JsPdfInstance = InstanceType<typeof import('jspdf').jsPDF>

interface PdfTheme {
  accent: string
  muted: string
  ink: string
  fontSize: number
  lineHeight: number
  marginX: number
  marginY: number
  contentWidth: number
  pageHeight: number
  compact: boolean
}

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

export async function createResumePdfBlob(parsed: ParsedResume): Promise<Blob> {
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

  return pdf.output('blob')
}

function isBuilderDocument(input: ParsedResume | EditableResumeDocument): input is EditableResumeDocument {
  return 'profile' in input && 'design' in input && 'sectionSettings' in input
}

function sectionTitle(document: EditableResumeDocument, key: ResumeBuilderSectionKey): string {
  return document.sectionSettings.find(section => section.key === key)?.title || key
}

function dateRange(startDate: string, endDate: string, current = false): string {
  if (!startDate && !endDate && !current) return ''
  if (current) return [startDate, 'Present'].filter(Boolean).join(' - ')
  return [startDate, endDate].filter(Boolean).join(' - ')
}

function visibleBullets(entry: { bullets?: Array<{ text: string }>; details?: Array<{ text: string }> }): string[] {
  return (entry.bullets || entry.details || []).map(bullet => bullet.text.trim()).filter(Boolean)
}

function writeWrappedText(
  pdf: JsPdfInstance,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
): number {
  const lines = pdf.splitTextToSize(text, width) as string[]
  for (const line of lines) {
    pdf.text(line, x, y)
    y += lineHeight
  }
  return y
}

function ensurePage(pdf: JsPdfInstance, y: number, needed: number, theme: PdfTheme): number {
  if (y + needed <= theme.pageHeight - theme.marginY) return y
  pdf.addPage()
  return theme.marginY
}

function writeSectionHeading(pdf: JsPdfInstance, title: string, y: number, theme: PdfTheme): number {
  y = ensurePage(pdf, y, theme.fontSize * 3, theme)
  y += theme.compact ? 8 : 12
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(theme.fontSize * 1.08)
  pdf.setTextColor(theme.accent)
  pdf.text(title.toUpperCase(), theme.marginX, y)
  y += 5
  pdf.setDrawColor(theme.accent)
  pdf.setLineWidth(1.2)
  pdf.line(theme.marginX, y, theme.marginX + theme.contentWidth, y)
  pdf.setTextColor(theme.ink)
  return y + (theme.compact ? 8 : 10)
}

function writeEntryHeading(
  pdf: JsPdfInstance,
  title: string,
  date: string,
  y: number,
  theme: PdfTheme,
): number {
  y = ensurePage(pdf, y, theme.lineHeight * 2, theme)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(theme.fontSize)
  pdf.setTextColor(theme.ink)

  const dateWidth = date ? Math.min(pdf.getTextWidth(date) + 10, theme.contentWidth * 0.34) : 0
  const titleWidth = theme.contentWidth - dateWidth - (date ? 12 : 0)
  const titleLines = pdf.splitTextToSize(title, titleWidth) as string[]
  pdf.text(titleLines[0] || title, theme.marginX, y)

  if (date) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(theme.fontSize * 0.92)
    pdf.setTextColor(theme.muted)
    pdf.text(date, theme.marginX + theme.contentWidth, y, { align: 'right' })
  }

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(theme.fontSize)
  pdf.setTextColor(theme.ink)
  for (const line of titleLines.slice(1)) {
    y += theme.lineHeight
    pdf.text(line, theme.marginX, y)
  }
  return y + theme.lineHeight
}

function writeBullets(pdf: JsPdfInstance, bullets: string[], y: number, theme: PdfTheme): number {
  if (!bullets.length) return y
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(theme.fontSize)
  pdf.setTextColor(theme.ink)
  const bulletIndent = 10
  const textIndent = 18
  for (const bullet of bullets) {
    y = ensurePage(pdf, y, theme.lineHeight, theme)
    pdf.text('•', theme.marginX + bulletIndent, y)
    const lines = pdf.splitTextToSize(bullet, theme.contentWidth - textIndent) as string[]
    for (const [index, line] of lines.entries()) {
      if (index > 0) y = ensurePage(pdf, y + theme.lineHeight, theme.lineHeight, theme)
      pdf.text(line, theme.marginX + textIndent, y)
    }
    y += theme.lineHeight + (theme.compact ? 0 : 1)
  }
  return y
}

function writeSubtitle(pdf: JsPdfInstance, subtitle: string, y: number, theme: PdfTheme): number {
  if (!subtitle) return y
  y = ensurePage(pdf, y, theme.lineHeight, theme)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(theme.fontSize)
  pdf.setTextColor(theme.muted)
  y = writeWrappedText(pdf, subtitle, theme.marginX, y, theme.contentWidth, theme.lineHeight)
  pdf.setTextColor(theme.ink)
  return y + 1
}

function writeExperienceEntry(pdf: JsPdfInstance, entry: ResumeExperienceEntry, y: number, theme: PdfTheme): number {
  const title = [entry.jobTitle, entry.employer].filter(Boolean).join(' - ') || 'Untitled role'
  y = writeEntryHeading(pdf, title, entry.hideDates ? '' : dateRange(entry.startDate, entry.endDate, entry.current), y, theme)
  y = writeSubtitle(pdf, entry.location, y, theme)
  y = writeBullets(pdf, visibleBullets(entry), y, theme)
  return y + (theme.compact ? 3 : 5)
}

function writeProjectEntry(pdf: JsPdfInstance, entry: ResumeProjectEntry, y: number, theme: PdfTheme): number {
  const title = [entry.name, entry.role].filter(Boolean).join(' - ') || 'Project'
  y = writeEntryHeading(pdf, title, dateRange(entry.startDate, entry.endDate), y, theme)
  y = writeSubtitle(pdf, entry.url, y, theme)
  y = writeBullets(pdf, visibleBullets(entry), y, theme)
  return y + (theme.compact ? 3 : 5)
}

function writeSimpleEntry(pdf: JsPdfInstance, entry: ResumeSimpleEntry, fallbackTitle: string, y: number, theme: PdfTheme): number {
  const title = [entry.title, entry.subtitle].filter(Boolean).join(' - ') || fallbackTitle
  y = writeEntryHeading(pdf, title, entry.date, y, theme)
  y = writeSubtitle(pdf, entry.location, y, theme)
  y = writeBullets(pdf, visibleBullets(entry), y, theme)
  return y + (theme.compact ? 3 : 5)
}

export async function createBuilderResumePdfBlob(document: EditableResumeDocument): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: document.design.pageSize })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const theme: PdfTheme = {
    accent: document.design.accentColor,
    muted: '#5f6673',
    ink: '#111111',
    fontSize: document.design.fontSize,
    lineHeight: document.design.fontSize * document.design.lineHeight,
    marginX: document.design.marginX,
    marginY: document.design.marginY,
    contentWidth: pageWidth - document.design.marginX * 2,
    pageHeight,
    compact: document.design.template === 'compact',
  }
  let y = theme.marginY

  const fullName = `${document.profile.firstName} ${document.profile.lastName}`.trim()
  const contactLine = [
    document.profile.email,
    document.profile.phone,
    document.profile.location,
  ].filter(Boolean).join(' | ')
  const linkLine = document.profile.links.map(link => link.url || link.label).filter(Boolean).join(' | ')

  if (fullName) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(theme.fontSize * 2)
    pdf.setTextColor(theme.accent)
    pdf.text(fullName, pageWidth / 2, y + theme.fontSize, { align: 'center' })
    y += theme.fontSize * 2.4
  }

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(theme.fontSize * 0.88)
  pdf.setTextColor(theme.ink)
  for (const line of [contactLine, linkLine].filter(Boolean)) {
    pdf.text(line, pageWidth / 2, y, { align: 'center' })
    y += theme.lineHeight
  }
  if (fullName || contactLine || linkLine) y += theme.compact ? 3 : 6

  if (document.profile.summary.trim()) {
    y = writeSectionHeading(pdf, 'Summary', y, theme)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(theme.fontSize)
    pdf.setTextColor(theme.ink)
    y = writeWrappedText(pdf, document.profile.summary.trim(), theme.marginX, y, theme.contentWidth, theme.lineHeight)
  }

  if (document.workExperiences.length) {
    y = writeSectionHeading(pdf, sectionTitle(document, 'work'), y, theme)
    for (const entry of document.workExperiences) y = writeExperienceEntry(pdf, entry, y, theme)
  }

  if (document.educations.length) {
    y = writeSectionHeading(pdf, sectionTitle(document, 'education'), y, theme)
    for (const entry of document.educations) {
      const title = [entry.degree, entry.school].filter(Boolean).join(' - ') || 'Education'
      y = writeEntryHeading(pdf, title, dateRange(entry.startDate, entry.endDate), y, theme)
      y = writeSubtitle(pdf, entry.location, y, theme)
      y = writeBullets(pdf, visibleBullets(entry), y, theme) + (theme.compact ? 3 : 5)
    }
  }

  const visibleSkillGroups = document.skills.filter(group => group.skills.some(Boolean))
  if (visibleSkillGroups.length) {
    y = writeSectionHeading(pdf, sectionTitle(document, 'skills'), y, theme)
    pdf.setFontSize(theme.fontSize)
    for (const group of visibleSkillGroups) {
      y = ensurePage(pdf, y, theme.lineHeight, theme)
      const label = group.title ? `${group.title}: ` : ''
      pdf.setFont('helvetica', group.title ? 'bold' : 'normal')
      pdf.setTextColor(theme.ink)
      pdf.text(label, theme.marginX, y)
      pdf.setFont('helvetica', 'normal')
      y = writeWrappedText(
        pdf,
        group.skills.filter(Boolean).join(', '),
        theme.marginX + pdf.getTextWidth(label),
        y,
        theme.contentWidth - pdf.getTextWidth(label),
        theme.lineHeight,
      ) + 1
    }
  }

  if (document.projects.length) {
    y = writeSectionHeading(pdf, sectionTitle(document, 'projects'), y, theme)
    for (const entry of document.projects) y = writeProjectEntry(pdf, entry, y, theme)
  }

  const simpleSections = [
    { key: 'volunteer' as const, title: sectionTitle(document, 'volunteer'), entries: document.volunteerExperiences },
    { key: 'certifications' as const, title: sectionTitle(document, 'certifications'), entries: document.certifications },
    { key: 'publications' as const, title: sectionTitle(document, 'publications'), entries: document.publications },
    { key: 'awards' as const, title: sectionTitle(document, 'awards'), entries: document.awards },
  ]
  for (const section of simpleSections.filter(section => section.entries.length)) {
    y = writeSectionHeading(pdf, section.title, y, theme)
    for (const entry of section.entries) y = writeSimpleEntry(pdf, entry, section.title, y, theme)
  }
  for (const section of document.customSections.filter(section => section.entries.length)) {
    y = writeSectionHeading(pdf, section.title, y, theme)
    for (const entry of section.entries) y = writeSimpleEntry(pdf, entry, section.title, y, theme)
  }

  return pdf.output('blob')
}

export async function exportResumePdf(input: ParsedResume | EditableResumeDocument, name: string): Promise<void> {
  const blob = isBuilderDocument(input)
    ? await createBuilderResumePdfBlob(input)
    : await createResumePdfBlob(input)
  downloadBlob(blob, `${safeFilename(name)}.pdf`)
}

export async function createResumeDocxBlob(parsed: ParsedResume): Promise<Blob> {
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
  return Packer.toBlob(document)
}

export async function exportResumeDocx(parsed: ParsedResume, name: string): Promise<void> {
  downloadBlob(await createResumeDocxBlob(parsed), `${safeFilename(name)}.docx`)
}
