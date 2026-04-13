"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, CheckCircle, Search, DollarSign, User as UserIcon } from "lucide-react";
import { 
  useCommissions, 
  useCommissionSummary, 
  useExportCommissions, 
  usePayCommission,
  CommissionStatus,
  Commission
} from "../../../lib/hooks/useCommissions";
import { useAuthStore } from "../../../stores/auth";
import { usePermissions } from "../../../lib/hooks/usePermissions";
import { useToast } from "../../../hooks/use-toast";
import { parseApiError } from "../../../lib/utils";

export default function CommissionsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { can } = usePermissions();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<CommissionStatus | "">("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Queries
  const { data: commissionsData, isLoading } = useCommissions({
    status: statusFilter === "" ? undefined : statusFilter,
    page,
    pageSize,
  });

  const { data: summaries, isLoading: isSummaryLoading } = useCommissionSummary();
  const exportMutation = useExportCommissions();
  const payMutation = usePayCommission();

  useEffect(() => {
    if (user && !can("canManageCommissions")) {
      toast({
        variant: "destructive",
        title: "Acceso denegado",
        description: "No tienes permisos para ver esta página.",
      });
      router.push("/dashboard");
    }
  }, [user, can, router]);

  if (!user || !can("canManageCommissions")) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800">Acceso Denegado</h2>
          <p className="text-red-600">No tienes permisos para ver esta página.</p>
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        status: statusFilter === "" ? undefined : statusFilter,
      });
      toast({
        variant: "success",
        title: "Exportación exitosa",
        description: "El archivo ha sido descargado.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: parseApiError(error, "Fallo al exportar comisiones"),
      });
    }
  };

  const handlePay = async (commission: Commission) => {
    if (!confirm(`¿Confirmas el pago de $${commission.amount} a ${commission.user.name || "Usuario"}?`)) {
      return;
    }
    
    try {
      await payMutation.mutateAsync(commission.id);
      toast({
        variant: "success",
        title: "Comisión pagada",
        description: "El pago ha sido registrado exitosamente.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al pagar",
        description: parseApiError(error, "Error al registrar el pago"),
      });
    }
  };

  const getStatusBadge = (status: CommissionStatus) => {
    switch (status) {
      case "PAGADA":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Pagada</span>;
      case "PENDIENTE":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pendiente</span>;
      case "CANCELADA":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Cancelada</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comisiones</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestionar y pagar comisiones de laboratorio
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exportMutation.isPending}
          className="bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 font-medium py-2 px-4 rounded-md transition-colors flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>{exportMutation.isPending ? "Exportando..." : "Exportar CSV"}</span>
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isSummaryLoading ? (
          <div className="col-span-full py-4 text-center text-gray-500">Cargando resumen...</div>
        ) : summaries && summaries.length > 0 ? (
          summaries.map((summary) => (
            <div key={summary.userId} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                  <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {summary.userName || summary.userEmail}
                </h3>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Pendiente ({summary.pendingCount}):</span>
                  <span className="font-bold text-yellow-600 dark:text-yellow-500">${Number(summary.pendingAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Pagado ({summary.paidCount}):</span>
                  <span className="font-medium text-green-600 dark:text-green-500">${Number(summary.paidAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Tasa actual:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {summary.commissionRate != null ? `${Number(summary.commissionRate).toFixed(1)}%` : "-"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
           <div className="col-span-full py-4 text-gray-500">No hay comisiones registradas.</div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estatus
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CommissionStatus | "")}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estatus</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PAGADA">Pagada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla detallada */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando registros...</div>
        ) : !commissionsData || commissionsData.data.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No se encontraron comisiones.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha / Folio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Venta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comisión</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estatus</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {commissionsData.data.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Ticket {commission.ticket.folio}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(commission.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{commission.user.name || commission.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">Venta: {commission.sale.folio}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Total: ${Number(commission.saleTotal).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">${Number(commission.amount).toFixed(2)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Tasa: {Number(commission.rate).toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(commission.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {commission.status === "PENDIENTE" && (
                        <button
                          onClick={() => handlePay(commission)}
                          title="Marcar como pagada"
                          className="inline-flex items-center space-x-1 p-2 rounded-md text-green-600 hover:bg-green-50 dark:text-green-500 dark:hover:bg-green-900/20 transition-colors"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-xs">Pagar</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {commissionsData && commissionsData.pagination.totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
               onClick={() => setPage((p) => Math.min(commissionsData.pagination.totalPages, p + 1))}
               disabled={page === commissionsData.pagination.totalPages}
               className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando página <span className="font-medium">{page}</span> de <span className="font-medium">{commissionsData.pagination.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Anterior</span>
                    &laquo;
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(commissionsData.pagination.totalPages, p + 1))}
                    disabled={page === commissionsData.pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Siguiente</span>
                    &raquo;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
