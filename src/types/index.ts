export type ParseConfidence = 'high' | 'medium' | 'low'
export type FindingSeverity = 'high' | 'medium' | 'low'
export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
export type ResumeExperienceLevel = 'entry' | 'mid' | 'senior'
export type ResumeBuilderSource = 'new' | 'import'
export type ResumeBuilderSectionKey =
  | 'profile'
  | 'work'
  | 'education'
  | 'skills'
  | 'projects'
  | 'volunteer'
  | 'certifications'
  | 'publications'
  | 'awards'
  | 'custom'

export interface ResumeBuilderLink {
  id: string
  label: string
  url: string
}

export interface ResumeBuilderBullet {
  id: string
  text: string
}

export interface ResumeProfileSection {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  links: ResumeBuilderLink[]
  summary: string
  targetRole: string
  experienceLevel: ResumeExperienceLevel
}

export interface ResumeExperienceEntry {
  id: string
  jobTitle: string
  employer: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  hideDates: boolean
  bullets: ResumeBuilderBullet[]
}

export interface ResumeEducationEntry {
  id: string
  school: string
  degree: string
  location: string
  startDate: string
  endDate: string
  details: ResumeBuilderBullet[]
}

export interface ResumeSkillGroup {
  id: string
  title: string
  skills: string[]
}

export interface ResumeProjectEntry {
  id: string
  name: string
  role: string
  url: string
  startDate: string
  endDate: string
  bullets: ResumeBuilderBullet[]
}

export interface ResumeSimpleEntry {
  id: string
  title: string
  subtitle: string
  date: string
  location: string
  bullets: ResumeBuilderBullet[]
}

export interface StructuredResumeSimpleEntry {
  title: string
  subtitle: string
  date: string
  location: string
  bullets: string[]
}

export interface StructuredResumeImport {
  profile: {
    firstName: string
    lastName: string
    email: string
    phone: string
    location: string
    links: Array<{ label: string; url: string }>
    summary: string
    targetRole: string
    experienceLevel: ResumeExperienceLevel
  }
  workExperiences: Array<{
    jobTitle: string
    employer: string
    location: string
    startDate: string
    endDate: string
    current: boolean
    bullets: string[]
  }>
  educations: Array<{
    school: string
    degree: string
    location: string
    startDate: string
    endDate: string
    details: string[]
  }>
  skills: Array<{ title: string; skills: string[] }>
  projects: Array<{
    name: string
    role: string
    url: string
    startDate: string
    endDate: string
    bullets: string[]
  }>
  volunteerExperiences: StructuredResumeSimpleEntry[]
  certifications: StructuredResumeSimpleEntry[]
  publications: StructuredResumeSimpleEntry[]
  awards: StructuredResumeSimpleEntry[]
}

export interface ResumeCustomSection {
  id: string
  title: string
  entries: ResumeSimpleEntry[]
}

export interface ResumeDesignSettings {
  template: 'classic' | 'compact'
  pageSize: 'letter' | 'a4'
  marginY: number
  marginX: number
  fontFamily: string
  fontSize: number
  lineHeight: number
  accentColor: string
  dateFormat: 'MM/YYYY' | 'MMM YYYY' | 'YYYY'
}

export interface ResumeBuilderSectionSetting {
  key: ResumeBuilderSectionKey
  title: string
  visible: boolean
  optional: boolean
  order: number
}

export interface EditableResumeDocument {
  id: string
  source: ResumeBuilderSource
  profile: ResumeProfileSection
  workExperiences: ResumeExperienceEntry[]
  educations: ResumeEducationEntry[]
  skills: ResumeSkillGroup[]
  projects: ResumeProjectEntry[]
  volunteerExperiences: ResumeSimpleEntry[]
  certifications: ResumeSimpleEntry[]
  publications: ResumeSimpleEntry[]
  awards: ResumeSimpleEntry[]
  customSections: ResumeCustomSection[]
  design: ResumeDesignSettings
  sectionSettings: ResumeBuilderSectionSetting[]
  updatedAt: string
}

export interface ToastMessage {
  id: number
  title: string
  message?: string
  tone: 'success' | 'info' | 'warning' | 'error'
  duration: number
}

export interface UserProfile {
  id: string
  accountId: string
  name: string
  email: string
  avatarUrl?: string
  authProvider: 'google' | 'email'
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
    website?: string
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
  source: 'upload' | 'edit' | 'rewrite' | 'tailored' | 'builder'
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
  targetJobTitle?: string
  experienceLevel?: ResumeExperienceLevel
  builderSource?: ResumeBuilderSource
  builderDocument?: EditableResumeDocument
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
  ownerId: string | null
  user: UserProfile | null
  resumes: ResumeRecord[]
  jobs: SavedJob[]
  applications: ApplicationRecord[]
  settings: AppSettings
  hydrated: boolean
}
