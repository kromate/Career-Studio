import type {
  AppSettings,
  ApplicationRecord,
  ApplicationStatus,
  EditableResumeDocument,
  ResumeBuilderSource,
  ResumeExperienceLevel,
  ResumeRecord,
  ResumeVersion,
  SavedJob,
  UserProfile,
  WorkspaceState,
} from '@/types'
import {
  builderDocumentToParsedResume,
  builderDocumentToText,
  createEmptyBuilderDocument,
  mergeBuilderDocument,
  parsedResumeToBuilderDocument,
} from '@/lib/resume/builder'
import { matchResumeToJob } from '@/lib/resume/matching'
import { SCORING_VERSION } from '@/lib/resume/constants'
import { hashText, parseResumeText } from '@/lib/resume/parser'
import { scoreResume } from '@/lib/resume/scoring'

const STORAGE_KEY = 'career-studio:workspace:v1'

function defaultSettings(): AppSettings {
  return {
    emailUpdates: true,
    weeklyReview: true,
    retainUploads: false,
    scoringDetails: true,
  }
}

function initialState(): WorkspaceState {
  return {
    schemaVersion: 4,
    ownerId: null,
    user: null,
    resumes: [],
    jobs: [],
    applications: [],
    settings: defaultSettings(),
    hydrated: false,
  }
}

function removeLegacyDemoData(workspace: WorkspaceState): WorkspaceState {
  const demoResumeIds = new Set(
    workspace.resumes
      .filter(resume => (
        resume.originalFileName === 'jordan-lee-resume.txt'
        || resume.name === 'Jordan Lee - Product Engineer'
        || resume.versions.some(version => (
          version.text.includes('JORDAN LEE')
          && version.text.includes('jordan.lee@example.com')
          && version.text.includes('Northstar Labs')
        ))
      ))
      .map(resume => resume.id),
  )
  const demoJobIds = new Set(
    workspace.jobs
      .filter(job => (
        job.url === 'https://example.com/jobs/senior-frontend-engineer'
        || (
          job.company === 'Linear Labs'
          && job.title === 'Senior Frontend Engineer'
          && job.description.includes('workflow products')
        )
      ))
      .map(job => job.id),
  )
  const resumes = workspace.resumes.filter(resume => !demoResumeIds.has(resume.id))
  const jobs = workspace.jobs
    .filter(job => !demoJobIds.has(job.id))
    .map(job => (
      job.resumeId && demoResumeIds.has(job.resumeId)
        ? { ...job, resumeId: undefined, resumeVersionId: undefined, match: undefined }
        : job
    ))
  const jobIds = new Set(jobs.map(job => job.id))

  return {
    ...workspace,
    schemaVersion: 4,
    resumes,
    jobs,
    applications: workspace.applications.filter(application => jobIds.has(application.jobId)),
  }
}

function refreshOutdatedAnalyses(workspace: WorkspaceState): WorkspaceState {
  return {
    ...workspace,
    resumes: workspace.resumes.map(resume => ({
      ...resume,
      builderDocument: resume.builderDocument
        ? mergeBuilderDocument(resume.builderDocument)
        : undefined,
      versions: resume.versions.map((version) => {
        if (version.analysis.scoringVersion === SCORING_VERSION) return version

        const parsed = parseResumeText(version.text)
        return {
          ...version,
          parsed,
          analysis: scoreResume(parsed, {
            resumeId: resume.id,
            versionId: version.id,
            createdAt: version.analysis.createdAt || version.createdAt,
          }),
        }
      }),
    })),
  }
}

function createId(prefix: string): string {
  if (import.meta.client && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function now(): string {
  return new Date().toISOString()
}
 
function stripFileExtension(fileName?: string): string {
  return fileName?.replace(/\.(pdf|docx|txt)$/i, '').replace(/[-_]+/g, ' ').trim() || ''
}

function fullName(document: EditableResumeDocument): string {
  return `${document.profile.firstName} ${document.profile.lastName}`.trim()
}

function inferTargetRole(document: EditableResumeDocument, fallback = ''): string {
  return fallback.trim() || document.profile.targetRole.trim() || document.workExperiences[0]?.jobTitle.trim() || ''
}

function dateYear(value: string): number | null {
  const year = value.match(/(?:19|20)\d{2}/)?.[0]
  return year ? Number(year) : null
}

function inferExperienceLevel(document: EditableResumeDocument, timestamp: string): ResumeExperienceLevel {
  const titles = document.workExperiences.map(entry => entry.jobTitle).join(' ')
  if (/\b(senior|lead|staff|principal|head|director|manager)\b/i.test(titles)) return 'senior'

  const years = document.workExperiences
    .flatMap(entry => [dateYear(entry.startDate), dateYear(entry.current ? timestamp : entry.endDate)])
    .filter((year): year is number => typeof year === 'number')
  const earliest = Math.min(...years)
  const latest = Math.max(...years, new Date(timestamp).getFullYear())
  const span = Number.isFinite(earliest) ? latest - earliest : 0

  if (span >= 5 || document.workExperiences.length >= 3) return 'senior'
  if (span >= 2 || document.workExperiences.length >= 2) return 'mid'
  return 'entry'
}

function createVersion(
  resumeId: string,
  text: string,
  label: string,
  source: ResumeVersion['source'],
  targetJobId?: string,
): ResumeVersion {
  const versionId = createId('version')
  const parsed = parseResumeText(text)
  const analysis = scoreResume(parsed, {
    resumeId,
    versionId,
    createdAt: now(),
  })
  return {
    id: versionId,
    label,
    createdAt: analysis.createdAt,
    source,
    text,
    parsed,
    analysis,
    targetJobId,
  }
}

function syncBuilderVersion(
  resume: ResumeRecord,
  document: EditableResumeDocument,
  timestamp = now(),
): ResumeRecord {
  const text = builderDocumentToText(document)
  const parsed = builderDocumentToParsedResume(document)
  const existing = resume.versions.find(version => version.source === 'builder')
  const versionId = existing?.id || createId('version')
  const analysis = scoreResume(parsed, {
    resumeId: resume.id,
    versionId,
    createdAt: timestamp,
  })
  const version: ResumeVersion = {
    id: versionId,
    label: 'Builder resume',
    createdAt: existing?.createdAt || timestamp,
    source: 'builder',
    text,
    parsed,
    analysis,
    intentionalRuleIds: existing?.intentionalRuleIds,
  }

  return {
    ...resume,
    targetJobTitle: document.profile.targetRole,
    experienceLevel: document.profile.experienceLevel,
    builderSource: document.source,
    builderDocument: document,
    updatedAt: timestamp,
    activeVersionId: version.id,
    versions: [version, ...resume.versions.filter(item => item.id !== versionId)],
  }
}

export function useWorkspace() {
  const state = useState<WorkspaceState>('career-studio-workspace', initialState)

  const persist = () => {
    if (!import.meta.client) return
    const serializable = { ...state.value, hydrated: true }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
  }

  const hydrate = () => {
    if (!import.meta.client || state.value.hydrated) return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as WorkspaceState
        const storedProvider = (parsed.user as { authProvider?: string } | null)?.authProvider
        const hasOutdatedAnalyses = parsed.resumes.some(resume => (
          resume.versions.some(version => version.analysis.scoringVersion !== SCORING_VERSION)
        ))
        const migrated = refreshOutdatedAnalyses(removeLegacyDemoData({
          ...initialState(),
          ...parsed,
          ownerId: parsed.ownerId || parsed.user?.id || null,
          user: storedProvider === 'demo' ? null : parsed.user,
          settings: { ...defaultSettings(), ...parsed.settings },
          hydrated: true,
        }))
        state.value = migrated
        if (
          storedProvider === 'demo'
          || hasOutdatedAnalyses
          || parsed.schemaVersion !== migrated.schemaVersion
          || parsed.resumes.length !== migrated.resumes.length
          || parsed.jobs.length !== migrated.jobs.length
          || parsed.applications.length !== migrated.applications.length
        ) persist()
        return
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    state.value.hydrated = true
    persist()
  }

  const login = (user: UserProfile) => {
    const hasWorkspaceData = Boolean(
      state.value.resumes.length
      || state.value.jobs.length
      || state.value.applications.length,
    )
    const belongsToAnotherUser = Boolean(
      (state.value.ownerId && state.value.ownerId !== user.id)
      || (!state.value.ownerId && hasWorkspaceData),
    )
    if (belongsToAnotherUser) {
      state.value = {
        ...initialState(),
        ownerId: user.id,
        user,
        hydrated: true,
      }
      persist()
      return
    }
    state.value.ownerId = user.id
    state.value.user = user
    persist()
  }

  const logout = () => {
    state.value.user = null
    persist()
  }

  const addResume = (
    name: string,
    originalFileName: string,
    fileType: string,
    text: string,
  ): ResumeRecord => {
    const resumeId = createId('resume')
    const version = createVersion(resumeId, text, 'Original resume', 'upload')
    const createdAt = now()
    const resume: ResumeRecord = {
      id: resumeId,
      name,
      originalFileName,
      fileType,
      createdAt,
      updatedAt: createdAt,
      activeVersionId: version.id,
      versions: [version],
    }
    state.value.resumes.unshift(resume)
    persist()
    return resume
  }

  const addBuilderResume = (input: {
    name?: string
    targetJobTitle?: string
    experienceLevel?: ResumeExperienceLevel
    source?: ResumeBuilderSource
    originalFileName?: string
    fileType?: string
    sourceText?: string
    builderDocument?: EditableResumeDocument
  }): ResumeRecord => {
    const resumeId = createId('resume')
    const createdAt = now()
    const sourceText = input.sourceText?.trim()
    const document = input.builderDocument
      ? mergeBuilderDocument({
        ...input.builderDocument,
        source: input.source || input.builderDocument.source,
        updatedAt: createdAt,
      })
      : sourceText
      ? parsedResumeToBuilderDocument({
        parsed: parseResumeText(sourceText),
        targetRole: input.targetJobTitle,
        experienceLevel: input.experienceLevel,
        now: createdAt,
      })
      : createEmptyBuilderDocument({
        id: createId('builder'),
        source: input.source || 'new',
        targetRole: input.targetJobTitle || '',
        experienceLevel: input.experienceLevel || 'entry',
        now: createdAt,
      })
    const targetJobTitle = inferTargetRole(document, input.targetJobTitle)
    const experienceLevel = input.experienceLevel
      || (input.builderDocument ? document.profile.experienceLevel : undefined)
      || (sourceText ? inferExperienceLevel(document, createdAt) : 'entry')
    const hydratedDocument = mergeBuilderDocument({
      ...document,
      profile: {
        ...document.profile,
        targetRole: targetJobTitle,
        experienceLevel,
      },
    })
    const name = input.name?.trim()
      || fullName(hydratedDocument)
      || stripFileExtension(input.originalFileName)
      || targetJobTitle
      || 'Untitled resume'
    const resume: ResumeRecord = {
      id: resumeId,
      name,
      originalFileName: input.originalFileName || `${name}.txt`,
      fileType: input.fileType || 'text/plain',
      targetJobTitle,
      experienceLevel,
      builderSource: input.source || 'new',
      builderDocument: hydratedDocument,
      createdAt,
      updatedAt: createdAt,
      activeVersionId: '',
      versions: sourceText
        ? [createVersion(resumeId, sourceText, 'Imported resume', 'upload')]
        : [],
    }
    const synced = syncBuilderVersion(resume, hydratedDocument, createdAt)
    state.value.resumes.unshift(synced)
    persist()
    return synced
  }

  const updateBuilderDocument = (
    resumeId: string,
    updater: (document: EditableResumeDocument) => EditableResumeDocument,
  ) => {
    const index = state.value.resumes.findIndex(item => item.id === resumeId)
    if (index < 0) return
    const resume = state.value.resumes[index]!
    const baseDocument = mergeBuilderDocument(resume.builderDocument || createEmptyBuilderDocument({
      targetRole: resume.targetJobTitle || '',
      experienceLevel: resume.experienceLevel || 'entry',
    }))
    const timestamp = now()
    const document = mergeBuilderDocument({ ...updater(baseDocument), updatedAt: timestamp })
    state.value.resumes[index] = syncBuilderVersion(resume, document, timestamp)
    persist()
  }

  const duplicateResume = (resumeId: string): ResumeRecord | undefined => {
    const resume = state.value.resumes.find(item => item.id === resumeId)
    if (!resume) return undefined
    const createdAt = now()
    const duplicateId = createId('resume')
    const versionIds = new Map<string, string>()
    const versions = resume.versions.map((version) => {
      const versionId = createId('version')
      versionIds.set(version.id, versionId)
      return {
        ...version,
        id: versionId,
        createdAt,
        analysis: scoreResume(version.parsed, {
          resumeId: duplicateId,
          versionId,
          createdAt,
        }),
      }
    })
    const duplicate: ResumeRecord = {
      ...resume,
      id: duplicateId,
      name: `${resume.name} copy`,
      createdAt,
      updatedAt: createdAt,
      activeVersionId: versionIds.get(resume.activeVersionId) || versions[0]?.id || '',
      versions,
      builderDocument: resume.builderDocument
        ? mergeBuilderDocument({ ...JSON.parse(JSON.stringify(resume.builderDocument)), id: createId('builder'), updatedAt: createdAt })
        : undefined,
    }
    state.value.resumes.unshift(duplicate)
    persist()
    return duplicate
  }

  const addResumeVersion = (
    resumeId: string,
    text: string,
    label: string,
    source: ResumeVersion['source'],
    targetJobId?: string,
  ): ResumeVersion => {
    const resume = state.value.resumes.find(item => item.id === resumeId)
    if (!resume) throw new Error('Resume not found.')
    const version = createVersion(resumeId, text, label, source, targetJobId)
    resume.versions.unshift(version)
    resume.activeVersionId = version.id
    resume.updatedAt = version.createdAt
    persist()
    return version
  }

  const setActiveVersion = (resumeId: string, versionId: string) => {
    const resume = state.value.resumes.find(item => item.id === resumeId)
    if (!resume?.versions.some(version => version.id === versionId)) return
    resume.activeVersionId = versionId
    resume.updatedAt = now()
    persist()
  }

  const toggleFindingIntentional = (resumeId: string, versionId: string, ruleId: string) => {
    const resume = state.value.resumes.find(item => item.id === resumeId)
    const version = resume?.versions.find(item => item.id === versionId)
    if (!resume || !version) return
    const intentionalRuleIds = new Set(version.intentionalRuleIds || [])
    if (intentionalRuleIds.has(ruleId)) intentionalRuleIds.delete(ruleId)
    else intentionalRuleIds.add(ruleId)
    version.intentionalRuleIds = [...intentionalRuleIds]
    resume.updatedAt = now()
    persist()
  }

  const renameResume = (resumeId: string, name: string) => {
    const resume = state.value.resumes.find(item => item.id === resumeId)
    if (!resume) return
    resume.name = name.trim() || resume.name
    resume.updatedAt = now()
    persist()
  }

  const deleteResume = (resumeId: string) => {
    state.value.resumes = state.value.resumes.filter(resume => resume.id !== resumeId)
    state.value.jobs = state.value.jobs.map(job => (
      job.resumeId === resumeId
        ? { ...job, resumeId: undefined, resumeVersionId: undefined, match: undefined }
        : job
    ))
    persist()
  }

  const saveJob = (input: {
    title: string
    company: string
    location: string
    url?: string
    description: string
    resumeId?: string
  }): SavedJob => {
    const createdAt = now()
    const resume = input.resumeId
      ? state.value.resumes.find(item => item.id === input.resumeId)
      : state.value.resumes[0]
    const version = resume?.versions.find(item => item.id === resume.activeVersionId)
    const job: SavedJob = {
      id: createId('job'),
      title: input.title.trim() || 'Untitled role',
      company: input.company.trim() || 'Unknown company',
      location: input.location.trim() || 'Not specified',
      url: input.url?.trim() || undefined,
      description: input.description.trim(),
      createdAt,
      updatedAt: createdAt,
      resumeId: resume?.id,
      resumeVersionId: version?.id,
      match: version && input.description.trim()
        ? matchResumeToJob(version.parsed, input.description, createdAt)
        : undefined,
    }
    state.value.jobs.unshift(job)
    persist()
    return job
  }

  const updateJobMatch = (jobId: string, resumeId: string) => {
    const job = state.value.jobs.find(item => item.id === jobId)
    const resume = state.value.resumes.find(item => item.id === resumeId)
    const version = resume?.versions.find(item => item.id === resume.activeVersionId)
    if (!job || !resume || !version) return
    job.resumeId = resume.id
    job.resumeVersionId = version.id
    job.match = matchResumeToJob(version.parsed, job.description)
    job.updatedAt = now()
    persist()
  }

  const deleteJob = (jobId: string) => {
    state.value.jobs = state.value.jobs.filter(job => job.id !== jobId)
    state.value.applications = state.value.applications.filter(application => application.jobId !== jobId)
    persist()
  }

  const addApplication = (jobId: string): ApplicationRecord => {
    const existing = state.value.applications.find(application => application.jobId === jobId)
    if (existing) return existing
    const createdAt = now()
    const application: ApplicationRecord = {
      id: createId('application'),
      jobId,
      status: 'saved',
      createdAt,
      updatedAt: createdAt,
      notes: '',
      nextAction: 'Review the tailored resume',
    }
    state.value.applications.unshift(application)
    persist()
    return application
  }

  const updateApplication = (
    applicationId: string,
    updates: Partial<Pick<ApplicationRecord, 'status' | 'notes' | 'nextAction' | 'nextActionAt'>>,
  ) => {
    const application = state.value.applications.find(item => item.id === applicationId)
    if (!application) return
    Object.assign(application, updates, { updatedAt: now() })
    if (updates.status === 'applied' && !application.appliedAt) application.appliedAt = now()
    persist()
  }

  const moveApplication = (applicationId: string, status: ApplicationStatus) => {
    updateApplication(applicationId, { status })
  }

  const deleteApplication = (applicationId: string) => {
    state.value.applications = state.value.applications.filter(item => item.id !== applicationId)
    persist()
  }

  const updateSettings = (settings: Partial<AppSettings>) => {
    state.value.settings = { ...state.value.settings, ...settings }
    persist()
  }

  const deleteAllData = () => {
    const user = state.value.user
    state.value = { ...initialState(), ownerId: user?.id || state.value.ownerId, user, hydrated: true }
    persist()
  }

  const getResume = (resumeId: string): ResumeRecord | undefined => (
    state.value.resumes.find(resume => resume.id === resumeId)
  )

  const getActiveVersion = (resume: ResumeRecord): ResumeVersion | undefined => (
    resume.versions.find(version => version.id === resume.activeVersionId)
  )

  const getJob = (jobId: string): SavedJob | undefined => (
    state.value.jobs.find(job => job.id === jobId)
  )

  const currentResume = computed(() => state.value.resumes[0])
  const currentVersion = computed(() => (
    currentResume.value ? getActiveVersion(currentResume.value) : undefined
  ))
  const scoreFingerprint = computed(() => (
    currentVersion.value
      ? hashText(`${currentVersion.value.parsed.contentHash}:${currentVersion.value.analysis.scoringVersion}`)
      : ''
  ))

  return {
    state,
    currentResume,
    currentVersion,
    scoreFingerprint,
    hydrate,
    persist,
    login,
    logout,
    addResume,
    addBuilderResume,
    addResumeVersion,
    updateBuilderDocument,
    duplicateResume,
    setActiveVersion,
    toggleFindingIntentional,
    renameResume,
    deleteResume,
    saveJob,
    updateJobMatch,
    deleteJob,
    addApplication,
    updateApplication,
    moveApplication,
    deleteApplication,
    updateSettings,
    deleteAllData,
    getResume,
    getActiveVersion,
    getJob,
  }
}
