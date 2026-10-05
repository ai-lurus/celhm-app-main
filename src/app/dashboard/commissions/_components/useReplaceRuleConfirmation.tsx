'use client'

import { useState } from 'react'
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog'
import type { CommissionRule, CommissionRuleInput } from '../../../../lib/hooks/useCommissionPlans'
import { findReplaceableRule } from './ruleScope'
import { formatBasis, formatCalc } from './RuleTable'

interface Pending {
  data: CommissionRuleInput
  current: CommissionRule
}

/**
 * Saving a rule for a scope that already has an open rule replaces it: the API ends the
 * current one when the new one starts today. This asks before doing that.
 * Render `dialog` next to the form modal, and call `submit` from the form.
 */
export function useReplaceRuleConfirmation(
  rules: CommissionRule[],
  save: (data: CommissionRuleInput) => Promise<void> | void
) {
  const [pending, setPending] = useState<Pending | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const submit = (data: CommissionRuleInput) => {
    const current = findReplaceableRule(rules, data)
    if (current) {
      setPending({ data, current })
      return
    }
    void save(data)
  }

  const confirm = async () => {
    if (!pending) return
    setIsSaving(true)
    try {
      await save(pending.data)
    } finally {
      setIsSaving(false)
      setPending(null)
    }
  }

  const dialog = (
    <ConfirmDialog
      isOpen={pending !== null}
      title="Ya existe una regla para este alcance"
      confirmLabel="Reemplazar regla"
      isLoading={isSaving}
      onConfirm={confirm}
      onCancel={() => setPending(null)}
    >
      {pending && (
        <>
          <p>
            La regla actual ({formatCalc(pending.current)} de {formatBasis(pending.current).toLowerCase()}) terminará al
            iniciar hoy y la nueva la reemplazará.
          </p>
          <p>Las comisiones que ya se generaron no cambian.</p>
        </>
      )}
    </ConfirmDialog>
  )

  return { submit, dialog }
}
