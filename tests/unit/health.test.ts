import { describe, expect, it, vi } from 'vitest'
import healthHandler from '@/../server/api/health.get'

describe('health endpoint contract', () => {
    it('returns safe status without secrets or resume text', async () => {
        vi.stubGlobal('useRuntimeConfig', () => ({
            tabstackApiKey: '',
            geminiApiKey: '',
            public: {
                appMode: 'local',
                firebaseApiKey: '',
                firebaseProjectId: '',
            },
        }))
        const response = await healthHandler({} as never)
        const serialized = JSON.stringify(response)

        expect(response.status).toBe('ok')
        expect(response.service).toBe('career-studio')
        expect(serialized).not.toMatch(/api[_-]?key|resume text|jordan\.lee@example\.com/i)
    })
})