# Pending-Payment Checkbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an explicit "Dejar pendiente (fiado)" checkbox to the POS new-sale form so a cashier can intentionally save a sale unpaid, replacing the current unintentional "split payment before adding items" workaround.

**Architecture:** A new `isPending` boolean field on `CashRegisterForm` drives two UI changes in `CashRegister.tsx` (hide the payment-method block, skip the cash-received modal) and one logic change in `page.tsx`'s `handlePay` (send an empty `payments` array instead of computing amounts from the form). No backend changes — `POST /sales` already produces `status: PENDIENTE` when `payments` is empty or omitted.

**Tech Stack:** Next.js 15, TypeScript, React (no new dependencies).

## Global Constraints

- No backend changes — `celhm-api-main` is untouched by this plan.
- When `isPending` is `false` (the default), the form must behave exactly as it does today — zero behavior change for the existing paid-sale flow.
- No new test files — neither `CashRegister.tsx` nor `page.tsx` has an existing test file in this repo; verification is `pnpm typecheck` plus a manual browser check, matching the spec.

---

### Task 1: Add `isPending` to `CashRegisterForm`

**Files:**
- Modify: `src/app/dashboard/sales/_components/types.ts`

**Interfaces:**
- Produces: `CashRegisterForm.isPending: boolean` — read by Task 2 (CashRegister.tsx) and Task 3 (page.tsx's handlePay). Defaults to `false` in `createInitialCashRegisterForm`.

- [ ] **Step 1: Add the field**

In `src/app/dashboard/sales/_components/types.ts`, replace:

```typescript
export interface CashRegisterForm {
  date: string
  customerId: string
  customerName: string
  requestInvoice: boolean
  sellerId: string
  payments: { method: PaymentMethod; amount: number }[]
  lines: SaleLineItem[]
  discount: number
  discountPercent: boolean
  productSearch: string
  productDetails: string
  ticketDetails: string
  cashRegisterId?: number
  continuingFromSaleId?: number
}
```

with:

```typescript
export interface CashRegisterForm {
  date: string
  customerId: string
  customerName: string
  requestInvoice: boolean
  sellerId: string
  payments: { method: PaymentMethod; amount: number }[]
  lines: SaleLineItem[]
  discount: number
  discountPercent: boolean
  productSearch: string
  productDetails: string
  ticketDetails: string
  cashRegisterId?: number
  continuingFromSaleId?: number
  isPending: boolean
}
```

Then replace:

```typescript
export const createInitialCashRegisterForm = (sellerId: string = ''): CashRegisterForm => ({
  date: new Date().toISOString().split('T')[0],
  customerId: '',
  customerName: 'CLIENTE DE MOSTRADOR',
  requestInvoice: false,
  sellerId,
  cashRegisterId: undefined,
  payments: [{ method: 'EFECTIVO', amount: 0 }],
  lines: [],
  discount: 0,
  discountPercent: false,
  productSearch: '',
  productDetails: '',
  ticketDetails: '',
})
```

with:

```typescript
export const createInitialCashRegisterForm = (sellerId: string = ''): CashRegisterForm => ({
  date: new Date().toISOString().split('T')[0],
  customerId: '',
  customerName: 'CLIENTE DE MOSTRADOR',
  requestInvoice: false,
  sellerId,
  cashRegisterId: undefined,
  payments: [{ method: 'EFECTIVO', amount: 0 }],
  lines: [],
  discount: 0,
  discountPercent: false,
  productSearch: '',
  productDetails: '',
  ticketDetails: '',
  isPending: false,
})
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: exits 0. `isPending` isn't read anywhere yet (Tasks 2 and 3 do that), but TypeScript doesn't require a struct field to be consumed, only supplied — and `createInitialCashRegisterForm` already supplies it — so this passes cleanly at this point.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/sales/_components/types.ts
git commit -m "feat: add isPending field to CashRegisterForm"
```

---

### Task 2: Checkbox and conditional UI in `CashRegister.tsx`

**Files:**
- Modify: `src/app/dashboard/sales/_components/CashRegister.tsx`

**Interfaces:**
- Consumes: `CashRegisterForm.isPending` from Task 1
- Produces: when `form.isPending` is `true`, `handlePayClick` calls `onPay()` directly (skipping the cash-received modal) and the payment-method UI block is not rendered.

- [ ] **Step 1: Skip the cash-received modal when pending**

In `src/app/dashboard/sales/_components/CashRegister.tsx`, replace:

```typescript
  const handlePayClick = () => {
    if (hasCashPayment) {
      setCashReceived("");
      setShowCashModal(true);
    } else {
      onPay();
    }
  };
```

with:

```typescript
  const handlePayClick = () => {
    if (form.isPending) {
      onPay();
      return;
    }
    if (hasCashPayment) {
      setCashReceived("");
      setShowCashModal(true);
    } else {
      onPay();
    }
  };
```

- [ ] **Step 2: Add the checkbox and hide the payment-method block when checked**

In the same file, replace:

```typescript
                <div className="col-span-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Método(s) de Pago: *
                    </label>
                    {form.payments.length < 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const total = calculateCashRegisterTotal({ ...form, payments: form.payments }); // just use standard total
                          const currentTotal = form.payments[0].amount > 0 ? form.payments[0].amount : total;
                          onFormChange({ 
                            ...form, 
                            payments: [
                              { method: form.payments[0].method, amount: currentTotal }, 
                              { method: "TARJETA_DEBITO" as PaymentMethod, amount: 0 }
                            ] 
                          });
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Dividir pago
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {form.payments.map((payment, index) => (
                      <div key={index} className="flex items-center space-x-1">
                        <select
                          value={payment.method}
                          onChange={(e) => {
                            const newPayments = [...form.payments];
                            newPayments[index].method = e.target.value as PaymentMethod;
                            onFormChange({ ...form, payments: newPayments });
                          }}
                          className={`${form.payments.length > 1 ? 'w-1/2' : 'flex-1'} px-2 py-1 text-sm border border-gray-300 rounded-md bg-white`}
                        >
                          <option value="EFECTIVO">Efectivo</option>
                          <option value="TARJETA_DEBITO">Débito</option>
                          <option value="TARJETA_CREDITO">Crédito</option>
                          <option value="TRANSFERENCIA">Transf.</option>
                          <option value="CHEQUE">Cheque</option>
                          <option value="OTRO">Otro</option>
                        </select>
                        {form.payments.length > 1 && (
                          <div className="flex items-center space-x-1 flex-1">
                            <span className="text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={payment.amount || ''}
                              onChange={(e) => {
                                const newPayments = [...form.payments];
                                newPayments[index].amount = parseFloat(e.target.value) || 0;
                                
                                // Auto-calcular el otro monto
                                const total = calculateCashRegisterTotal({ ...form, payments: newPayments });
                                if (index === 0 && form.payments.length === 2 && total > 0) {
                                  newPayments[1].amount = parseFloat(Math.max(0, total - newPayments[0].amount).toFixed(2));
                                } else if (index === 1 && form.payments.length === 2 && total > 0) {
                                  newPayments[0].amount = parseFloat(Math.max(0, total - newPayments[1].amount).toFixed(2));
                                }
                                
                                onFormChange({ ...form, payments: newPayments });
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md bg-white"
                              placeholder="Monto"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newPayments = form.payments.filter((_, i) => i !== index);
                                // Ensure the remaining method has 0 amount or auto amounts since it's only one.
                                if (newPayments.length === 1) newPayments[0].amount = calculateCashRegisterTotal({ ...form, payments: newPayments });
                                onFormChange({ ...form, payments: newPayments });
                              }}
                              className="text-red-500 hover:text-red-700"
                              title="Eliminar método"
                            >
                              <svg className="w-4 h-4 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
```

with:

```typescript
                <div className="col-span-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      id="isPending"
                      checked={form.isPending}
                      onChange={(e) =>
                        onFormChange({ ...form, isPending: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <label htmlFor="isPending" className="text-sm font-medium text-gray-700">
                      Dejar pendiente (fiado)
                    </label>
                  </div>
                  {!form.isPending && (
                    <>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Método(s) de Pago: *
                        </label>
                        {form.payments.length < 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const total = calculateCashRegisterTotal({ ...form, payments: form.payments }); // just use standard total
                              const currentTotal = form.payments[0].amount > 0 ? form.payments[0].amount : total;
                              onFormChange({ 
                                ...form, 
                                payments: [
                                  { method: form.payments[0].method, amount: currentTotal }, 
                                  { method: "TARJETA_DEBITO" as PaymentMethod, amount: 0 }
                                ] 
                              });
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            + Dividir pago
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {form.payments.map((payment, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            <select
                              value={payment.method}
                              onChange={(e) => {
                                const newPayments = [...form.payments];
                                newPayments[index].method = e.target.value as PaymentMethod;
                                onFormChange({ ...form, payments: newPayments });
                              }}
                              className={`${form.payments.length > 1 ? 'w-1/2' : 'flex-1'} px-2 py-1 text-sm border border-gray-300 rounded-md bg-white`}
                            >
                              <option value="EFECTIVO">Efectivo</option>
                              <option value="TARJETA_DEBITO">Débito</option>
                              <option value="TARJETA_CREDITO">Crédito</option>
                              <option value="TRANSFERENCIA">Transf.</option>
                              <option value="CHEQUE">Cheque</option>
                              <option value="OTRO">Otro</option>
                            </select>
                            {form.payments.length > 1 && (
                              <div className="flex items-center space-x-1 flex-1">
                                <span className="text-gray-500 text-sm">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={payment.amount || ''}
                                  onChange={(e) => {
                                    const newPayments = [...form.payments];
                                    newPayments[index].amount = parseFloat(e.target.value) || 0;
                                    
                                    // Auto-calcular el otro monto
                                    const total = calculateCashRegisterTotal({ ...form, payments: newPayments });
                                    if (index === 0 && form.payments.length === 2 && total > 0) {
                                      newPayments[1].amount = parseFloat(Math.max(0, total - newPayments[0].amount).toFixed(2));
                                    } else if (index === 1 && form.payments.length === 2 && total > 0) {
                                      newPayments[0].amount = parseFloat(Math.max(0, total - newPayments[1].amount).toFixed(2));
                                    }
                                    
                                    onFormChange({ ...form, payments: newPayments });
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md bg-white"
                                  placeholder="Monto"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPayments = form.payments.filter((_, i) => i !== index);
                                    // Ensure the remaining method has 0 amount or auto amounts since it's only one.
                                    if (newPayments.length === 1) newPayments[0].amount = calculateCashRegisterTotal({ ...form, payments: newPayments });
                                    onFormChange({ ...form, payments: newPayments });
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                  title="Eliminar método"
                                >
                                  <svg className="w-4 h-4 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: exits 0

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/sales/_components/CashRegister.tsx
git commit -m "feat: add pending-payment checkbox to the POS new-sale form"
```

---

### Task 3: Respect `isPending` in `handlePay`

**Files:**
- Modify: `src/app/dashboard/sales/page.tsx`

**Interfaces:**
- Consumes: `cashRegisterForm.isPending` from Task 1

- [ ] **Step 1: Send an empty payments array when pending**

In `src/app/dashboard/sales/page.tsx`, replace:

```typescript
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
```

with:

```typescript
      // Calculate the final total to resolve payment amounts.
      // When there's only one payment method, its amount stays 0 in the form
      // (it's shown visually via calculateCashRegisterTotal but never written back).
      // We must fill it here so the sale gets marked PAGADO.
      const saleTotal = calculateCashRegisterTotal(cashRegisterForm);
      const resolvedPayments = cashRegisterForm.isPending
        ? []
        : cashRegisterForm.payments.map((p) => {
            // Single payment with no explicit amount → use the full total
            if (cashRegisterForm.payments.length === 1 && p.amount === 0) {
              return { method: p.method, amount: saleTotal };
            }
            return { method: p.method, amount: p.amount };
          }).filter(p => p.amount > 0);
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/sales/page.tsx
git commit -m "feat: send no payments when the pending checkbox is checked"
```

---

### Task 4: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev servers**

Run (from `celhm-app-main`): `pnpm dev`
Run (from `celhm-api-main`): `pnpm dev`

- [ ] **Step 2: Verify the paid flow is unchanged**

In the browser: Ventas → + Nueva Venta → select a customer → add a product → leave the checkbox unchecked → PAGAR with the default single EFECTIVO method. Confirm the sale is created with status `PAGADO` (check the Ventas table).

- [ ] **Step 3: Verify the new pending flow**

Ventas → + Nueva Venta → select a customer → check **"Dejar pendiente (fiado)"** (payment-method UI should disappear) → add a product → PAGAR. Confirm:
- No cash-received modal appears.
- The sale is created with status `PENDIENTE` in the Ventas table.

- [ ] **Step 4: Verify the pending-sales modal still triggers**

Start another new sale for the same customer used in Step 3. Confirm the "Documentos pendientes de este cliente" modal appears listing that sale (this is the feature built in the previous plan — confirms no regression).

## Spec coverage check

- Checkbox "Dejar pendiente (fiado)", hides payment UI when checked → Task 2
- PAGAR skips the cash-received modal when pending → Task 2 Step 1
- `payments: []` sent when pending, regardless of form.payments → Task 3
- No backend changes → confirmed, no task touches `celhm-api-main`
- Unchecked behavior unchanged → Task 3's ternary preserves the exact prior logic when `isPending` is `false`; Task 4 Step 2 verifies this manually
