export type ParseConfidence = 'high' | 'medium' | 'low'
export type FindingSeverity = 'high' | 'medium' | 'low'
export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'

export interface ToastMessage {
  id: number
  title: string
  message?: string
  tone: 'success' | 'info' | 'warning' | 'error'
}

export interface UserProfile {
  id: string
  accountId: string
  name: string
  email: string
  avatarUrl?: string
  authProvider: 'demo' | 'google' | 'email'
}

export interface ResumeLine {
  id: string
  text: string
  section: ResumeSectionType
  kind: 'heading' | 'bullet' | 'body' | 'contact'
  index: number
}

export type ResumeSectionType =
  | 'header'
  | 'summary'
  | 'experience'
  | 'skills'
  | 'education'
  | 'certifications'
  | 'projects'
  | 'other'

export interface ResumeSection {
  id: string
  type: ResumeSectionType
  title: string
  lineIds: string[]
}

export interface ParsedResume {
  normalizedText: string
  contentHash: string
  lines: ResumeLine[]
  sections: ResumeSection[]
  contacts: {
    email?: string
    phone?: string
    linkedIn?: string
    location?: string
  }
  stats: {
    words: number
    pagesEstimated: number
    bullets: number
    datedLines: number
  }
  confidence: ParseConfidence
  warnings: string[]
}

export interface FindingEvidence {
  lineId?: string
  section?: ResumeSectionType
  quote?: string
}

export interface ScoreCheck {
  ruleId: string
  dimension: ScoreDimension
  title: string
  explanation: string
  recommendation: string
  maxPoints: number
  earnedPoints: number
  severity: FindingSeverity
  passed: boolean
  evidence: FindingEvidence[]
}

export type ScoreDimension =
  | 'parseability'
  | 'completeness'
  | 'impact'
  | 'clarity'
  | 'consistency'
  | 'searchability'
  | 'mechanics'

export interface DimensionScore {
  id: ScoreDimension
  label: string
  score: number
  maxScore: number
}

export interface ResumeAnalysis {
  id: string
  resumeId: string
  versionId: string
  createdAt: string
  score: number | null
  parseConfidence: ParseConfidence
  parserVersion: string
  scoringVersion: string
  taxonomyVersion: string
  sourceFileHash: string
  canonicalContentHash: string
  dimensions: DimensionScore[]
  checks: ScoreCheck[]
  parseWarnings: string[]
}

export interface ResumeVersion {
  id: string
  label: string
  createdAt: string
  source: 'upload' | 'edit' | 'rewrite' | 'tailored'
  text: string
  parsed: ParsedResume
  analysis: ResumeAnalysis
  targetJobId?: string
  intentionalRuleIds?: string[]
}

export interface ResumeRecord {
  id: string
  name: string
  originalFileName: string
  fileType: string
  createdAt: string
  updatedAt: string
  activeVersionId: string
  versions: ResumeVersion[]
}

export interface JobRequirement {
  id: string
  label: string
  normalized: string
  type: 'required' | 'preferred' | 'responsibility'
  matched: boolean
  evidence?: string
}

export interface JobMatchDimension {
  id: string
  label: string
  score: number
  maxScore: number
}

export interface JobMatchResult {
  score: number
  createdAt: string
  scoringVersion: string
  taxonomyVersion: string
  resumeContentHash: string
  jobDescriptionHash: string
  requirements: JobRequirement[]
  dimensions: JobMatchDimension[]
  recommendations: string[]
}

export interface SavedJob {
  id: string
  title: string
  company: string
  location: string
  url?: string
  description: string
  createdAt: string
  updatedAt: string
  match?: JobMatchResult
  resumeId?: string
  resumeVersionId?: string
}

export interface ApplicationRecord {
  id: string
  jobId: string
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
  appliedAt?: string
  nextAction?: string
  nextActionAt?: string
  notes?: string
}

export interface RewriteSuggestion {
  id: string
  lineId: string
  sourceText: string
  proposedText: string
  reason: string
  addressedRuleIds: string[]
  expectedPointRecovery: number
  requiresFactConfirmation: boolean
  status: 'pending' | 'accepted' | 'rejected'
}

export interface AppSettings {
  emailUpdates: boolean
  weeklyReview: boolean
  retainUploads: boolean
  scoringDetails: boolean
}

export interface WorkspaceState {
  schemaVersion: number
  user: UserProfile | null
  resumes: ResumeRecord[]
  jobs: SavedJob[]
  applications: ApplicationRecord[]
  settings: AppSettings
  hydrated: boolean
}
