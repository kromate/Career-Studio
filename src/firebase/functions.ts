import { httpsCallable } from 'firebase/functions'
import { functions } from './init'

const longTimeoutFunctions = new Set([
    'messageAgent',
    'runAgentTest',
    'analyzeAgentTestFeedback',
    'runAgentRegressionTests',
])

const longTimeoutMs = 300_000
const maxRetries = 2
const baseDelayMs = 1500

const retryableCodes = new Set([
    'unavailable',
    'deadline-exceeded',
    'aborted',
    'cancelled',
    'functions/unavailable',
    'functions/deadline-exceeded',
    'functions/aborted',
    'functions/cancelled',
])

const nonRetryableCodes = new Set([
    'already-exists',
    'not-found',
    'permission-denied',
    'unauthenticated',
    'invalid-argument',
    'failed-precondition',
    'resource-exhausted',
    'unimplemented',
    'functions/already-exists',
    'functions/not-found',
    'functions/permission-denied',
    'functions/unauthenticated',
    'functions/invalid-argument',
    'functions/failed-precondition',
    'functions/resource-exhausted',
    'functions/unimplemented',
])

function isRetryable(error: unknown): boolean {
    const firebaseError = error as { code?: string; message?: string }
    const code = (firebaseError.code || '').toLowerCase()
    if (nonRetryableCodes.has(code)) return false
    if (code === 'internal' || code === 'functions/internal') {
        const message = (firebaseError.message || '').toLowerCase()
        return !message || message === 'internal' || message.includes('internal error')
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) return true
    if (retryableCodes.has(code)) return true

    const message = (firebaseError.message || '').toLowerCase()
    return message.includes('network')
        || message.includes('failed to fetch')
        || message.includes('timeout')
        || message.includes('econnrefused')
}

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function wrapFirebaseError(error: unknown): Error {
    if (error instanceof Error) return error
    return new Error('Firebase function request failed. Please try again.')
}

export const callFirebaseFunction = async <TResponse = unknown>(
    functionName: string,
    details: Record<string, unknown>,
): Promise<TResponse> => {
    const timeout = longTimeoutFunctions.has(functionName) ? longTimeoutMs : undefined
    const call = httpsCallable<Record<string, unknown>, TResponse>(
        functions,
        functionName,
        timeout ? { timeout } : undefined,
    )

    let lastError: unknown
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        try {
            const response = await call(details)
            return response.data
        } catch (error) {
            lastError = error
            if (attempt < maxRetries && isRetryable(error)) {
                const delay = baseDelayMs * 2 ** attempt + Math.random() * 500
                await wait(delay)
                continue
            }
            break
        }
    }

    throw wrapFirebaseError(lastError)
}