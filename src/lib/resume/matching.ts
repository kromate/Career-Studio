import type {
  JobCoverageBucket,
  JobMatchDimension,
  JobMatchResult,
  JobRequirement,
  JobRequirementType,
  MissingJobRequirement,
  ParsedResume,
  ResumeEvidenceLocation,
} from '@/types'
import {
  COMMON_SKILLS,
  MATCH_SCORING_VERSION,
  RESPONSIBILITY_TERMS,
  TAXONOMY_VERSION,
} from './constants'
import { hashText, normalizeResumeText } from './parser'

interface RequirementDraft {
  id: string
  label: string
  normalized: string
  type: JobRequirementType
  priority: JobRequirement['priority']
  aliases: string[]
  sourceSentences: string[]
}

const CREDENTIAL_REQUIREMENTS: Array<Omit<RequirementDraft, 'sourceSentences'>> = [
  {
    id: 'credential-degree',
    label: 'Degree or equivalent education',
    normalized: 'degree',
    type: 'credential',
    priority: 'nice-to-have',
    aliases: ['degree', 'bachelor', "bachelor's", 'bsc', 'bs', 'ba', 'master', 'msc', 'university', 'college'],
  },
  {
    id: 'credential-certification',
    label: 'Relevant certification',
    normalized: 'certification',
    type: 'credential',
    priority: 'important',
    aliases: ['certification', 'certificate', 'certified', 'license', 'licensed'],
  },
]

const RESPONSIBILITY_ALIASES: Record<string, string[]> = {
  lead: ['lead', 'leads', 'leading', 'led'],
  manage: ['manage', 'manages', 'managed', 'managing'],
  build: ['build', 'builds', 'building', 'built'],
  design: ['design', 'designs', 'designed', 'designing'],
  develop: ['develop', 'develops', 'developed', 'developing'],
  analyze: ['analyze', 'analyzes', 'analyzed', 'analyzing', 'analyse', 'analysed'],
  coordinate: ['coordinate', 'coordinates', 'coordinated', 'coordinating'],
  own: ['own', 'owns', 'owned', 'owning'],
  deliver: ['deliver', 'delivers', 'delivered', 'delivering'],
  support: ['support', 'supports', 'supported', 'supporting'],
  create: ['create', 'creates', 'created', 'creating'],
  implement: ['implement', 'implements', 'implemented', 'implementing'],
  optimize: ['optimize', 'optimizes', 'optimized', 'optimizing', 'optimise', 'optimised'],
  collaborate: ['collaborate', 'collaborates', 'collaborated', 'collaborating'],
  report: ['report', 'reports', 'reported', 'reporting'],
  research: ['research', 'researches', 'researched', 'researching'],
  plan: ['plan', 'plans', 'planned', 'planning'],
  communicate: ['communicate', 'communicates', 'communicated', 'communicating'],
  mentor: ['mentor', 'mentors', 'mentored', 'mentoring'],
  sell: ['sell', 'sells', 'sold', 'selling'],
  recruit: ['recruit', 'recruits', 'recruited', 'recruiting'],
  operate: ['operate', 'operates', 'operated', 'operating'],
}

function escapePattern(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function includesAlias(text: string, aliases: string[]): boolean {
  return aliases.some((alias) => {
    const escaped = escapePattern(alias.toLowerCase()).replace(/ /g, '\\s+')
    return new RegExp(`(^|[^a-z0-9+#])${escaped}(?=$|[^a-z0-9+#])`, 'i').test(text)
  })
}

function aliasPattern(alias: string): RegExp {
  const escaped = escapePattern(alias.toLowerCase()).replace(/ /g, '\\s+')
  return new RegExp(`(^|[^a-z0-9+#])${escaped}(?=$|[^a-z0-9+#])`, 'i')
}

function responsibilityAliases(term: string): string[] {
  return RESPONSIBILITY_ALIASES[term] || [term, `${term}s`, `${term}ed`, `${term}ing`]
}

function normalizedSkills(text: string): string[] {
  const normalized = text.toLowerCase()
  return Object.entries(COMMON_SKILLS)
    .filter(([, aliases]) => includesAlias(normalized, aliases))
    .map(([canonical]) => canonical)
    .sort()
}

function titleCase(input: string): string {
  return input
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, character => character.toUpperCase())
    .trim()
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function uniqueBy<T>(values: T[], keyFor: (value: T) => string): T[] {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = keyFor(value)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function splitSentences(text: string): string[] {
  return normalizeResumeText(text)
    .split(/(?<=[.!?])\s+|\n+|;/)
    .map(sentence => sentence.replace(/^[-*+]\s+/, '').trim())
    .filter(sentence => sentence.length >= 8)
}

function sentencesWithAliases(sentences: string[], aliases: string[]): string[] {
  return sentences.filter(sentence => includesAlias(sentence.toLowerCase(), aliases)).slice(0, 3)
}

function evidenceForAliases(parsed: ParsedResume, aliases: string[], limit = 3): ResumeEvidenceLocation[] {
  const evidence: ResumeEvidenceLocation[] = []

  parsed.lines.forEach((line) => {
    if (evidence.length >= limit) return
    const matchingAlias = aliases.find(alias => aliasPattern(alias).test(line.text.toLowerCase()))
    if (!matchingAlias) return
    evidence.push({
      lineId: line.id,
      section: line.section,
      quote: line.text,
      match: matchingAlias,
    })
  })

  return evidence
}

function countAliasOccurrences(text: string, aliases: string[]): number {
  return aliases.reduce((sum, alias) => {
    const pattern = aliasPattern(alias)
    const matches = text.match(new RegExp(pattern.source, 'gi'))
    return sum + (matches?.length || 0)
  }, 0)
}

function coverageBucket(requirements: JobRequirement[], type: JobRequirementType): JobCoverageBucket {
  const items = requirements.filter(requirement => requirement.type === type)
  const matched = items.filter(requirement => requirement.matched).length
  return {
    total: items.length,
    matched,
    missing: items.length - matched,
  }
}

function suggestedAction(requirement: JobRequirement): string {
  if (requirement.type === 'required') return `Add truthful resume evidence for ${requirement.label} if your background supports it.`
  if (requirement.type === 'responsibility') return `Make the relevant ${requirement.normalized} responsibility explicit in a bullet if it is accurate.`
  if (requirement.type === 'credential') return `Add the credential, education, or training only if you can verify it.`
  return `Consider mentioning ${requirement.label} when it is relevant and evidence-backed.`
}

export function extractJobRequirements(jobDescription: string): RequirementDraft[] {
  const normalizedJob = normalizeResumeText(jobDescription).toLowerCase()
  const sentences = splitSentences(jobDescription)
  const requiredContext = sentences
    .filter(sentence => /\b(required|must|minimum|need|you have|we expect|requirements?|qualifications?)\b/i.test(sentence))
    .join(' ')
    .toLowerCase()
  const preferredContext = sentences
    .filter(sentence => /\b(preferred|nice to have|bonus|ideally|plus|preferred qualifications?)\b/i.test(sentence))
    .join(' ')
    .toLowerCase()
  const jobSkills = normalizedSkills(normalizedJob)
  const requiredSkills = jobSkills.filter(skill => (
    includesAlias(requiredContext, COMMON_SKILLS[skill] || [])
    || !includesAlias(preferredContext, COMMON_SKILLS[skill] || [])
  ))
  const preferredSkills = jobSkills.filter(skill => (
    includesAlias(preferredContext, COMMON_SKILLS[skill] || [])
    && !requiredSkills.includes(skill)
  ))
  const responsibilityTerms = unique(
    RESPONSIBILITY_TERMS.filter(term => includesAlias(normalizedJob, responsibilityAliases(term))),
  ).slice(0, 10)
  const credentials = CREDENTIAL_REQUIREMENTS.filter(requirement => includesAlias(normalizedJob, requirement.aliases))

  return uniqueBy([
    ...requiredSkills.map(skill => ({
      id: `required-${skill}`,
      label: titleCase(skill),
      normalized: skill,
      type: 'required' as const,
      priority: 'critical' as const,
      aliases: COMMON_SKILLS[skill] || [skill],
      sourceSentences: sentencesWithAliases(sentences, COMMON_SKILLS[skill] || [skill]),
    })),
    ...preferredSkills.map(skill => ({
      id: `preferred-${skill}`,
      label: titleCase(skill),
      normalized: skill,
      type: 'preferred' as const,
      priority: 'nice-to-have' as const,
      aliases: COMMON_SKILLS[skill] || [skill],
      sourceSentences: sentencesWithAliases(sentences, COMMON_SKILLS[skill] || [skill]),
    })),
    ...responsibilityTerms.map(term => ({
      id: `responsibility-${term}`,
      label: `${titleCase(term)} responsibilities`,
      normalized: term,
      type: 'responsibility' as const,
      priority: 'important' as const,
      aliases: responsibilityAliases(term),
      sourceSentences: sentencesWithAliases(sentences, responsibilityAliases(term)),
    })),
    ...credentials.map(requirement => ({
      ...requirement,
      sourceSentences: sentencesWithAliases(sentences, requirement.aliases),
    })),
  ], requirement => requirement.id)
}

function levelFromText(text: string): number {
  const normalized = text.toLowerCase()
  if (/\b(chief|vp|vice president|director|head of)\b/.test(normalized)) return 5
  if (/\b(principal|staff|lead)\b/.test(normalized)) return 4
  if (/\bsenior\b/.test(normalized)) return 3
  if (/\b(junior|associate|entry[- ]level|graduate)\b/.test(normalized)) return 1
  return 2
}

export function matchResumeToJob(
  parsed: ParsedResume,
  jobDescription: string,
  createdAt = new Date().toISOString(),
): JobMatchResult {
  const normalizedJob = normalizeResumeText(jobDescription).toLowerCase()
  const normalizedResume = parsed.normalizedText.toLowerCase()
  const requirements = extractJobRequirements(jobDescription).map((requirement): JobRequirement => {
    const evidenceLocations = evidenceForAliases(parsed, requirement.aliases)
    return {
      ...requirement,
      matched: evidenceLocations.length > 0,
      evidence: evidenceLocations[0]?.quote,
      evidenceLocations,
      missingEvidence: evidenceLocations.length === 0,
    }
  })

  const scoreCoverage = (type: JobRequirementType, maxScore: number): number => {
    const group = requirements.filter(requirement => requirement.type === type)
    if (!group.length) return maxScore
    return Math.round((group.filter(requirement => requirement.matched).length / group.length) * maxScore)
  }

  const requiredScore = scoreCoverage('required', 30)
  const responsibilityScore = scoreCoverage('responsibility', 25)
  const preferredScore = scoreCoverage('preferred', 10)
  const credentialScore = scoreCoverage('credential', 5)
  const jobLevel = levelFromText(normalizedJob)
  const resumeLevel = levelFromText(normalizedResume)
  const levelDifference = Math.abs(jobLevel - resumeLevel)
  const seniorityScore = levelDifference === 0 ? 20 : levelDifference === 1 ? 14 : levelDifference === 2 ? 7 : 2
  const titleWords = unique(
    normalizedJob
      .split(/\s+/)
      .map(word => word.replace(/[^a-z]/g, ''))
      .filter(word => word.length >= 5 && !['about', 'company', 'position', 'responsibilities', 'requirements'].includes(word)),
  ).slice(0, 20)
  const titleOverlap = titleWords.filter(word => includesAlias(normalizedResume, [word])).length
  const titleScore = Math.min(10, Math.round((titleOverlap / Math.max(1, Math.min(8, titleWords.length))) * 10))
  const dimensions: JobMatchDimension[] = [
    { id: 'required-skills', label: 'Required skill coverage', score: requiredScore, maxScore: 30 },
    { id: 'responsibilities', label: 'Responsibility coverage', score: responsibilityScore, maxScore: 25 },
    { id: 'seniority', label: 'Experience & seniority', score: seniorityScore, maxScore: 20 },
    { id: 'title-domain', label: 'Title & domain alignment', score: titleScore, maxScore: 10 },
    { id: 'preferred-skills', label: 'Preferred skill coverage', score: preferredScore, maxScore: 10 },
    { id: 'credentials', label: 'Education & credentials', score: credentialScore, maxScore: 5 },
  ]
  const coverage: Record<JobRequirementType, JobCoverageBucket> = {
    required: coverageBucket(requirements, 'required'),
    preferred: coverageBucket(requirements, 'preferred'),
    responsibility: coverageBucket(requirements, 'responsibility'),
    credential: coverageBucket(requirements, 'credential'),
  }
  const missing: MissingJobRequirement[] = requirements
    .filter(requirement => !requirement.matched)
    .map(requirement => ({
      requirementId: requirement.id,
      label: requirement.label,
      normalized: requirement.normalized,
      type: requirement.type,
      priority: requirement.priority,
      suggestedAction: suggestedAction(requirement),
    }))
  const warnings = requirements
    .filter(requirement => requirement.matched && countAliasOccurrences(normalizedResume, requirement.aliases) >= 6)
    .map(requirement => `${requirement.label} appears repeatedly; coverage is awarded once per requirement.`)
  if (!requirements.length) warnings.push('No recognizable requirements were extracted from the job description.')
  const recommendations: string[] = []
  const missingRequired = missing.filter(item => item.type === 'required')
  const missingResponsibilities = missing.filter(item => item.type === 'responsibility')

  if (missingRequired.length) {
    recommendations.push(`Add truthful evidence for required skills: ${missingRequired.map(item => item.label).join(', ')}.`)
  }
  if (missingResponsibilities.length) {
    recommendations.push(`Make relevant responsibility evidence explicit: ${missingResponsibilities.slice(0, 4).map(item => item.normalized).join(', ')}.`)
  }
  if (levelDifference >= 2) {
    recommendations.push('Clarify scope, leadership, and decision-making evidence so the reader can assess seniority.')
  }
  if (!recommendations.length) {
    recommendations.push('The resume covers the main requirements. Tailor the summary and strongest bullets to this role.')
  }

  return {
    score: dimensions.reduce((sum, dimension) => sum + dimension.score, 0),
    createdAt,
    scoringVersion: MATCH_SCORING_VERSION,
    taxonomyVersion: TAXONOMY_VERSION,
    resumeContentHash: parsed.contentHash,
    jobDescriptionHash: hashText(normalizedJob),
    requirements,
    coverage,
    missing,
    warnings,
    dimensions,
    recommendations,
  }
}
