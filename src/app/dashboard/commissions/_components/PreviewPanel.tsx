'use client'

import { useState } from 'react'
import { useUsers } from '../../../../lib/hooks/useUsers'
import { useCommissionRulePreview } from '../../../../lib/hooks/useCommissionPlans'

function formatBasis(basis: 'SALE_TOTAL' | 'PROFIT'): string {
  return basis === 'SALE_TOTAL' ? 'Venta total' : 'Ganancia'
}

function formatCalc(calcMethod: 'PERCENTAGE' | 'FIXED', value: number): string {
  return calcMethod === 'PERCENTAGE' ? `${value}%` : `$${value} fijo`
}

export default function PreviewPanel() {
  const { data: members = [] } = useUsers()
  const [membershipId, setMembershipId] = useState<number | null>(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [query, setQuery] = useState<{ membershipId: number; date: string } | null>(null)

  const { data: results = [], isFetching } = useCommissionRulePreview(query?.membershipId ?? null, query?.date ?? null)

  const handleCalculate = () => {
    if (membershipId === null) return
    setQuery({ membershipId, date })
  }

  return (
    <div className="bg-card rounded-lg shadow p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="preview-member" className="block text-sm font-medium text-foreground mb-1">Empleado</label>
          <select
            id="preview-member"
            value={membershipId ?? ''}
            onChange={(e) => setMembershipId(e.target.value ? Number(e.target.value) : null)}
            className="w-full border border-border rounded-md px-3 py-2"
          >
            <option value="">Selecciona un empleado</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.user.name || m.user.email}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="preview-date" className="block text-sm font-medium text-foreground mb-1">Fecha</label>
          <input
            id="preview-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2"
          />
        </div>
        <button
          onClick={handleCalculate}
          disabled={membershipId === null || isFetching}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {isFetching ? 'Calculando...' : 'Calcular'}
        </button>
      </div>

      {query && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Alcance</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Basis</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Cálculo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.length === 0 && !isFetching ? (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">Sin regla aplicable</td></tr>
              ) : (
                results.map((r) => (
                  <tr key={r.scopeLabel}>
                    <td className="px-4 py-2 text-sm text-foreground">{r.scopeLabel}</td>
                    <td className="px-4 py-2 text-sm text-foreground">{formatBasis(r.basis)}</td>
                    <td className="px-4 py-2 text-sm text-foreground">{formatCalc(r.calcMethod, r.value)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
