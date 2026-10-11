import { CATEGORIES } from './checklistRules.js'

export const IMPORTANCE_WEIGHTS = { critical: 5, high: 3, normal: 2, optional: 1 }

/**
 * Readiness = weighted share of APPLICABLE items that are completed (0–100).
 * Requirement status is reported separately and never implies legal readiness.
 */
export function computeReadiness(items) {
  const applicable = items.filter((i) => i.applicable)
  const totalWeight = applicable.reduce((n, i) => n + IMPORTANCE_WEIGHTS[i.importance], 0)
  const doneWeight = applicable.filter((i) => i.completed).reduce((n, i) => n + IMPORTANCE_WEIGHTS[i.importance], 0)
  const completed = applicable.filter((i) => i.completed).length

  const requirements = applicable.filter((i) => i.kind === 'requirement')
  const unverified = requirements.filter((i) => i.requirementStatus !== 'verified')
  const criticalOutstanding = applicable.filter((i) => i.importance === 'critical' && !i.completed)

  const byCategory = CATEGORIES.map((id) => {
    const list = applicable.filter((i) => i.category === id)
    return { id, total: list.length, completed: list.filter((i) => i.completed).length }
  })

  return {
    score: totalWeight ? Math.round((doneWeight / totalWeight) * 100) : 0,
    completed,
    total: applicable.length,
    completionPct: applicable.length ? Math.round((completed / applicable.length) * 100) : 0,
    notApplicable: items.length - applicable.length,
    criticalOutstanding: criticalOutstanding.map((i) => ({ id: i.id, title: i.title, category: i.category })),
    requirements: {
      total: requirements.length,
      verified: requirements.length - unverified.length,
      // 'none' = nothing to confirm; never "legally ready"
      status: requirements.length === 0 ? 'none' : unverified.length === 0 ? 'all_confirmed' : 'needs_confirmation',
      outstanding: unverified.map((i) => ({ id: i.id, title: i.title })),
    },
    byCategory,
  }
}
