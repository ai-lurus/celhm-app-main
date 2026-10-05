import type { CommissionRule } from '../../../../lib/hooks/useCommissionPlans'
import { findReplaceableRule, isOpenRule } from './ruleScope'

const NOW = new Date('2026-09-21T20:00:00.000Z')

function rule(overrides: Partial<CommissionRule> = {}): CommissionRule {
  return {
    id: 1,
    planId: null,
    membershipId: 9,
    basis: 'SALE_TOTAL',
    scopeType: 'GENERAL',
    scopeValue: null,
    calcMethod: 'PERCENTAGE',
    value: 5,
    validFrom: '2026-08-01T06:00:00.000Z',
    validTo: null,
    label: null,
    ...overrides,
  }
}

describe('isOpenRule', () => {
  it('is open with no end date, or an end date in the future', () => {
    expect(isOpenRule(rule(), NOW)).toBe(true)
    expect(isOpenRule(rule({ validTo: '2026-10-01T00:00:00.000Z' }), NOW)).toBe(true)
  })

  it('is closed once its end date has passed', () => {
    expect(isOpenRule(rule({ validTo: '2026-09-01T00:00:00.000Z' }), NOW)).toBe(false)
  })
})

describe('findReplaceableRule', () => {
  it('finds the open GENERAL rule when adding another GENERAL rule, whatever the basis', () => {
    const current = rule({ basis: 'PROFIT' })
    expect(findReplaceableRule([current], { scopeType: 'GENERAL' }, NOW)).toBe(current)
  })

  it('matches a category by value only', () => {
    const accesorios = rule({ id: 2, scopeType: 'PRODUCT_CATEGORY', scopeValue: 'Accesorios' })
    const rules = [rule({ id: 1 }), accesorios]
    expect(findReplaceableRule(rules, { scopeType: 'PRODUCT_CATEGORY', scopeValue: 'Accesorios' }, NOW)).toBe(accesorios)
    expect(findReplaceableRule(rules, { scopeType: 'PRODUCT_CATEGORY', scopeValue: 'Pantallas' }, NOW)).toBeNull()
  })

  it('ignores rules that already ended', () => {
    const ended = rule({ validTo: '2026-09-01T00:00:00.000Z' })
    expect(findReplaceableRule([ended], { scopeType: 'GENERAL' }, NOW)).toBeNull()
  })

  it('returns null when nothing shares the scope', () => {
    expect(findReplaceableRule([], { scopeType: 'GENERAL' }, NOW)).toBeNull()
  })
})
