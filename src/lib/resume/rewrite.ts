import type { ParsedResume, ResumeAnalysis, RewriteSuggestion } from '@/types'
import { TECHNOLOGY_LIST_PATTERN, WEAK_PHRASES } from './constants'
import { hashText } from './parser'

const DIRECT_REWRITES: Array<[RegExp, string, string]> = [
  [/^as the founder and primary developer,\s*i assumed the responsibility of overseeing\b/i, 'Oversaw', 'State your ownership directly.'],
  [/^was in charge of\b/i, 'Led', 'State your leadership directly.'],
  [/^team lead for\b/i, 'Led', 'Use a clear action verb while preserving the original claim.'],
  [/^responsible for managing\b/i, 'Managed', 'State your ownership directly.'],
  [/^responsible for\b/i, 'Owned', 'State your ownership directly.'],
  [/^worked on\b/i, 'Contributed to', 'Replace vague phrasing with a more precise contribution.'],
  [/^helped (?:with|to)?\s*/i, 'Supported ', 'Use a concise action that does not overstate ownership.'],
  [/^tasked with\b/i, 'Delivered', 'Remove assignment language and describe the completed work.'],
  [/^participated in\b/i, 'Contributed to', 'Clarify your contribution without overstating leadership.'],
]

export function generateRewriteSuggestions(
  parsed: ParsedResume,
  analysis: ResumeAnalysis,
): RewriteSuggestion[] {
  const suggestions: RewriteSuggestion[] = []
  const weakRule = analysis.checks.find(check => check.ruleId === 'impact.weak-phrasing')
  const actionRule = analysis.checks.find(check => check.ruleId === 'impact.action-verbs')
  const metricRule = analysis.checks.find(check => check.ruleId === 'impact.quantified-outcomes')
  const longRule = analysis.checks.find(check => check.ruleId === 'clarity.bullet-length')

  parsed.lines
    .filter(line => line.kind === 'bullet')
    .forEach((line) => {
      const directRewrite = DIRECT_REWRITES.find(([pattern]) => pattern.test(line.text))
      if (directRewrite) {
        const [pattern, replacement, reason] = directRewrite
        const proposedText = line.text.replace(pattern, replacement).replace(/\s+/g, ' ').trim()
        suggestions.push({
          id: `rewrite-${hashText(`${line.id}:${proposedText}`)}`,
          targetPath: `lines.${line.index}.text`,
          lineId: line.id,
          sourceText: line.text,
          originalText: line.text,
          proposedText,
          rationale: reason,
          reason,
          addressedRuleIds: weakRule ? [weakRule.ruleId, actionRule?.ruleId].filter(Boolean) as string[] : [],
          expectedPointRecovery: 2,
          requiresFactConfirmation: false,
          riskFlags: [],
          status: 'pending',
        })
      }

      const wordCount = line.text.split(/\s+/).length
      if (!directRewrite && wordCount > 32) {
        const firstClause = line.text.split(/[,;]\s+/)[0]
        if (firstClause && firstClause !== line.text && firstClause.split(/\s+/).length >= 8) {
          suggestions.push({
            id: `rewrite-${hashText(`${line.id}:${firstClause}`)}`,
            targetPath: `lines.${line.index}.text`,
            lineId: line.id,
            sourceText: line.text,
            originalText: line.text,
            proposedText: firstClause.replace(/[,.]$/, ''),
            rationale: 'Focus this bullet on one clear contribution. Review the removed clause before accepting.',
            reason: 'Focus this bullet on one clear contribution. Review the removed clause before accepting.',
            addressedRuleIds: longRule ? [longRule.ruleId] : [],
            expectedPointRecovery: 1,
            requiresFactConfirmation: false,
            riskFlags: [],
            status: 'pending',
          })
          return
        }
      }

      if (
        !TECHNOLOGY_LIST_PATTERN.test(line.text)
        && !/\b(?:\d+(?:\.\d+)?%?|\$[\d,.]+|£[\d,.]+|€[\d,.]+)\b/.test(line.text)
      ) {
        suggestions.push({
          id: `rewrite-${hashText(`${line.id}:evidence-prompt`)}`,
          targetPath: `lines.${line.index}.text`,
          lineId: line.id,
          sourceText: line.text,
          originalText: line.text,
          proposedText: line.text,
          rationale: 'New metrics or scope claims need user-supplied evidence before export.',
          reason: 'Add a verified result, scale, volume, time saved, or quality improvement if one exists.',
          addressedRuleIds: metricRule ? [metricRule.ruleId] : [],
          expectedPointRecovery: 1,
          requiresFactConfirmation: true,
          riskFlags: ['new_metric'],
          status: 'pending',
        })
      }
    })

  return suggestions
    .sort((left, right) => Number(left.requiresFactConfirmation) - Number(right.requiresFactConfirmation))
    .slice(0, 12)
}

export function applySuggestion(text: string, suggestion: RewriteSuggestion): string {
  if (suggestion.requiresFactConfirmation) return text
  const lines = text.split('\n')
  const sourceIndex = lines.findIndex(line => (
    line.replace(/^\s*(?:[-*+]|[•◦▪‣])\s+/, '').trim() === suggestion.sourceText.trim()
  ))
  if (sourceIndex === -1) return text
  const prefix = lines[sourceIndex]?.match(/^\s*(?:[-*+]|[•◦▪‣])\s+/)?.[0] || ''
  lines[sourceIndex] = `${prefix}${suggestion.proposedText}`
  return lines.join('\n')
}
