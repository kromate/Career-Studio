import type {
  DimensionScore,
  ParsedResume,
  ResumeAnalysis,
  ScoreCheck,
  ScoreDimension,
} from '@/types'
import {
  ACTION_VERBS,
  COMMON_SKILLS,
  DIMENSION_LABELS,
  PARSER_VERSION,
  SCORING_VERSION,
  TAXONOMY_VERSION,
  WEAK_PHRASES,
} from './constants'
import { hashText } from './parser'

interface RuleInput {
  id: string
  dimension: ScoreDimension
  title: string
  explanation: string
  recommendation: string
  maxPoints: number
  earnedPoints: number
  evidence?: ScoreCheck['evidence']
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function ratioScore(matches: number, total: number, maxPoints: number): number {
  if (total <= 0) return 0
  return Math.round(clamp(matches / total, 0, 1) * maxPoints * 100) / 100
}

function makeCheck(rule: RuleInput): ScoreCheck {
  const earnedPoints = clamp(Math.round(rule.earnedPoints * 100) / 100, 0, rule.maxPoints)
  const lostRatio = (rule.maxPoints - earnedPoints) / rule.maxPoints
  return {
    ruleId: rule.id,
    dimension: rule.dimension,
    title: rule.title,
    explanation: rule.explanation,
    recommendation: rule.recommendation,
    maxPoints: rule.maxPoints,
    earnedPoints,
    passed: earnedPoints >= rule.maxPoints * 0.85,
    severity: lostRatio >= 0.6 ? 'high' : lostRatio >= 0.25 ? 'medium' : 'low',
    evidence: rule.evidence || [],
  }
}

function evidenceFor(parsed: ParsedResume, predicate: (text: string) => boolean, limit = 3): ScoreCheck['evidence'] {
  return parsed.lines
    .filter(line => predicate(line.text.toLowerCase()))
    .slice(0, limit)
    .map(line => ({ lineId: line.id, section: line.section, quote: line.text }))
}

function sectionExists(parsed: ParsedResume, section: string): boolean {
  return parsed.sections.some(item => item.type === section && item.lineIds.length > 1)
}

function countSkillMatches(text: string): number {
  const normalized = text.toLowerCase()
  return Object.values(COMMON_SKILLS)
    .filter(aliases => aliases.some(alias => normalized.includes(alias)))
    .length
}

function repeatedPhrases(lines: string[]): string[] {
  const starts = new Map<string, number>()
  lines.forEach((line) => {
    const start = line.toLowerCase().split(/\s+/).slice(0, 2).join(' ')
    if (start.split(' ').length === 2) starts.set(start, (starts.get(start) || 0) + 1)
  })
  return [...starts.entries()].filter(([, count]) => count >= 3).map(([phrase]) => phrase)
}

export function scoreResume(
  parsed: ParsedResume,
  options: { resumeId?: string; versionId?: string; createdAt?: string } = {},
): ResumeAnalysis {
  const bullets = parsed.lines.filter(line => line.kind === 'bullet')
  const bulletTexts = bullets.map(line => line.text)
  const actionBullets = bullets.filter((line) => {
    const firstWord = line.text.toLowerCase().split(/\s+/)[0]?.replace(/[^a-z]/g, '') || ''
    return ACTION_VERBS.includes(firstWord)
  })
  const quantifiedBullets = bullets.filter(line => /\b(?:\d+(?:\.\d+)?%?|\$[\d,.]+|£[\d,.]+|€[\d,.]+)\b/.test(line.text))
  const weakEvidence = evidenceFor(parsed, text => WEAK_PHRASES.some(phrase => text.includes(phrase)))
  const weakCount = parsed.lines.filter(line => WEAK_PHRASES.some(phrase => line.text.toLowerCase().includes(phrase))).length
  const conciseBullets = bullets.filter((line) => {
    const words = line.text.split(/\s+/).length
    return words >= 8 && words <= 32
  })
  const longEvidence = bullets
    .filter(line => line.text.split(/\s+/).length > 32)
    .slice(0, 3)
    .map(line => ({ lineId: line.id, section: line.section, quote: line.text }))
  const firstPersonEvidence = evidenceFor(parsed, text => /\b(i|me|my|mine)\b/.test(text))
  const placeholders = evidenceFor(parsed, text => /\b(lorem ipsum|your name|company name|xxx+|tbd|n\/a)\b/.test(text))
  const repeated = repeatedPhrases(bulletTexts)
  const sectionsFound = new Set(parsed.sections.map(section => section.type))
  const skillMatches = countSkillMatches(parsed.normalizedText)
  const titleLines = parsed.lines.filter(line => (
    line.section === 'experience'
    && line.kind === 'body'
    && line.text.split(/\s+/).length <= 10
  ))
  const punctuationBullets = bullets.filter(line => /[.!?]$/.test(line.text))
  const punctuationRatio = bullets.length ? punctuationBullets.length / bullets.length : 0
  const punctuationConsistency = bullets.length < 2
    ? 0
    : (punctuationRatio <= 0.15 || punctuationRatio >= 0.85 ? 1 : 0.45)

  const rules: RuleInput[] = [
    {
      id: 'parse.text-volume',
      dimension: 'parseability',
      title: 'Usable text extraction',
      explanation: 'Applicant systems need enough selectable text to identify your experience.',
      recommendation: 'Use a text-based PDF or DOCX and confirm that the extraction preview contains your full resume.',
      maxPoints: 4,
      earnedPoints: parsed.stats.words >= 300 ? 4 : parsed.stats.words >= 180 ? 2.5 : parsed.stats.words >= 100 ? 1 : 0,
    },
    {
      id: 'parse.sections',
      dimension: 'parseability',
      title: 'Recognizable section structure',
      explanation: 'Standard headings make experience, skills, and education easier to classify.',
      recommendation: 'Use conventional headings such as Experience, Skills, and Education.',
      maxPoints: 5,
      earnedPoints: clamp((sectionsFound.size - 1) * 1.5, 0, 5),
    },
    {
      id: 'parse.contacts',
      dimension: 'parseability',
      title: 'Contact details are extractable',
      explanation: 'Recruiters need a reliable email address and phone number.',
      recommendation: 'Put your email and phone number in normal text near the top of the first page.',
      maxPoints: 4,
      earnedPoints: (parsed.contacts.email ? 2 : 0) + (parsed.contacts.phone ? 1.5 : 0) + (parsed.contacts.linkedIn ? 0.5 : 0),
    },
    {
      id: 'parse.dates',
      dimension: 'parseability',
      title: 'Employment dates are identifiable',
      explanation: 'Dates help software and recruiters reconstruct your career history.',
      recommendation: 'Add consistent month/year or year ranges to each role.',
      maxPoints: 4,
      earnedPoints: parsed.stats.datedLines >= 4 ? 4 : parsed.stats.datedLines >= 2 ? 2.5 : parsed.stats.datedLines >= 1 ? 1 : 0,
    },
    {
      id: 'parse.bullets',
      dimension: 'parseability',
      title: 'Experience bullets are identifiable',
      explanation: 'Bullets make responsibilities and outcomes easier to scan.',
      recommendation: 'Format accomplishments as simple text bullets rather than tables or text boxes.',
      maxPoints: 3,
      earnedPoints: bullets.length >= 6 ? 3 : bullets.length >= 3 ? 2 : bullets.length >= 1 ? 1 : 0,
    },
    {
      id: 'complete.summary',
      dimension: 'completeness',
      title: 'Focused professional summary',
      explanation: 'A concise summary gives the reader immediate role and domain context.',
      recommendation: 'Add a two-to-four line summary tailored to the kind of work you want.',
      maxPoints: 2,
      earnedPoints: sectionExists(parsed, 'summary') ? 2 : 0,
    },
    {
      id: 'complete.experience',
      dimension: 'completeness',
      title: 'Substantive experience section',
      explanation: 'The experience section is the primary evidence for most applications.',
      recommendation: 'Include relevant roles with dates and accomplishment-focused bullets.',
      maxPoints: 6,
      earnedPoints: sectionExists(parsed, 'experience')
        ? clamp(2 + bullets.length * 0.5 + parsed.stats.datedLines * 0.4, 0, 6)
        : 0,
    },
    {
      id: 'complete.skills',
      dimension: 'completeness',
      title: 'Dedicated skills section',
      explanation: 'An explicit skills section improves quick scanning and requirement matching.',
      recommendation: 'Add a compact skills section containing tools and capabilities you can support with evidence.',
      maxPoints: 3,
      earnedPoints: sectionExists(parsed, 'skills') ? 3 : skillMatches >= 4 ? 1.5 : 0,
    },
    {
      id: 'complete.education',
      dimension: 'completeness',
      title: 'Education or training',
      explanation: 'Many roles and applicant systems expect education or relevant training.',
      recommendation: 'Include relevant education, certifications, or professional training.',
      maxPoints: 3,
      earnedPoints: sectionExists(parsed, 'education') ? 3 : sectionExists(parsed, 'certifications') ? 2 : 0,
    },
    {
      id: 'complete.contact',
      dimension: 'completeness',
      title: 'Complete contact header',
      explanation: 'A complete header removes friction when a recruiter wants to contact you.',
      recommendation: 'Include an email, phone number, and location or LinkedIn profile.',
      maxPoints: 1,
      earnedPoints: parsed.contacts.email && parsed.contacts.phone ? 1 : parsed.contacts.email ? 0.5 : 0,
    },
    {
      id: 'impact.action-verbs',
      dimension: 'impact',
      title: 'Bullets start with clear action',
      explanation: 'Strong opening verbs make ownership and contribution easier to understand.',
      recommendation: 'Start each experience bullet with a precise action verb.',
      maxPoints: 8,
      earnedPoints: ratioScore(actionBullets.length, bullets.length, 8),
      evidence: bullets
        .filter(line => !actionBullets.includes(line))
        .slice(0, 3)
        .map(line => ({ lineId: line.id, section: line.section, quote: line.text })),
    },
    {
      id: 'impact.quantified-outcomes',
      dimension: 'impact',
      title: 'Outcomes include verified scale',
      explanation: 'Numbers make the size and result of your work concrete.',
      recommendation: 'Where truthful, add verified volume, time, revenue, quality, or percentage outcomes.',
      maxPoints: 10,
      earnedPoints: ratioScore(quantifiedBullets.length, Math.max(1, Math.min(bullets.length, 6)), 10),
      evidence: bullets
        .filter(line => !quantifiedBullets.includes(line))
        .slice(0, 3)
        .map(line => ({ lineId: line.id, section: line.section, quote: line.text })),
    },
    {
      id: 'impact.weak-phrasing',
      dimension: 'impact',
      title: 'Ownership is stated directly',
      explanation: 'Passive phrases can hide what you personally contributed.',
      recommendation: 'Replace “responsible for” and “worked on” with accurate, direct descriptions of your action.',
      maxPoints: 4,
      earnedPoints: clamp(4 - weakCount * 1.5, 0, 4),
      evidence: weakEvidence,
    },
    {
      id: 'impact.role-context',
      dimension: 'impact',
      title: 'Roles provide clear context',
      explanation: 'Job titles and role context help a reader understand where each achievement happened.',
      recommendation: 'Use recognizable job titles and clearly associate them with each employer.',
      maxPoints: 3,
      earnedPoints: titleLines.length >= 2 ? 3 : titleLines.length === 1 ? 1.5 : 0,
    },
    {
      id: 'clarity.bullet-length',
      dimension: 'clarity',
      title: 'Bullets are concise and complete',
      explanation: 'Focused bullets are easier to scan than fragments or multi-line paragraphs.',
      recommendation: 'Keep most bullets between 8 and 32 words and limit each bullet to one main outcome.',
      maxPoints: 6,
      earnedPoints: ratioScore(conciseBullets.length, bullets.length, 6),
      evidence: longEvidence,
    },
    {
      id: 'clarity.first-person',
      dimension: 'clarity',
      title: 'Resume voice is concise',
      explanation: 'Resume bullets normally omit first-person pronouns.',
      recommendation: 'Remove “I”, “me”, and “my” where the subject is already understood.',
      maxPoints: 3,
      earnedPoints: firstPersonEvidence.length === 0 ? 3 : clamp(3 - firstPersonEvidence.length, 0, 3),
      evidence: firstPersonEvidence,
    },
    {
      id: 'clarity.repetition',
      dimension: 'clarity',
      title: 'Sentence openings are varied',
      explanation: 'Repeated phrasing makes distinct achievements sound generic.',
      recommendation: 'Vary action verbs while keeping each claim precise.',
      maxPoints: 3,
      earnedPoints: repeated.length === 0 ? 3 : repeated.length === 1 ? 1.5 : 0,
      evidence: repeated.flatMap(phrase => evidenceFor(parsed, text => text.startsWith(phrase), 2)).slice(0, 3),
    },
    {
      id: 'clarity.resume-length',
      dimension: 'clarity',
      title: 'Resume length is focused',
      explanation: 'Most resumes should communicate relevant evidence without unnecessary volume.',
      recommendation: 'Prioritize recent, relevant evidence and remove duplicated or low-value content.',
      maxPoints: 3,
      earnedPoints: parsed.stats.words >= 300 && parsed.stats.words <= 1100
        ? 3
        : parsed.stats.words >= 200 && parsed.stats.words <= 1400
          ? 1.5
          : 0,
    },
    {
      id: 'consistency.punctuation',
      dimension: 'consistency',
      title: 'Bullet punctuation is consistent',
      explanation: 'Consistent punctuation signals attention to detail.',
      recommendation: 'Either end all bullets with punctuation or omit it consistently.',
      maxPoints: 3,
      earnedPoints: punctuationConsistency * 3,
    },
    {
      id: 'consistency.dates',
      dimension: 'consistency',
      title: 'Dates follow a consistent format',
      explanation: 'Consistent date formats make the career timeline easier to scan.',
      recommendation: 'Use one date style throughout, such as “Jan 2023 - Mar 2025”.',
      maxPoints: 4,
      earnedPoints: parsed.stats.datedLines >= 4 ? 4 : parsed.stats.datedLines >= 2 ? 2.5 : parsed.stats.datedLines ? 1 : 0,
    },
    {
      id: 'consistency.headings',
      dimension: 'consistency',
      title: 'Section headings are conventional',
      explanation: 'Conventional headings reduce ambiguity for both people and software.',
      recommendation: 'Use familiar headings and apply one capitalization style.',
      maxPoints: 3,
      earnedPoints: sectionsFound.has('experience') && sectionsFound.has('education') ? 3 : sectionsFound.size >= 3 ? 2 : 0.5,
    },
    {
      id: 'search.skills',
      dimension: 'searchability',
      title: 'Relevant skills are explicit',
      explanation: 'Recruiters and search systems need important capabilities stated in plain language.',
      recommendation: 'List relevant tools and skills explicitly, then support the important ones in experience bullets.',
      maxPoints: 5,
      earnedPoints: clamp(skillMatches * 0.75, 0, 5),
    },
    {
      id: 'search.titles',
      dimension: 'searchability',
      title: 'Job titles are recognizable',
      explanation: 'Standard titles improve discoverability and clarify seniority.',
      recommendation: 'Use the official title and, where necessary, add a truthful clarifying title in parentheses.',
      maxPoints: 3,
      earnedPoints: titleLines.length >= 2 ? 3 : titleLines.length === 1 ? 1.5 : 0,
    },
    {
      id: 'search.linkedin',
      dimension: 'searchability',
      title: 'Professional profile is linked',
      explanation: 'A LinkedIn or portfolio link gives recruiters additional context.',
      recommendation: 'Add a clean LinkedIn or portfolio URL if it strengthens your application.',
      maxPoints: 2,
      earnedPoints: parsed.contacts.linkedIn ? 2 : /https?:\/\//i.test(parsed.normalizedText) ? 1 : 0,
    },
    {
      id: 'mechanics.placeholders',
      dimension: 'mechanics',
      title: 'No template placeholders remain',
      explanation: 'Unfinished placeholder text is a high-risk application error.',
      recommendation: 'Replace or remove all template placeholders before exporting.',
      maxPoints: 2,
      earnedPoints: placeholders.length === 0 ? 2 : 0,
      evidence: placeholders,
    },
    {
      id: 'mechanics.characters',
      dimension: 'mechanics',
      title: 'Text is cleanly encoded',
      explanation: 'Corrupted symbols can break parsing and make the document look unfinished.',
      recommendation: 'Replace corrupted characters and export using a modern PDF or DOCX tool.',
      maxPoints: 1,
      earnedPoints: /�|\uFFFD/.test(parsed.normalizedText) ? 0 : 1,
    },
    {
      id: 'mechanics.casing',
      dimension: 'mechanics',
      title: 'Capitalization is readable',
      explanation: 'Long all-caps text is harder to scan and can look inconsistent.',
      recommendation: 'Reserve all caps for short section headings.',
      maxPoints: 2,
      earnedPoints: parsed.lines.filter(line => line.text.length > 35 && line.text === line.text.toUpperCase()).length === 0 ? 2 : 0.5,
    },
  ]

  const checks = rules.map(makeCheck)
  const dimensionOrder: ScoreDimension[] = [
    'parseability',
    'completeness',
    'impact',
    'clarity',
    'consistency',
    'searchability',
    'mechanics',
  ]
  const dimensions: DimensionScore[] = dimensionOrder.map((id) => {
    const dimensionChecks = checks.filter(check => check.dimension === id)
    return {
      id,
      label: DIMENSION_LABELS[id],
      score: Math.round(dimensionChecks.reduce((sum, check) => sum + check.earnedPoints, 0)),
      maxScore: dimensionChecks.reduce((sum, check) => sum + check.maxPoints, 0),
    }
  })
  const calculatedScore = Math.round(dimensions.reduce((sum, dimension) => sum + dimension.score, 0))
  const createdAt = options.createdAt || new Date().toISOString()

  return {
    id: `analysis-${hashText(`${parsed.contentHash}:${SCORING_VERSION}`)}`,
    resumeId: options.resumeId || 'unassigned',
    versionId: options.versionId || 'unassigned',
    createdAt,
    score: parsed.confidence === 'low' ? null : calculatedScore,
    parseConfidence: parsed.confidence,
    parserVersion: PARSER_VERSION,
    scoringVersion: SCORING_VERSION,
    taxonomyVersion: TAXONOMY_VERSION,
    sourceFileHash: hashText(parsed.normalizedText),
    canonicalContentHash: parsed.contentHash,
    dimensions,
    checks,
    parseWarnings: parsed.warnings,
  }
}

export function getPrioritizedFindings(analysis: ResumeAnalysis): ScoreCheck[] {
  return analysis.checks
    .filter(check => !check.passed)
    .sort((left, right) => {
      const leftLoss = left.maxPoints - left.earnedPoints
      const rightLoss = right.maxPoints - right.earnedPoints
      if (rightLoss !== leftLoss) return rightLoss - leftLoss
      return left.ruleId.localeCompare(right.ruleId)
    })
}
