'use client'

import { useState, useEffect, useRef } from 'react'
import { Customer, useCreateCustomer } from '../../../../lib/hooks/useCustomers'
import { useToast } from '../../../../hooks/use-toast'

interface CustomerSelectorProps {
  customers: Customer[]
  value: string
  customerName: string
  onSelect: (customerId: string, customerName: string) => void
  onCreateCustomer: (name: string, phone: string) => Promise<void>
}

export function CustomerSelector({
  customers,
  value,
  customerName,
  onSelect,
  onCreateCustomer,
}: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerNotes, setNewCustomerNotes] = useState('')
  const createCustomer = useCreateCustomer()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Focus name field when modal opens
  useEffect(() => {
    if (showCreateModal) {
      setTimeout(() => nameInputRef.current?.focus(), 50)
    }
  }, [showCreateModal])

  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer.id.toString(), customer.name)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleSelectDefault = () => {
    onSelect('', 'CLIENTE DE MOSTRADOR')
    setIsOpen(false)
    setSearchTerm('')
  }

  const resetCreateForm = () => {
    setNewCustomerName('')
    setNewCustomerPhone('')
    setNewCustomerEmail('')
    setNewCustomerNotes('')
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    resetCreateForm()
  }

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast({ variant: 'destructive', title: 'Nombre requerido', description: 'El nombre del cliente es requerido.' })
      return
    }
    if (!newCustomerPhone.trim()) {
      toast({ variant: 'destructive', title: 'Teléfono requerido', description: 'El teléfono del cliente es requerido.' })
      return
    }
    if (!newCustomerEmail.trim()) {
      toast({ variant: 'destructive', title: 'Email requerido', description: 'El email del cliente es requerido.' })
      return
    }

    try {
      // mutateAsync returns the created customer directly — use it for auto-select
      const created = await createCustomer.mutateAsync({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        email: newCustomerEmail.trim() || undefined,
        notes: newCustomerNotes.trim() || undefined,
      })

      // Auto-select using the returned customer data
      // (useCreateCustomer.onSuccess already invalidates the customers query cache)
      onSelect(created.id.toString(), created.name)

      handleCloseCreateModal()
      setIsOpen(false)

      toast({ variant: 'success', title: 'Cliente creado', description: `${created.name} se ha registrado correctamente.` })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al crear', description: 'Hubo un error al crear el cliente.' })
    }
  }

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleCreateCustomer() }
    if (e.key === 'Escape') { handleCloseCreateModal() }
  }

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <div className="flex items-center space-x-2">
        {/* Search / Display input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : String(customerName || '')}
            onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true) }}
            onFocus={() => { setIsOpen(true); setSearchTerm('') }}
            className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            placeholder="CLIENTE DE MOSTRADOR"
          />
          {isOpen && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <button
                onClick={handleSelectDefault}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 text-sm font-medium ${!value ? 'bg-blue-50' : ''}`}
              >
                CLIENTE DE MOSTRADOR
              </button>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 text-sm ${value === customer.id.toString() ? 'bg-blue-50' : ''}`}
                  >
                    <div className="font-medium">{String(customer.name || '')}</div>
                    {customer.phone && (
                      <div className="text-xs text-gray-500">{String(customer.phone)}</div>
                    )}
                  </button>
                ))
              ) : searchTerm ? (
                <div className="px-4 py-2 text-sm text-gray-500">No se encontraron clientes</div>
              ) : null}
              <button
                onClick={() => { setIsOpen(false); setShowCreateModal(true) }}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm text-blue-600 font-medium border-t"
              >
                + Crear nuevo cliente
              </button>
            </div>
          )}
        </div>

        {/* Quick-create button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm whitespace-nowrap"
        >
          Crear Cliente
        </button>

        <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>

      {/* Quick-Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
          <div
            className="bg-card rounded-xl shadow-2xl w-full max-w-md"
            onKeyDown={handleModalKeyDown}
          >
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="text-lg font-bold">Nuevo Cliente</h2>
              </div>
              <button onClick={handleCloseCreateModal} className="text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-background text-foreground"
                  placeholder="Nombre completo del cliente"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-background text-foreground"
                  placeholder="Número de teléfono"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-background text-foreground"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Notas</label>
                <textarea
                  value={newCustomerNotes}
                  onChange={(e) => setNewCustomerNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-background text-foreground resize-none"
                  placeholder="Notas adicionales (opcional)"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateCustomer}
                disabled={createCustomer.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {createCustomer.isPending ? (
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16 8 8 0 01-8-8z" />
                    </svg>
                    <span>Guardando...</span>
                  </span>
                ) : 'Guardar y seleccionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
