"use client";

import { useState } from "react";
import {
  useSales,
  useCreateSale,
  useAddPayment,
  useCreateReturn,
  Sale,
  CreateSaleLine,
  PaymentMethod,
  SaleLine,
  Payment,
} from "../../../lib/hooks/useSales";
import { useToast } from "../../../hooks/use-toast";
import {
  useCustomers,
  Customer,
  useCreateCustomer,
} from "../../../lib/hooks/useCustomers";
import { useTickets } from "../../../lib/hooks/useTickets";
import { Ticket } from "@celhm/types";
import { useBranches } from "../../../lib/hooks/useBranches";
import { useAuthStore } from "../../../stores/auth";
import { useStock } from "../../../lib/hooks/useStock";
import { useUsers } from "../../../lib/hooks/useUsers";
import { CashRegister } from "./_components/CashRegister";
import {
  CashRegisterForm,
  createInitialCashRegisterForm,
} from "./_components/types";
import { calculateCashRegisterTotal } from "./_components/utils";
import { PaymentModal } from "./_components/PaymentModal";
import { ReturnModal } from "./_components/ReturnModal";

const IconView = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className || "w-5 h-5"}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export default function SalesPage() {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnSale, setReturnSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  const { data: branches = [] } = useBranches();
  const branchId = user?.branchId || (branches.length > 0 ? branches[0].id : 1);

  const {
    data: salesData,
    isLoading,
    refetch: refetchSales,
  } = useSales({ branchId, page, pageSize: 20 });
  const { data: customersData, refetch: refetchCustomers } = useCustomers({
    page: 1,
    pageSize: 100,
  });
  const { data: ticketsData } = useTickets({ page: 1, pageSize: 100 });
  const { data: stockData } = useStock({ page: 1, pageSize: 1000 });
  const { data: usersData } = useUsers();

  const createSale = useCreateSale();
  const addPayment = useAddPayment();
  const createReturn = useCreateReturn();
  const createCustomer = useCreateCustomer();

  const sales = Array.isArray((salesData as any)?.data)
    ? (salesData as any).data
    : [];
  const customers = Array.isArray((customersData as any)?.data)
    ? (customersData as any).data
    : [];
  const tickets = Array.isArray((ticketsData as any)?.data)
    ? (ticketsData as any).data
    : [];
  const stockItems = Array.isArray((stockData as any)?.data)
    ? (stockData as any).data
    : [];
  const users = Array.isArray(usersData) ? usersData : [];

  // Form state - usando CashRegisterForm
  const [cashRegisterForm, setCashRegisterForm] = useState<CashRegisterForm>(
    () => createInitialCashRegisterForm(user?.id?.toString() || "")
  );

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: "EFECTIVO" as PaymentMethod,
    reference: "",
  });

  const handlePay = async () => {
    if (cashRegisterForm.lines.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrito vacío",
        description: "Agrega al menos un producto o orden de reparación",
      });
      return;
    }

    if (!cashRegisterForm.cashRegisterId) {
      toast({
        variant: "destructive",
        title: "Caja no seleccionada",
        description: "Debes seleccionar una caja para realizar la venta",
      });
      return;
    }

    try {
      // Convertir CashRegisterForm a CreateSaleRequest
      const lines: CreateSaleLine[] = cashRegisterForm.lines.map((line) => {
        // Si es una orden de reparación (code empieza con TICKET-)
        if (line.code.startsWith("TICKET-")) {
          const ticketId = parseInt(line.code.replace("TICKET-", ""));
          return {
            ticketId,
            description: line.product,
            qty: Number(line.qty),
            unitPrice: Number(line.unitPrice),
          };
        } else {
          // Es un producto normal
          return {
            variantId: line.variantId,
            description: line.product,
            qty: Number(line.qty),
            unitPrice: Number(line.unitPrice),
          };
        }
      });

      // Calculate the final total to resolve payment amounts.
      // When there's only one payment method, its amount stays 0 in the form
      // (it's shown visually via calculateCashRegisterTotal but never written back).
      // We must fill it here so the sale gets marked PAGADO.
      const saleTotal = calculateCashRegisterTotal(cashRegisterForm);
      const resolvedPayments = cashRegisterForm.payments.map((p) => {
        // Single payment with no explicit amount → use the full total
        if (cashRegisterForm.payments.length === 1 && p.amount === 0) {
          return { method: p.method, amount: saleTotal };
        }
        return { method: p.method, amount: p.amount };
      }).filter(p => p.amount > 0);

      // Get the first ticketId if present in lines for root ticketId support
      const rootTicketId = lines.find(l => l.ticketId)?.ticketId;

      await createSale.mutateAsync({
        branchId,
        customerId: cashRegisterForm.customerId
          ? parseInt(cashRegisterForm.customerId)
          : undefined,
        ticketId: rootTicketId,
        lines,
        discount: cashRegisterForm.discount,
        payments: resolvedPayments,
        cashRegisterId: cashRegisterForm.cashRegisterId,
      });

      // El pago se manejó en la creación de la venta

      setIsCreateModalOpen(false);
      setCashRegisterForm(
        createInitialCashRegisterForm(user?.id?.toString() || "")
      );
      // Resetear a la página 1 para ver la nueva venta creada
      setPage(1);
      // Refrescar la lista de ventas para mostrar la nueva venta creada
      await refetchSales();
      toast({
        title: "Venta creada",
        description: "La venta se ha registrado exitosamente.",
      });
    } catch (error) {
      console.error("Error creating sale:", error);
      toast({
        variant: "destructive",
        title: "Error al crear venta",
        description: "Por favor, intenta de nuevo.",
      });
    }
  };

  const handleCancel = () => {
    setIsCreateModalOpen(false);
    setCashRegisterForm(
      createInitialCashRegisterForm(user?.id?.toString() || "")
    );
  };

  const handleCreateCustomer = async (name: string, phone: string) => {
    try {
      await createCustomer.mutateAsync({
        name,
        phone,
        branchId,
      });
      await refetchCustomers();
      // Buscar el cliente recién creado y seleccionarlo
      const newCustomer = customers.find(
        (c: Customer) => c.name === name && c.phone === phone
      );
      if (newCustomer) {
        setCashRegisterForm({
          ...cashRegisterForm,
          customerId: newCustomer.id.toString(),
          customerName: newCustomer.name,
        });
        toast({
          title: "Cliente creado",
          description: `Se ha registrado a ${name} exitosamente.`,
        });
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        variant: "destructive",
        title: "Error al crear cliente",
        description: "Por favor, intenta de nuevo.",
      });
    }
  };

  const handlePaymentSubmit = async (data: {
    amount: number;
    method: PaymentMethod;
    reference: string;
  }) => {
    if (!selectedSale) return;

    try {
      await addPayment.mutateAsync({
        saleId: selectedSale.id,
        data,
      });
      setIsPaymentModalOpen(false);
      setSelectedSale(null);
      await refetchSales();
    } catch (error) {
      console.error("Error adding payment:", error);
    }
  };

  const handleReturnConfirm = async (data: {
    cashRegisterId: number;
    refundMethod: PaymentMethod;
    lines: { saleLineId: number; qty: number }[];
  }) => {
    if (!returnSale) return;
    try {
      await createReturn.mutateAsync({ saleId: returnSale.id, data });
      setIsReturnModalOpen(false);
      setReturnSale(null);
      setPage(1);
      await refetchSales();
      toast({
        title: "Devolución registrada",
        description: "La devolución se ha procesado y el inventario fue repuesto.",
      });
    } catch (error: any) {
      console.error("Error creating return:", error);
      toast({
        variant: "destructive",
        title: "Error en devolución",
        description: error?.response?.data?.message || "Por favor, intenta de nuevo.",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAGADO":
        return "bg-green-100 text-green-800";
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELADO":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ventas</h1>
          <p className="text-muted-foreground">Gestiona las ventas y pagos</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          + Nueva Venta
        </button>
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-card rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Folio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Caja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Pagado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-muted-foreground"
                  >
                    Cargando...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-muted-foreground"
                  >
                    No hay ventas registradas
                  </td>
                </tr>
              ) : (
                sales.map((sale: Sale) => (
                  <tr key={sale.id} className={`hover:bg-muted ${sale.isReturn ? "bg-rose-50/40" : ""}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {sale.folio}
                        {sale.isReturn && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            DEV
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {sale.customer?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {sale.cashRegister?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <span className={sale.isReturn ? "text-rose-600 font-semibold" : ""}>
                        ${(sale.total || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      ${(sale.paidAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(sale.status)}`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setViewingSale(sale)}
                          className="text-primary hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <IconView />
                        </button>
                        {sale.status === "PAGADO" && !sale.isReturn && (
                          <button
                            onClick={() => {
                              setReturnSale(sale);
                              setIsReturnModalOpen(true);
                            }}
                            className="text-rose-600 hover:text-rose-800 text-sm font-medium flex items-center gap-1"
                            title="Hacer devolución"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Devolver
                          </button>
                        )}
                        {sale.status === "PENDIENTE" &&
                          sale.paidAmount < sale.total && (
                            <button
                              onClick={() => {
                                setSelectedSale(sale);
                                setIsPaymentModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-900 text-sm"
                            >
                              Agregar Pago
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
      </div>

      {/* Paginación */}
      {salesData && (salesData as any).pagination && (
        <div className="flex items-center justify-between px-4 py-3 bg-card border-t border-border">
          <div className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * 20 + 1} a{" "}
            {Math.min(page * 20, (salesData as any).pagination.total)} de{" "}
            {(salesData as any).pagination.total} ventas
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= (salesData as any).pagination.totalPages}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal Crear Venta - CashRegister */}
      <CashRegister
        isOpen={isCreateModalOpen}
        form={cashRegisterForm}
        stockItems={stockItems}
        users={users}
        customers={customers}
        tickets={tickets}
        isPaying={createSale.isPending}
        onFormChange={setCashRegisterForm}
        onPay={handlePay}
        onCancel={handleCancel}
        onCreateCustomer={handleCreateCustomer}
      />

      {/* Modal Agregar Pago */}
      {isPaymentModalOpen && selectedSale && (
        <PaymentModal
          sale={selectedSale}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedSale(null);
          }}
          onSubmit={handlePaymentSubmit}
          isPending={addPayment.isPending}
        />
      )}

      {/* Modal Devolución */}
      {isReturnModalOpen && returnSale && (
        <ReturnModal
          sale={returnSale}
          onClose={() => {
            setIsReturnModalOpen(false);
            setReturnSale(null);
          }}
          onConfirm={handleReturnConfirm}
          isPending={createReturn.isPending}
        />
      )}

      {/* Modal Ver Detalles */}
      {viewingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold mb-4">Detalles de Venta</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Folio
                  </label>
                  <p className="text-sm text-foreground">{viewingSale.folio}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Estado
                  </label>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(viewingSale.status)}`}
                  >
                    {viewingSale.status}
                  </span>
                </div>
              </div>
              {viewingSale.customer && (
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Cliente
                  </label>
                  <p className="text-sm text-foreground">
                    {viewingSale.customer.name}
                  </p>
                </div>
              )}
              {viewingSale.cashRegister && (
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Caja
                  </label>
                  <p className="text-sm text-foreground">
                    {viewingSale.cashRegister.code} -{" "}
                    {viewingSale.cashRegister.name}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Líneas de Venta
                </label>
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        Descripción
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        Cantidad
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        Precio
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {viewingSale.lines.map((line: SaleLine) => (
                      <tr key={line.id}>
                        <td className="px-4 py-2 text-sm">
                          {line.description}
                        </td>
                        <td className="px-4 py-2 text-sm">{line.qty}</td>
                        <td className="px-4 py-2 text-sm">
                          ${(line.unitPrice || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          ${(line.subtotal || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-muted p-4 rounded">
                <div className="flex justify-between">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold">
                    ${(viewingSale.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              {viewingSale.payments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Pagos
                  </label>
                  <div className="space-y-2">
                    {viewingSale.payments.map((payment: Payment) => (
                      <div
                        key={payment.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {payment.method} -{" "}
                          {payment.reference || "Sin referencia"}
                        </span>
                        <span>${(payment.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingSale(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
