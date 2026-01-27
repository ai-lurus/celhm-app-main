'use client'

import { useState, useEffect, useRef } from 'react'
import { Customer } from '../../../../lib/hooks/useCustomers'
import { useCreateCustomer } from '../../../../lib/hooks/useCustomers'

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
  const createCustomer = useCreateCustomer()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

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

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      alert('El nombre del cliente es requerido')
      return
    }
    if (!newCustomerPhone.trim()) {
      alert('El teléfono del cliente es requerido')
      return
    }

    try {
      const customer = await createCustomer.mutateAsync({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
      })
      await onCreateCustomer(newCustomerName.trim(), newCustomerPhone.trim())
      onSelect(customer.id.toString(), customer.name)
      setShowCreateModal(false)
      setNewCustomerName('')
      setNewCustomerPhone('')
      setIsOpen(false)
    } catch (error) {
      console.error('Error creating customer:', error)
      alert('Error al crear el cliente')
    }
  }

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : String(customerName || '')}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => {
              setIsOpen(true)
              setSearchTerm('')
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
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
              ) : searchTerm && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No se encontraron clientes
                </div>
              )}
              <button
                onClick={() => {
                  setIsOpen(false)
                  setShowCreateModal(true)
                }}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm text-blue-600 font-medium border-t"
              >
                + Crear nuevo cliente
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm whitespace-nowrap"
        >
          Crear Cliente
        </button>
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>

      {/* Modal Crear Cliente */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Crear Cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre: *
                </label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Nombre del cliente"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono: *
                </label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Número de teléfono"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewCustomerName('')
                    setNewCustomerPhone('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCustomer}
                  disabled={createCustomer.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createCustomer.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
