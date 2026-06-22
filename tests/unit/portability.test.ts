import { describe, expect, it } from 'vitest'
import type { WorkspaceState } from '@/types'
import { matchResumeToJob } from '@/lib/resume/matching'
import { parseResumeText } from '@/lib/resume/parser'
import {
    CAREER_STUDIO_WORKSPACE_FORMAT,
    createCareerStudioWorkspaceExport,
    importCareerStudioWorkspaceExport,
    parseCareerStudioWorkspaceJson,
} from '@/lib/resume/portable'
import { scoreResume } from '@/lib/resume/scoring'
import { sampleJobDescription, sampleResume } from '../fixtures/sample-resume'

function sampleWorkspace(): WorkspaceState {
    const parsed = parseResumeText(sampleResume)
    const analysis = scoreResume(parsed, {
        resumeId: 'resume-1',
        versionId: 'version-1',
        createdAt: '2026-06-11T12:00:00.000Z',
    })
    const match = matchResumeToJob(parsed, sampleJobDescription, '2026-06-11T12:00:00.000Z')

    return {
        schemaVersion: 5,
        ownerId: 'user-1',
        masterResumeId: 'resume-1',
        user: null,
        resumes: [{
            id: 'resume-1',
            name: 'Jordan Lee',
            isMaster: true,
            originalFileName: 'jordan.txt',
            fileType: 'text/plain',
            createdAt: '2026-06-11T12:00:00.000Z',
            updatedAt: '2026-06-11T12:00:00.000Z',
            activeVersionId: 'version-1',
            versions: [{
                id: 'version-1',
                label: 'Original resume',
                createdAt: '2026-06-11T12:00:00.000Z',
                source: 'upload',
                kind: 'master',
                text: sampleResume,
                parsed,
                analysis,
                lineage: { acceptedSuggestionIds: [] },
                exportMetadata: [],
            }],
        }],
        jobs: [{
            id: 'job-1',
            title: 'Senior Frontend Engineer',
            company: 'Northstar',
            location: 'Remote',
            description: sampleJobDescription,
            createdAt: '2026-06-11T12:00:00.000Z',
            updatedAt: '2026-06-11T12:00:00.000Z',
            resumeId: 'resume-1',
            resumeVersionId: 'version-1',
            match,
        }],
        applications: [{
            id: 'application-1',
            jobId: 'job-1',
            status: 'drafting',
            createdAt: '2026-06-11T12:00:00.000Z',
            updatedAt: '2026-06-11T12:00:00.000Z',
            resumeId: 'resume-1',
            resumeVersionId: 'version-1',
            coverLetterDraftIds: ['cover-1'],
        }],
        coverLetters: [{
            id: 'cover-1',
            title: 'Senior Frontend Engineer cover letter',
            jobId: 'job-1',
            resumeId: 'resume-1',
            resumeVersionId: 'version-1',
            tone: 'direct',
            length: 'standard-letter',
            createdAt: '2026-06-11T12:00:00.000Z',
            updatedAt: '2026-06-11T12:00:00.000Z',
            paragraphs: [{
                id: 'paragraph-1',
                text: 'I am interested in applying for the role.',
                evidenceSources: [{ type: 'job-description', id: 'job-1', quote: 'Senior Frontend Engineer' }],
                unsupported: false,
            }],
            exportMetadata: [],
            status: 'ready',
        }],
        publicShares: [{
            id: 'share-1',
            resumeId: 'resume-1',
            versionId: 'version-1',
            resumeName: 'Jordan Lee',
            versionLabel: 'Original resume',
            createdAt: '2026-06-11T12:00:00.000Z',
            parsed,
            includeContact: true,
            visibility: 'local-public',
        }],
        settings: {
            emailUpdates: true,
            weeklyReview: true,
            retainUploads: false,
            scoringDetails: true,
            aiProvider: {
                provider: 'local-preview',
                model: 'deterministic-local',
                baseUrl: '',
                enabled: true,
                lastStatus: 'untested',
            },
        },
        hydrated: true,
    }
}

describe('Career Studio JSON portability', () => {
    it('exports and imports a workspace while recomputing current hashes, scores, and matches', () => {
        const exported = createCareerStudioWorkspaceExport(sampleWorkspace())
        const parsed = parseCareerStudioWorkspaceJson(JSON.stringify(exported))
        const imported = importCareerStudioWorkspaceExport(parsed)
        const version = imported.resumes[0]?.versions[0]

        expect(exported.format).toBe(CAREER_STUDIO_WORKSPACE_FORMAT)
        expect(imported.resumes).toHaveLength(1)
        expect(imported.masterResumeId).toBe('resume-1')
        expect(version?.parsed.contentHash).toBe(parseResumeText(sampleResume).contentHash)
        expect(version?.analysis.canonicalContentHash).toBe(version?.parsed.contentHash)
        expect(version?.historicalAnalyses?.[0]?.id).toBe(exported.resumes[0]?.versions[0]?.analysis.id)
        expect(imported.jobs[0]?.match?.resumeContentHash).toBe(version?.parsed.contentHash)
        expect(imported.applications[0]?.status).toBe('drafting')
        expect(imported.coverLetters[0]?.paragraphs[0]?.evidenceSources[0]?.type).toBe('job-description')
        expect(imported.publicShares[0]?.parsed.contentHash).toBe(version?.parsed.contentHash)
    })

    it('rejects non-Career Studio JSON files', () => {
        expect(() => parseCareerStudioWorkspaceJson('{"format":"other"}')).toThrow(/Career Studio/)
        expect(() => parseCareerStudioWorkspaceJson('not json')).toThrow(/valid JSON/)
    })
})