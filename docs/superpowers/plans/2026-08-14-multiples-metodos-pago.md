# Múltiples métodos de pago al dividir Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir agregar más de 2 métodos de pago al dividir un cobro en el PDV (`CashRegister.tsx`), sin tope de filas, con la última fila siempre absorbiendo el monto restante.

**Architecture:** Cambio 100% frontend en `celhm-app-main`. Se extraen dos funciones puras nuevas a `utils.ts` (mismo archivo que ya alberga `calculateCashRegisterTotal` y hermanas) y se usan desde `CashRegister.tsx` para reemplazar la lógica hardcodeada de "exactamente 2 pagos" por una regla general de N pagos. El backend no se toca — ya soporta arreglos de pagos de cualquier longitud (verificado en el spec).

**Tech Stack:** Next.js 15 / React, TypeScript, Jest + Testing Library (para los helpers puros nuevos).

## Global Constraints

- No hay cambios de backend — `POST /sales` ya soporta `payments[]` de cualquier longitud.
- Sin tope de filas de pago (decisión del spec: "sin límite").
- La última fila de `form.payments` siempre actúa como "resto": se recalcula como `max(0, total - suma(las demás filas))` cada vez que se edita el monto de cualquier fila que no sea la última.
- Editar el monto de la última fila directamente no dispara recálculo de ninguna otra fila.
- Al quedar 1 sola fila (tras eliminar), su monto se fija al total completo — comportamiento ya existente, no cambia.
- El método por defecto de una fila nueva es el primero de `PAYMENT_METHOD_OPTIONS` (`EFECTIVO`, `TARJETA_DEBITO`, `TARJETA_CREDITO`, `TRANSFERENCIA`, `CHEQUE`, `OTRO`) que no esté ya en uso en `form.payments`; si los 6 ya están en uso, se repite `OTRO`.
- No se impide seleccionar el mismo método de pago en dos filas distintas.
- `CashRegister.tsx` no tiene archivo de test existente (verificado); se sigue el patrón del repo para este archivo: verificar con `pnpm typecheck` y prueba manual en `pnpm dev`. Las funciones puras nuevas en `utils.ts` sí llevan tests unitarios (`utils.test.ts`, archivo nuevo — `utils.ts` tampoco tenía tests hasta ahora).
- Montos se redondean a 2 decimales con `parseFloat(x.toFixed(2))`, igual que el patrón ya usado en el archivo (línea 613 actual).

---

## File Structure

- **Modify:** `src/app/dashboard/sales/_components/utils.ts` — agrega `PAYMENT_METHOD_OPTIONS`, `getNextAvailablePaymentMethod`, `rebalanceLastPayment`.
- **Create:** `src/app/dashboard/sales/_components/utils.test.ts` — tests unitarios de los dos helpers nuevos.
- **Modify:** `src/app/dashboard/sales/_components/CashRegister.tsx` — usa los helpers nuevos en el botón de agregar método, en el `onChange` de monto, y en el botón de eliminar fila; agrega scroll al contenedor de filas.

---

### Task 1: Helpers puros de pagos en `utils.ts`

**Files:**
- Modify: `src/app/dashboard/sales/_components/utils.ts`
- Test: `src/app/dashboard/sales/_components/utils.test.ts` (nuevo)

**Interfaces:**
- Produces:
  - `PAYMENT_METHOD_OPTIONS: PaymentMethod[]` — lista ordenada de los 6 métodos, exportada.
  - `getNextAvailablePaymentMethod(payments: PaymentEntry[]): PaymentMethod` — primer método de `PAYMENT_METHOD_OPTIONS` no usado en `payments`; `'OTRO'` si los 6 están en uso.
  - `rebalanceLastPayment(payments: PaymentEntry[], total: number): PaymentEntry[]` — arreglo nuevo (inmutable) donde la última entrada tiene `amount = max(0, round2(total - suma(amount de las demás)))`; las demás entradas quedan igual. Si `payments.length <= 1`, devuelve `payments` sin cambios.
  - `type PaymentEntry = { method: PaymentMethod; amount: number }` (alias interno, no necesita exportarse fuera de `utils.ts` salvo que el test lo importe).

- [ ] **Step 1: Escribir los tests que fallan**

Crear `src/app/dashboard/sales/_components/utils.test.ts`:

```typescript
import { getNextAvailablePaymentMethod, rebalanceLastPayment, PAYMENT_METHOD_OPTIONS } from './utils'
import { PaymentMethod } from '../../../../lib/hooks/useSales'

describe('PAYMENT_METHOD_OPTIONS', () => {
  it('lists all 6 payment methods in the fixed UI order', () => {
    expect(PAYMENT_METHOD_OPTIONS).toEqual([
      'EFECTIVO',
      'TARJETA_DEBITO',
      'TARJETA_CREDITO',
      'TRANSFERENCIA',
      'CHEQUE',
      'OTRO',
    ])
  })
})

describe('getNextAvailablePaymentMethod', () => {
  it('returns the first method not already used', () => {
    const payments = [{ method: 'EFECTIVO' as PaymentMethod, amount: 100 }]
    expect(getNextAvailablePaymentMethod(payments)).toBe('TARJETA_DEBITO')
  })

  it('skips every method already present, in any order', () => {
    const payments = [
      { method: 'TARJETA_DEBITO' as PaymentMethod, amount: 50 },
      { method: 'EFECTIVO' as PaymentMethod, amount: 50 },
    ]
    expect(getNextAvailablePaymentMethod(payments)).toBe('TARJETA_CREDITO')
  })

  it('falls back to OTRO when all 6 methods are already used', () => {
    const payments: { method: PaymentMethod; amount: number }[] = [
      { method: 'EFECTIVO', amount: 1 },
      { method: 'TARJETA_DEBITO', amount: 1 },
      { method: 'TARJETA_CREDITO', amount: 1 },
      { method: 'TRANSFERENCIA', amount: 1 },
      { method: 'CHEQUE', amount: 1 },
      { method: 'OTRO', amount: 1 },
    ]
    expect(getNextAvailablePaymentMethod(payments)).toBe('OTRO')
  })
})

describe('rebalanceLastPayment', () => {
  it('sets the last row to total minus the sum of every other row', () => {
    const payments = [
      { method: 'EFECTIVO' as PaymentMethod, amount: 20 },
      { method: 'TARJETA_DEBITO' as PaymentMethod, amount: 40 },
      { method: 'TRANSFERENCIA' as PaymentMethod, amount: 0 },
    ]
    const result = rebalanceLastPayment(payments, 100)
    expect(result).toEqual([
      { method: 'EFECTIVO', amount: 20 },
      { method: 'TARJETA_DEBITO', amount: 40 },
      { method: 'TRANSFERENCIA', amount: 40 },
    ])
  })

  it('floors the last row at 0 when the other rows already exceed the total', () => {
    const payments = [
      { method: 'EFECTIVO' as PaymentMethod, amount: 70 },
      { method: 'TARJETA_DEBITO' as PaymentMethod, amount: 50 },
      { method: 'TRANSFERENCIA' as PaymentMethod, amount: 0 },
    ]
    const result = rebalanceLastPayment(payments, 100)
    expect(result[2].amount).toBe(0)
  })

  it('rounds the recalculated amount to 2 decimals', () => {
    const payments = [
      { method: 'EFECTIVO' as PaymentMethod, amount: 33.33 },
      { method: 'TARJETA_DEBITO' as PaymentMethod, amount: 0 },
    ]
    const result = rebalanceLastPayment(payments, 100)
    expect(result[1].amount).toBe(66.67)
  })

  it('does not mutate the input array', () => {
    const payments = [
      { method: 'EFECTIVO' as PaymentMethod, amount: 20 },
      { method: 'TARJETA_DEBITO' as PaymentMethod, amount: 0 },
    ]
    const original = payments.map((p) => ({ ...p }))
    rebalanceLastPayment(payments, 100)
    expect(payments).toEqual(original)
  })

  it('returns the array unchanged when there is only one payment', () => {
    const payments = [{ method: 'EFECTIVO' as PaymentMethod, amount: 55 }]
    expect(rebalanceLastPayment(payments, 100)).toEqual(payments)
  })
})
```

- [ ] **Step 2: Correr los tests y confirmar que fallan**

Run: `pnpm test utils.test.ts`
Expected: FAIL — `getNextAvailablePaymentMethod`, `rebalanceLastPayment` y `PAYMENT_METHOD_OPTIONS` no existen todavía en `utils.ts`.

- [ ] **Step 3: Implementar los helpers**

Agregar al final de `src/app/dashboard/sales/_components/utils.ts` (después de `calculateTotalPieces`):

```typescript
import { PaymentMethod } from '../../../../lib/hooks/useSales'

type PaymentEntry = { method: PaymentMethod; amount: number }

export const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  'EFECTIVO',
  'TARJETA_DEBITO',
  'TARJETA_CREDITO',
  'TRANSFERENCIA',
  'CHEQUE',
  'OTRO',
]

export const getNextAvailablePaymentMethod = (payments: PaymentEntry[]): PaymentMethod => {
  const usedMethods = new Set(payments.map((p) => p.method))
  const available = PAYMENT_METHOD_OPTIONS.find((method) => !usedMethods.has(method))
  return available ?? 'OTRO'
}

export const rebalanceLastPayment = (payments: PaymentEntry[], total: number): PaymentEntry[] => {
  if (payments.length <= 1) return payments

  const lastIndex = payments.length - 1
  const sumOfOthers = payments
    .slice(0, lastIndex)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const lastAmount = parseFloat(Math.max(0, total - sumOfOthers).toFixed(2))

  return payments.map((p, i) => (i === lastIndex ? { ...p, amount: lastAmount } : p))
}
```

Nota: agregar el `import { PaymentMethod } ... }` junto a los imports existentes en la línea 1 del archivo, no repetido a mitad de archivo.

- [ ] **Step 4: Correr los tests y confirmar que pasan**

Run: `pnpm test utils.test.ts`
Expected: PASS — los 3 describe blocks (`PAYMENT_METHOD_OPTIONS`, `getNextAvailablePaymentMethod`, `rebalanceLastPayment`) en verde.

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: sin errores nuevos.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/sales/_components/utils.ts src/app/dashboard/sales/_components/utils.test.ts
git commit -m "feat: agrega helpers puros para balancear N metodos de pago"
```

---

### Task 2: Botón "+ Dividir pago" / "+ Agregar método" sin tope de filas

**Files:**
- Modify: `src/app/dashboard/sales/_components/CashRegister.tsx:1` (imports), `:559-577` (botón)

**Interfaces:**
- Consumes: `getNextAvailablePaymentMethod(payments: PaymentEntry[]): PaymentMethod` y `rebalanceLastPayment(payments: PaymentEntry[], total: number): PaymentEntry[]` de Task 1 (`./utils`).

- [ ] **Step 1: Importar los helpers nuevos**

En `CashRegister.tsx`, el bloque de imports (línea 13-19) ya trae varias funciones de `./utils`:

```typescript
import {
  calculateCashRegisterSubtotal,
  calculateCashRegisterDiscount,
  calculateCashRegisterIVA,
  calculateCashRegisterTotal,
  calculateTotalPieces,
} from "./utils";
```

Reemplazar por:

```typescript
import {
  calculateCashRegisterSubtotal,
  calculateCashRegisterDiscount,
  calculateCashRegisterIVA,
  calculateCashRegisterTotal,
  calculateTotalPieces,
  getNextAvailablePaymentMethod,
  rebalanceLastPayment,
} from "./utils";
```

- [ ] **Step 2: Quitar el tope de 2 filas y generalizar el botón**

Reemplazar el bloque actual (líneas 559-577):

```tsx
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
```

por:

```tsx
                        <button
                          type="button"
                          onClick={() => {
                            const total = calculateCashRegisterTotal(form);
                            const newMethod = getNextAvailablePaymentMethod(form.payments);

                            if (form.payments.length === 1) {
                              const currentTotal = form.payments[0].amount > 0 ? form.payments[0].amount : total;
                              onFormChange({
                                ...form,
                                payments: [
                                  { method: form.payments[0].method, amount: currentTotal },
                                  { method: newMethod, amount: 0 },
                                ],
                              });
                            } else {
                              const withNewRow = [...form.payments, { method: newMethod, amount: 0 }];
                              onFormChange({
                                ...form,
                                payments: rebalanceLastPayment(withNewRow, total),
                              });
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {form.payments.length === 1 ? "+ Dividir pago" : "+ Agregar método"}
                        </button>
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 4: Verificación manual**

Run: `pnpm dev`, abrir el PDV, agregar un producto, hacer clic en "+ Dividir pago" y confirmar:
- Aparecen 2 filas, la primera con el total y la segunda en $0 con un método distinto al de la primera.
- El texto del botón ahora dice "+ Agregar método".
- Un clic más agrega una 3ª fila en $0, con un método que no sea ni el de la fila 1 ni el de la fila 2.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/sales/_components/CashRegister.tsx
git commit -m "feat: permite agregar mas de 2 metodos de pago al dividir"
```

---

### Task 3: Recalcular la última fila al editar cualquier monto

**Files:**
- Modify: `src/app/dashboard/sales/_components/CashRegister.tsx:601-622` (aprox., el `onChange` del input de monto — la numeración pudo correrse ligeramente tras el Task 2, ubicar por el contenido del bloque)

**Interfaces:**
- Consumes: `rebalanceLastPayment` de Task 1 (ya importado en Task 2).

- [ ] **Step 1: Reemplazar el `onChange` hardcodeado a 2 filas**

Bloque actual:

```tsx
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
```

Reemplazar por:

```tsx
                                  onChange={(e) => {
                                    const newAmount = parseFloat(e.target.value) || 0;
                                    const editedPayments = form.payments.map((p, i) =>
                                      i === index ? { ...p, amount: newAmount } : p
                                    );

                                    const isLastRow = index === form.payments.length - 1;
                                    const total = calculateCashRegisterTotal({ ...form, payments: editedPayments });
                                    const newPayments = isLastRow
                                      ? editedPayments
                                      : rebalanceLastPayment(editedPayments, total);

                                    onFormChange({ ...form, payments: newPayments });
                                  }}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 3: Verificación manual**

Con 3 filas de pago y un total de, por ejemplo, $300:
- Editar la fila 1 a $100 → confirmar que la fila 3 (última) se ajusta sola para que la suma dé $300, y la fila 2 no se toca.
- Editar la fila 2 → confirmar que solo la fila 3 se ajusta.
- Editar la fila 3 (última) directamente → confirmar que las filas 1 y 2 no cambian.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/sales/_components/CashRegister.tsx
git commit -m "fix: recalcula la ultima fila de pago sin importar cuantas filas haya"
```

---

### Task 4: Eliminar fila con recálculo + scroll del contenedor

**Files:**
- Modify: `src/app/dashboard/sales/_components/CashRegister.tsx` (botón × de eliminar fila, aprox. líneas 623-635; contenedor de filas, aprox. línea 579)

**Interfaces:**
- Consumes: `rebalanceLastPayment` de Task 1.

- [ ] **Step 1: Generalizar el `onClick` de eliminar fila**

Bloque actual:

```tsx
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
```

Reemplazar por:

```tsx
                                <button
                                  type="button"
                                  onClick={() => {
                                    const remaining = form.payments.filter((_, i) => i !== index);
                                    const total = calculateCashRegisterTotal({ ...form, payments: remaining });
                                    const newPayments =
                                      remaining.length === 1
                                        ? [{ ...remaining[0], amount: total }]
                                        : rebalanceLastPayment(remaining, total);
                                    onFormChange({ ...form, payments: newPayments });
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                  title="Eliminar método"
                                >
```

- [ ] **Step 2: Agregar scroll al contenedor de filas**

Bloque actual (línea 579):

```tsx
                      <div className="space-y-2">
```

Reemplazar por:

```tsx
                      <div className="space-y-2 max-h-40 overflow-y-auto">
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Step 4: Verificación manual completa (flujo end-to-end)**

Run: `pnpm dev`, en el PDV:
1. Agregar productos por un total conocido (ej. $300). Dividir el pago, agregar un 3er y 4to método. Confirmar que la última fila siempre absorbe el restante al editar cualquiera de las anteriores (repetir la prueba manual de Task 3 ahora con 4 filas).
2. Eliminar una fila intermedia (no la última) y confirmar que la suma de las filas restantes sigue dando el total.
3. Eliminar filas hasta quedar 1 sola y confirmar que su monto se fija al total completo.
4. Con 3+ métodos de pago cuya suma cubre el total, dar clic en PAGAR (usar el modal de cobro en efectivo si alguna fila es `EFECTIVO`) y confirmar en el listado de Ventas que el detalle (`ViewSaleModal`) muestra todos los pagos correctamente y el estado queda `PAGADO`.
5. Confirmar que con más de ~4 filas el contenedor hace scroll interno en vez de desbordar el modal.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/sales/_components/CashRegister.tsx
git commit -m "feat: recalcula al eliminar filas de pago y agrega scroll al listado"
```

---

## Self-Review Notes

- **Cobertura del spec:** punto 1 (sin tope + texto de botón + método por defecto) → Task 2. Punto 2 (auto-cálculo generalizado) → Task 3. Punto 3 (eliminar fila) → Task 4 Step 1. Punto 4 (scroll) → Task 4 Step 2. Punto 5 (nada más se toca) → verificado en el spec, sin tarea de código porque no requiere cambios.
- **Placeholders:** ninguno — todos los steps traen código completo y comandos exactos.
- **Consistencia de tipos:** `PaymentEntry`, `getNextAvailablePaymentMethod` y `rebalanceLastPayment` se definen una sola vez en Task 1 y se consumen igual (mismos nombres y firmas) en Tasks 2-4.
