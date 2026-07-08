"use client";

import { Sale } from "../../../../lib/hooks/useSales";
import { PAYMENT_METHOD_LABELS } from "./ReturnModal";

interface SalesHistoryTabProps {
  sales: Sale[];
  isLoading: boolean;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onReprint: (sale: Sale) => void;
}

const formatPaymentMethods = (sale: Sale): string => {
  if (sale.payments.length === 0) return "-";
  const labels = sale.payments.map(
    (payment) => PAYMENT_METHOD_LABELS[payment.method] || payment.method
  );
  return Array.from(new Set(labels)).join(", ");
};

export function SalesHistoryTab({
  sales,
  isLoading,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReprint,
}: SalesHistoryTabProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gray-100 px-6 py-4 border-b flex items-end space-x-4">
        <div>
          <label htmlFor="history-start-date" className="block text-sm font-medium text-gray-700 mb-1">
            Desde:
          </label>
          <input
            id="history-start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          />
        </div>
        <div>
          <label htmlFor="history-end-date" className="block text-sm font-medium text-gray-700 mb-1">
            Hasta:
          </label>
          <input
            id="history-end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          />
        </div>
      </div>

      <div className="bg-blue-600 text-white px-6 py-2">
        <div className="grid grid-cols-6 gap-4 text-sm font-medium">
          <div>Folio</div>
          <div>Hora</div>
          <div className="col-span-2">Cliente</div>
          <div>Total</div>
          <div>Método de Pago</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Cargando...
          </div>
        ) : sales.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            No hay tickets en el rango seleccionado
          </div>
        ) : (
          <div className="divide-y">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="grid grid-cols-6 gap-4 px-6 py-3 hover:bg-gray-50 items-center"
              >
                <div className="text-sm text-gray-700">{sale.folio}</div>
                <div className="text-sm text-gray-700">
                  {new Date(sale.createdAt).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="col-span-2 text-sm text-gray-700 truncate">
                  {sale.customer?.name || "CLIENTE DE MOSTRADOR"}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  $
                  {(sale.total || 0).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {formatPaymentMethods(sale)}
                  </span>
                  <button
                    onClick={() => onReprint(sale)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 rounded px-2 py-1"
                  >
                    Reimprimir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
