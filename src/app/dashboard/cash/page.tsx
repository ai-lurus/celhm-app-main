'use client'

import React, { useState, useEffect, type ReactElement } from 'react'
import { useCashRegisters, useCashCuts, useCreateCashCut, CashCut, CashRegister } from '../../../lib/hooks/useCash'
import { useBranches } from '../../../lib/hooks/useBranches'
import { useAuthStore } from '../../../stores/auth'

const IconView = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function CashPage(): ReactElement {
  const user = useAuthStore((state) => state.user)
  const [page, setPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [viewingCut, setViewingCut] = useState<CashCut | null>(null)

  const { data: branches } = useBranches()
  const branchId = user?.branchId || (Array.isArray(branches) && branches.length > 0 ? branches[0].id : 1)

  const { data: registers } = useCashRegisters(branchId)
  const { data: cutsData, isLoading } = useCashCuts({
    branchId,
    page,
    pageSize: 20,
  })

  const createCashCut = useCreateCashCut()

  const cuts: CashCut[] = Array.isArray((cutsData as any)?.data) ? (cutsData as any).data : []
  const registersArray: CashRegister[] = Array.isArray(registers) ? registers : []
  const selectedRegister = registersArray.length > 0 ? registersArray[0] : undefined

  const [cutForm, setCutForm] = useState({
    cashRegisterId: 0,
    initialAmount: 0,
    notes: '',
  })

  // Actualizar el formulario cuando se carguen los registros
  useEffect(() => {
    if (selectedRegister && cutForm.cashRegisterId === 0) {
      setCutForm(prev => ({ ...prev, cashRegisterId: selectedRegister.id }))
    }
  }, [selectedRegister, cutForm.cashRegisterId])

  const handleCreateCut = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cutForm.cashRegisterId) {
      alert('Selecciona una caja')
      return
    }

    try {
      await createCashCut.mutateAsync({
        branchId,
        cashRegisterId: cutForm.cashRegisterId,
        initialAmount: cutForm.initialAmount,
        notes: cutForm.notes,
      })
      setIsCreateModalOpen(false)
      setCutForm({ cashRegisterId: selectedRegister?.id || 0, initialAmount: 0, notes: '' })
    } catch (error) {
      console.error('Error creating cash cut:', error)
    }
  }

  const getDifferenceColor = (diff: number) => {
    if (diff === 0) return 'text-green-600'
    if (diff > 0) return 'text-primary'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Caja y Cortes</h1>
          <p className="text-muted-foreground">Gestiona los cortes de caja diarios</p>
        </div>
        <button
          onClick={() => {
            setCutForm({ cashRegisterId: selectedRegister?.id || 0, initialAmount: 0, notes: '' })
            setIsCreateModalOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          + Nuevo Corte
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-card p-4 rounded-lg shadow">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Caja</label>
            <select
              value={cutForm.cashRegisterId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCutForm({ ...cutForm, cashRegisterId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-border rounded-md"
            >
              {registersArray.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Cortes */}
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Caja</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Inicial</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Ventas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Esperado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Final</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Diferencia</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-muted-foreground">Cargando...</td>
              </tr>
            ) : cuts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-muted-foreground">No hay cortes registrados</td>
              </tr>
            ) : (
              cuts.map((cut: CashCut) => (
                <tr key={cut.id} className="hover:bg-muted">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(cut.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {cut.cashRegister?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    ${cut.initialAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    ${cut.totalSales.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    ${cut.expectedAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    ${cut.finalAmount.toLocaleString()}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getDifferenceColor(cut.difference)}`}>
                    ${cut.difference.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setViewingCut(cut)}
                      className="text-primary hover:text-blue-900"
                      title="Ver detalles"
                    >
                      <IconView />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear Corte */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nuevo Corte de Caja</h2>
            <form onSubmit={handleCreateCut} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Caja</label>
                <select
                  required
                  value={cutForm.cashRegisterId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCutForm({ ...cutForm, cashRegisterId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-md"
                >
                  <option value="">Seleccionar caja...</option>
                  {registersArray.map((reg: CashRegister) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Monto Inicial</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={cutForm.initialAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCutForm({ ...cutForm, initialAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Notas</label>
                <textarea
                  value={cutForm.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCutForm({ ...cutForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createCashCut.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createCashCut.isPending ? 'Guardando...' : 'Crear Corte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      {viewingCut && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-card rounded-lg p-6 w-full max-w-3xl my-8">
            <h2 className="text-xl font-bold mb-4">Detalles del Corte</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Fecha</label>
                  <p className="text-sm text-foreground">{new Date(viewingCut.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Caja</label>
                  <p className="text-sm text-foreground">{viewingCut.cashRegister?.name || '-'}</p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-foreground">Monto Inicial:</span>
                  <span className="text-sm font-medium">${viewingCut.initialAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground">Total Ventas:</span>
                  <span className="text-sm font-medium">${viewingCut.totalSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground">Total Pagos:</span>
                  <span className="text-sm font-medium">${viewingCut.totalPayments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Monto Esperado:</span>
                  <span className="text-sm font-medium">${viewingCut.expectedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Monto Final:</span>
                  <span className="text-sm font-medium">${viewingCut.finalAmount.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between pt-2 border-t ${getDifferenceColor(viewingCut.difference)}`}>
                  <span className="text-sm font-bold">Diferencia:</span>
                  <span className="text-sm font-bold">${viewingCut.difference.toLocaleString()}</span>
                </div>
              </div>

              {viewingCut.salesByMethod && viewingCut.salesByMethod.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Ventas por Método de Pago</label>
                  <div className="space-y-2">
                    {viewingCut.salesByMethod.map((item: { method: string; amount: number }, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.method}:</span>
                        <span>${item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingCut.notes && (
                <div>
                  <label className="block text-sm font-medium text-foreground">Notas</label>
                  <p className="text-sm text-foreground mt-1">{viewingCut.notes}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingCut(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


