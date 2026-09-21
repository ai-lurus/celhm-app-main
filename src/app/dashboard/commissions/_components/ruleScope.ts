import type { CommissionRule, CommissionRuleInput } from '../../../../lib/hooks/useCommissionPlans'

/** A rule that has not ended yet (in force now, or scheduled for later). */
export function isOpenRule(rule: CommissionRule, now: Date = new Date()): boolean {
  return rule.validTo === null || new Date(rule.validTo) > now
}

function scopeKey(scopeType: CommissionRule['scopeType'], scopeValue: string | null | undefined): string {
  return `${scopeType}|${scopeType === 'GENERAL' ? '' : scopeValue ?? ''}`
}

/**
 * The open rule that a new rule with this scope would replace. The API ends it when
 * the new one is saved (basis does not matter: the resolver ranks by scope only).
 */
export function findReplaceableRule(
  rules: CommissionRule[],
  input: Pick<CommissionRuleInput, 'scopeType' | 'scopeValue'>,
  now: Date = new Date()
): CommissionRule | null {
  const wanted = scopeKey(input.scopeType, input.scopeValue)
  return rules.find((rule) => isOpenRule(rule, now) && scopeKey(rule.scopeType, rule.scopeValue) === wanted) ?? null
}
