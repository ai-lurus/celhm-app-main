"use client";

import { useState } from "react";
import {
  useSales,
  useCreateSale,
  useCancelSale,
  Sale,
  CreateSaleLine,
} from "./useSales";
import { useToast } from "../../hooks/use-toast";
import { useCustomers, Customer, useCreateCustomer } from "./useCustomers";
import { useTickets } from "./useTickets";
import { useBranches } from "./useBranches";
import { useAuthStore } from "../../stores/auth";
import { useStock } from "./useStock";
import { useUsers } from "./useUsers";
import {
  CashRegisterForm,
  createInitialCashRegisterForm,
} from "../../app/dashboard/sales/_components/types";
import { calculateCashRegisterTotal } from "../../app/dashboard/sales/_components/utils";

/**
 * Encapsulates all the data-fetching and sale-creation logic that drives the
 * <CashRegister> component. Shared between the in-dashboard "Nueva Venta"
 * modal (sales/page.tsx) and the standalone popup POS route (/pos), so both
 * stay in sync and a cashier can open several independent instances (each
 * with its own cart) without any shared cart state between them.
 */
export function useCashRegisterSale(options?: {
  onSaleCreated?: (sale: Sale) => void | Promise<void>;
}) {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const { data: branches = [] } = useBranches();
  const branchId = user?.branchId || (branches.length > 0 ? branches[0].id : 1);

  const { data: customersData, refetch: refetchCustomers } = useCustomers({
    page: 1,
    pageSize: 100,
  });
  const { data: ticketsData } = useTickets({ page: 1, pageSize: 100 });
  const { data: stockData } = useStock({ page: 1, pageSize: 1000 });
  const { data: usersData } = useUsers();

  const createSale = useCreateSale();
  const cancelSale = useCancelSale();
  const createCustomer = useCreateCustomer();

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

  const [cashRegisterForm, setCashRegisterForm] = useState<CashRegisterForm>(
    () => createInitialCashRegisterForm(user?.id?.toString() || "")
  );
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

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
      if (cashRegisterForm.continuingFromSaleId) {
        await cancelSale.mutateAsync(cashRegisterForm.continuingFromSaleId);
        setCashRegisterForm((prev) => ({ ...prev, continuingFromSaleId: undefined }));
      }

      const lines: CreateSaleLine[] = cashRegisterForm.lines.map((line) => {
        if (line.code.startsWith("TICKET-")) {
          const ticketId = parseInt(line.code.replace("TICKET-", ""));
          return {
            ticketId,
            description: line.product,
            qty: Number(line.qty),
            unitPrice: Number(line.unitPrice),
            advance: Number(line.advance) || 0,
          };
        } else {
          return {
            variantId: line.variantId,
            description: line.product,
            qty: Number(line.qty),
            unitPrice: Number(line.unitPrice),
          };
        }
      });

      const saleTotal = calculateCashRegisterTotal(cashRegisterForm);
      const resolvedPayments = cashRegisterForm.isPending
        ? []
        : cashRegisterForm.payments
            .map((p) => {
              if (cashRegisterForm.payments.length === 1 && p.amount === 0) {
                return { method: p.method, amount: saleTotal };
              }
              return { method: p.method, amount: p.amount };
            })
            .filter((p) => p.amount > 0);

      const rootTicketId = lines.find((l) => l.ticketId)?.ticketId;

      const newSale = await createSale.mutateAsync({
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

      setViewingSale(newSale);
      setCashRegisterForm(createInitialCashRegisterForm(user?.id?.toString() || ""));

      toast({
        title: "Venta creada",
        description: "La venta se ha registrado exitosamente.",
      });

      await options?.onSaleCreated?.(newSale);
    } catch (error) {
      console.error("Error creating sale:", error);
      toast({
        variant: "destructive",
        title: "Error al crear venta",
        description: cashRegisterForm.continuingFromSaleId
          ? "La venta pendiente original fue cancelada, pero no se pudo crear la venta nueva. Verifica el carrito e intenta de nuevo."
          : "Por favor, intenta de nuevo.",
      });
    }
  };

  const handleCancel = () => {
    setCashRegisterForm(createInitialCashRegisterForm(user?.id?.toString() || ""));
  };

  const handleCreateCustomer = async (name: string, phone: string) => {
    try {
      await createCustomer.mutateAsync({ name, phone, branchId });
      await refetchCustomers();
      const newCustomer = customers.find(
        (c: Customer) => c.name === name && c.phone === phone
      );
      if (newCustomer) {
        setCashRegisterForm((prev) => ({
          ...prev,
          customerId: newCustomer.id.toString(),
          customerName: newCustomer.name,
        }));
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

  return {
    branchId,
    cashRegisterForm,
    setCashRegisterForm,
    stockItems,
    users,
    customers,
    tickets,
    isPaying: createSale.isPending,
    handlePay,
    handleCancel,
    handleCreateCustomer,
    viewingSale,
    setViewingSale,
  };
}
