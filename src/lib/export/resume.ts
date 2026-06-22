import type {
  EditableResumeDocument,
  ParsedResume,
  ResumeBuilderSectionKey,
  ResumeExperienceEntry,
  ResumeProjectEntry,
  ResumeSimpleEntry,
  ResumeSkillGroup,
  ResumeTemplateId,
} from '@/types'

type JsPdfInstance = InstanceType<typeof import('jspdf').jsPDF>

interface PdfTheme {
  accent: string
  muted: string
  ink: string
  font: string
  fontSize: number
  lineHeight: number
  marginX: number
  marginY: number
  pageWidth: number
  contentWidth: number
  pageHeight: number
  compact: boolean
  template: ResumeTemplateId
}

interface PdfEntry {
  id: string
  title: string
  date: string
  subtitle: string
  bullets: string[]
}

interface PdfSection {
  key: string
  title: string
  text?: string
  entries?: PdfEntry[]
  skillGroups?: ResumeSkillGroup[]
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
  const title = document.sectionSettings.find(section => section.key === key)?.title || key
  return isUploadedTemplate(document.design.template) && key === 'work' ? title.replace(/^Work\s+/i, '') : title
}

function isUploadedTemplate(template: ResumeTemplateId): boolean {
  return ['blueprint', 'coral', 'green', 'mono'].includes(template)
}

function isOrderedOneColumnTemplate(template: ResumeTemplateId): boolean {
  return ['coral', 'green', 'mono'].includes(template)
}

function pdfFont(fontFamily: string): string {
  if (/courier/i.test(fontFamily)) return 'courier'
  if (/georgia|times/i.test(fontFamily)) return 'times'
  return 'helvetica'
}

function dateRange(startDate: string, endDate: string, current = false): string {
  if (!startDate && !endDate && !current) return ''
  if (current) return [startDate, 'Present'].filter(Boolean).join(' - ')
  return [startDate, endDate].filter(Boolean).join(' - ')
}

function visibleBullets(entry: { bullets?: Array<{ text: string }>; details?: Array<{ text: string }> }): string[] {
  return (entry.bullets || entry.details || []).map(bullet => bullet.text.trim()).filter(Boolean)
}

function simpleEntry(entry: ResumeSimpleEntry, fallbackTitle: string): PdfEntry {
  return {
    id: entry.id,
    title: [entry.title, entry.subtitle].filter(Boolean).join(' - ') || fallbackTitle,
    date: entry.date,
    subtitle: entry.location,
    bullets: visibleBullets(entry),
  }
}

function builderPdfSections(document: EditableResumeDocument): PdfSection[] {
  const visibleSkillGroups = document.skills.filter(group => group.skills.some(Boolean))
  const simpleSections = [
    { key: 'volunteer', title: sectionTitle(document, 'volunteer'), entries: document.volunteerExperiences },
    { key: 'certifications', title: sectionTitle(document, 'certifications'), entries: document.certifications },
    { key: 'publications', title: sectionTitle(document, 'publications'), entries: document.publications },
    { key: 'awards', title: sectionTitle(document, 'awards'), entries: document.awards },
  ]
  const sections: Array<PdfSection | undefined> = [
    document.profile.summary.trim()
      ? { key: 'summary', title: 'Summary', text: document.profile.summary.trim() }
      : undefined,
    document.workExperiences.length
      ? {
        key: 'work',
        title: sectionTitle(document, 'work'),
        entries: document.workExperiences.map(entry => ({
          id: entry.id,
          title: [entry.jobTitle, entry.employer].filter(Boolean).join(' - ') || 'Untitled role',
          date: entry.hideDates ? '' : dateRange(entry.startDate, entry.endDate, entry.current),
          subtitle: entry.location,
          bullets: visibleBullets(entry),
        })),
      }
      : undefined,
    document.educations.length
      ? {
        key: 'education',
        title: sectionTitle(document, 'education'),
        entries: document.educations.map(entry => ({
          id: entry.id,
          title: [entry.degree, entry.school].filter(Boolean).join(' - ') || 'Education',
          date: dateRange(entry.startDate, entry.endDate),
          subtitle: entry.location,
          bullets: visibleBullets(entry),
        })),
      }
      : undefined,
    visibleSkillGroups.length
      ? { key: 'skills', title: sectionTitle(document, 'skills'), skillGroups: visibleSkillGroups }
      : undefined,
    document.projects.length
      ? {
        key: 'projects',
        title: sectionTitle(document, 'projects'),
        entries: document.projects.map(entry => ({
          id: entry.id,
          title: [entry.name, entry.role].filter(Boolean).join(' - ') || 'Project',
          date: dateRange(entry.startDate, entry.endDate),
          subtitle: entry.url,
          bullets: visibleBullets(entry),
        })),
      }
      : undefined,
    ...simpleSections
      .filter(section => section.entries.length)
      .map(section => ({
        key: section.key,
        title: section.title,
        entries: section.entries.map(entry => simpleEntry(entry, section.title)),
      })),
    ...document.customSections
      .filter(section => section.entries.length)
      .map(section => ({
        key: section.id,
        title: section.title,
        entries: section.entries.map(entry => simpleEntry(entry, section.title)),
      })),
  ]
  const visibleSections = sections.filter((section): section is PdfSection => Boolean(section))
  if (!isOrderedOneColumnTemplate(document.design.template)) return visibleSections
  const templateOrder = ['summary', 'skills', 'work', 'education', 'projects', 'volunteer', 'certifications', 'publications', 'awards']
  const orderIndex = (key: string) => {
    const index = templateOrder.indexOf(key)
    return index >= 0 ? index : templateOrder.length
  }
  return [...visibleSections].sort((first, second) => orderIndex(first.key) - orderIndex(second.key))
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

function ensureColumnPage(pdf: JsPdfInstance, y: number, needed: number, theme: PdfTheme): number {
  if (y + needed <= theme.pageHeight - theme.marginY) return y
  pdf.addPage()
  return theme.marginY
}

function writeColumnWrappedText(
  pdf: JsPdfInstance,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
  theme: PdfTheme,
): number {
  const lines = pdf.splitTextToSize(text, width) as string[]
  for (const line of lines) {
    y = ensureColumnPage(pdf, y, lineHeight, theme)
    pdf.text(line, x, y)
    y += lineHeight
  }
  return y
}

function templateContactLines(document: EditableResumeDocument): string[] {
  return [
    document.profile.email,
    document.profile.phone,
    document.profile.location,
    ...document.profile.links.map(link => link.url || link.label),
  ].filter(Boolean)
}

function writeTemplateHeader(pdf: JsPdfInstance, document: EditableResumeDocument, theme: PdfTheme): number {
  const fullName = `${document.profile.firstName} ${document.profile.lastName}`.trim()
  const contactLines = templateContactLines(document)
  let y = theme.marginY

  if (theme.template === 'blueprint') {
    const sideWidth = theme.contentWidth * 0.32
    const sideX = theme.marginX + theme.contentWidth - sideWidth
    pdf.setFont('times', 'bold')
    pdf.setFontSize(theme.fontSize * 3.6)
    pdf.setTextColor('#000000')
    if (fullName) pdf.text(fullName, theme.marginX, y + theme.fontSize * 2.8)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(theme.fontSize * 0.82)
    pdf.setTextColor('#000000')
    let contactY = y + 7
    for (const line of contactLines) {
      contactY = writeColumnWrappedText(pdf, line, sideX, contactY, sideWidth, theme.lineHeight * 0.9, theme)
    }
    return y + theme.fontSize * 7.8
  }

  if (theme.template === 'coral') {
    pdf.setFont('times', 'bold')
    pdf.setFontSize(theme.fontSize * 1.65)
    pdf.setTextColor(theme.accent)
    pdf.text('Hello', theme.marginX, y + theme.fontSize)
    y += theme.fontSize * 2.1
    pdf.setFont('times', 'bold')
    pdf.setFontSize(theme.fontSize * 1.25)
    pdf.setTextColor('#000000')
    if (fullName) pdf.text(`I'm ${fullName}`, theme.marginX, y)
    y += theme.fontSize * 2.1
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(theme.fontSize * 0.82)
    for (const line of contactLines) {
      pdf.text(line.toUpperCase(), theme.marginX, y)
      y += theme.lineHeight * 0.86
    }
    return y + theme.fontSize * 2.2
  }

  if (theme.template === 'green') {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(theme.fontSize * 3)
    pdf.setTextColor('#3c3d4a')
    if (fullName) pdf.text(fullName, theme.marginX, y + theme.fontSize * 2.2)
    y += theme.fontSize * 3.4
    if (document.profile.targetRole.trim()) {
      pdf.setFontSize(theme.fontSize * 1.55)
      pdf.setTextColor(theme.accent)
      pdf.text(document.profile.targetRole.trim(), theme.marginX, y)
      y += theme.lineHeight * 1.15
    }
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(theme.fontSize * 0.92)
    pdf.setTextColor('#666666')
    for (const line of contactLines) {
      pdf.text(line, theme.marginX, y)
      y += theme.lineHeight * 0.86
    }
    return y + theme.fontSize * 2
  }

  pdf.setFont('courier', 'normal')
  pdf.setFontSize(theme.fontSize * 0.85)
  pdf.setTextColor('#8a8a8a')
  for (const line of contactLines) {
    pdf.setTextColor(/@|\d/.test(line) ? theme.accent : '#8a8a8a')
    pdf.text(line.toUpperCase(), theme.marginX, y)
    y += theme.lineHeight * 0.82
  }
  y += theme.fontSize * 2
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(theme.fontSize * 3)
  pdf.setTextColor('#4a4a4a')
  if (fullName) pdf.text(fullName.toUpperCase(), theme.marginX, y)
  y += theme.fontSize * 1.7
  pdf.setDrawColor('#4a4a4a')
  pdf.setLineWidth(3)
  pdf.line(theme.marginX, y, theme.marginX + theme.contentWidth, y)
  return y + theme.fontSize * 3.2
}

function writeTemplateSectionHeading(
  pdf: JsPdfInstance,
  section: PdfSection,
  x: number,
  y: number,
  width: number,
  theme: PdfTheme,
): number {
  const topGap = theme.template === 'blueprint' ? 18 : theme.template === 'coral' ? 20 : 24
  y = ensureColumnPage(pdf, y + topGap, theme.lineHeight * 2, theme)
  const heading = theme.template === 'coral' ? section.title : section.title.toUpperCase()

  if (theme.template === 'coral') {
    pdf.setFont('times', 'bold')
    pdf.setFontSize(theme.fontSize * 1.5)
    pdf.setTextColor(theme.accent)
  } else if (theme.template === 'green') {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(theme.fontSize * 1.35)
    pdf.setTextColor(theme.accent)
  } else if (theme.template === 'mono') {
    pdf.setFont('courier', 'bold')
    pdf.setFontSize(theme.fontSize * 1.35)
    pdf.setTextColor('#4a4a4a')
  } else {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(theme.fontSize * 0.9)
    pdf.setTextColor(theme.accent)
  }

  y = writeColumnWrappedText(pdf, heading, x, y, width, theme.lineHeight, theme)
  return y + (theme.template === 'blueprint' ? 10 : 8)
}

function writeTemplateBullets(
  pdf: JsPdfInstance,
  bullets: string[],
  x: number,
  y: number,
  width: number,
  theme: PdfTheme,
): number {
  const bulletIndent = theme.template === 'blueprint' ? 8 : 16
  const textIndent = theme.template === 'blueprint' ? 16 : 27
  pdf.setFont(theme.font, 'normal')
  pdf.setFontSize(theme.fontSize)
  pdf.setTextColor(theme.template === 'mono' ? '#666666' : '#111111')
  for (const bullet of bullets) {
    y = ensureColumnPage(pdf, y, theme.lineHeight, theme)
    pdf.text('•', x + bulletIndent, y)
    const lines = pdf.splitTextToSize(bullet, width - textIndent) as string[]
    for (const [index, line] of lines.entries()) {
      if (index > 0) y = ensureColumnPage(pdf, y + theme.lineHeight, theme.lineHeight, theme)
      pdf.text(line, x + textIndent, y)
    }
    y += theme.lineHeight * 0.95
  }
  return y
}

function writeTemplateEntry(
  pdf: JsPdfInstance,
  entry: PdfEntry,
  x: number,
  y: number,
  width: number,
  theme: PdfTheme,
): number {
  y = ensureColumnPage(pdf, y, theme.lineHeight * 4, theme)

  if (theme.template === 'coral' && entry.date) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(theme.fontSize * 0.82)
    pdf.setTextColor('#707070')
    y = writeColumnWrappedText(pdf, entry.date.toUpperCase(), x, y, width, theme.lineHeight, theme)
  }

  const titleColor = theme.template === 'mono' ? theme.accent : theme.template === 'green' ? '#3c3d4a' : '#000000'
  pdf.setFont(theme.template === 'mono' ? 'courier' : theme.font, 'bold')
  pdf.setFontSize(theme.fontSize * (theme.template === 'blueprint' ? 1.12 : 1))
  pdf.setTextColor(titleColor)
  y = writeColumnWrappedText(pdf, entry.title, x, y, width, theme.lineHeight, theme)

  if (theme.template !== 'coral' && entry.date) {
    pdf.setFont(theme.template === 'mono' ? 'courier' : 'helvetica', 'normal')
    pdf.setFontSize(theme.fontSize * 0.82)
    pdf.setTextColor(theme.template === 'mono' ? '#696969' : '#666666')
    y = writeColumnWrappedText(pdf, entry.date.toUpperCase(), x, y, width, theme.lineHeight * 0.92, theme)
  }

  if (entry.subtitle) {
    pdf.setFont(theme.font, 'normal')
    pdf.setFontSize(theme.fontSize * 0.9)
    pdf.setTextColor(theme.muted)
    y = writeColumnWrappedText(pdf, entry.subtitle, x, y, width, theme.lineHeight * 0.9, theme)
  }

  if (entry.bullets.length) y = writeTemplateBullets(pdf, entry.bullets, x, y + 2, width, theme)
  return y + (theme.template === 'blueprint' ? 13 : 16)
}

function writeTemplateSkills(
  pdf: JsPdfInstance,
  groups: ResumeSkillGroup[],
  x: number,
  y: number,
  width: number,
  theme: PdfTheme,
): number {
  for (const group of groups) {
    const skills = group.skills.filter(Boolean).join(', ')
    if (!skills) continue
    const text = group.title ? `${group.title}: ${skills}` : skills
    pdf.setFont(theme.font, group.title ? 'bold' : 'normal')
    pdf.setFontSize(theme.fontSize)
    pdf.setTextColor(theme.template === 'mono' ? '#666666' : '#111111')
    y = writeColumnWrappedText(pdf, text, x, y, width, theme.lineHeight, theme) + 4
  }
  return y
}

function writeTemplateSection(
  pdf: JsPdfInstance,
  section: PdfSection,
  x: number,
  y: number,
  width: number,
  theme: PdfTheme,
): number {
  y = writeTemplateSectionHeading(pdf, section, x, y, width, theme)
  if (section.text) {
    pdf.setFont(theme.font, 'normal')
    pdf.setFontSize(theme.fontSize)
    pdf.setTextColor(theme.template === 'mono' ? '#666666' : '#111111')
    y = writeColumnWrappedText(pdf, section.text, x, y, width, theme.lineHeight, theme) + 8
  }
  if (section.skillGroups) y = writeTemplateSkills(pdf, section.skillGroups, x, y, width, theme)
  if (section.entries) {
    for (const entry of section.entries) y = writeTemplateEntry(pdf, entry, x, y, width, theme)
  }
  return y
}

function renderUploadedTemplatePdf(pdf: JsPdfInstance, document: EditableResumeDocument, theme: PdfTheme): void {
  const sections = builderPdfSections(document)
  const y = writeTemplateHeader(pdf, document, theme)

  if (theme.template === 'blueprint') {
    const gap = 58
    const sideWidth = theme.contentWidth * 0.32
    const mainWidth = theme.contentWidth - sideWidth - gap
    const sideX = theme.marginX + mainWidth + gap
    const sideKeys = new Set(['skills', 'volunteer', 'certifications', 'publications', 'awards'])
    const sideSections = sections.filter(section => sideKeys.has(section.key))
    const mainSections = sections.filter(section => !sideKeys.has(section.key))

    let sideY = y
    for (const section of sideSections) sideY = writeTemplateSection(pdf, section, sideX, sideY, sideWidth, theme)
    pdf.setPage(1)
    let mainY = y
    for (const section of mainSections) mainY = writeTemplateSection(pdf, section, theme.marginX, mainY, mainWidth, theme)
    return
  }

  let sectionY = y
  for (const section of sections) sectionY = writeTemplateSection(pdf, section, theme.marginX, sectionY, theme.contentWidth, theme)
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
    font: pdfFont(document.design.fontFamily),
    fontSize: document.design.fontSize,
    lineHeight: document.design.fontSize * document.design.lineHeight,
    marginX: document.design.marginX,
    marginY: document.design.marginY,
    pageWidth,
    contentWidth: pageWidth - document.design.marginX * 2,
    pageHeight,
    compact: document.design.template === 'compact',
    template: document.design.template,
  }

  if (isUploadedTemplate(document.design.template)) {
    renderUploadedTemplatePdf(pdf, document, theme)
    return pdf.output('blob')
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
