'use client'

import { useState } from 'react'
import { useSales, useCreateSale, useAddPayment, Sale, CreateSaleLine, PaymentMethod } from '../../../lib/hooks/useSales'
import { useToast } from '../../../hooks/use-toast'
import { useCustomers } from '../../../lib/hooks/useCustomers'
import { useTickets } from '../../../lib/hooks/useTickets'
import { useProducts } from '../../../lib/hooks/useCatalog'
import { useBranches } from '../../../lib/hooks/useBranches'
import { useAuthStore } from '../../../stores/auth'
import { useStock, InventoryItem } from '../../../lib/hooks/useStock'
import { useUsers, OrgMember } from '../../../lib/hooks/useUsers'
import {
  SalesTable,
  SalesPagination,
  CashRegister,
  CreateSaleModal,
  PaymentModal,
  ViewSaleModal,
  CashRegisterForm,
  createInitialCashRegisterForm,
  calculateCashRegisterDiscount,
  calculateCashRegisterTotal,
} from './_components'
import { useCreateCustomer } from '../../../lib/hooks/useCustomers'

export default function SalesPage() {
  const user = useAuthStore((state) => state.user)
  const [page, setPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [viewingSale, setViewingSale] = useState<Sale | null>(null)

  // Cash register state
  const [cashRegisterForm, setCashRegisterForm] = useState<CashRegisterForm>(
    createInitialCashRegisterForm(user?.id?.toString() || '')
  )

  const { data: branches = [] } = useBranches()
  const branchId = user?.branchId || (branches.length > 0 ? branches[0].id : 1)

  // API hooks
  const { toast } = useToast()
  const { data: salesData, isLoading } = useSales({ branchId, page, pageSize: 20 })
  const { data: customersData } = useCustomers({ page: 1, pageSize: 100 })
  const { data: ticketsData } = useTickets({ page: 1, pageSize: 100 })
  const { data: productsData } = useProducts({ page: 1, pageSize: 100 })
  const { data: stockData } = useStock({ sucursal: branchId, page: 1, pageSize: 1000 })
  const { data: usersData } = useUsers()

  const createSale = useCreateSale()
  const addPayment = useAddPayment()
  const createCustomer = useCreateCustomer()

  // Safely extract data, ensuring we never get error objects
  const sales = Array.isArray((salesData as any)?.data) ? (salesData as any).data : []
  const customers = Array.isArray((customersData as any)?.data) ? (customersData as any).data : []
  const tickets = Array.isArray((ticketsData as any)?.data) ? (ticketsData as any).data : []
  const products = Array.isArray((productsData as any)?.data) ? (productsData as any).data : []
  const stockItems: InventoryItem[] = Array.isArray((stockData as any)?.data) ? (stockData as any).data : []
  const users: OrgMember[] = Array.isArray(usersData) ? usersData : []

  // Ensure customers array doesn't contain error objects
  const safeCustomers = customers.filter((c: any) => {
    if (!c || typeof c !== 'object') return false
    // Reject objects that look like error objects
    if (c.message && c.error && c.statusCode) return false
    return true
  })

  // Form state for old modal
  const [saleForm, setSaleForm] = useState({
    customerId: '',
    ticketId: '',
    lines: [] as CreateSaleLine[],
    discount: 0,
  })

  const handleAddLine = () => {
    setSaleForm({
      ...saleForm,
      lines: [...saleForm.lines, { description: '', qty: 1, unitPrice: 0 }],
    })
  }

  const handleRemoveLine = (index: number) => {
    setSaleForm({
      ...saleForm,
      lines: saleForm.lines.filter((_, i) => i !== index),
    })
  }

  const handleUpdateLine = (index: number, field: keyof CreateSaleLine, value: any) => {
    const newLines = [...saleForm.lines]
    newLines[index] = { ...newLines[index], [field]: value }
    setSaleForm({ ...saleForm, lines: newLines })
  }

  const calculateSubtotal = () => {
    return saleForm.lines.reduce((sum, line) => {
      const unitPrice = Number(line.unitPrice) || 0
      const qty = Number(line.qty) || 0
      const discount = Number(line.discount) || 0
      return sum + (unitPrice * qty) - discount
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discount = Number(saleForm.discount) || 0
    return subtotal - discount
  }

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saleForm.lines.length === 0) {
      toast({
        variant: "destructive",
        title: "Venta vacía",
        description: "Agrega al menos una línea de venta.",
      })
      return
    }

    try {
      await createSale.mutateAsync({
        branchId,
        customerId: saleForm.customerId ? parseInt(saleForm.customerId) : undefined,
        ticketId: saleForm.ticketId ? parseInt(saleForm.ticketId) : undefined,
        lines: saleForm.lines,
        discount: saleForm.discount,
      })
      toast({
        variant: "success",
        title: "Venta creada",
        description: "La venta se ha registrado exitosamente.",
      })
      setIsCreateModalOpen(false)
      setSaleForm({ customerId: '', ticketId: '', lines: [], discount: 0 })
    } catch (error: any) {
      console.error('Error creating sale:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Error al crear la venta.",
      })
    }
  }

  const handleAddPaymentToSale = async (data: { amount: number; method: PaymentMethod; reference: string }) => {
    if (!selectedSale) return

    try {
      await addPayment.mutateAsync({
        saleId: selectedSale.id,
        data,
      })
      toast({
        variant: "success",
        title: "Pago registrado",
        description: "El pago se ha registrado correctamente.",
      })
      setIsPaymentModalOpen(false)
      setSelectedSale(null)
    } catch (error: any) {
      console.error('Error adding payment:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Error al registrar el pago.",
      })
    }
  }

  const handleCashRegisterPay = async () => {
    if (cashRegisterForm.lines.length === 0) {
      toast({
        variant: "destructive",
        title: "Venta vacía",
        description: "Agrega al menos un producto a la venta.",
      })
      return
    }

    try {
      const saleLines: CreateSaleLine[] = cashRegisterForm.lines.map(line => ({
        variantId: line.variantId,
        description: line.product,
        qty: line.qty,
        unitPrice: line.unitPrice,
      }))

      const discount = calculateCashRegisterDiscount(cashRegisterForm)

      const sale = await createSale.mutateAsync({
        branchId,
        customerId: cashRegisterForm.customerId ? parseInt(cashRegisterForm.customerId) : undefined,
        lines: saleLines,
        discount,
      })

      // Add payment
      await addPayment.mutateAsync({
        saleId: sale.id,
        data: {
          amount: calculateCashRegisterTotal(cashRegisterForm),
          method: cashRegisterForm.paymentMethod,
        },
      })

      toast({
        variant: "success",
        title: "Venta procesada",
        description: "La venta y el pago se han registrado correctamente.",
      })

      setIsCashRegisterOpen(false)
      setCashRegisterForm(createInitialCashRegisterForm(user?.id?.toString() || ''))
    } catch (error: any) {
      console.error('Error processing sale:', error)
      toast({
        variant: "destructive",
        title: "Error al procesar venta",
        description: error?.message || 'Error al procesar la venta',
      })
    }
  }

  const handleCashRegisterCancel = () => {
    setIsCashRegisterOpen(false)
    setCashRegisterForm(createInitialCashRegisterForm(user?.id?.toString() || ''))
  }

  const handleCreateCustomer = async (name: string, phone: string) => {
    // El CustomerSelector ya maneja la creación, esto es solo para refrescar la lista
    // Los datos se invalidan automáticamente por el hook
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ventas</h1>
          <p className="text-muted-foreground">Gestiona las ventas y pagos</p>
        </div>
        <button
          onClick={() => {
            setIsCashRegisterOpen(true)
            setCashRegisterForm(createInitialCashRegisterForm(user?.id?.toString() || ''))
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          Crear venta
        </button>
      </div>

      <SalesTable
        sales={sales}
        isLoading={isLoading}
        onViewSale={setViewingSale}
        onAddPayment={(sale) => {
          setSelectedSale(sale)
          setIsPaymentModalOpen(true)
        }}
        getStatusColor={getStatusColor}
      />

      {salesData && (salesData as any).pagination && (
        <SalesPagination
          page={page}
          totalPages={(salesData as any).pagination.totalPages}
          total={(salesData as any).pagination.total}
          pageSize={20}
          onPageChange={setPage}
        />
      )}

      <CreateSaleModal
        isOpen={isCreateModalOpen}
        form={saleForm}
        customers={safeCustomers}
        tickets={tickets}
        products={products}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSale}
        onFormChange={setSaleForm}
        onAddLine={handleAddLine}
        onRemoveLine={handleRemoveLine}
        onUpdateLine={handleUpdateLine}
        calculateSubtotal={calculateSubtotal}
        calculateTotal={calculateTotal}
        isPending={createSale.isPending}
      />

      {isPaymentModalOpen && selectedSale && (
        <PaymentModal
          sale={selectedSale}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setSelectedSale(null)
          }}
          onSubmit={handleAddPaymentToSale}
          isPending={addPayment.isPending}
        />
      )}

      {viewingSale && (
        <ViewSaleModal
          sale={viewingSale}
          onClose={() => setViewingSale(null)}
          getStatusColor={getStatusColor}
        />
      )}

      <CashRegister
        isOpen={isCashRegisterOpen}
        form={cashRegisterForm}
        stockItems={stockItems}
        users={users}
        customers={safeCustomers}
        tickets={tickets}
        onFormChange={setCashRegisterForm}
        onPay={handleCashRegisterPay}
        onCancel={handleCashRegisterCancel}
        onCreateCustomer={handleCreateCustomer}
      />
    </div>
  )
}
