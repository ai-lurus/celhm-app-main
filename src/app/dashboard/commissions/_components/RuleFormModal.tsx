'use client'

import { useEffect, useState } from 'react'
import {
  useCommissionCategories,
  CommissionBasis,
  CommissionScope,
  CommissionCalcMethod,
  CommissionRule,
  CommissionRuleInput,
  CommissionRuleReviseInput,
} from '../../../../lib/hooks/useCommissionPlans'
import { useCustomerGroups } from '../../../../lib/hooks/useCustomerGroups'

interface RuleFormModalProps {
  isOpen: boolean
  mode: 'add' | 'revise'
  ruleToRevise: CommissionRule | null
  isSaving: boolean
  onClose: () => void
  onSubmitAdd: (data: CommissionRuleInput) => void
  onSubmitRevise: (data: CommissionRuleReviseInput) => void
}

const BASIS_OPTIONS: { value: CommissionBasis; label: string }[] = [
  { value: 'SALE_TOTAL', label: 'Venta total' },
  { value: 'PROFIT', label: 'Ganancia' },
]

const SCOPE_OPTIONS: { value: CommissionScope; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'PRODUCT_CATEGORY', label: 'Categoría de producto' },
  { value: 'CUSTOMER_GROUP', label: 'Grupo de cliente' },
]

const CALC_OPTIONS: { value: CommissionCalcMethod; label: string }[] = [
  { value: 'PERCENTAGE', label: 'Porcentaje (%)' },
  { value: 'FIXED', label: 'Monto fijo ($)' },
]

const emptyForm = {
  basis: 'SALE_TOTAL' as CommissionBasis,
  scopeType: 'GENERAL' as CommissionScope,
  scopeValue: '',
  calcMethod: 'PERCENTAGE' as CommissionCalcMethod,
  value: '',
  label: '',
}

export default function RuleFormModal({
  isOpen,
  mode,
  ruleToRevise,
  isSaving,
  onClose,
  onSubmitAdd,
  onSubmitRevise,
}: RuleFormModalProps) {
  const [form, setForm] = useState(emptyForm)
  const { data: categories = [] } = useCommissionCategories()
  const { data: customerGroups = [] } = useCustomerGroups()

  useEffect(() => {
    if (!isOpen) return
    if (mode === 'revise' && ruleToRevise) {
      setForm({
        basis: ruleToRevise.basis,
        scopeType: ruleToRevise.scopeType,
        scopeValue: ruleToRevise.scopeValue ?? '',
        calcMethod: ruleToRevise.calcMethod,
        value: String(ruleToRevise.value),
        label: ruleToRevise.label ?? '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [isOpen, mode, ruleToRevise])

  if (!isOpen) return null

  const needsScopeValue = form.scopeType !== 'GENERAL'
  const numericValue = Number(form.value)
  const isValueValid = form.value !== '' && !Number.isNaN(numericValue) && numericValue >= 0
  const isScopeValid = mode === 'revise' || !needsScopeValue || form.scopeValue !== ''
  const canSubmit = isValueValid && isScopeValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    if (mode === 'revise') {
      onSubmitRevise({
        calcMethod: form.calcMethod,
        value: numericValue,
        label: form.label || undefined,
      })
      return
    }

    onSubmitAdd({
      basis: form.basis,
      scopeType: form.scopeType,
      scopeValue: needsScopeValue ? form.scopeValue : undefined,
      calcMethod: form.calcMethod,
      value: numericValue,
      label: form.label || undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-card p-6 rounded-lg shadow-2xl w-full max-w-md">
        <h2 className="text-xl font-bold text-foreground">
          {mode === 'revise' ? 'Revisar regla' : 'Agregar regla'}
        </h2>
        {mode === 'revise' && (
          <p className="text-xs text-muted-foreground mt-2">
            Esto cierra la regla actual y crea una nueva a partir de hoy.
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === 'add' && (
            <>
              <div>
                <label htmlFor="rule-basis" className="block text-sm font-medium text-foreground mb-1">Basis</label>
                <select
                  id="rule-basis"
                  aria-label="Basis"
                  value={form.basis}
                  onChange={(e) => setForm({ ...form, basis: e.target.value as CommissionBasis })}
                  className="w-full border border-border rounded-md px-3 py-2"
                  disabled={isSaving}
                >
                  {BASIS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="rule-scope" className="block text-sm font-medium text-foreground mb-1">Alcance</label>
                <select
                  id="rule-scope"
                  aria-label="Alcance"
                  value={form.scopeType}
                  onChange={(e) => setForm({ ...form, scopeType: e.target.value as CommissionScope, scopeValue: '' })}
                  className="w-full border border-border rounded-md px-3 py-2"
                  disabled={isSaving}
                >
                  {SCOPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {form.scopeType === 'PRODUCT_CATEGORY' && (
                <div>
                  <label htmlFor="rule-category" className="block text-sm font-medium text-foreground mb-1">Categoría</label>
                  <select
                    id="rule-category"
                    aria-label="Categoría"
                    value={form.scopeValue}
                    onChange={(e) => setForm({ ...form, scopeValue: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2"
                    disabled={isSaving}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.scopeType === 'CUSTOMER_GROUP' && (
                <div>
                  <label htmlFor="rule-group" className="block text-sm font-medium text-foreground mb-1">Grupo de cliente</label>
                  <select
                    id="rule-group"
                    aria-label="Grupo de cliente"
                    value={form.scopeValue}
                    onChange={(e) => setForm({ ...form, scopeValue: e.target.value })}
                    className="w-full border border-border rounded-md px-3 py-2"
                    disabled={isSaving}
                  >
                    <option value="">Selecciona un grupo</option>
                    {customerGroups.map((g) => (
                      <option key={g.id} value={String(g.id)}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          <div>
            <label htmlFor="rule-calc" className="block text-sm font-medium text-foreground mb-1">Cálculo</label>
            <select
              id="rule-calc"
              aria-label="Cálculo"
              value={form.calcMethod}
              onChange={(e) => setForm({ ...form, calcMethod: e.target.value as CommissionCalcMethod })}
              className="w-full border border-border rounded-md px-3 py-2"
              disabled={isSaving}
            >
              {CALC_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rule-value" className="block text-sm font-medium text-foreground mb-1">
              Valor {form.calcMethod === 'PERCENTAGE' ? '(%)' : '($)'}
            </label>
            <input
              id="rule-value"
              aria-label={form.calcMethod === 'PERCENTAGE' ? 'Valor (%)' : 'Valor ($)'}
              type="number"
              min="0"
              max={form.calcMethod === 'PERCENTAGE' ? 100 : undefined}
              step="0.01"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              className="w-full border border-border rounded-md px-3 py-2"
              disabled={isSaving}
            />
          </div>
          <div>
            <label htmlFor="rule-label" className="block text-sm font-medium text-foreground mb-1">Etiqueta (opcional)</label>
            <input
              id="rule-label"
              aria-label="Etiqueta (opcional)"
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full border border-border rounded-md px-3 py-2"
              disabled={isSaving}
            />
          </div>
          <div className="flex justify-end space-x-4 pt-2">
            <button type="button" onClick={onClose} disabled={isSaving} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving || !canSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50">
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
