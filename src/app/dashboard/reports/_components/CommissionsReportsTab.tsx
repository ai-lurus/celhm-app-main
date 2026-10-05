"use client";

import { useState } from "react";
import {
  useCommissionsSalesReport,
  useExportCommissionsSalesReport,
  useSalesBySellerReport,
  useExportSalesBySellerReport,
  SalesBySellerDetailLevel,
} from "../../../../lib/hooks/useReports";
import { useUsers } from "../../../../lib/hooks/useUsers";

interface CommissionsReportsTabProps {
  branchId?: number;
}

const todayIso = () => new Date().toISOString().split("T")[0];
const thirtyDaysAgoIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
};

const commissionStatusLabel: Record<string, string> = {
  SIN_COMISION: "Sin comisión",
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  PAGADA: "Pagada",
};

const detailLevels: { value: SalesBySellerDetailLevel; label: string }[] = [
  { value: "TOTALS_BY_SELLER", label: "Solo totales por vendedor" },
  { value: "TOTALS_BY_DOCUMENT", label: "Totales por documento" },
  { value: "DOCUMENT_DETAILS", label: "Detalles de documento" },
  { value: "DOCUMENT_DETAILS_SERIAL", label: "Detalles y número de serie" },
];

function formatCurrency(value: number) {
  return `$${(value || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-MX");
}

export function CommissionsReportsTab({ branchId }: CommissionsReportsTabProps) {
  const [subTab, setSubTab] = useState<"commissions-sales" | "sales-by-seller">(
    "commissions-sales"
  );

  // --- Reporte: Ventas para comisiones ---
  const [commissionsSalesParams, setCommissionsSalesParams] = useState({
    startDate: thirtyDaysAgoIso(),
    endDate: todayIso(),
  });
  const { data: commissionsSalesReport, isLoading: commissionsSalesLoading } =
    useCommissionsSalesReport({ branchId, ...commissionsSalesParams });
  const exportCommissionsSales = useExportCommissionsSalesReport();

  // --- Reporte: Ventas por vendedor ---
  const { data: usersData } = useUsers();
  const users = Array.isArray(usersData) ? usersData : [];

  const [sellerParams, setSellerParams] = useState({
    sellerId: undefined as number | undefined,
    startDate: thirtyDaysAgoIso(),
    endDate: todayIso(),
    detailLevel: "TOTALS_BY_SELLER" as SalesBySellerDetailLevel,
  });
  const { data: sellerReport, isLoading: sellerLoading } = useSalesBySellerReport({
    branchId,
    ...sellerParams,
  });
  const exportSalesBySeller = useExportSalesBySellerReport();

  return (
    <div className="space-y-4">
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setSubTab("commissions-sales")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              subTab === "commissions-sales"
                ? "border-blue-500 text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            Ventas para comisiones
          </button>
          <button
            onClick={() => setSubTab("sales-by-seller")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              subTab === "sales-by-seller"
                ? "border-blue-500 text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            Ventas por vendedor
          </button>
        </nav>
      </div>

      {subTab === "commissions-sales" && (
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={commissionsSalesParams.startDate}
                  onChange={(e) =>
                    setCommissionsSalesParams({
                      ...commissionsSalesParams,
                      startDate: e.target.value,
                    })
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
                  value={commissionsSalesParams.endDate}
                  onChange={(e) =>
                    setCommissionsSalesParams({
                      ...commissionsSalesParams,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md"
                />
              </div>
              <div>
                <button
                  onClick={() =>
                    exportCommissionsSales.mutate({ branchId, ...commissionsSalesParams })
                  }
                  disabled={exportCommissionsSales.isPending}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-md"
                >
                  {exportCommissionsSales.isPending ? "Exportando..." : "Exportar CSV"}
                </button>
              </div>
            </div>
          </div>

          {commissionsSalesLoading ? (
            <div className="bg-card p-8 rounded-lg shadow text-center text-muted-foreground">
              Cargando...
            </div>
          ) : commissionsSalesReport ? (
            <div className="space-y-4">
              <div className="bg-card p-6 rounded-lg shadow">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-primary/10 p-4 rounded">
                    <div className="text-sm text-muted-foreground">Ventas</div>
                    <div className="text-2xl font-bold text-primary">
                      {commissionsSalesReport.salesCount}
                    </div>
                  </div>
                  <div className="bg-primary/10 p-4 rounded">
                    <div className="text-sm text-muted-foreground">Total Vendido</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(commissionsSalesReport.totalSales)}
                    </div>
                  </div>
                  <div className="bg-primary/10 p-4 rounded">
                    <div className="text-sm text-muted-foreground">
                      Total Comisiones
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(commissionsSalesReport.totalCommissions)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Folio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Sucursal</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Vendedor</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Comisión</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {commissionsSalesReport.rows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 text-center text-muted-foreground">
                            No hay ventas en el rango seleccionado
                          </td>
                        </tr>
                      ) : (
                        commissionsSalesReport.rows.map((row) => (
                          <tr key={row.saleId}>
                            <td className="px-4 py-2 text-sm">{row.folio}</td>
                            <td className="px-4 py-2 text-sm">{formatDate(row.date)}</td>
                            <td className="px-4 py-2 text-sm">{row.branch}</td>
                            <td className="px-4 py-2 text-sm">{row.seller}</td>
                            <td className="px-4 py-2 text-sm text-right">{formatCurrency(row.total)}</td>
                            <td className="px-4 py-2 text-sm text-right">{formatCurrency(row.commissionAmount)}</td>
                            <td className="px-4 py-2 text-sm">
                              {commissionStatusLabel[row.commissionStatus] || row.commissionStatus}
                            </td>
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
      )}

      {subTab === "sales-by-seller" && (
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-lg shadow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Vendedor
                </label>
                <select
                  value={sellerParams.sellerId ?? ""}
                  onChange={(e) =>
                    setSellerParams({
                      ...sellerParams,
                      sellerId: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md"
                >
                  <option value="">Todos</option>
                  {users.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user?.name || m.user?.email || `Usuario ${m.userId}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={sellerParams.startDate}
                  onChange={(e) =>
                    setSellerParams({ ...sellerParams, startDate: e.target.value })
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
                  value={sellerParams.endDate}
                  onChange={(e) =>
                    setSellerParams({ ...sellerParams, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md"
                />
              </div>
              <div>
                <button
                  onClick={() =>
                    exportSalesBySeller.mutate({ branchId, ...sellerParams })
                  }
                  disabled={exportSalesBySeller.isPending}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-md"
                >
                  {exportSalesBySeller.isPending ? "Exportando..." : "Exportar CSV"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nivel de detalle
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
                {detailLevels.map((level) => (
                  <label key={level.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="detailLevel"
                      checked={sellerParams.detailLevel === level.value}
                      onChange={() =>
                        setSellerParams({ ...sellerParams, detailLevel: level.value })
                      }
                    />
                    {level.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {sellerLoading ? (
            <div className="bg-card p-8 rounded-lg shadow text-center text-muted-foreground">
              Cargando...
            </div>
          ) : sellerReport ? (
            <div className="bg-card rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      {sellerReport.detailLevel === "TOTALS_BY_SELLER" && (
                        <>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Vendedor</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Num. Ventas</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                        </>
                      )}
                      {sellerReport.detailLevel === "TOTALS_BY_DOCUMENT" && (
                        <>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Folio</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Sucursal</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Vendedor</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                        </>
                      )}
                      {(sellerReport.detailLevel === "DOCUMENT_DETAILS" ||
                        sellerReport.detailLevel === "DOCUMENT_DETAILS_SERIAL") && (
                        <>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Folio</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Vendedor</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Descripción</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Cant</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                          {sellerReport.detailLevel === "DOCUMENT_DETAILS_SERIAL" && (
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Serie</th>
                          )}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {sellerReport.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-4 text-center text-muted-foreground"
                        >
                          No hay ventas en el rango seleccionado
                        </td>
                      </tr>
                    ) : sellerReport.detailLevel === "TOTALS_BY_SELLER" ? (
                      sellerReport.rows.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-sm">{row.seller}</td>
                          <td className="px-4 py-2 text-sm text-right">{row.salesCount}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(row.total)}</td>
                        </tr>
                      ))
                    ) : sellerReport.detailLevel === "TOTALS_BY_DOCUMENT" ? (
                      sellerReport.rows.map((row: any) => (
                        <tr key={row.saleId}>
                          <td className="px-4 py-2 text-sm">{row.folio}</td>
                          <td className="px-4 py-2 text-sm">{formatDate(row.date)}</td>
                          <td className="px-4 py-2 text-sm">{row.branch}</td>
                          <td className="px-4 py-2 text-sm">{row.seller}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(row.total)}</td>
                        </tr>
                      ))
                    ) : (
                      sellerReport.rows.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-sm">{row.folio}</td>
                          <td className="px-4 py-2 text-sm">{formatDate(row.date)}</td>
                          <td className="px-4 py-2 text-sm">{row.seller}</td>
                          <td className="px-4 py-2 text-sm">{row.description}</td>
                          <td className="px-4 py-2 text-sm text-right">{row.qty}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(row.total)}</td>
                          {sellerReport.detailLevel === "DOCUMENT_DETAILS_SERIAL" && (
                            <td className="px-4 py-2 text-sm">{row.serialNumber || "-"}</td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
