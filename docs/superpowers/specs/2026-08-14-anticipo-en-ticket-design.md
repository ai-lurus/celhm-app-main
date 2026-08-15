# Mostrar anticipo en el ticket de venta

## Contexto

Cuando una venta incluye una o más líneas de orden de reparación (`TICKET-*`),
la orden puede traer un anticipo (`ticket.advancePayment`) pagado previamente
en el laboratorio. Hoy, `CashRegister.tsx` ya descuenta ese anticipo del monto
que se cobra en caja (`calculateCashRegisterTotal`), pero el ticket impreso de
la venta (`ViewSaleModal.tsx`) no muestra ese anticipo en ningún lado: solo
aparece el TOTAL completo y los pagos cobrados, sin explicar la diferencia.

## Fuera de alcance

- No se toca el cálculo de `Sale.total` / `Sale.subtotal` en el backend. Hoy
  ese total se calcula sobre el precio completo de la línea, sin restar el
  anticipo (`sales.service.ts`, `create()`). Ese descuadre entre el total
  registrado y lo efectivamente cobrado en caja es un problema aparte, ya
  identificado, que se deja fuera de este trabajo.
- No se toca `DevolucionReceipt.tsx` (recibo de devoluciones).

## Por qué no se puede leer `ticket.advancePayment` en vivo

`ticket.advancePayment` no es un valor estable: `sales.service.ts` lo
incrementa (`increment: totalEfectivoAmount`) cada vez que se cobra efectivo
contra ese ticket, incluida la propia venta que se está creando. Leerlo después
de crear la venta duplicaría el anticipo (ya incluiría el pago de esta misma
venta), y una reimpresión posterior mostraría un valor distinto si hubo ventas
adicionales sobre el mismo ticket. Por eso el anticipo aplicado a una venta se
debe **persistir en el momento de crear la venta**, no derivarse después.

## Diseño

### 1. Backend: persistir `advance` en `SaleLine`

- **Prisma schema** (`prisma/schema.prisma`, modelo `SaleLine`): agregar
  columna `advance Decimal @default(0) @db.Decimal(10, 2)`. Migración nueva.
- **`CreateSaleLineDto`** (`src/sales/dto/create-sale.dto.ts`): agregar campo
  opcional `advance?: number` con la misma validación que `discount`
  (`@IsOptional() @Type(() => Number) @IsNumber() @Min(0)`).
- **`sales.service.ts`, método `create()`**: al construir
  `lines: { create: ... }`, incluir `advance: line.advance || 0` junto a los
  demás campos de la línea. No se modifica el cálculo de `sumLines` / `total`.
- `findAll` y `findOne` ya usan `include` (no `select`) sobre `lines`, así que
  la nueva columna aparece automáticamente en las respuestas existentes sin
  tocar esas queries.

### 2. Frontend: capturar y enviar el anticipo

- **`src/lib/hooks/useSales.ts`**: agregar `advance: number` a la interfaz
  `SaleLine`, y `advance?: number` a `CreateSaleLine`.
- **`src/app/dashboard/sales/page.tsx`** (líneas ~164-183, construcción del
  payload `lines` antes de `createSale.mutateAsync`): para líneas de orden de
  reparación (`line.code.startsWith("TICKET-")`), incluir
  `advance: Number(line.advance) || 0`. El valor ya existe en
  `CashRegisterForm.lines[].advance`, capturado en
  `CashRegister.tsx#handleAddTicket` desde `ticket.advancePayment` en el
  momento en que la orden se agrega al carrito — antes de que esta venta
  pueda modificar ese contador.

### 3. Ticket: mostrar el anticipo

En `ViewSaleModal.tsx`:

- Calcular `totalAdvance = sale.lines.reduce((sum, l) => sum + (Number(l.advance) || 0), 0)`.
- Si `totalAdvance > 0`, agregar, inmediatamente después de la fila TOTAL
  (tanto en el bloque de totales en pantalla como en el área imprimible):

  ```
  TOTAL:                 $1,200.00
  ANTICIPO:                -$300.00
  --------------------------------
  SALDO PAGADO EN CAJA:    $900.00
  ```

  `SALDO PAGADO EN CAJA` = `sale.total - totalAdvance`. Este valor debe
  coincidir con la suma de la sección PAGOS existente (ya que en caja solo se
  cobró `total - anticipo`).
- Si `totalAdvance === 0`, no se muestra nada nuevo (comportamiento actual sin
  cambios).

## Testing

- Backend: test unitario/e2e de `sales.service.ts` (o el DTO) verificando que
  `advance` se persiste en `SaleLine` al crear una venta con una línea de
  ticket que trae anticipo, y que `Sale.total` no se ve afectado.
- Frontend: test de componente para `ViewSaleModal` cubriendo:
  - venta con líneas que tienen `advance > 0` → se muestra ANTICIPO y SALDO
    con los montos correctos.
  - venta sin anticipo (todas las líneas con `advance` 0 o ausente) → no se
    muestra el bloque nuevo (regresión del comportamiento actual).
