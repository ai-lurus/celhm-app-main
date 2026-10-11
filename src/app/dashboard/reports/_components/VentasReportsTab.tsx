"use client";

import { useState } from "react";
import {
  useVentasPorVendedorReport,
  useExportVentasPorVendedorReport,
} from "../../../../lib/hooks/useReports";
import { PAYMENT_METHOD_LABELS } from "../../sales/_components/ReturnModal";

interface VentasReportsTabProps {
  branchId?: number;
}

const todayIso = () => new Date().toISOString().split("T")[0];
const thirtyDaysAgoIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
};

function formatCurrency(value: number) {
  return `$${(value || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-MX");
}

function paymentMethodLabel(method: string | null) {
  if (!method) return "-";
  if (method === "MIXTO") return "Mixto";
  return PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] || method;
}

export function VentasReportsTab({ branchId }: VentasReportsTabProps) {
  const [params, setParams] = useState({
    startDate: thirtyDaysAgoIso(),
    endDate: todayIso(),
  });
  const { data: report, isLoading } = useVentasPorVendedorReport({
    branchId,
    ...params,
  });
  const exportReport = useExportVentasPorVendedorReport();

  const totalCost = report?.totalCost ?? 0;
  const totalSales = report?.totalSales ?? 0;
  const utility = totalSales - totalCost;

  return (
    <div className="space-y-4">
      <div className="bg-card p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={params.startDate}
              onChange={(e) =>
                setParams({ ...params, startDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={params.endDate}
              onChange={(e) =>
                setParams({ ...params, endDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md"
            />
          </div>
          <div>
            <button
              onClick={() => exportReport.mutate({ branchId, ...params })}
              disabled={exportReport.isPending}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-md"
            >
              {exportReport.isPending ? "Exportando..." : "Exportar CSV"}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card p-8 rounded-lg shadow text-center text-muted-foreground">
          Cargando...
        </div>
      ) : report ? (
        <div className="space-y-4">
          <div className="bg-card p-6 rounded-lg shadow">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-primary/10 p-4 rounded">
                <div className="text-sm text-muted-foreground">Ventas</div>
                <div className="text-2xl font-bold text-primary">
                  {report.salesCount}
                </div>
              </div>
              <div className="bg-primary/10 p-4 rounded">
                <div className="text-sm text-muted-foreground">Total Vendido</div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totalSales)}
                </div>
              </div>
              <div className="bg-primary/10 p-4 rounded">
                <div className="text-sm text-muted-foreground">Costo Total</div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totalCost)}
                </div>
              </div>
              <div className="bg-primary/10 p-4 rounded">
                <div className="text-sm text-muted-foreground">Utilidad</div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(utility)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Vendedor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Folio</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Cliente</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Código</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Producto</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Cant</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Método de Pago</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Costo</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Precio</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Importe</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {report.rows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-4 text-center text-muted-foreground">
                        No hay ventas en el rango seleccionado
                      </td>
                    </tr>
                  ) : (
                    report.rows.map((row, idx) => (
                      <tr key={`${row.saleId}-${idx}`}>
                        <td className="px-4 py-2 text-sm">{row.seller}</td>
                        <td className="px-4 py-2 text-sm">{row.folio}</td>
                        <td className="px-4 py-2 text-sm">{formatDate(row.date)}</td>
                        <td className="px-4 py-2 text-sm">{row.customer}</td>
                        <td className="px-4 py-2 text-sm">{row.code || "-"}</td>
                        <td className="px-4 py-2 text-sm">{row.description}</td>
                        <td className="px-4 py-2 text-sm text-right">{row.qty}</td>
                        <td className="px-4 py-2 text-sm">{paymentMethodLabel(row.paymentMethod)}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(row.cost)}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(row.unitPrice)}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(row.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
