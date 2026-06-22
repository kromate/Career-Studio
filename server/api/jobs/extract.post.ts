import type { StructuredJobImport } from '@/types'
import { createError, defineEventHandler, readBody } from 'h3'

type JsonRecord = Record<string, unknown>

interface FetchLikeError {
    data?: { error?: string; message?: string; statusMessage?: string }
    response?: { _data?: { error?: string; message?: string; statusMessage?: string } }
    status?: number
    statusCode?: number
    message?: string
}

const TABSTACK_EXTRACT_JSON_URL = 'https://api.tabstack.ai/v1/extract/json'
const MIN_DESCRIPTION_WORDS = 50

const jobExtractionSchema = {
    type: 'object',
    properties: {
        title: {
            type: ['string', 'null'],
            description: 'The job title or role name from the posting.',
        },
        company: {
            type: ['string', 'null'],
            description: 'The hiring company or organization named on the posting.',
        },
        location: {
            type: ['string', 'null'],
            description: 'The job location, remote status, or office location from the posting.',
        },
        description: {
            type: 'string',
            description: 'The complete job description text, including responsibilities, required qualifications, preferred qualifications, skills, experience level, and role details. Preserve the meaning of lists and paragraphs.',
        },
    },
    required: ['description'],
} as const

function asRecord(value: unknown): JsonRecord {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function asSingleLineText(value: unknown): string {
    return typeof value === 'string' ? value.normalize('NFC').replace(/\s+/g, ' ').trim() : ''
}

function normalizeDescription(value: unknown): string {
    if (typeof value !== 'string') return ''

    return value
        .normalize('NFC')
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .split('\n')
        .map(line => line.replace(/[ \t]+/g, ' ').trim())
        .filter((line, index, lines) => line.length > 0 || (index > 0 && Boolean(lines[index - 1]?.length)))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function wordCount(text: string): number {
    return text.trim() ? text.trim().split(/\s+/).length : 0
}

function isPrivateHostname(hostname: string): boolean {
    const value = hostname.toLowerCase()
    if (
        value === 'localhost'
        || value.endsWith('.localhost')
        || value.endsWith('.local')
        || value === '[::1]'
        || value === '::1'
    ) return true

    const octets = value.split('.').map(Number)
    if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet))) return false

    const [first, second] = octets
    return (
        first === 0
        || first === 10
        || first === 127
        || (first === 169 && second === 254)
        || (first === 172 && typeof second === 'number' && second >= 16 && second <= 31)
        || (first === 192 && second === 168)
    )
}

function normalizeJobUrl(input: string): string {
    let parsed: URL
    try {
        parsed = new URL(input.trim())
    } catch {
        throw createError({ statusCode: 400, statusMessage: 'Enter a valid job posting URL.' })
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw createError({ statusCode: 400, statusMessage: 'Job posting URL must start with http or https.' })
    }
    if (isPrivateHostname(parsed.hostname)) {
        throw createError({ statusCode: 422, statusMessage: 'Job posting URL must be publicly accessible.' })
    }

    return parsed.toString()
}

function extractionErrorMessage(error: unknown): string {
    const candidate = error as FetchLikeError
    return candidate.response?._data?.statusMessage
        || candidate.response?._data?.message
        || candidate.response?._data?.error
        || candidate.data?.statusMessage
        || candidate.data?.message
        || candidate.data?.error
        || candidate.message
        || 'Tabstack extraction failed.'
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const apiKey = String(config.tabstackApiKey || '')
    if (!apiKey) {
        throw createError({ statusCode: 503, statusMessage: 'Tabstack job extraction is not configured.' })
    }

    const body = await readBody<{ url?: string }>(event)
    const url = normalizeJobUrl(body.url || '')

    try {
        const response = await $fetch<JsonRecord>(TABSTACK_EXTRACT_JSON_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: {
                url,
                json_schema: jobExtractionSchema,
                effort: 'max',
            },
            signal: AbortSignal.timeout(45_000),
        })
        const extracted = asRecord(response)
        const source = new URL(url)
        const description = normalizeDescription(extracted.description)

        if (wordCount(description) < MIN_DESCRIPTION_WORDS) {
            throw createError({ statusCode: 422, statusMessage: 'Could not extract a complete job description from this URL.' })
        }

        const job: StructuredJobImport = {
            title: asSingleLineText(extracted.title) || 'Imported role',
            company: asSingleLineText(extracted.company) || source.hostname.replace(/^www\./, ''),
            location: asSingleLineText(extracted.location) || 'Not specified',
            url,
            description,
        }

        return { provider: 'tabstack', job }
    } catch (error) {
        const candidate = error as FetchLikeError
        const statusCode = candidate.statusCode || candidate.status
        if (statusCode && statusCode < 500 && statusCode !== 422) {
            throw createError({ statusCode: 502, statusMessage: extractionErrorMessage(error) })
        }
        if (statusCode === 422) throw error
        throw createError({ statusCode: 502, statusMessage: extractionErrorMessage(error) })
    }
})