import type { CommissionSummary } from '../../../../lib/hooks/useCommissions'

type EffectiveRule = NonNullable<CommissionSummary['effectiveRule']>

function describeRule(rule: EffectiveRule): string {
  if (rule.calcMethod === 'FIXED') return `$${rule.value} fijo`
  return `${rule.value}% de ${rule.basis === 'SALE_TOTAL' ? 'venta total' : 'ganancia'}`
}

function describeSource(rule: EffectiveRule, planName: string | null): string {
  if (rule.source === 'OVERRIDE') return 'Regla individual'
  return planName ? `Plan "${planName}"` : 'Plan de comisión'
}

interface EffectiveRuleSummaryProps {
  summary: CommissionSummary
}

/**
 * What the employee earns on a sale right now, from the same resolver that pays real
 * commissions. It is evaluated at "now"; the simulator ("Preview") evaluates a date-only
 * input at the end of that day. That difference is intentional, not a bug.
 */
export default function EffectiveRuleSummary({ summary }: EffectiveRuleSummaryProps) {
  const { effectiveRule, scopedRuleCount } = summary

  if (effectiveRule) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Regla actual:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{describeRule(effectiveRule)}</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{describeSource(effectiveRule, summary.commissionPlanName)}</span>
          {scopedRuleCount > 0 && (
            <span className="inline-flex text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              +{scopedRuleCount} específicas
            </span>
          )}
        </div>
      </div>
    )
  }

  if (scopedRuleCount > 0) {
    return (
      <p className="text-sm font-medium text-gray-900 dark:text-white">Solo reglas específicas ({scopedRuleCount})</p>
    )
  }

  return <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Sin regla: no genera comisiones</p>
}
