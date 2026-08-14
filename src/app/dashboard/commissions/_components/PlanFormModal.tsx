'use client'

import { useEffect, useState } from 'react'
import { CommissionPlan } from '../../../../lib/hooks/useCommissionPlans'
import { Role } from '@celhm/types'

interface PlanFormModalProps {
  isOpen: boolean
  planToEdit: CommissionPlan | null
  isSaving: boolean
  onClose: () => void
  onSave: (data: { name: string; role?: Role }) => void
}

const ROLE_OPTIONS: Role[] = ['ADMINISTRADOR', 'TECNICO', 'VENDEDOR', 'ALMACENISTA', 'CAJERO']

export default function PlanFormModal({ isOpen, planToEdit, isSaving, onClose, onSave }: PlanFormModalProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role | ''>('')

  useEffect(() => {
    if (!isOpen) return
    setName(planToEdit?.name ?? '')
    setRole(planToEdit?.role ?? '')
  }, [isOpen, planToEdit])

  if (!isOpen) return null

  const canSubmit = name.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSave({ name: name.trim(), role: role || undefined })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
        <h2 className="text-xl font-bold text-foreground">{planToEdit ? 'Editar plan' : 'Agregar plan'}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="plan-name" className="block text-sm font-medium text-foreground mb-1">Nombre</label>
            <input
              id="plan-name"
              aria-label="Nombre"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Vendedor estándar"
              className="w-full border border-border rounded-md px-3 py-2"
              autoFocus
              disabled={isSaving}
            />
          </div>
          {!planToEdit && (
            <div>
              <label htmlFor="plan-role" className="block text-sm font-medium text-foreground mb-1">Rol (opcional)</label>
              <select
                id="plan-role"
                aria-label="Rol (opcional)"
                value={role}
                onChange={(e) => setRole(e.target.value as Role | '')}
                className="w-full border border-border rounded-md px-3 py-2"
                disabled={isSaving}
              >
                <option value="">— Sin rol específico —</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end space-x-4 pt-2">
            <button type="button" onClick={onClose} disabled={isSaving} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving || !canSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50">
              {isSaving ? 'Guardando...' : (planToEdit ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
