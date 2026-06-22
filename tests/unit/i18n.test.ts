import { describe, expect, it } from 'vitest'
import { enMessages, messageKeys, missingMessageKeys } from '@/lib/i18n/messages'

describe('i18n readiness', () => {
    it('reports locale key parity gaps', () => {
        expect(messageKeys(enMessages)).toContain('coverLetters.studio')
        expect(missingMessageKeys(enMessages, { app: { overview: 'Overview' } })).toContain('actions.export')
        expect(missingMessageKeys(enMessages, enMessages)).toEqual([])
    })
})