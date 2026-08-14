'use client'

import { useState } from 'react'
import {
  CommissionPlan,
  useCreateCommissionPlan,
  useUpdateCommissionPlan,
  useDeactivateCommissionPlan,
} from '../../../../lib/hooks/useCommissionPlans'
import { useToast } from '../../../../hooks/use-toast'
import { parseApiError } from '../../../../lib/utils'
import { IconEdit, IconPlus } from '../../inventory/_components/icons'
import PlanFormModal from './PlanFormModal'
import { Role } from '@celhm/types'

interface PlanListProps {
  plans: CommissionPlan[]
  isLoading: boolean
  selectedPlanId: number | null
  onSelectPlan: (id: number) => void
}

export default function PlanList({ plans, isLoading, selectedPlanId, onSelectPlan }: PlanListProps) {
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [planToEdit, setPlanToEdit] = useState<CommissionPlan | null>(null)
  const [planToDeactivate, setPlanToDeactivate] = useState<CommissionPlan | null>(null)

  const createPlan = useCreateCommissionPlan()
  const updatePlan = useUpdateCommissionPlan()
  const deactivatePlan = useDeactivateCommissionPlan()
  const isSaving = createPlan.isPending || updatePlan.isPending

  const openAdd = () => { setPlanToEdit(null); setIsModalOpen(true) }
  const openEdit = (plan: CommissionPlan) => { setPlanToEdit(plan); setIsModalOpen(true) }
  const closeModal = () => { if (isSaving) return; setIsModalOpen(false); setPlanToEdit(null) }

  const handleSave = async (data: { name: string; role?: Role }) => {
    try {
      if (planToEdit) {
        await updatePlan.mutateAsync({ id: planToEdit.id, data: { name: data.name } })
        toast({ variant: 'success', title: 'Plan actualizado', description: 'El plan se actualizó correctamente.' })
      } else {
        await createPlan.mutateAsync(data)
        toast({ variant: 'success', title: 'Plan creado', description: 'El plan se creó correctamente.' })
      }
      closeModal()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: parseApiError(error, 'Error al guardar plan') })
    }
  }

  const handleDeactivate = async () => {
    if (!planToDeactivate) return
    try {
      await deactivatePlan.mutateAsync(planToDeactivate.id)
      toast({ variant: 'success', title: 'Plan desactivado', description: 'El plan quedó inactivo.' })
      setPlanToDeactivate(null)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al desactivar', description: parseApiError(error, 'Error al desactivar plan') })
    }
  }

  return (
    <div className="bg-card rounded-lg shadow">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">Planes de comisión</h3>
        <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2">
          <IconPlus className="w-4 h-4" />
          <span>Agregar plan</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Nombre</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Rol</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase"># Reglas</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Estatus</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">Cargando...</td></tr>
            ) : plans.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">No hay planes todavía</td></tr>
            ) : (
              plans.map((plan) => (
                <tr
                  key={plan.id}
                  onClick={() => onSelectPlan(plan.id)}
                  className={`cursor-pointer hover:bg-muted ${selectedPlanId === plan.id ? 'bg-muted' : ''}`}
                >
                  <td className="px-4 py-2 text-sm font-medium text-foreground">{plan.name}</td>
                  <td className="px-4 py-2 text-sm text-foreground">{plan.role ?? '—'}</td>
                  <td className="px-4 py-2 text-sm text-foreground">{plan.rules.length}</td>
                  <td className="px-4 py-2 text-sm">
                    {plan.active ? (
                      <span className="inline-flex text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Activo</span>
                    ) : (
                      <span className="inline-flex text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => openEdit(plan)} title="Editar" className="p-1 rounded-md text-primary hover:bg-blue-100 hover:text-blue-800">
                        <IconEdit className="w-5 h-5" />
                      </button>
                      {plan.active && (
                        <button onClick={() => setPlanToDeactivate(plan)} title="Desactivar" className="text-xs text-red-600 hover:underline">
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PlanFormModal isOpen={isModalOpen} planToEdit={planToEdit} isSaving={isSaving} onClose={closeModal} onSave={handleSave} />

      {planToDeactivate && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground">Confirmar desactivación</h2>
            <p className="text-muted-foreground mt-4">
              ¿Desactivar el plan <span className="font-medium">{planToDeactivate.name}</span>? Dejará de aplicar a
              ventas nuevas; sus reglas y comisiones ya generadas no se borran.
            </p>
            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={() => setPlanToDeactivate(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">Cancelar</button>
              <button onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md">Desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
