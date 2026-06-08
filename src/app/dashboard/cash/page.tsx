"use client";

import React, { useState, type ReactElement } from "react";
import {
  useCashRegisters,
  useCashCuts,
  useCashCut,
  useCreateCashCut,
  useOpenCashSession,
  useCreateCashRegister,
  useDeleteCashRegister,
  useUpdateCashCut,
  CashCut,
  CashRegister,
} from "../../../lib/hooks/useCash";
import { useBranches } from "../../../lib/hooks/useBranches";
import { useAuthStore } from "../../../stores/auth";
import { useToast } from "../../../hooks/use-toast";

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

const IconLock = ({ className }: { className?: string }) => (
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
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

const IconChevronDown = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className || "w-4 h-4"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const IconChevronRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className || "w-4 h-4"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA_DEBITO: "Tarjeta Débito",
  TARJETA_CREDITO: "Tarjeta Crédito",
  TRANSFERENCIA: "Transferencia",
  CHEQUE: "Cheque",
  OTRO: "Otro",
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  EFECTIVO: "bg-green-100 text-green-700",
  TARJETA_DEBITO: "bg-blue-100 text-blue-700",
  TARJETA_CREDITO: "bg-purple-100 text-purple-700",
  TRANSFERENCIA: "bg-orange-100 text-orange-700",
  CHEQUE: "bg-gray-100 text-gray-700",
  OTRO: "bg-gray-100 text-gray-600",
};

const StatusBadge = ({ status }: { status: "OPEN" | "CLOSED" }) => {
  if (status === "OPEN") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Abierta
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Cerrada
    </span>
  );
};

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5];

export default function CashPage(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
  const [isCreateRegisterModalOpen, setIsCreateRegisterModalOpen] =
    useState(false);
  const [viewingCutId, setViewingCutId] = useState<number | null>(null);
  const [salesExpanded, setSalesExpanded] = useState(false);
  const [isDenominationsExpanded, setIsDenominationsExpanded] = useState(false);
  const [expandedSaleIds, setExpandedSaleIds] = useState<Set<number>>(new Set());
  const [isEditing, setIsEditing] = useState(false);

  const { data: viewingCutData, isLoading: isLoadingCut } = useCashCut(viewingCutId ?? 0);
  const viewingCut = viewingCutId ? viewingCutData : null;

  const { data: branches } = useBranches();
  const branchId =
    user?.branchId ||
    (Array.isArray(branches) && branches.length > 0 ? branches[0].id : 1);

  const { data: registers } = useCashRegisters(branchId);
  const [selectedRegisterId, setSelectedRegisterId] = useState<
    number | undefined
  >(undefined);

  const { data: cutsData, isLoading } = useCashCuts({
    branchId,
    cashRegisterId: selectedRegisterId,
    page,
    pageSize: 20,
  });

  const createCashCut = useCreateCashCut();
  const openCashSession = useOpenCashSession();
  const createCashRegister = useCreateCashRegister();
  const deleteCashRegister = useDeleteCashRegister();
  const updateCashCut = useUpdateCashCut();

  const cuts: CashCut[] = Array.isArray((cutsData as any)?.data)
    ? (cutsData as any).data
    : [];
  const registersArray: CashRegister[] = Array.isArray(registers)
    ? registers
    : [];

  // Form state
  const [cutForm, setCutForm] = useState<{
    cashRegisterId: number;
    declaredAmount: string | number;
    notes: string;
    denominations: Record<string, number>;
  }>({
    cashRegisterId: 0,
    declaredAmount: "0.00",
    notes: "",
    denominations: {},
  });

  const [openForm, setOpenForm] = useState<{
    cashRegisterId: number;
    initialAmount: string | number;
    notes: string;
  }>({
    cashRegisterId: 0,
    initialAmount: "0.00",
    notes: "",
  });

  const [registerForm, setRegisterForm] = useState({ name: "" });

  const { toast } = useToast();

  const [closingCut, setClosingCut] = useState<CashCut | null>(null);

  // Open close modal pre-loaded with the register from the row action
  const handleOpenCloseModal = (cut: CashCut) => {
    setClosingCut(cut);
    setCutForm({
      cashRegisterId: cut.cashRegisterId,
      declaredAmount: "0.00",
      notes: "",
      denominations: {},
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateCut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cutForm.cashRegisterId) {
      toast({
        variant: "destructive",
        title: "Caja requerida",
        description: "Por favor, selecciona una caja.",
      });
      return;
    }

    try {
      await createCashCut.mutateAsync({
        branchId,
        cashRegisterId: cutForm.cashRegisterId,
        date: new Date().toISOString(),
        declaredAmount: parseFloat(cutForm.declaredAmount.toString()),
        notes: cutForm.notes,
        denominations: Object.keys(cutForm.denominations).length > 0 ? cutForm.denominations : undefined,
      });
      setIsCreateModalOpen(false);
      setCutForm({ cashRegisterId: 0, declaredAmount: "0.00", notes: "", denominations: {} });
      toast({
        variant: "success",
        title: "Corte realizado",
        description: "Caja cerrada exitosamente.",
      });
    } catch (error: any) {
      console.error("Error al crear el corte de caja:", error);
      toast({
        variant: "destructive",
        title: "Error al registrar",
        description:
          error?.message || "Hubo un error al registrar el corte de caja.",
      });
    }
  };

  const handleEditClick = () => {
    if (viewingCut) {
      setClosingCut(viewingCut);
      setCutForm({
        cashRegisterId: viewingCut.cashRegisterId,
        declaredAmount: viewingCut.declaredAmount !== undefined ? viewingCut.declaredAmount : (viewingCut.finalAmount || "0.00"),
        notes: viewingCut.notes || "",
        denominations: viewingCut.denominations || {},
      });
      setIsEditing(true);
      setIsDenominationsExpanded(!!viewingCut.denominations && Object.keys(viewingCut.denominations).length > 0);
      setViewingCutId(null);
      setIsCreateModalOpen(true);
    }
  };

  const handleUpdateCut = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // In edit mode we are editing closingCut which was stored when handleEditClick was called
      const editId = closingCut?.id;
      if (!editId) return;
      
      await updateCashCut.mutateAsync({
        id: editId,
        data: {
          declaredAmount: parseFloat(cutForm.declaredAmount.toString()),
          notes: cutForm.notes,
          denominations: Object.keys(cutForm.denominations).length > 0 ? cutForm.denominations : undefined,
        }
      });
      setIsCreateModalOpen(false);
      setIsEditing(false);
      toast({
        variant: "success",
        title: "Corte actualizado",
        description: "El corte de caja ha sido actualizado exitosamente.",
      });
    } catch (error: any) {
      console.error("Error al actualizar el corte:", error);
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error?.message || "Hubo un error al actualizar el corte.",
      });
    }
  };

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openForm.cashRegisterId) {
      toast({
        variant: "destructive",
        title: "Caja requerida",
        description: "Por favor, selecciona una caja.",
      });
      return;
    }

    try {
      await openCashSession.mutateAsync({
        branchId,
        cashRegisterId: openForm.cashRegisterId,
        date: new Date().toISOString(),
        initialAmount: parseFloat(openForm.initialAmount.toString() || "0"),
        notes: openForm.notes,
      });
      setIsOpenSessionModalOpen(false);
      setOpenForm({ cashRegisterId: 0, initialAmount: "0.00", notes: "" });
      toast({
        variant: "success",
        title: "Caja Abierta",
        description: "Sesión de caja iniciada exitosamente.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al abrir",
        description: error?.message || "Hubo un error al abrir la caja.",
      });
    }
  };

  const handleCreateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name.trim()) {
      alert("Ingresa un nombre para la caja");
      return;
    }

    try {
      await createCashRegister.mutateAsync({
        branchId,
        name: registerForm.name.trim(),
      });
      setIsCreateRegisterModalOpen(false);
      setRegisterForm({ name: "" });
    } catch (error) {
      console.error("Error al crear la caja:", error);
      alert("Error al crear la caja. Por favor, intenta nuevamente.");
    }
  };

  const handleAmountChange = (
    setter: (v: string) => void,
    value: string,
    currentValue: string
  ) => {
    if (!/^\d*\.?\d*$/.test(value)) return;

    let newValue = value;

    if (currentValue === "0.00" && value !== "0.00") {
      if (value.startsWith("0.00") && value.length > 4) {
        newValue = value.substring(4);
      }
    }

    if (currentValue === "0.00" && value.length > 4) {
      newValue = value.replace("0.00", "");
    }

    if (newValue.length > 1 && newValue.startsWith("0") && newValue[1] !== ".") {
      newValue = newValue.replace(/^0+/, "");
    }

    setter(newValue);
  };

  const handleAmountBlur = (
    value: string,
    setter: (v: string) => void
  ) => {
    if (value !== "") {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        setter(num.toFixed(2));
      } else {
        setter("0.00");
      }
    } else {
      setter("0.00");
    }
  };

  const handleDenominationChange = (den: number, count: string) => {
    const numCount = parseInt(count) || 0;
    const newDenominations = { ...cutForm.denominations, [den.toString()]: numCount };
    if (numCount === 0) {
      delete newDenominations[den.toString()];
    }
    
    // Calculate new total
    let newTotal = 0;
    for (const [d, c] of Object.entries(newDenominations)) {
      newTotal += parseFloat(d) * c;
    }
    
    setCutForm({
      ...cutForm,
      denominations: newDenominations,
      declaredAmount: newTotal > 0 ? newTotal.toFixed(2) : "0.00",
    });
  };

  const getDifferenceColor = (diff: number) => {
    if (diff === 0) return "text-green-600";
    if (diff > 0) return "text-primary";
    return "text-red-600";
  };

  const pagination = (cutsData as any)?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Caja y Cortes</h1>
          <p className="text-muted-foreground">
            Gestiona los cortes de caja diarios
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setRegisterForm({ name: "" });
              setIsCreateRegisterModalOpen(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
          >
            + Agregar Caja
          </button>
          <button
            onClick={() => {
              setOpenForm({ cashRegisterId: registersArray[0]?.id || 0, initialAmount: "0.00", notes: "" });
              setIsOpenSessionModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Abrir Caja
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card p-4 rounded-lg shadow">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Caja
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedRegisterId ?? ""}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const val = e.target.value;
                  setSelectedRegisterId(val === "" ? undefined : parseInt(val));
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-border rounded-md"
              >
                <option value="">Todas las cajas</option>
                {registersArray.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {reg.name}
                  </option>
                ))}
              </select>
              {selectedRegisterId && (
                <button
                  onClick={async () => {
                    if (confirm("¿Estás seguro de que deseas eliminar esta caja?")) {
                      try {
                        await deleteCashRegister.mutateAsync(selectedRegisterId);
                        setSelectedRegisterId(undefined);
                        toast({ variant: "success", title: "Caja eliminada" });
                      } catch (error: any) {
                        toast({ variant: "destructive", title: "Error", description: error?.message || "No se pudo eliminar la caja" });
                      }
                    }
                  }}
                  className="px-3 py-2 text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-md"
                  title="Eliminar caja seleccionada"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Cortes */}
      <div className="bg-card rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Caja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Inicial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Ventas (Total)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Esperado (Efectivo)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Contado (Efectivo)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Diferencia
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
                    colSpan={9}
                    className="px-6 py-4 text-center text-muted-foreground"
                  >
                    Cargando...
                  </td>
                </tr>
              ) : cuts.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-4 text-center text-muted-foreground"
                  >
                    No hay cortes registrados
                  </td>
                </tr>
              ) : (
                cuts.map((cut: CashCut) => (
                  <tr
                    key={cut.id}
                    className={`hover:bg-muted transition-colors ${cut.status === "OPEN" ? "bg-green-50/30" : ""}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={cut.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(cut.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {cut.cashRegister?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      ${(cut.initialAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      ${(cut.totalIncome || cut.totalSales || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {cut.status === "OPEN" ? (
                        <span className="text-muted-foreground italic text-xs">En curso...</span>
                      ) : (
                        `$${(cut.expectedAmount || 0).toLocaleString()}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {cut.status === "OPEN" ? (
                        <span className="text-muted-foreground italic text-xs">—</span>
                      ) : (
                        `$${(cut.finalAmount || 0).toLocaleString()}`
                      )}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        cut.status === "OPEN"
                          ? "text-muted-foreground"
                          : getDifferenceColor(cut.difference)
                      }`}
                    >
                      {cut.status === "OPEN"
                        ? "—"
                        : `$${(cut.difference || 0).toLocaleString()}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {cut.status === "OPEN" && (
                          <button
                            onClick={() => handleOpenCloseModal(cut)}
                            title="Cerrar caja"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                          >
                            <IconLock className="w-3.5 h-3.5" />
                            Cerrar
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setViewingCutId(cut.id);
                            setSalesExpanded(false);
                            setExpandedSaleIds(new Set());
                          }}
                          className="text-primary hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <IconView />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-muted"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-muted"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Agregar Caja */}
      {isCreateRegisterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Agregar Nueva Caja</h2>
            <form onSubmit={handleCreateRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nombre de la Caja
                </label>
                <input
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterForm({ name: e.target.value })
                  }
                  placeholder="Ej: Caja Principal"
                  className="w-full px-3 py-2 border border-border rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateRegisterModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createCashRegister.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {createCashRegister.isPending ? "Guardando..." : "Agregar Caja"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Abrir Caja */}
      {isOpenSessionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-1">Abrir Caja</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Registra el fondo inicial de efectivo para la sesión.
            </p>
            <form onSubmit={handleOpenSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Caja
                </label>
                <select
                  required
                  value={openForm.cashRegisterId}
                  onChange={(e) =>
                    setOpenForm({ ...openForm, cashRegisterId: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md"
                >
                  <option value={0}>Seleccionar caja...</option>
                  {registersArray.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Fondo Inicial (Efectivo)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <input
                    type="text"
                    required
                    value={openForm.initialAmount}
                    onChange={(e) =>
                      handleAmountChange(
                        (v) => setOpenForm({ ...openForm, initialAmount: v }),
                        e.target.value,
                        openForm.initialAmount.toString()
                      )
                    }
                    onBlur={() =>
                      handleAmountBlur(
                        openForm.initialAmount.toString(),
                        (v) => setOpenForm({ ...openForm, initialAmount: v })
                      )
                    }
                    onFocus={(e) => e.target.select()}
                    className="w-full pl-7 pr-3 py-2 border border-border rounded-md font-bold text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={openForm.notes}
                  onChange={(e) => setOpenForm({ ...openForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-md"
                  placeholder="Observaciones al abrir..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpenSessionModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={openCashSession.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {openCashSession.isPending ? "Abriendo..." : "Abrir Caja"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cerrar / Editar Caja */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-1">{isEditing ? "Editar Corte de Caja" : "Cerrar Caja"}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {isEditing 
                ? "Edita la información del corte de caja ya cerrado. Los subtotales se recalcularán automáticamente." 
                : "Ingresa el efectivo que contaste físicamente en caja. Los demás montos (tarjeta, transferencia) se calcularán automáticamente desde las ventas registradas."}
            </p>
            <form onSubmit={isEditing ? handleUpdateCut : handleCreateCut} className="space-y-4">
              {/* Caja — read-only, pre-filled from row action */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Caja
                </label>
                <select
                  required
                  value={cutForm.cashRegisterId}
                  disabled={isEditing}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setCutForm({ ...cutForm, cashRegisterId: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-muted disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value={0}>Seleccionar caja...</option>
                  {registersArray.map((reg: CashRegister) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Only cash input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Efectivo Contado en Caja
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <input
                    type="text"
                    required
                    value={cutForm.declaredAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleAmountChange(
                        (v) => setCutForm({ ...cutForm, declaredAmount: v }),
                        e.target.value,
                        cutForm.declaredAmount.toString()
                      )
                    }
                    onBlur={() =>
                      handleAmountBlur(
                        cutForm.declaredAmount.toString(),
                        (v) => setCutForm({ ...cutForm, declaredAmount: v })
                      )
                    }
                    onFocus={(e) => e.target.select()}
                    className="w-full pl-7 pr-3 py-2 border border-border rounded-md font-bold text-2xl"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Denomination Breakdown */}
              <div className="border border-border rounded-lg overflow-hidden mt-4">
                <button
                  type="button"
                  onClick={() => setIsDenominationsExpanded(!isDenominationsExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Desglose por denominación (Opcional)
                  </span>
                  {isDenominationsExpanded ? (
                    <IconChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <IconChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {isDenominationsExpanded && (
                  <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3 bg-card border-t border-border">
                    {DENOMINATIONS.map((den) => (
                      <div key={den} className="flex items-center justify-between">
                        <label className="text-sm text-foreground w-16">
                          ${den >= 1 ? den : den.toFixed(2)}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={cutForm.denominations[den.toString()] || ""}
                          onChange={(e) => handleDenominationChange(den, e.target.value)}
                          className="w-20 px-2 py-1 text-sm border border-border rounded-md text-right"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expected amounts summary */}
              {closingCut && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-900 shadow-sm">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Montos Esperados (Cálculo automático)
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex justify-between font-bold text-base bg-white/60 px-2 py-1 rounded">
                      <span>Efectivo:</span>
                      <span>${(Number(closingCut.initialAmount || 0) + Number(closingCut.salesCash || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-blue-800/80 px-2 py-1">
                      <span>T. Débito:</span>
                      <span className="font-medium">${Number(closingCut.salesDebitCard || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-blue-800/80 px-2 py-1">
                      <span>T. Crédito:</span>
                      <span className="font-medium">${Number(closingCut.salesCreditCard || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-blue-800/80 px-2 py-1">
                      <span>Transf.:</span>
                      <span className="font-medium">${Number(closingCut.salesTransfer || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={cutForm.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCutForm({ ...cutForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md"
                  placeholder="Observaciones sobre sobrantes/faltantes..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEditing ? updateCashCut.isPending : createCashCut.isPending}
                  className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                    isEditing ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isEditing 
                    ? (updateCashCut.isPending ? "Guardando..." : "Guardar Cambios") 
                    : (createCashCut.isPending ? "Guardando..." : "Cerrar Caja")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      {viewingCutId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-card rounded-lg p-6 w-full max-w-3xl my-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {isLoadingCut
                  ? "Cargando..."
                  : viewingCut?.status === "OPEN"
                  ? "Sesión en Curso"
                  : "Detalles del Corte"}
              </h2>
              <div className="flex items-center gap-3">
                {viewingCut?.status === "CLOSED" && (
                  <button
                    onClick={handleEditClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Editar
                  </button>
                )}
                {viewingCut && <StatusBadge status={viewingCut.status} />}
              </div>
            </div>

            {isLoadingCut ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : viewingCut ? (
              <div className="space-y-4">
                {/* Info básica */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Fecha</label>
                    <p className="text-sm text-foreground">{new Date(viewingCut.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Caja</label>
                    <p className="text-sm text-foreground">{viewingCut.cashRegister?.name || "-"}</p>
                  </div>
                </div>

                {/* Resumen financiero */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Resumen de Ingresos</p>
                  {[
                    { label: "Fondo Inicial", value: viewingCut.initialAmount || 0 },
                    { label: "Ventas en Efectivo", value: viewingCut.salesCash || 0 },
                    { label: "Ventas con Tarjeta Débito", value: viewingCut.salesDebitCard || 0 },
                    { label: "Ventas con Tarjeta Crédito", value: viewingCut.salesCreditCard || 0 },
                    { label: "Ventas por Transferencia", value: viewingCut.salesTransfer || 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-sm text-foreground">{label}:</span>
                      <span className="text-sm font-medium">${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}

                  {viewingCut.status === "CLOSED" && (
                    <>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">Efectivo Esperado (Sistema):</span>
                          <span className="text-sm font-bold">${Number(viewingCut.expectedAmount || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm font-bold">Efectivo Contado (Real):</span>
                          <span className="text-sm font-bold">${Number(viewingCut.declaredAmount || viewingCut.finalAmount || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className={`flex justify-between pt-2 border-t ${getDifferenceColor(viewingCut.difference)}`}>
                        <span className="text-sm font-bold">Diferencia:</span>
                        <span className="text-sm font-bold">${Number(viewingCut.difference || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Desglose de denominaciones */}
                {viewingCut.denominations && Object.keys(viewingCut.denominations).length > 0 && (
                  <div className="bg-muted p-4 rounded-lg space-y-2 mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Desglose de Denominaciones</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      {Object.entries(viewingCut.denominations)
                        .sort(([a], [b]) => Number(b) - Number(a))
                        .map(([den, count]) => (
                          <div key={den} className="flex justify-between border-b border-border/50 pb-1">
                            <span className="text-sm text-foreground">${Number(den) >= 1 ? Number(den) : Number(den).toFixed(2)} x {count}</span>
                            <span className="text-sm font-medium">${(Number(den) * Number(count)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Desglose de ventas — collapsible */}
                {viewingCut.sales && viewingCut.sales.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    {/* Accordion header */}
                    <button
                      type="button"
                      onClick={() => setSalesExpanded((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">Desglose de Ventas</span>
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {viewingCut.sales.length}
                        </span>
                      </div>
                      {salesExpanded ? (
                        <IconChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <IconChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Accordion body */}
                    {salesExpanded && (
                      <div className="max-h-96 overflow-y-auto divide-y divide-border">
                        {(viewingCut.sales as any[]).map((sale) => {
                          const isExpanded = expandedSaleIds.has(sale.id);
                          const toggleSale = () =>
                            setExpandedSaleIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(sale.id)) next.delete(sale.id);
                              else next.add(sale.id);
                              return next;
                            });

                          return (
                            <div key={sale.id}>
                              {/* Sale row */}
                              <button
                                type="button"
                                onClick={toggleSale}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left"
                              >
                                <span className="mt-0.5 text-muted-foreground flex-shrink-0">
                                  {isExpanded ? (
                                    <IconChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <IconChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground">{sale.folio}</span>
                                    {sale.customer && (
                                      <span className="text-xs text-muted-foreground truncate">{sale.customer.name}</span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(sale.payments || []).map((p: any, i: number) => (
                                      <span
                                        key={i}
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${PAYMENT_METHOD_COLORS[p.method] || "bg-gray-100 text-gray-600"}`}
                                      >
                                        {PAYMENT_METHOD_LABELS[p.method] || p.method}: ${Number(p.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-bold text-foreground">${Number(sale.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(sale.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</p>
                                </div>
                              </button>

                              {/* Expanded: line items */}
                              {isExpanded && sale.lines && sale.lines.length > 0 && (
                                <div className="bg-muted/40 px-4 pb-3">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-muted-foreground border-b border-border">
                                        <th className="text-left py-1.5 font-medium">Producto</th>
                                        <th className="text-center py-1.5 font-medium w-12">Cant.</th>
                                        <th className="text-right py-1.5 font-medium">Precio</th>
                                        <th className="text-right py-1.5 font-medium">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                      {(sale.lines as any[]).map((line) => (
                                        <tr key={line.id} className="text-foreground">
                                          <td className="py-1.5 pr-2">
                                            <span className="font-medium">
                                              {line.variant?.product?.name || line.description}
                                            </span>
                                            {line.variant?.name && (
                                              <span className="text-muted-foreground ml-1">— {line.variant.name}</span>
                                            )}
                                          </td>
                                          <td className="py-1.5 text-center">{line.qty}</td>
                                          <td className="py-1.5 text-right">${Number(line.unitPrice).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                          <td className="py-1.5 text-right font-medium">${Number(line.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {viewingCut.sales && viewingCut.sales.length === 0 && (
                  <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                    No hay ventas registradas en este corte.
                  </div>
                )}

                {viewingCut.notes && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Notas</label>
                    <p className="text-sm text-foreground mt-1">{viewingCut.notes}</p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-6 flex justify-between items-center">
              {viewingCut?.status === "OPEN" && (
                <button
                  onClick={() => {
                    setViewingCutId(null);
                    handleOpenCloseModal(viewingCut);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                >
                  <IconLock className="w-4 h-4" />
                  Cerrar Caja
                </button>
              )}
              <button
                onClick={() => setViewingCutId(null)}
                className="ml-auto px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
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
