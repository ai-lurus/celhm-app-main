import { render, screen } from '@testing-library/react'
import type { CommissionSummary } from '../../../../lib/hooks/useCommissions'
import EffectiveRuleSummary from './EffectiveRuleSummary'

const baseSummary: CommissionSummary = {
  userId: 4,
  userName: 'Chlau',
  userEmail: null,
  commissionPlanName: null,
  commissionPlanActive: null,
  effectiveRule: null,
  scopedRuleCount: 0,
  pendingAmount: 0,
  paidAmount: 0,
  totalAmount: 0,
  pendingCount: 0,
  paidCount: 0,
}

const overrideFivePercent: NonNullable<CommissionSummary['effectiveRule']> = {
  ruleId: 1,
  source: 'OVERRIDE',
  basis: 'SALE_TOTAL',
  calcMethod: 'PERCENTAGE',
  value: 5,
}

describe('EffectiveRuleSummary', () => {
  it('shows the general rule and where it comes from, with no chip when there are no scoped rules', () => {
    render(<EffectiveRuleSummary summary={{ ...baseSummary, effectiveRule: overrideFivePercent }} />)

    expect(screen.getByText('5% de venta total')).toBeInTheDocument()
    expect(screen.getByText('Regla individual')).toBeInTheDocument()
    expect(screen.queryByText(/específicas/)).toBeNull()
  })

  it('adds a "+N específicas" chip when scoped rules are also in force', () => {
    render(<EffectiveRuleSummary summary={{ ...baseSummary, effectiveRule: overrideFivePercent, scopedRuleCount: 2 }} />)

    expect(screen.getByText('5% de venta total')).toBeInTheDocument()
    expect(screen.getByText('+2 específicas')).toBeInTheDocument()
  })

  it('names the plan when the rule comes from the plan', () => {
    render(
      <EffectiveRuleSummary
        summary={{
          ...baseSummary,
          commissionPlanName: 'Vendedor nivel 1',
          effectiveRule: { ...overrideFivePercent, source: 'PLAN', basis: 'PROFIT', value: 8 },
        }}
      />
    )

    expect(screen.getByText('8% de ganancia')).toBeInTheDocument()
    expect(screen.getByText('Plan "Vendedor nivel 1"')).toBeInTheDocument()
  })

  it('formats a fixed amount without a base', () => {
    render(
      <EffectiveRuleSummary
        summary={{ ...baseSummary, effectiveRule: { ...overrideFivePercent, calcMethod: 'FIXED', value: 50 } }}
      />
    )
    expect(screen.getByText('$50 fijo')).toBeInTheDocument()
  })

  it('with no general rule but scoped ones: "Solo reglas específicas (N)"', () => {
    render(<EffectiveRuleSummary summary={{ ...baseSummary, scopedRuleCount: 3 }} />)

    expect(screen.getByText('Solo reglas específicas (3)')).toBeInTheDocument()
    expect(screen.queryByText(/Sin regla/)).toBeNull()
  })

  it('with no valid rule of any kind: says it does not generate commissions', () => {
    render(<EffectiveRuleSummary summary={baseSummary} />)

    expect(screen.getByText('Sin regla: no genera comisiones')).toBeInTheDocument()
  })
})
