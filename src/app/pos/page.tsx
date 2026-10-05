"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/auth";
import { hasPermission, getDefaultRoute } from "../../lib/permissions";
import { useCashRegisterSale } from "../../lib/hooks/useCashRegisterSale";
import { CashRegister } from "../dashboard/sales/_components/CashRegister";
import { ViewSaleModal } from "../dashboard/sales/_components/ViewSaleModal";

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

/**
 * Standalone, chrome-less point-of-sale window. Meant to be opened via
 * window.open() from the Ventas page (see "Abrir en ventana nueva"), so a
 * cashier can run several independent POS windows side by side. Each window
 * has its own cart state (no global store), but all windows share the same
 * auth session automatically through the persisted auth store (localStorage).
 */
export default function PosPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (user === null && token === null) {
      router.replace("/login");
    }
  }, [user, token, router]);

  useEffect(() => {
    if (user && !hasPermission(user.role, "canManageSales")) {
      router.replace(getDefaultRoute(user.role));
    }
  }, [user, router]);

  const {
    cashRegisterForm,
    setCashRegisterForm,
    stockItems,
    users,
    customers,
    tickets,
    isPaying,
    handlePay,
    handleCancel,
    handleCreateCustomer,
    viewingSale,
    setViewingSale,
  } = useCashRegisterSale();

  if ((token && !user) || (user === null && token === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user && !hasPermission(user.role, "canManageSales")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <CashRegister
        isOpen={true}
        form={cashRegisterForm}
        stockItems={stockItems}
        users={users}
        customers={customers}
        tickets={tickets}
        isPaying={isPaying}
        onFormChange={setCashRegisterForm}
        onPay={handlePay}
        onCancel={handleCancel}
        onCreateCustomer={handleCreateCustomer}
      />

      {viewingSale && (
        <ViewSaleModal
          sale={viewingSale}
          onClose={() => setViewingSale(null)}
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  );
}
