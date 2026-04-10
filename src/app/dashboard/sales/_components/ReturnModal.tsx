"use client";

import { useState, useEffect } from "react";
import { Sale, SaleLine, PaymentMethod } from "../../../../lib/hooks/useSales";
import { useCashRegisters } from "../../../../lib/hooks/useCash";
import { useAuthStore } from "../../../../stores/auth";

interface ReturnLine {
  saleLineId: number;
  description: string;
  maxQty: number;
  unitPrice: number;
  selected: boolean;
  qty: number;
}

interface ReturnModalProps {
  sale: Sale;
  onClose: () => void;
  onConfirm: (data: {
    cashRegisterId: number;
    refundMethod: PaymentMethod;
    lines: { saleLineId: number; qty: number }[];
  }) => Promise<void>;
  isPending?: boolean;
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  TARJETA_DEBITO: "Tarjeta Débito",
  TARJETA_CREDITO: "Tarjeta Crédito",
  TRANSFERENCIA: "Transferencia",
  CHEQUE: "Cheque",
  OTRO: "Otro",
};

export function ReturnModal({
  sale,
  onClose,
  onConfirm,
  isPending = false,
}: ReturnModalProps) {
  const user = useAuthStore((state) => state.user);
  const { data: cashRegisters = [] } = useCashRegisters(user?.branchId || 0);

  const [lines, setLines] = useState<ReturnLine[]>(
    sale.lines
      .filter((l: SaleLine) => (l.qty || 0) > 0)
      .map((l: SaleLine) => ({
        saleLineId: l.id,
        description: l.description,
        maxQty: l.qty,
        unitPrice: Math.abs(Number(l.unitPrice)),
        selected: false,
        qty: l.qty,
      }))
  );

  const [cashRegisterId, setCashRegisterId] = useState<number | undefined>(undefined);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>("EFECTIVO");

  // Set the first cash register once the async list loads
  useEffect(() => {
    if (cashRegisters.length > 0 && cashRegisterId === undefined) {
      setCashRegisterId(cashRegisters[0].id);
    }
  }, [cashRegisters, cashRegisterId]);

  const toggleLine = (idx: number) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, selected: !l.selected } : l))
    );
  };

  const updateQty = (idx: number, qty: number) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const safe = Math.max(1, Math.min(qty, l.maxQty));
        return { ...l, qty: safe };
      })
    );
  };

  const selectedLines = lines.filter((l) => l.selected);
  const refundTotal = selectedLines.reduce(
    (sum, l) => sum + l.unitPrice * l.qty,
    0
  );

  const handleConfirm = async () => {
    if (selectedLines.length === 0 || !cashRegisterId) return;
    await onConfirm({
      cashRegisterId,
      refundMethod,
      lines: selectedLines.map((l) => ({ saleLineId: l.saleLineId, qty: l.qty })),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Devolución de Venta</h2>
              <p className="text-rose-100 text-sm">Folio original: {sale.folio}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-800">
              Selecciona los productos a devolver y ajusta la cantidad si es una devolución parcial.
              Se generará una nota de crédito con folio <strong>DEV-XXX</strong> y se repondrá el inventario.
            </p>
          </div>

          {/* Line items */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Productos de la venta
            </label>
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {lines.map((line, idx) => (
                <div
                  key={line.saleLineId}
                  className={`flex items-center gap-4 px-4 py-3 transition-colors cursor-pointer ${
                    line.selected ? "bg-rose-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => toggleLine(idx)}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      line.selected
                        ? "bg-rose-600 border-rose-600"
                        : "border-gray-300"
                    }`}
                  >
                    {line.selected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {line.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      ${line.unitPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })} c/u
                      · Max: {line.maxQty} pza{line.maxQty !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Qty input */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      disabled={!line.selected || line.qty <= 1}
                      onClick={() => updateQty(idx, line.qty - 1)}
                      className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={line.maxQty}
                      value={line.qty}
                      disabled={!line.selected}
                      onChange={(e) => updateQty(idx, parseInt(e.target.value) || 1)}
                      className="w-12 text-center border border-gray-200 rounded-md text-sm py-1 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <button
                      disabled={!line.selected || line.qty >= line.maxQty}
                      onClick={() => updateQty(idx, line.qty + 1)}
                      className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="w-24 text-right">
                    <p className={`text-sm font-semibold ${line.selected ? "text-rose-600" : "text-gray-400"}`}>
                      {line.selected
                        ? `-$${(line.unitPrice * line.qty).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                        : "-"
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cash register + totals row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Caja de reembolso
              </label>
              <select
                value={cashRegisterId || ""}
                onChange={(e) =>
                  setCashRegisterId(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Seleccionar caja...</option>
                {cashRegisters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Método de reembolso
              </label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                  <option key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Refund total */}
          {selectedLines.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-700">
                  {selectedLines.length} producto{selectedLines.length !== 1 ? "s" : ""} seleccionado{selectedLines.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-rose-500 mt-0.5">Se regresará en efectivo al cliente</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-rose-500 uppercase tracking-wide font-medium">Total a reembolsar</p>
                <p className="text-2xl font-bold text-rose-600">
                  -${refundTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending || selectedLines.length === 0 || !cashRegisterId}
            className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Procesando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Confirmar Devolución
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
