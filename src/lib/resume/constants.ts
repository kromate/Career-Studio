import type { ResumeSectionType, ScoreDimension } from '@/types'

export const PARSER_VERSION = 'resume-parser-v1.1.0'
export const SCORING_VERSION = 'resume-quality-v1.3.0'
export const MATCH_SCORING_VERSION = 'job-match-v1.1.0'
export const TAXONOMY_VERSION = 'skills-v1.0.0'
export const CANONICAL_SCHEMA_VERSION = 'career-studio-resume-v1.0.0'

export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  parseability: 'ATS readability',
  completeness: 'Completeness',
  impact: 'Evidence & impact',
  clarity: 'Clarity & brevity',
  consistency: 'Consistency',
  searchability: 'Searchability',
  mechanics: 'Mechanics',
}

export const SECTION_HEADINGS: Array<{
  type: ResumeSectionType
  patterns: string[]
}> = [
    { type: 'summary', patterns: ['summary', 'profile', 'professional summary', 'career summary', 'about me', 'objective'] },
    { type: 'experience', patterns: ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'career history'] },
    {
      type: 'skills',
      patterns: [
        'skills',
        'skills & tools',
        'technical skills',
        'technical skills & tools',
        'core competencies',
        'competencies',
        'expertise',
        'technologies',
      ],
    },
    { type: 'education', patterns: ['education', 'academic background', 'qualifications'] },
    { type: 'certifications', patterns: ['certifications', 'certificates', 'licenses', 'professional development'] },
    { type: 'projects', patterns: ['projects', 'selected projects', 'key projects', 'portfolio'] },
  ]

export const ACTION_VERBS = [
  'achieved', 'accelerated', 'analyzed', 'attracted', 'automated', 'built',
  'collaborated', 'completed', 'converted', 'coordinated', 'created', 'delivered',
  'designed', 'developed', 'drove', 'established', 'founded', 'generated', 'grew',
  'implemented', 'improved', 'increased', 'launched', 'led', 'managed', 'mentored',
  'negotiated', 'optimized', 'orchestrated', 'oversaw', 'owned', 'produced',
  'reduced', 'resolved', 'scaled', 'shipped', 'streamlined', 'supported',
  'transformed',
]

export const TECHNOLOGY_LIST_PATTERN = /^(?:technologies?|tech stack|tools) used\s*:/i

export const WEAK_PHRASES = [
  'responsible for',
  'worked on',
  'worked with',
  'helped with',
  'helped to',
  'tasked with',
  'duties included',
  'participated in',
  'involved in',
  'was in charge of',
  'assumed the responsibility',
]

export const FILLER_PHRASES = [
  'in order to',
  'successfully',
  'various',
  'multiple different',
  'a number of',
  'as needed',
  'as required',
  'was able to',
  'helped to',
  'helped with',
  'responsible for',
  'duties included',
  'tasked with',
  'involved in',
  'participated in',
]

export const COMMON_SKILLS: Record<string, string[]> = {
  javascript: ['javascript'],
  typescript: ['typescript'],
  vue: ['vue', 'vue.js', 'vuejs'],
  react: ['react', 'react.js', 'reactjs'],
  nuxt: ['nuxt', 'nuxt.js', 'nuxtjs'],
  node: ['node', 'node.js', 'nodejs'],
  python: ['python'],
  java: ['java'],
  sql: ['sql', 'postgresql', 'mysql'],
  aws: ['aws', 'amazon web services'],
  gcp: ['gcp', 'google cloud'],
  azure: ['azure', 'microsoft azure'],
  docker: ['docker', 'containers'],
  kubernetes: ['kubernetes', 'k8s'],
  firebase: ['firebase', 'firestore'],
  figma: ['figma'],
  analytics: ['analytics', 'data analysis'],
  excel: ['excel', 'spreadsheets'],
  salesforce: ['salesforce'],
  marketing: ['marketing', 'growth marketing'],
  seo: ['seo', 'search engine optimization'],
  product: ['product management', 'product strategy', 'roadmap'],
  agile: ['agile', 'scrum', 'kanban'],
  leadership: ['leadership', 'team leadership', 'people management'],
  communication: ['communication', 'stakeholder management'],
  recruiting: ['recruiting', 'talent acquisition'],
  hr: ['human resources', 'hr'],
  finance: ['financial analysis', 'finance', 'accounting'],
  customerSuccess: ['customer success', 'customer experience'],
  projectManagement: ['project management', 'program management'],
}

export const RESPONSIBILITY_TERMS = [
  'lead', 'manage', 'build', 'design', 'develop', 'analyze', 'coordinate', 'own',
  'deliver', 'support', 'create', 'implement', 'optimize', 'collaborate', 'report',
  'research', 'plan', 'communicate', 'mentor', 'sell', 'recruit', 'operate',
]
