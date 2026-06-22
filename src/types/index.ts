export type ParseConfidence = 'high' | 'medium' | 'low'
export type FindingSeverity = 'high' | 'medium' | 'low'
export type ApplicationStatus = 'saved' | 'drafting' | 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
export type ResumeExperienceLevel = 'entry' | 'mid' | 'senior'
export type ResumeBuilderSource = 'new' | 'import'
export type ResumeVersionKind = 'master' | 'revision' | 'tailored' | 'exported'
export type ResumeExportFormat = 'pdf' | 'docx' | 'json' | 'txt'
export type CoverLetterTone = 'direct' | 'warm' | 'formal' | 'concise'
export type CoverLetterLength = 'short-email' | 'standard-letter' | 'recruiter-note'
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

export type ResumeTemplateId =
  | 'ats-clean'
  | 'modern-single'
  | 'compact-two-column'
  | 'executive'
  | 'classic'
  | 'compact'
  | 'blueprint'
  | 'coral'
  | 'green'
  | 'mono'

export interface ResumeDesignSettings {
  template: ResumeTemplateId
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
  canonicalSchemaVersion: string
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

export interface ResumeVersionLineage {
  sourceResumeId?: string
  sourceVersionId?: string
  sourceContentHash?: string
  targetJobId?: string
  acceptedSuggestionIds: string[]
}

export interface ResumeExportMetadata {
  id: string
  format: ResumeExportFormat
  exportedAt: string
  resumeId: string
  versionId: string
  canonicalContentHash: string
  jobId?: string
  jobMatchScore?: number
  unresolvedFindingCount: number
  parseWarningCount: number
}

export interface CoverLetterEvidenceSource {
  type: 'resume-line' | 'job-requirement' | 'job-description' | 'user-note'
  id: string
  quote: string
}

export interface CoverLetterParagraph {
  id: string
  text: string
  evidenceSources: CoverLetterEvidenceSource[]
  unsupported: boolean
}

export interface CoverLetterExportMetadata {
  id: string
  format: 'pdf' | 'txt'
  exportedAt: string
  draftId: string
  resumeVersionId: string
  jobId: string
  unsupportedParagraphCount: number
}

export interface CoverLetterDraft {
  id: string
  title: string
  jobId: string
  resumeId: string
  resumeVersionId: string
  tone: CoverLetterTone
  length: CoverLetterLength
  createdAt: string
  updatedAt: string
  paragraphs: CoverLetterParagraph[]
  userNotes?: string
  exportMetadata?: CoverLetterExportMetadata[]
  status: 'draft' | 'ready' | 'exported'
}

export interface ResumeVersion {
  id: string
  label: string
  createdAt: string
  source: 'upload' | 'edit' | 'rewrite' | 'tailored' | 'builder'
  kind?: ResumeVersionKind
  text: string
  parsed: ParsedResume
  analysis: ResumeAnalysis
  historicalAnalyses?: ResumeAnalysis[]
  targetJobId?: string
  lineage?: ResumeVersionLineage
  exportMetadata?: ResumeExportMetadata[]
  intentionalRuleIds?: string[]
}

export interface ResumeRecord {
  id: string
  name: string
  isMaster?: boolean
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

export interface ResumeEvidenceLocation {
  lineId: string
  section: ResumeSectionType
  quote: string
  match: string
}

export type JobRequirementType = 'required' | 'preferred' | 'responsibility' | 'credential'

export interface JobRequirement {
  id: string
  label: string
  normalized: string
  type: JobRequirementType
  priority: 'critical' | 'important' | 'nice-to-have'
  matched: boolean
  evidence?: string
  evidenceLocations: ResumeEvidenceLocation[]
  missingEvidence: boolean
  sourceSentences: string[]
  aliases: string[]
}

export interface JobCoverageBucket {
  total: number
  matched: number
  missing: number
}

export interface MissingJobRequirement {
  requirementId: string
  label: string
  normalized: string
  type: JobRequirementType
  priority: JobRequirement['priority']
  suggestedAction: string
}

export interface JobCoverageResult {
  createdAt: string
  scoringVersion: string
  taxonomyVersion: string
  resumeContentHash: string
  jobDescriptionHash: string
  requirements: JobRequirement[]
  coverage: Record<JobRequirementType, JobCoverageBucket>
  missing: MissingJobRequirement[]
  warnings: string[]
}

export interface JobMatchDimension {
  id: string
  label: string
  score: number
  maxScore: number
}

export interface JobMatchResult extends JobCoverageResult {
  score: number
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

export interface StructuredJobImport {
  title: string
  company: string
  location: string
  url: string
  description: string
}

export interface ApplicationRecord {
  id: string
  jobId: string
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
  resumeId?: string
  resumeVersionId?: string
  submittedResumeVersionId?: string
  coverLetterDraftIds?: string[]
  submittedCoverLetterDraftId?: string
  appliedAt?: string
  nextAction?: string
  nextActionAt?: string
  notes?: string
}

export interface RewriteSuggestion {
  id: string
  targetPath?: string
  lineId: string
  sourceText: string
  originalText?: string
  proposedText: string
  rationale?: string
  reason: string
  addressedRuleIds: string[]
  expectedPointRecovery: number
  requiresFactConfirmation: boolean
  riskFlags?: Array<'new_metric' | 'new_date' | 'new_title' | 'new_company' | 'new_degree' | 'new_certification' | 'new_technology'>
  status: 'pending' | 'accepted' | 'rejected'
}

export interface EnrichmentQuestion {
  id: string
  prompt: string
  targetPath: string
  sourceText?: string
  sourceLineId?: string
  sourceSection?: ResumeSectionType
  missingRequirementId?: string
  label: string
  riskFlags: NonNullable<RewriteSuggestion['riskFlags']>
}

export interface EnrichmentSuggestion {
  id: string
  questionId: string
  targetPath: string
  originalText: string
  proposedText: string
  rationale: string
  evidenceSources: Array<{
    type: 'resume-line' | 'user-answer' | 'job-requirement'
    id: string
    quote: string
  }>
  riskFlags: NonNullable<RewriteSuggestion['riskFlags']>
  status: 'pending' | 'accepted' | 'rejected'
}

export interface AiProviderSettings {
  provider: 'local-preview' | 'openai-compatible' | 'ollama'
  model: string
  baseUrl: string
  enabled: boolean
  lastTestedAt?: string
  lastStatus?: 'untested' | 'ok' | 'failed'
}

export interface PublicResumeShare {
  id: string
  resumeId: string
  versionId: string
  resumeName: string
  versionLabel: string
  createdAt: string
  parsed: ParsedResume
  includeContact: boolean
  visibility: 'local-public'
}

export interface AppSettings {
  emailUpdates: boolean
  weeklyReview: boolean
  retainUploads: boolean
  scoringDetails: boolean
  aiProvider: AiProviderSettings
}

export interface WorkspaceState {
  schemaVersion: number
  ownerId: string | null
  masterResumeId: string | null
  user: UserProfile | null
  resumes: ResumeRecord[]
  jobs: SavedJob[]
  applications: ApplicationRecord[]
  coverLetters: CoverLetterDraft[]
  publicShares: PublicResumeShare[]
  settings: AppSettings
  hydrated: boolean
}
