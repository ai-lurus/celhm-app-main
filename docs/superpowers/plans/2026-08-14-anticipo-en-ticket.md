# Anticipo en el Ticket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the repair-order anticipo (advance payment) on the printed/on-screen sale ticket, without changing how `Sale.total` is calculated.

**Architecture:** Persist the anticipo on `SaleLine.advance` at sale-creation time (it's only known client-side, in the cart, and would otherwise be lost). `ViewSaleModal` then sums `advance` across a sale's lines and renders an ANTICIPO / SALDO PAGADO EN CAJA block whenever that sum is greater than 0.

**Tech Stack:** NestJS + Prisma + PostgreSQL (`celhm-api-main`), Next.js + TypeScript + Jest/RTL (`celhm-app-main`).

## Global Constraints

- Do not change `Sale.total` / `Sale.subtotal` calculation in `sales.service.ts` — the anticipo stays purely informational/display-only in this plan.
- Do not read `ticket.advancePayment` live for display — it's mutated by `sales.service.ts` as a side effect of the very sale being created, so it does not represent "anticipo applied to this sale" after the fact. The value must be captured and persisted at creation time instead.
- Do not touch `DevolucionReceipt.tsx`.
- Repo paths below are relative to two repo roots:
  - Backend: `/Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-api-main`
  - Frontend: `/Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-app-main`

---

### Task 1: Backend — persist `advance` on `SaleLine`

**Files:**
- Modify: `prisma/schema.prisma` (`SaleLine` model, ~line 459-478)
- Modify: `src/sales/dto/create-sale.dto.ts` (`CreateSaleLineDto`)
- Modify: `src/sales/sales.service.ts` (`create()` method, ~line 85-97)
- Test: `src/sales/sales.service.spec.ts`
- Create (auto-generated): `prisma/migrations/<timestamp>_add_advance_to_sale_line/migration.sql`

**Interfaces:**
- Consumes: nothing new from other tasks.
- Produces: `SaleLine.advance: Decimal` (Prisma), surfaced through the existing `findAll`/`findOne` `include` (no query changes needed there since they already `include` full line records). `CreateSaleLineDto.advance?: number`. This is what Task 2 sends and Task 3 reads (as `SaleLine.advance: number` once serialized to JSON).

- [ ] **Step 1: Write the failing tests**

In `src/sales/sales.service.spec.ts`, inside the existing `describe('create', ...)` block (after the `baseDto` declaration, e.g. right after the last existing `it(...)` in that block), add:

```typescript
    it('persists the advance amount on ticket lines when creating a sale', async () => {
      await service.create(
        {
          branchId: 1,
          cashRegisterId: 1,
          ticketId: 42,
          lines: [
            {
              ticketId: 42,
              description: 'Orden de Reparación TCK-001',
              qty: 1,
              unitPrice: 1200,
              advance: 300,
            },
          ],
          payments: [{ amount: 900, method: 'EFECTIVO' as any }],
        } as any,
        mockUser,
      );

      expect(mockPrismaService.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lines: {
              create: [
                expect.objectContaining({
                  ticketId: 42,
                  advance: 300,
                }),
              ],
            },
          }),
        }),
      );
    });

    it('defaults advance to 0 when a line does not specify one', async () => {
      await service.create(
        {
          branchId: 1,
          cashRegisterId: 1,
          lines: [{ description: 'Producto', qty: 1, unitPrice: 100 }],
        } as any,
        mockUser,
      );

      expect(mockPrismaService.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lines: {
              create: [expect.objectContaining({ advance: 0 })],
            },
          }),
        }),
      );
    });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd /Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-api-main && pnpm test -- sales.service.spec.ts`
Expected: FAIL — the two new tests fail because the actual `lines.create` objects passed to `mockPrismaService.sale.create` don't contain an `advance` key yet.

- [ ] **Step 3: Add the column to the Prisma schema**

In `prisma/schema.prisma`, in the `SaleLine` model, add the `advance` field right after `discount`:

```prisma
model SaleLine {
  id          Int      @id @default(autoincrement())
  saleId      Int
  variantId   Int?
  description String
  qty         Int      @default(1)
  unitPrice   Decimal  @db.Decimal(10, 2)
  discount    Decimal  @default(0) @db.Decimal(10, 2)
  advance     Decimal  @default(0) @db.Decimal(10, 2)
  total       Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  sale        Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)
  variant     Variant? @relation(fields: [variantId], references: [id])
  ticketId    Int?
  ticket      Ticket?  @relation(fields: [ticketId], references: [id])
  commissions Commission[]

  @@index([saleId])
  @@map("sale_lines")
}
```

- [ ] **Step 4: Generate and apply the migration**

Run: `cd /Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-api-main && pnpm db:migrate:dev --name add_advance_to_sale_line`
Expected: Prisma creates `prisma/migrations/<timestamp>_add_advance_to_sale_line/migration.sql` containing `ALTER TABLE "sale_lines" ADD COLUMN "advance" DECIMAL(10,2) NOT NULL DEFAULT 0;`, applies it to the dev database, and regenerates the Prisma Client (`SaleLine` type now has `advance: Decimal`).

- [ ] **Step 5: Add `advance` to the DTO**

In `src/sales/dto/create-sale.dto.ts`, in `CreateSaleLineDto`, add the field right after `discount`:

```typescript
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ description: 'Anticipo ya aplicado a esta línea (informativo, no afecta el total)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  advance?: number;
```

This is required, not cosmetic: `main.ts` configures `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`, so without this field any request sending `advance` on a line gets rejected with a 400.

- [ ] **Step 6: Persist `advance` when creating sale lines**

In `src/sales/sales.service.ts`, in `create()`, the `lines: { create: createSaleDto.lines.map((line) => ({ ... })) }` block currently reads:

```typescript
        lines: {
          create: createSaleDto.lines.map((line) => ({
            variantId: line.variantId,
            ticketId: line.ticketId,
            description: line.description,
            qty: line.qty,
            unitPrice: line.unitPrice,
            discount: line.discount || 0,
            total: Number(line.unitPrice) * line.qty - Number(line.discount || 0),
          })),
        },
```

Add `advance: line.advance || 0`:

```typescript
        lines: {
          create: createSaleDto.lines.map((line) => ({
            variantId: line.variantId,
            ticketId: line.ticketId,
            description: line.description,
            qty: line.qty,
            unitPrice: line.unitPrice,
            discount: line.discount || 0,
            advance: line.advance || 0,
            total: Number(line.unitPrice) * line.qty - Number(line.discount || 0),
          })),
        },
```

Do not change the `total` expression or the `sumLines`/`total`/`subtotal` calculation earlier in the method — `advance` must not affect them (Global Constraints).

- [ ] **Step 7: Run the tests to verify they pass**

Run: `cd /Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-api-main && pnpm test -- sales.service.spec.ts`
Expected: PASS — all tests in the file, including the two new ones.

- [ ] **Step 8: Run the full backend test suite**

Run: `cd /Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-api-main && pnpm test`
Expected: PASS — no regressions elsewhere.

- [ ] **Step 9: Commit**

```bash
cd /Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-api-main
git add prisma/schema.prisma prisma/migrations src/sales/dto/create-sale.dto.ts src/sales/sales.service.ts src/sales/sales.service.spec.ts
git commit -m "feat: persist anticipo on sale lines"
```

---

### Task 2: Frontend — send `advance` when creating a sale

**Files:**
- Modify: `src/lib/hooks/useSales.ts` (`SaleLine` interface ~line 8-18, `CreateSaleLine` interface ~line 65-72)
- Modify: `src/app/dashboard/sales/page.tsx` (lines payload construction, ~line 164-183)

**Interfaces:**
- Consumes: `SaleLineItem.advance?: number` (already exists in `src/app/dashboard/sales/_components/types.ts`, populated by `CashRegister.tsx#handleAddTicket` from `ticket.advancePayment`). `CreateSaleLineDto.advance?: number` from Task 1 (the backend field this payload must match).
- Produces: `SaleLine.advance: number` and `CreateSaleLine.advance?: number` in `useSales.ts`, consumed by Task 3 (`ViewSaleModal`) and by the payload builder in this same task.

There is no existing automated test coverage for `sales/page.tsx` (no test file exists for it in the repo, and its sale-payload logic isn't extracted into `utils.ts`), so this task is verified via typecheck and the existing test suite rather than a new unit test — consistent with current repo conventions.

- [ ] **Step 1: Add `advance` to the frontend types**

In `src/lib/hooks/useSales.ts`, add `advance: number` to `SaleLine` (after `discount`):

```typescript
export interface SaleLine {
  id: number
  saleId: number
  variantId?: number
  ticketId?: number
  description: string
  qty: number
  unitPrice: number
  discount: number
  advance: number
  subtotal: number
}
```

And add `advance?: number` to `CreateSaleLine` (after `discount`):

```typescript
export interface CreateSaleLine {
  variantId?: number
  ticketId?: number
  description: string
  qty: number
  unitPrice: number
  discount?: number
  advance?: number
}
```

- [ ] **Step 2: Send `advance` in the create-sale payload**

In `src/app/dashboard/sales/page.tsx`, the `lines` construction currently reads:

```typescript
      const lines: CreateSaleLine[] = cashRegisterForm.lines.map((line) => {
        // Si es una orden de reparación (code empieza con TICKET-)
        if (line.code.startsWith("TICKET-")) {
          const ticketId = parseInt(line.code.replace("TICKET-", ""));
          return {
            ticketId,
            description: line.product,
            qty: Number(line.qty),
            unitPrice: Number(line.unitPrice),
          };
        } else {
          // Es un producto normal
          return {
            variantId: line.variantId,
            description: line.product,
            qty: Number(line.qty),
            unitPrice: Number(line.unitPrice),
          };
        }
      });
```

Add `advance` to the ticket branch only (normal product lines never have an advance):

```typescript
      const lines: CreateSaleLine[] = cashRegisterForm.lines.map((line) => {
        // Si es una orden de reparación (code empieza con TICKET-)
        if (line.code.startsWith("TICKET-")) {
          const ticketId = parseInt(line.code.replace("TICKET-", ""));
          return {
            ticketId,
            description: line.product,
            qty: Number(line.qty),
            unitPrice: Number(line.unitPrice),
            advance: Number(line.advance) || 0,
          };
        } else {
          // Es un producto normal
          return {
            variantId: line.variantId,
            description: line.product,
            qty: Number(line.qty),
            unitPrice: Number(line.unitPrice),
          };
        }
      });
```

- [ ] **Step 3: Typecheck**

Run: `cd /Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-app-main && pnpm typecheck`
Expected: PASS — no type errors.

- [ ] **Step 4: Run the existing frontend test suite**

Run: `cd /Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-app-main && pnpm test`
Expected: PASS — no regressions (in particular `SalesHistoryTab.test.tsx`'s `makeSale` helper must still satisfy the `Sale`/`SaleLine` types; it uses `lines: []` so the new required `advance` field on `SaleLine` doesn't apply there).

- [ ] **Step 5: Commit**

```bash
cd /Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-app-main
git add src/lib/hooks/useSales.ts src/app/dashboard/sales/page.tsx
git commit -m "feat: send anticipo on repair-order sale lines"
```

---

### Task 3: Frontend — show anticipo on the sale ticket

**Files:**
- Modify: `src/app/dashboard/sales/_components/ViewSaleModal.tsx`
- Test: `src/app/dashboard/sales/_components/ViewSaleModal.test.tsx` (new)

**Interfaces:**
- Consumes: `Sale.lines[].advance: number` (Task 2).
- Produces: nothing consumed by later tasks (this is the last task).

- [ ] **Step 1: Write the failing test**

Create `src/app/dashboard/sales/_components/ViewSaleModal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { ViewSaleModal } from './ViewSaleModal'
import { Sale, SaleLine } from '../../../../lib/hooks/useSales'

jest.mock('../../../../lib/hooks/useOrganization', () => ({
  useOrganization: () => ({ data: undefined }),
}))

const makeLine = (overrides: Partial<SaleLine> = {}): SaleLine => ({
  id: 1,
  saleId: 1,
  description: 'Orden de Reparación TCK-001',
  qty: 1,
  unitPrice: 1200,
  discount: 0,
  advance: 0,
  subtotal: 1200,
  ...overrides,
})

const makeSale = (overrides: Partial<Sale> = {}): Sale => ({
  id: 1,
  folio: 'VTA-001-202607-0001',
  branchId: 1,
  customerId: 10,
  status: 'PAGADO',
  subtotal: 1034.48,
  discount: 0,
  total: 1200,
  paidAmount: 900,
  isReturn: false,
  createdAt: '2026-07-08T18:30:00.000Z',
  updatedAt: '2026-07-08T18:30:00.000Z',
  lines: [makeLine()],
  payments: [{ id: 1, saleId: 1, amount: 900, method: 'EFECTIVO', createdAt: '2026-07-08T18:30:00.000Z' }],
  customer: { id: 10, name: 'Juan Perez', phone: '5551234567' },
  ...overrides,
})

const getStatusColor = () => 'bg-gray-100'

describe('ViewSaleModal anticipo', () => {
  it('shows ANTICIPO and SALDO PAGADO EN CAJA when a line carries an advance', () => {
    const sale = makeSale({ lines: [makeLine({ advance: 300 })] })
    render(<ViewSaleModal sale={sale} onClose={() => {}} getStatusColor={getStatusColor} />)

    expect(screen.getByText('Anticipo:')).toBeInTheDocument()
    expect(screen.getByText('ANTICIPO:')).toBeInTheDocument()
    expect(screen.getByText('Saldo pagado en caja:')).toBeInTheDocument()
    expect(screen.getByText('SALDO PAGADO EN CAJA:')).toBeInTheDocument()
    expect(screen.getAllByText('-$300.00')).toHaveLength(2)
    expect(screen.getAllByText('$900.00').length).toBeGreaterThanOrEqual(2)
  })

  it('sums advance across multiple ticket lines', () => {
    const sale = makeSale({
      total: 2000,
      lines: [makeLine({ id: 1, advance: 300 }), makeLine({ id: 2, advance: 200 })],
    })
    render(<ViewSaleModal sale={sale} onClose={() => {}} getStatusColor={getStatusColor} />)

    expect(screen.getAllByText('-$500.00')).toHaveLength(2)
    expect(screen.getAllByText('$1,500.00')).toHaveLength(2)
  })

  it('shows nothing extra when no line has an advance', () => {
    const sale = makeSale({ lines: [makeLine({ advance: 0 })] })
    render(<ViewSaleModal sale={sale} onClose={() => {}} getStatusColor={getStatusColor} />)

    expect(screen.queryByText('Anticipo:')).not.toBeInTheDocument()
    expect(screen.queryByText('ANTICIPO:')).not.toBeInTheDocument()
    expect(screen.queryByText('Saldo pagado en caja:')).not.toBeInTheDocument()
    expect(screen.queryByText('SALDO PAGADO EN CAJA:')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-app-main && pnpm test -- ViewSaleModal.test.tsx`
Expected: FAIL — `Anticipo:`/`ANTICIPO:`/etc. are not found because `ViewSaleModal` doesn't render them yet.

- [ ] **Step 3: Compute `totalAdvance` in the component**

In `src/app/dashboard/sales/_components/ViewSaleModal.tsx`, right after the `ticketLegends` computation (after line 16, before the `return`):

```typescript
  const totalAdvance = sale.lines.reduce((sum, line) => sum + (Number(line.advance) || 0), 0)
```

- [ ] **Step 4: Add the ANTICIPO/SALDO block to the on-screen totals**

The on-screen totals block currently ends with the Total row:

```tsx
            <div className="flex justify-between font-bold border-t border-border pt-2">
              <span>Total:</span>
              <span>${(sale.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
```

Add the new block right after the Total row, still inside the `bg-muted p-4 rounded` div:

```tsx
            <div className="flex justify-between font-bold border-t border-border pt-2">
              <span>Total:</span>
              <span>${(sale.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            {totalAdvance > 0 && (
              <>
                <div className="flex justify-between text-sm text-red-500 mt-1">
                  <span>Anticipo:</span>
                  <span>-${totalAdvance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-border pt-2 mt-1">
                  <span>Saldo pagado en caja:</span>
                  <span>${((sale.total || 0) - totalAdvance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
          </div>
```

- [ ] **Step 5: Add the ANTICIPO/SALDO block to the printable ticket**

The printable totals block currently ends with the TOTAL row:

```tsx
            <div className="flex justify-between font-bold text-sm mt-1 border-t border-dashed border-gray-400 pt-1 pb-1">
              <span>TOTAL:</span>
              <span>${(sale?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
```

Add the new block right after it, still inside that `mb-4 text-xs` div:

```tsx
            <div className="flex justify-between font-bold text-sm mt-1 border-t border-dashed border-gray-400 pt-1 pb-1">
              <span>TOTAL:</span>
              <span>${(sale?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            {totalAdvance > 0 && (
              <>
                <div className="flex justify-between mb-1">
                  <span>ANTICIPO:</span>
                  <span>-${totalAdvance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-400 pt-1">
                  <span>SALDO PAGADO EN CAJA:</span>
                  <span>${((sale?.total || 0) - totalAdvance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
          </div>
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd /Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-app-main && pnpm test -- ViewSaleModal.test.tsx`
Expected: PASS — all three tests.

- [ ] **Step 7: Run the full frontend test suite and typecheck**

Run: `cd /Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-app-main && pnpm typecheck && pnpm test`
Expected: PASS — no regressions.

- [ ] **Step 8: Manual check in the browser**

Run: `cd /Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-app-main && pnpm dev`, open Caja (Sales), add a repair order with `advancePayment > 0` to the cart, complete the sale, and confirm the "Detalles de Venta" view and the print preview (`window.print()` / browser print dialog) both show ANTICIPO and SALDO PAGADO EN CAJA with the correct amounts. Also confirm a sale with only regular product lines (no ticket) shows nothing new.

- [ ] **Step 9: Commit**

```bash
cd /Users/laucho/Documents/Projects/ai-lurus/celhm/celhm-app-main
git add src/app/dashboard/sales/_components/ViewSaleModal.tsx src/app/dashboard/sales/_components/ViewSaleModal.test.tsx
git commit -m "feat: show anticipo on the sale ticket"
```
