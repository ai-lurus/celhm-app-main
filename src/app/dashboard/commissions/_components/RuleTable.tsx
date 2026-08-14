'use client'

import { CommissionRule } from '../../../../lib/hooks/useCommissionPlans'
import { useCustomerGroups } from '../../../../lib/hooks/useCustomerGroups'
import { IconEdit, IconDelete, IconPlus } from '../../inventory/_components/icons'

interface RuleTableProps {
  title: string
  rules: CommissionRule[]
  onAddRule: () => void
  onReviseRule: (rule: CommissionRule) => void
  onDeleteRule: (rule: CommissionRule) => void
  isMutating: boolean
}

function formatScopeLabel(rule: CommissionRule, groupNameById: Map<number, string>): string {
  if (rule.scopeType === 'GENERAL') return 'General'
  if (rule.scopeType === 'PRODUCT_CATEGORY') return `Categoría: ${rule.scopeValue}`
  const groupId = Number(rule.scopeValue)
  return `Grupo: ${groupNameById.get(groupId) ?? rule.scopeValue}`
}

function formatCalc(rule: CommissionRule): string {
  return rule.calcMethod === 'PERCENTAGE' ? `${rule.value}%` : `$${rule.value} fijo`
}

function formatBasis(rule: CommissionRule): string {
  return rule.basis === 'SALE_TOTAL' ? 'Venta total' : 'Ganancia'
}

function formatVigencia(rule: CommissionRule): string {
  const from = new Date(rule.validFrom).toLocaleDateString()
  if (!rule.validTo) return `Desde ${from} · Vigente`
  return `${from} – ${new Date(rule.validTo).toLocaleDateString()}`
}

export default function RuleTable({ title, rules, onAddRule, onReviseRule, onDeleteRule, isMutating }: RuleTableProps) {
  const { data: customerGroups = [] } = useCustomerGroups()
  const groupNameById = new Map(customerGroups.map((g) => [g.id, g.name]))

  return (
    <div className="bg-card rounded-lg shadow">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <button onClick={onAddRule} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2">
          <IconPlus className="w-4 h-4" />
          <span>Agregar regla</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Alcance</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Basis</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Cálculo</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Vigencia</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">Sin reglas todavía</td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-muted">
                  <td className="px-4 py-2 text-sm text-foreground">{formatScopeLabel(rule, groupNameById)}</td>
                  <td className="px-4 py-2 text-sm text-foreground">{formatBasis(rule)}</td>
                  <td className="px-4 py-2 text-sm text-foreground">{formatCalc(rule)}</td>
                  <td className="px-4 py-2 text-sm text-foreground">{formatVigencia(rule)}</td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex items-center space-x-3">
                      <button onClick={() => onReviseRule(rule)} title="Revisar" disabled={isMutating} className="p-1 rounded-md text-primary hover:bg-blue-100 hover:text-blue-800 disabled:opacity-30">
                        <IconEdit className="w-5 h-5" />
                      </button>
                      <button onClick={() => onDeleteRule(rule)} title="Eliminar" disabled={isMutating} className="p-1 rounded-md text-red-600 hover:bg-red-100 hover:text-red-800 disabled:opacity-30">
                        <IconDelete className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
