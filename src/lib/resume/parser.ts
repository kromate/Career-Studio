import type { ParsedResume, ResumeLine, ResumeSection, ResumeSectionType } from '@/types'
import { SECTION_HEADINGS } from './constants'

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/
const LINKEDIN_PATTERN = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i
const URL_PATTERN = /https?:\/\/[^\s|]+/gi
const DATE_PATTERN = /\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\b/i
const BULLET_PATTERN = /^\s*(?:[-*+]|[•◦▪‣])\s+/
const PDF_BULLET_PATTERN = /^\s*[•●◦▪‣]\s*/

export interface PdfTextItem {
  str: string
  hasEOL?: boolean
  width?: number
  transform?: number[]
}

interface PdfPhysicalLine {
  text: string
  x: number
}

export function normalizeResumeText(input: string): string {
  return input
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter((line, index, lines) => line.length > 0 || (index > 0 && lines[index - 1]?.length))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function hashText(input: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function pdfItemX(item: PdfTextItem): number {
  return item.transform?.[4] || 0
}

function appendPdfFragment(
  line: string,
  fragment: string,
  item: PdfTextItem,
  previousItem?: PdfTextItem,
): string {
  if (!fragment) return line
  if (/^\s+$/.test(fragment)) return line.endsWith(' ') ? line : `${line} `

  const text = fragment.trim()
  if (!line) return text

  const previousEnd = previousItem
    ? pdfItemX(previousItem) + (previousItem.width || 0)
    : pdfItemX(item)
  const gap = pdfItemX(item) - previousEnd
  const fontSize = Math.abs(item.transform?.[0] || 10)
  const needsSpace = !/\s$/.test(line)
    && !/^[,.;:!?%)\]}]/.test(text)
    && gap > fontSize * 0.08

  return `${line}${needsSpace ? ' ' : ''}${text}`
}

function physicalLinesFromPdfItems(items: PdfTextItem[]): PdfPhysicalLine[] {
  const lines: PdfPhysicalLine[] = []
  let line = ''
  let lineX = 0
  let previousItem: PdfTextItem | undefined

  const flush = () => {
    const text = line.replace(/\s+/g, ' ').trim()
    if (text) lines.push({ text, x: lineX })
    line = ''
    lineX = 0
    previousItem = undefined
  }

  items.forEach((item) => {
    if (item.str && !line) lineX = pdfItemX(item)
    line = appendPdfFragment(line, item.str, item, previousItem)
    if (item.str) previousItem = item
    if (item.hasEOL) flush()
  })
  flush()

  return lines
}

function isPdfPageNumber(line: PdfPhysicalLine): boolean {
  return /^\d{1,3}$/.test(line.text) && line.x > 450
}

function mergePdfBulletLines(lines: PdfPhysicalLine[]): string[] {
  const merged: string[] = []
  let activeBulletIndex = -1

  lines.forEach((line) => {
    if (isPdfPageNumber(line)) return

    if (PDF_BULLET_PATTERN.test(line.text)) {
      merged.push(line.text.replace(PDF_BULLET_PATTERN, '• '))
      activeBulletIndex = merged.length - 1
      return
    }

    if (activeBulletIndex >= 0 && line.x >= 55) {
      merged[activeBulletIndex] = `${merged[activeBulletIndex]} ${line.text}`.replace(/\s+/g, ' ')
      return
    }

    activeBulletIndex = -1
    merged.push(line.text)
  })

  return merged
}

export function reconstructPdfText(pages: PdfTextItem[][]): string {
  return pages
    .map(items => mergePdfBulletLines(physicalLinesFromPdfItems(items)).join('\n'))
    .filter(Boolean)
    .join('\n\f\n')
    .trim()
}

function normalizeHeading(line: string): string {
  return line
    .toLowerCase()
    .replace(/[:|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sectionForHeading(line: string): ResumeSectionType | null {
  const normalized = normalizeHeading(line)
  for (const section of SECTION_HEADINGS) {
    if (section.patterns.includes(normalized)) return section.type
  }
  return null
}

function looksLikeHeading(line: string): boolean {
  if (line.length > 42) return false
  const words = line.split(/\s+/)
  if (words.length > 5) return false
  return line === line.toUpperCase() || /^[A-Z][A-Za-z &/-]+$/.test(line)
}

function inferLocation(lines: string[]): string | undefined {
  return lines.slice(0, 6).find((line) => {
    if (EMAIL_PATTERN.test(line) || PHONE_PATTERN.test(line) || LINKEDIN_PATTERN.test(line)) return false
    return /\b[A-Z][a-z]+,\s*(?:[A-Z]{2}|[A-Z][a-z]+)\b/.test(line)
  })
}

function inferWebsite(lines: string[]): string | undefined {
  for (const line of lines.slice(0, 6)) {
    const candidate = line
      .match(URL_PATTERN)
      ?.map(url => url.replace(/[),.;]+$/, ''))
      .find(url => !LINKEDIN_PATTERN.test(url))
    if (candidate) return candidate
  }
}

export function parseResumeText(input: string): ParsedResume {
  const explicitPageCount = input.includes('\f')
    ? input.split('\f').filter(page => page.trim()).length
    : null
  const normalizedText = normalizeResumeText(input)
  const rawLines = normalizedText ? normalizedText.split('\n').filter(Boolean) : []
  const lines: ResumeLine[] = []
  const sections: ResumeSection[] = []
  let currentSection: ResumeSectionType = 'header'
  let currentSectionId = 'section-header'

  sections.push({
    id: currentSectionId,
    type: 'header',
    title: 'Header',
    lineIds: [],
  })

  rawLines.forEach((rawLine, index) => {
    const headingSection = sectionForHeading(rawLine)
    if (headingSection) {
      currentSection = headingSection
      currentSectionId = `section-${headingSection}-${sections.length}`
      sections.push({
        id: currentSectionId,
        type: headingSection,
        title: rawLine,
        lineIds: [],
      })
    } else if (looksLikeHeading(rawLine) && index > 2 && currentSection === 'header') {
      currentSection = 'other'
      currentSectionId = `section-other-${sections.length}`
      sections.push({
        id: currentSectionId,
        type: 'other',
        title: rawLine,
        lineIds: [],
      })
    }

    const id = `line-${index + 1}`
    const isContact = index < 6 && (
      EMAIL_PATTERN.test(rawLine)
      || PHONE_PATTERN.test(rawLine)
      || LINKEDIN_PATTERN.test(rawLine)
    )
    const line: ResumeLine = {
      id,
      text: rawLine.replace(BULLET_PATTERN, ''),
      section: headingSection || currentSection,
      kind: headingSection
        ? 'heading'
        : isContact
          ? 'contact'
          : BULLET_PATTERN.test(rawLine)
            ? 'bullet'
            : 'body',
      index,
    }
    lines.push(line)
    sections.find(section => section.id === currentSectionId)?.lineIds.push(id)
  })

  const words = normalizedText ? normalizedText.split(/\s+/).filter(Boolean).length : 0
  const recognizedSections = new Set(sections.map(section => section.type).filter(type => type !== 'header' && type !== 'other'))
  const bullets = lines.filter(line => line.kind === 'bullet').length
  const datedLines = lines.filter(line => DATE_PATTERN.test(line.text)).length
  const warnings: string[] = []

  if (words < 120) warnings.push('Very little resume text was extracted.')
  if (recognizedSections.size < 2) warnings.push('The document structure could not be identified reliably.')
  if (!lines.some(line => EMAIL_PATTERN.test(line.text))) warnings.push('No email address was detected.')
  if (bullets === 0) warnings.push('No bullet points were detected in the extracted document.')

  const confidence = words >= 250 && recognizedSections.size >= 3
    ? 'high'
    : words >= 120 && recognizedSections.size >= 2
      ? 'medium'
      : 'low'

  return {
    normalizedText,
    contentHash: hashText(normalizedText),
    lines,
    sections,
    contacts: {
      email: normalizedText.match(EMAIL_PATTERN)?.[0],
      phone: normalizedText.match(PHONE_PATTERN)?.[0],
      linkedIn: normalizedText.match(LINKEDIN_PATTERN)?.[0],
      website: inferWebsite(rawLines),
      location: inferLocation(rawLines),
    },
    stats: {
      words,
      pagesEstimated: explicitPageCount || Math.max(1, Math.ceil(words / 450)),
      bullets,
      datedLines,
    },
    confidence,
    warnings,
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'txt') return file.text()

  if (extension === 'docx') {
    const mammoth = await import('mammoth/mammoth.browser')
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return result.value
  }

  if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    if (import.meta.env.SSR) {
      const workerModule = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs')
      const workerScope = globalThis as typeof globalThis & {
        pdfjsWorker?: typeof workerModule
      }
      workerScope.pdfjsWorker = workerModule
    } else {
      const workerModule = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
      pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default
    }
    const document = await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise
    const pages: PdfTextItem[][] = []

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent()
      const items: PdfTextItem[] = []

      content.items.forEach((item) => {
        if ('str' in item) {
          items.push({
            str: item.str,
            hasEOL: item.hasEOL,
            width: item.width,
            transform: item.transform,
          })
        }
      })
      pages.push(items)
    }

    return reconstructPdfText(pages)
  }

  throw new Error('Unsupported file type. Upload a PDF, DOCX, or TXT file.')
}
