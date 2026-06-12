import type { JobMatchDimension, JobMatchResult, JobRequirement, ParsedResume } from '@/types'
import {
  COMMON_SKILLS,
  MATCH_SCORING_VERSION,
  RESPONSIBILITY_TERMS,
  TAXONOMY_VERSION,
} from './constants'
import { hashText, normalizeResumeText } from './parser'

function escapePattern(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function includesAlias(text: string, aliases: string[]): boolean {
  return aliases.some((alias) => {
    const escaped = escapePattern(alias.toLowerCase()).replace(/ /g, '\\s+')
    return new RegExp(`(^|[^a-z0-9+#])${escaped}(?=$|[^a-z0-9+#])`, 'i').test(text)
  })
}

function responsibilityPattern(term: string): RegExp {
  if (term === 'lead') return /\b(?:lead|leads|leading|led)\b/i
  return new RegExp(`\\b${escapePattern(term)}(?:s|ed|ing)?\\b`, 'i')
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
  const jobSkills = normalizedSkills(normalizedJob)
  const requiredContext = normalizedJob
    .split(/[.\n;]/)
    .filter(sentence => /\b(required|must|minimum|need|you have|we expect)\b/.test(sentence))
    .join(' ')
  const preferredContext = normalizedJob
    .split(/[.\n;]/)
    .filter(sentence => /\b(preferred|nice to have|bonus|ideally|plus)\b/.test(sentence))
    .join(' ')

  const requiredSkills = jobSkills.filter(skill => (
    includesAlias(requiredContext, COMMON_SKILLS[skill] || [])
    || !includesAlias(preferredContext, COMMON_SKILLS[skill] || [])
  ))
  const preferredSkills = jobSkills.filter(skill => (
    includesAlias(preferredContext, COMMON_SKILLS[skill] || [])
    && !requiredSkills.includes(skill)
  ))
  const responsibilities = unique(
    RESPONSIBILITY_TERMS.filter(term => responsibilityPattern(term).test(normalizedJob)),
  ).slice(0, 10)
  const requirements: JobRequirement[] = [
    ...requiredSkills.map((skill, index) => ({
      id: `required-${index}`,
      label: titleCase(skill),
      normalized: skill,
      type: 'required' as const,
      matched: includesAlias(normalizedResume, COMMON_SKILLS[skill] || []),
      evidence: includesAlias(normalizedResume, COMMON_SKILLS[skill] || []) ? titleCase(skill) : undefined,
    })),
    ...preferredSkills.map((skill, index) => ({
      id: `preferred-${index}`,
      label: titleCase(skill),
      normalized: skill,
      type: 'preferred' as const,
      matched: includesAlias(normalizedResume, COMMON_SKILLS[skill] || []),
      evidence: includesAlias(normalizedResume, COMMON_SKILLS[skill] || []) ? titleCase(skill) : undefined,
    })),
    ...responsibilities.map((term, index) => ({
      id: `responsibility-${index}`,
      label: `${titleCase(term)} responsibilities`,
      normalized: term,
      type: 'responsibility' as const,
      matched: responsibilityPattern(term).test(normalizedResume),
      evidence: responsibilityPattern(term).test(normalizedResume) ? titleCase(term) : undefined,
    })),
  ]

  const scoreCoverage = (type: JobRequirement['type'], maxScore: number): number => {
    const group = requirements.filter(requirement => requirement.type === type)
    if (!group.length) return maxScore
    return Math.round((group.filter(requirement => requirement.matched).length / group.length) * maxScore)
  }

  const requiredScore = scoreCoverage('required', 30)
  const responsibilityScore = scoreCoverage('responsibility', 25)
  const preferredScore = scoreCoverage('preferred', 10)
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
  const educationRequested = /\b(degree|bachelor|master|mba|phd|certification|certified)\b/.test(normalizedJob)
  const educationPresent = /\b(education|bachelor|master|mba|phd|university|college|certified|certification)\b/.test(normalizedResume)
  const educationScore = educationRequested ? (educationPresent ? 5 : 0) : 5

  const dimensions: JobMatchDimension[] = [
    { id: 'required-skills', label: 'Required skill coverage', score: requiredScore, maxScore: 30 },
    { id: 'responsibilities', label: 'Responsibility coverage', score: responsibilityScore, maxScore: 25 },
    { id: 'seniority', label: 'Experience & seniority', score: seniorityScore, maxScore: 20 },
    { id: 'title-domain', label: 'Title & domain alignment', score: titleScore, maxScore: 10 },
    { id: 'preferred-skills', label: 'Preferred skill coverage', score: preferredScore, maxScore: 10 },
    { id: 'education', label: 'Education & certification', score: educationScore, maxScore: 5 },
  ]
  const recommendations: string[] = []
  const missingRequired = requirements.filter(item => item.type === 'required' && !item.matched)
  const missingResponsibilities = requirements.filter(item => item.type === 'responsibility' && !item.matched)

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
    dimensions,
    recommendations,
  }
}
