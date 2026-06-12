import type {
  AppSettings,
  ApplicationRecord,
  ApplicationStatus,
  ResumeRecord,
  ResumeVersion,
  SavedJob,
  UserProfile,
  WorkspaceState,
} from '@/types'
import { DEMO_JOB_DESCRIPTION, DEMO_RESUME_TEXT } from '@/lib/demo'
import { matchResumeToJob } from '@/lib/resume/matching'
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
    schemaVersion: 1,
    user: null,
    resumes: [],
    jobs: [],
    applications: [],
    settings: defaultSettings(),
    hydrated: false,
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
        state.value = {
          ...initialState(),
          ...parsed,
          settings: { ...defaultSettings(), ...parsed.settings },
          hydrated: true,
        }
        return
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    state.value.hydrated = true
    persist()
  }

  const seedDemoWorkspace = () => {
    if (state.value.resumes.length) return
    const resumeId = createId('resume')
    const version = createVersion(resumeId, DEMO_RESUME_TEXT, 'Original resume', 'upload')
    const createdAt = now()
    const resume: ResumeRecord = {
      id: resumeId,
      name: 'Jordan Lee - Product Engineer',
      originalFileName: 'jordan-lee-resume.txt',
      fileType: 'text/plain',
      createdAt,
      updatedAt: createdAt,
      activeVersionId: version.id,
      versions: [version],
    }
    const jobId = createId('job')
    const job: SavedJob = {
      id: jobId,
      title: 'Senior Frontend Engineer',
      company: 'Linear Labs',
      location: 'Remote',
      url: 'https://example.com/jobs/senior-frontend-engineer',
      description: DEMO_JOB_DESCRIPTION,
      createdAt,
      updatedAt: createdAt,
      resumeId,
      resumeVersionId: version.id,
      match: matchResumeToJob(version.parsed, DEMO_JOB_DESCRIPTION, createdAt),
    }
    state.value.resumes = [resume]
    state.value.jobs = [job]
    state.value.applications = [{
      id: createId('application'),
      jobId,
      status: 'saved',
      createdAt,
      updatedAt: createdAt,
      nextAction: 'Tailor resume before applying',
      notes: '',
    }]
  }

  const login = (user: UserProfile, options: { seedDemo?: boolean } = {}) => {
    state.value.user = user
    if (options.seedDemo) seedDemoWorkspace()
    persist()
  }

  const loginDemo = () => {
    login({
      id: 'demo-user-local',
      accountId: 'demo-account-local',
      name: 'Jordan Lee',
      email: 'jordan.lee@example.com',
      authProvider: 'demo',
    }, { seedDemo: true })
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
    updates: Partial<Pick<ApplicationRecord, 'status' | 'notes' | 'nextAction'>>,
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
    state.value = { ...initialState(), user, hydrated: true }
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
    loginDemo,
    logout,
    addResume,
    addResumeVersion,
    setActiveVersion,
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
