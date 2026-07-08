# Checkbox explícito "Dejar pendiente (fiado)" en el PDV

**Fecha:** 2026-07-08
**Repo afectado:** `celhm-app-main` (solo frontend, sin cambios de backend)

## Contexto / problema

Hoy la única forma de dejar una venta nueva en estado `PENDIENTE` (sin cobrar)
desde el PDV es un flujo no intencional: activar "+ Dividir pago" **antes**
de agregar productos al carrito (momento en que el total es $0, así que ambos
métodos quedan en $0), agregar los productos después, y dar PAGAR sin tocar
los montos. Si se activa "+ Dividir pago" después de agregar productos, el
primer método absorbe el total completo y la venta queda pagada — el
comportamiento depende del orden exacto de clics, sin ninguna señal en la UI
de que eso es lo que está pasando.

## Comportamiento esperado

1. Se agrega un checkbox **"Dejar pendiente (fiado)"** en el formulario de
   nueva venta (`CashRegister.tsx`), justo arriba de la sección
   "Método(s) de Pago: *".
2. Al marcarlo, todo el bloque de métodos de pago y montos (selects, "+
   Dividir pago", inputs de monto) se oculta — ya no aplica, porque no se va
   a cobrar nada en este momento.
3. Al hacer clic en **PAGAR** con el checkbox marcado:
   - No se abre el modal de "Cobro en Efectivo" (no hay nada que cobrar).
   - La venta se crea enviando `payments: []` al backend, sin importar
     cualquier valor que hubiera quedado en `form.payments` de antes.
   - El backend ya soporta esto sin cambios: `SalesService.create()` solo
     marca `PAGADO` si `payments.length > 0`; con arreglo vacío queda
     `PENDIENTE` (comportamiento existente, sin tocar).
4. Al desmarcar el checkbox, el formulario vuelve a comportarse exactamente
   como hoy (sin cambios de comportamiento cuando el checkbox está apagado).

## Fuera de alcance

- No se cubre el caso de abono parcial (pagar una parte y dejar el resto
  pendiente) — hoy `create()` marca `PAGADO` con cualquier `payments`
  no vacío sin verificar si cubre el total; ese es un problema aparte, no se
  toca en este cambio.
- No hay cambios de backend — el endpoint `POST /sales` ya soporta
  `payments: []` produciendo `status: PENDIENTE`.

## Componentes y archivos afectados

- `src/app/dashboard/sales/_components/types.ts`: nuevo campo
  `isPending: boolean` en `CashRegisterForm`, `false` por defecto en
  `createInitialCashRegisterForm`.
- `src/app/dashboard/sales/_components/CashRegister.tsx`: checkbox nuevo,
  oculta el bloque de métodos de pago cuando `form.isPending` es `true`,
  `handlePayClick` salta el modal de cobro en efectivo cuando
  `form.isPending` es `true`.
- `src/app/dashboard/sales/page.tsx`: en `handlePay`, si
  `cashRegisterForm.isPending` es `true`, se envía `payments: []` en vez de
  calcular `resolvedPayments` a partir del formulario.

## Testing

- No hay archivo de test existente para `CashRegister.tsx` ni `page.tsx`
  (verificado: no hay `.test.tsx` para ninguno de los dos); se sigue el
  patrón existente del repo y se verifica con `pnpm typecheck` y prueba
  manual en el navegador (correr `pnpm dev`, crear una venta con el
  checkbox marcado, confirmar en el listado de Ventas que queda en estado
  `PENDIENTE`).
