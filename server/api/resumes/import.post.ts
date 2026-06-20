import type {
  ResumeExperienceLevel,
  StructuredResumeImport,
  StructuredResumeSimpleEntry,
} from '@/types'
import { createError, defineEventHandler, readBody } from 'h3'

type JsonRecord = Record<string, unknown>

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

const MAX_IMPORT_CHARACTERS = 45_000
const GEMINI_IMPORT_MODEL = 'gemini-3.1-flash-lite'

const prompt = `You are structuring resume text for a resume editor.

Rules:
- Use only facts explicitly present in the source text.
- Do not invent employers, titles, dates, schools, certifications, metrics, locations, links, or technologies.
- Preserve dates as written when possible.
- Preserve bullet meaning. Light cleanup of bullet markers and wrapped lines is fine.
- If a value is missing, use an empty string, false, or an empty array.
- Return only valid JSON. Do not wrap it in markdown.

JSON shape:
{
  "profile": {
    "firstName": "",
    "lastName": "",
    "email": "",
    "phone": "",
    "location": "",
    "links": [{ "label": "", "url": "" }],
    "summary": "",
    "targetRole": "",
    "experienceLevel": "entry|mid|senior"
  },
  "workExperiences": [{
    "jobTitle": "",
    "employer": "",
    "location": "",
    "startDate": "",
    "endDate": "",
    "current": false,
    "bullets": [""]
  }],
  "educations": [{
    "school": "",
    "degree": "",
    "location": "",
    "startDate": "",
    "endDate": "",
    "details": [""]
  }],
  "skills": [{ "title": "", "skills": [""] }],
  "projects": [{
    "name": "",
    "role": "",
    "url": "",
    "startDate": "",
    "endDate": "",
    "bullets": [""]
  }],
  "volunteerExperiences": [{ "title": "", "subtitle": "", "date": "", "location": "", "bullets": [""] }],
  "certifications": [{ "title": "", "subtitle": "", "date": "", "location": "", "bullets": [""] }],
  "publications": [{ "title": "", "subtitle": "", "date": "", "location": "", "bullets": [""] }],
  "awards": [{ "title": "", "subtitle": "", "date": "", "location": "", "bullets": [""] }]
}`

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function asRecordArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.map(asRecord).filter(record => Object.keys(record).length > 0) : []
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function asTextArray(value: unknown, limit = 24): string[] {
  return Array.isArray(value) ? value.map(asText).filter(Boolean).slice(0, limit) : []
}

function asExperienceLevel(value: unknown): ResumeExperienceLevel {
  return value === 'senior' || value === 'mid' || value === 'entry' ? value : 'entry'
}

function createSimpleEntry(entry: JsonRecord): StructuredResumeSimpleEntry {
  return {
    title: asText(entry.title),
    subtitle: asText(entry.subtitle),
    date: asText(entry.date),
    location: asText(entry.location),
    bullets: asTextArray(entry.bullets),
  }
}

function normalizeResumeText(input: string): string {
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

function extractModelJson(text: string): JsonRecord {
  const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
  const candidate = fencedJson || text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('Model response did not contain JSON.')
  return asRecord(JSON.parse(candidate.slice(start, end + 1)))
}

function sanitizeStructuredResume(input: JsonRecord): StructuredResumeImport {
  const profile = asRecord(input.profile)
  return {
    profile: {
      firstName: asText(profile.firstName),
      lastName: asText(profile.lastName),
      email: asText(profile.email),
      phone: asText(profile.phone),
      location: asText(profile.location),
      links: asRecordArray(profile.links).map(link => ({
        label: asText(link.label) || 'Link',
        url: asText(link.url),
      })).filter(link => link.url),
      summary: asText(profile.summary),
      targetRole: asText(profile.targetRole),
      experienceLevel: asExperienceLevel(profile.experienceLevel),
    },
    workExperiences: asRecordArray(input.workExperiences).map(entry => ({
      jobTitle: asText(entry.jobTitle),
      employer: asText(entry.employer),
      location: asText(entry.location),
      startDate: asText(entry.startDate),
      endDate: asText(entry.endDate),
      current: entry.current === true,
      bullets: asTextArray(entry.bullets),
    })).filter(entry => entry.jobTitle || entry.employer || entry.bullets.length),
    educations: asRecordArray(input.educations).map(entry => ({
      school: asText(entry.school),
      degree: asText(entry.degree),
      location: asText(entry.location),
      startDate: asText(entry.startDate),
      endDate: asText(entry.endDate),
      details: asTextArray(entry.details),
    })).filter(entry => entry.school || entry.degree || entry.details.length),
    skills: asRecordArray(input.skills).map(group => ({
      title: asText(group.title),
      skills: asTextArray(group.skills, 80),
    })).filter(group => group.skills.length),
    projects: asRecordArray(input.projects).map(entry => ({
      name: asText(entry.name),
      role: asText(entry.role),
      url: asText(entry.url),
      startDate: asText(entry.startDate),
      endDate: asText(entry.endDate),
      bullets: asTextArray(entry.bullets),
    })).filter(entry => entry.name || entry.role || entry.bullets.length),
    volunteerExperiences: asRecordArray(input.volunteerExperiences).map(createSimpleEntry),
    certifications: asRecordArray(input.certifications).map(createSimpleEntry),
    publications: asRecordArray(input.publications).map(createSimpleEntry),
    awards: asRecordArray(input.awards).map(createSimpleEntry),
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = String(config.geminiApiKey || '')
  const model = GEMINI_IMPORT_MODEL
  if (!apiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Gemini import assist is not configured.' })
  }

  const body = await readBody<{ text?: string }>(event)
  const sourceText = normalizeResumeText(body.text || '').slice(0, MAX_IMPORT_CHARACTERS)
  if (sourceText.length < 20) {
    throw createError({ statusCode: 400, statusMessage: 'Resume text is too short to structure.' })
  }

  try {
    const response = await $fetch<GeminiResponse>(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?${new URLSearchParams({ key: apiKey })}`,
      {
        method: 'POST',
        body: {
          contents: [{
            role: 'user',
            parts: [{ text: `${prompt}\n\nSource resume text:\n${sourceText}` }],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        },
        signal: AbortSignal.timeout(25_000),
      },
    )
    const text = response.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('\n') || ''
    const resume = sanitizeStructuredResume(extractModelJson(text))
    return { provider: 'google-gemini', model, resume }
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Gemini import assist failed. Check VITE_GEMINI_API_KEY and model access.' })
  }
})