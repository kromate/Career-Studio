import { describe, expect, it } from 'vitest'
import { jsPDF } from 'jspdf'
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { extractTextFromFile } from '@/lib/resume/parser'

describe('PDF resume extraction', () => {
  it('loads the PDF.js worker and extracts text from an uploaded PDF', async () => {
    const pdf = new jsPDF()
    pdf.text('Taylor Morgan', 20, 20)
    pdf.text('EXPERIENCE', 20, 32)
    pdf.text('Built reliable product workflows for growing teams.', 20, 44)

    const file = new File(
      [pdf.output('arraybuffer')],
      'taylor-morgan-resume.pdf',
      { type: 'application/pdf' },
    )

    const text = await extractTextFromFile(file)

    expect(text).toContain('Taylor Morgan')
    expect(text).toContain('EXPERIENCE')
    expect(text).toContain('Built reliable product workflows')
  })

  it.skipIf(!process.env.CAREER_STUDIO_TEST_RESUME)(
    'extracts text from a provided real resume',
    async () => {
      const resumePath = process.env.CAREER_STUDIO_TEST_RESUME as string
      const bytes = await readFile(resumePath)
      const file = new File(
        [new Uint8Array(bytes)],
        basename(resumePath),
        { type: 'application/pdf' },
      )

      const text = await extractTextFromFile(file)

      expect(text.length).toBeGreaterThan(500)
      expect(text.toLowerCase()).toContain('anthony')
    },
  )
})
