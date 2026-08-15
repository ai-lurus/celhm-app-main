'use client'

import { useState } from 'react'
import { useUsers } from '../../../../lib/hooks/useUsers'
import {
  useCommissionOverrides,
  useCreateCommissionOverride,
  useReviseCommissionRule,
  useDeleteCommissionRule,
  CommissionRule,
  CommissionRuleInput,
  CommissionRuleReviseInput,
} from '../../../../lib/hooks/useCommissionPlans'
import { useToast } from '../../../../hooks/use-toast'
import { parseApiError } from '../../../../lib/utils'
import RuleTable from './RuleTable'
import RuleFormModal from './RuleFormModal'

export default function OverridesPanel() {
  const { toast } = useToast()
  const { data: members = [] } = useUsers()
  const [membershipId, setMembershipId] = useState<number | null>(null)
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [ruleToRevise, setRuleToRevise] = useState<CommissionRule | null>(null)

  const { data: overrides = [], isLoading } = useCommissionOverrides(membershipId)
  const createOverride = useCreateCommissionOverride()
  const reviseRule = useReviseCommissionRule()
  const deleteRule = useDeleteCommissionRule()

  const openAddRule = () => { setRuleToRevise(null); setIsRuleModalOpen(true) }
  const openReviseRule = (rule: CommissionRule) => { setRuleToRevise(rule); setIsRuleModalOpen(true) }
  const closeRuleModal = () => { setIsRuleModalOpen(false); setRuleToRevise(null) }

  const handleSubmitAdd = async (data: CommissionRuleInput) => {
    if (membershipId === null) return
    try {
      await createOverride.mutateAsync({ ...data, membershipId })
      toast({ variant: 'success', title: 'Override creado', description: 'La regla individual se creó correctamente.' })
      closeRuleModal()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: parseApiError(error, 'Error al crear override') })
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
    if (!confirm('¿Eliminar este override? Si ya fue usado en comisiones generadas, solo se cerrará su vigencia.')) return
    try {
      await deleteRule.mutateAsync(rule.id)
      toast({ variant: 'success', title: 'Override eliminado', description: 'El override se procesó correctamente.' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al eliminar', description: parseApiError(error, 'Error al eliminar override') })
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg shadow p-4">
        <label htmlFor="override-member" className="block text-sm font-medium text-foreground mb-1">Empleado</label>
        <select
          id="override-member"
          value={membershipId ?? ''}
          onChange={(e) => setMembershipId(e.target.value ? Number(e.target.value) : null)}
          className="w-full max-w-md border border-border rounded-md px-3 py-2"
        >
          <option value="">Selecciona un empleado</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.user.name || m.user.email}</option>
          ))}
        </select>
      </div>

      {membershipId !== null && (
        isLoading ? (
          <div className="bg-card rounded-lg shadow p-4 text-center text-muted-foreground">Cargando overrides...</div>
        ) : (
          <RuleTable
            title="Reglas individuales"
            rules={overrides}
            onAddRule={openAddRule}
            onReviseRule={openReviseRule}
            onDeleteRule={handleDeleteRule}
            isMutating={deleteRule.isPending}
          />
        )
      )}

      <RuleFormModal
        isOpen={isRuleModalOpen}
        mode={ruleToRevise ? 'revise' : 'add'}
        ruleToRevise={ruleToRevise}
        isSaving={createOverride.isPending || reviseRule.isPending}
        onClose={closeRuleModal}
        onSubmitAdd={handleSubmitAdd}
        onSubmitRevise={handleSubmitRevise}
      />
    </div>
  )
}
