'use client'

import { useState } from 'react'
import {
  useCommissionPlans,
  useAddCommissionRule,
  useReviseCommissionRule,
  useDeleteCommissionRule,
  CommissionRule,
  CommissionRuleInput,
  CommissionRuleReviseInput,
} from '../../../../lib/hooks/useCommissionPlans'
import { useToast } from '../../../../hooks/use-toast'
import { parseApiError } from '../../../../lib/utils'
import PlanList from './PlanList'
import RuleTable from './RuleTable'
import RuleFormModal from './RuleFormModal'
import OverridesPanel from './OverridesPanel'
import PreviewPanel from './PreviewPanel'

type SubTab = 'plans' | 'overrides' | 'preview'

const SUB_TAB_LABELS: Record<SubTab, string> = {
  plans: 'Planes',
  overrides: 'Overrides',
  preview: 'Preview',
}

export default function PlansTab() {
  const { toast } = useToast()
  const [subTab, setSubTab] = useState<SubTab>('plans')
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [ruleToRevise, setRuleToRevise] = useState<CommissionRule | null>(null)

  const { data: plans = [], isLoading } = useCommissionPlans()
  const addRule = useAddCommissionRule()
  const reviseRule = useReviseCommissionRule()
  const deleteRule = useDeleteCommissionRule()

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null

  const openAddRule = () => { setRuleToRevise(null); setIsRuleModalOpen(true) }
  const openReviseRule = (rule: CommissionRule) => { setRuleToRevise(rule); setIsRuleModalOpen(true) }
  const closeRuleModal = () => { setIsRuleModalOpen(false); setRuleToRevise(null) }

  const handleSubmitAdd = async (data: CommissionRuleInput) => {
    if (selectedPlanId === null) return
    try {
      await addRule.mutateAsync({ planId: selectedPlanId, data })
      toast({ variant: 'success', title: 'Regla agregada', description: 'La regla se agregó correctamente.' })
      closeRuleModal()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: parseApiError(error, 'Error al agregar regla') })
    }
  }

  const handleSubmitRevise = async (data: CommissionRuleReviseInput) => {
    if (!ruleToRevise) return
    try {
      await reviseRule.mutateAsync({ id: ruleToRevise.id, data })
      toast({ variant: 'success', title: 'Regla revisada', description: 'Se creó una nueva versión de la regla.' })
      closeRuleModal()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al revisar', description: parseApiError(error, 'Error al revisar regla') })
    }
  }

  const handleDeleteRule = async (rule: CommissionRule) => {
    if (!confirm('¿Eliminar esta regla? Si ya fue usada en comisiones generadas, solo se cerrará su vigencia.')) return
    try {
      await deleteRule.mutateAsync(rule.id)
      toast({ variant: 'success', title: 'Regla eliminada', description: 'La regla se procesó correctamente.' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al eliminar', description: parseApiError(error, 'Error al eliminar regla') })
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {(Object.keys(SUB_TAB_LABELS) as SubTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                subTab === tab
                  ? 'border-blue-500 text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {SUB_TAB_LABELS[tab]}
            </button>
          ))}
        </nav>
      </div>

      {subTab === 'plans' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlanList plans={plans} isLoading={isLoading} selectedPlanId={selectedPlanId} onSelectPlan={setSelectedPlanId} />
          {selectedPlan && (
            <RuleTable
              title={`Reglas de "${selectedPlan.name}"`}
              rules={selectedPlan.rules}
              onAddRule={openAddRule}
              onReviseRule={openReviseRule}
              onDeleteRule={handleDeleteRule}
              isMutating={deleteRule.isPending}
            />
          )}
        </div>
      )}

      {subTab === 'overrides' && <OverridesPanel />}
      {subTab === 'preview' && <PreviewPanel />}

      <RuleFormModal
        isOpen={isRuleModalOpen}
        mode={ruleToRevise ? 'revise' : 'add'}
        ruleToRevise={ruleToRevise}
        isSaving={addRule.isPending || reviseRule.isPending}
        onClose={closeRuleModal}
        onSubmitAdd={handleSubmitAdd}
        onSubmitRevise={handleSubmitRevise}
      />
    </div>
  )
}
