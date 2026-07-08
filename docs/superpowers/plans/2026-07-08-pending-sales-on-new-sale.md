# Pending Sales Handling in POS New-Sale Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a cashier selects a customer in the POS new-sale screen who already has an unresolved (`PENDIENTE`) sale, show a non-blocking modal offering to continue, cancel, or ignore each pending sale — without ever preventing the new sale from being created.

**Architecture:** The frontend (`celhm-app-main`) queries the existing `GET /sales?customerId&status=PENDIENTE` endpoint when a customer is selected inside `CashRegister.tsx`, and shows a new `PendingSalesModal` component. "Continuar" prefills the current cart from the pending sale's lines and flags it for cancellation; "Cancelar" calls a new backend endpoint. The backend (`celhm-api-main`) gets one new endpoint, `POST /sales/:id/cancel`, which validates the sale is `PENDIENTE` with no payments, restores stock via a `DEV` movement, and marks it `CANCELADO`.

**Tech Stack:** NestJS 10 + Prisma 5 (backend), Next.js 15 + TanStack Query 5 + Tailwind (frontend), Jest (both), Playwright (E2E).

## Global Constraints

- Spec: `celhm-app-main/docs/superpowers/specs/2026-07-08-pending-sales-on-new-sale-design.md` — every requirement in it must map to a task below.
- The new-sale form must never be disabled or blocked by pending sales, in any state of the modal.
- No new permission/role is introduced — the new endpoint reuses the existing `@Roles(Role.ADMINISTRADOR, Role.VENDEDOR)` guard on `SalesController`.
- "Continuar" recreates the sale (new folio) rather than editing the original in place — no `PATCH /sales/:id/lines` endpoint is added.
- Cancelling a pending sale is rejected if it already has any payment recorded (`paidAmount > 0`).

---

### Task 1: Backend — `cancelSale` service method

**Files:**
- Modify: `celhm-api-main/src/sales/sales.service.ts:1` (import), `celhm-api-main/src/sales/sales.service.ts:719-720` (add method before the closing class brace)
- Test: `celhm-api-main/src/sales/sales.service.spec.ts`

**Interfaces:**
- Produces: `SalesService.cancelSale(id: number, user: AuthUser): Promise<Sale & { paidAmount: number }>` — throws `BadRequestException` if `sale.status !== SaleStatus.PENDIENTE`, throws `ConflictException` if the sale has any payment, throws `NotFoundException` if the sale doesn't exist for the user's org.

- [ ] **Step 1: Write the failing tests**

In `celhm-api-main/src/sales/sales.service.spec.ts`, replace the existing import on line 2:

```typescript
import { BadRequestException } from '@nestjs/common';
```

with:

```typescript
import { BadRequestException, ConflictException } from '@nestjs/common';
```

Then add the new `describe('cancelSale', ...)` block alongside the existing `describe('createReturn', ...)` block — insert it right after the `createReturn` describe block's closing `});` and before the outer `describe('SalesService', ...)` block's final closing `});`:

```typescript
  describe('cancelSale', () => {
    const basePendingSale = {
      id: 200,
      branchId: 1,
      folio: 'VTA-001-202607-0002',
      status: SaleStatus.PENDIENTE,
      payments: [] as { amount: number }[],
      lines: [] as any[],
    };

    it('rejects when the sale is not PENDIENTE', async () => {
      mockPrismaService.sale.findFirst.mockResolvedValue({
        ...basePendingSale,
        status: SaleStatus.PAGADO,
      });

      await expect(service.cancelSale(200, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('rejects when the sale already has a payment registered', async () => {
      mockPrismaService.sale.findFirst.mockResolvedValue({
        ...basePendingSale,
        payments: [{ amount: 50 }],
      });

      await expect(service.cancelSale(200, mockUser)).rejects.toThrow(ConflictException);
    });

    it('restores stock and marks the sale as CANCELADO', async () => {
      mockPrismaService.sale.findFirst.mockResolvedValue({
        ...basePendingSale,
        lines: [
          {
            variantId: 5,
            qty: 3,
            variant: { product: { tracksInventory: true } },
          },
        ],
      });
      mockPrismaService.sale.update.mockResolvedValue({ ...basePendingSale, status: SaleStatus.CANCELADO });

      await service.cancelSale(200, mockUser);

      expect(mockPrismaService.movement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          branchId: 1,
          variantId: 5,
          qty: 3,
          type: 'DEV',
          folio: 'VTA-001-202607-0002',
        }),
      });
      expect(mockPrismaService.stock.updateMany).toHaveBeenCalledWith({
        where: { branchId: 1, variantId: 5 },
        data: { qty: { increment: 3 } },
      });
      expect(mockPrismaService.sale.update).toHaveBeenCalledWith({
        where: { id: 200 },
        data: { status: SaleStatus.CANCELADO },
      });
    });

    it('skips stock restoration for lines whose product does not track inventory', async () => {
      mockPrismaService.sale.findFirst.mockResolvedValue({
        ...basePendingSale,
        lines: [
          {
            variantId: 9,
            qty: 1,
            variant: { product: { tracksInventory: false } },
          },
        ],
      });
      mockPrismaService.sale.update.mockResolvedValue({ ...basePendingSale, status: SaleStatus.CANCELADO });

      await service.cancelSale(200, mockUser);

      expect(mockPrismaService.movement.create).not.toHaveBeenCalled();
      expect(mockPrismaService.stock.updateMany).not.toHaveBeenCalled();
    });
  });
```

Also add `update: jest.fn()` to the `sale` object inside `mockPrismaService` (it currently only has `findFirst`, `findMany`, `create`):

```typescript
    sale: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd celhm-api-main && pnpm test -- sales.service.spec.ts`
Expected: FAIL — `service.cancelSale is not a function`

- [ ] **Step 3: Implement `cancelSale`**

In `celhm-api-main/src/sales/sales.service.ts`, change the import on line 1:

```typescript
import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
```

Add this method right before the final closing `}` of the `SalesService` class (after the `createReturn` method, i.e. right after line 719 `return this.findOne(returnSale.id, user.organizationId);` and its closing `}`):

```typescript
  async cancelSale(id: number, user: AuthUser) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id,
        branch: { organizationId: user.organizationId },
      },
      include: {
        lines: {
          include: { variant: { include: { product: true } } },
        },
        payments: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    if (sale.status !== SaleStatus.PENDIENTE) {
      throw new BadRequestException('Solo se pueden cancelar ventas pendientes');
    }

    const paidAmount = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    if (paidAmount > 0) {
      throw new ConflictException('No se puede cancelar una venta con abono registrado');
    }

    for (const line of sale.lines) {
      if (line.variantId && line.variant?.product?.tracksInventory !== false) {
        await this.prisma.$transaction([
          this.prisma.movement.create({
            data: {
              branchId: sale.branchId,
              variantId: line.variantId,
              type: MovementType.DEV,
              qty: line.qty,
              reason: `Cancelación de venta pendiente ${sale.folio}`,
              folio: sale.folio,
              userId: user.id,
            },
          }),
          this.prisma.stock.updateMany({
            where: { branchId: sale.branchId, variantId: line.variantId },
            data: { qty: { increment: line.qty } },
          }),
        ]);
      }
    }

    await this.prisma.sale.update({
      where: { id: sale.id },
      data: { status: SaleStatus.CANCELADO },
    });

    return this.findOne(sale.id, user.organizationId);
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd celhm-api-main && pnpm test -- sales.service.spec.ts`
Expected: PASS — all `cancelSale` and `createReturn` tests green

- [ ] **Step 5: Commit**

```bash
cd celhm-api-main
git add src/sales/sales.service.ts src/sales/sales.service.spec.ts
git commit -m "feat: add SalesService.cancelSale to release stock and cancel pending sales"
```

---

### Task 2: Backend — `POST /sales/:id/cancel` endpoint

**Files:**
- Modify: `celhm-api-main/src/sales/sales.controller.ts:81` (add endpoint after `createReturn`)

**Interfaces:**
- Consumes: `SalesService.cancelSale(id: number, user: AuthUser)` from Task 1
- Produces: `POST /sales/:id/cancel` → `201`, body is the cancelled sale (same shape as `GET /sales/:id`)

- [ ] **Step 1: Add the controller method**

In `celhm-api-main/src/sales/sales.controller.ts`, add this method right after `createReturn` (after line 90, before the final `}` closing the class):

```typescript
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending sale and restore its stock' })
  @ApiResponse({ status: 201, description: 'Sale cancelled and stock restored' })
  cancelSale(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.salesService.cancelSale(parseInt(id), user);
  }
```

- [ ] **Step 2: Verify the project still builds**

Run: `cd celhm-api-main && pnpm build`
Expected: exits 0, no TypeScript errors

- [ ] **Step 3: Commit**

```bash
cd celhm-api-main
git add src/sales/sales.controller.ts
git commit -m "feat: expose POST /sales/:id/cancel endpoint"
```

---

### Task 3: Frontend — `useSales.ts` hooks for pending sales and cancellation

**Files:**
- Modify: `celhm-app-main/src/lib/hooks/useSales.ts`

**Interfaces:**
- Produces: `useSales(params, options?: { enabled?: boolean })` (extended signature, backward compatible), `usePendingSalesByCustomer(customerId?: number): UseQueryResult<ApiResponse<Sale>>`, `useCancelSale(): UseMutationResult<Sale, unknown, number>`

- [ ] **Step 1: Extend `useSales` to accept an `enabled` option**

In `celhm-app-main/src/lib/hooks/useSales.ts`, replace:

```typescript
export function useSales(params: GetSalesParams = {}) {
  return useQuery<ApiResponse<Sale>>({
    queryKey: ['sales', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.branchId) queryParams.append('branchId', params.branchId.toString())
      if (params.customerId) queryParams.append('customerId', params.customerId.toString())
      if (params.ticketId) queryParams.append('ticketId', params.ticketId.toString())
      if (params.status) queryParams.append('status', params.status)
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())

      const response = await api.get<ApiResponse<Sale>>(`/sales?${queryParams.toString()}`)
      return response.data
    },
    retry: false,
  })
}
```

with:

```typescript
export function useSales(params: GetSalesParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery<ApiResponse<Sale>>({
    queryKey: ['sales', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params.branchId) queryParams.append('branchId', params.branchId.toString())
      if (params.customerId) queryParams.append('customerId', params.customerId.toString())
      if (params.ticketId) queryParams.append('ticketId', params.ticketId.toString())
      if (params.status) queryParams.append('status', params.status)
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())

      const response = await api.get<ApiResponse<Sale>>(`/sales?${queryParams.toString()}`)
      return response.data
    },
    retry: false,
    enabled: options.enabled,
  })
}

export function usePendingSalesByCustomer(customerId?: number) {
  return useSales(
    { customerId, status: 'PENDIENTE', pageSize: 50 },
    { enabled: !!customerId },
  )
}
```

- [ ] **Step 2: Add `useCancelSale`**

At the end of `celhm-app-main/src/lib/hooks/useSales.ts`, after `useCreateReturn`, add:

```typescript
export function useCancelSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (saleId: number) => {
      const response = await api.post<Sale>(`/sales/${saleId}/cancel`, {})
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['stock'] })
    },
  })
}
```

- [ ] **Step 3: Typecheck**

Run: `cd celhm-app-main && pnpm typecheck`
Expected: exits 0, no TypeScript errors

- [ ] **Step 4: Commit**

```bash
cd celhm-app-main
git add src/lib/hooks/useSales.ts
git commit -m "feat: add usePendingSalesByCustomer and useCancelSale hooks"
```

---

### Task 4: Frontend — track the sale being replaced in `CashRegisterForm`

**Files:**
- Modify: `celhm-app-main/src/app/dashboard/sales/_components/types.ts`

**Interfaces:**
- Produces: `CashRegisterForm.continuingFromSaleId?: number` — set when the cart was prefilled from a pending sale via "Continuar"; read by `handlePay` in Task 7 to cancel the original sale before creating the new one.

- [ ] **Step 1: Add the field**

In `celhm-app-main/src/app/dashboard/sales/_components/types.ts`, replace:

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
}
```

`createInitialCashRegisterForm` does not need to set `continuingFromSaleId` explicitly — it stays `undefined` by default, which is correct for a brand-new sale.

- [ ] **Step 2: Typecheck**

Run: `cd celhm-app-main && pnpm typecheck`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
cd celhm-app-main
git add src/app/dashboard/sales/_components/types.ts
git commit -m "feat: track originating pending sale id on the cash register form"
```

---

### Task 5: Frontend — `PendingSalesModal` component

**Files:**
- Create: `celhm-app-main/src/app/dashboard/sales/_components/PendingSalesModal.tsx`
- Test: `celhm-app-main/src/app/dashboard/sales/_components/PendingSalesModal.test.tsx`

**Interfaces:**
- Consumes: `Sale` type from `../../../../lib/hooks/useSales`
- Produces: `PendingSalesModal({ sales: Sale[], onContinue: (sale: Sale) => void, onCancel: (sale: Sale) => void, onClose: () => void })` — a React component. Row action "Cancelar" is disabled when `sale.paidAmount > 0`. Clicking "Ignorar" on a row hides only that row (local state). Clicking the close button or backdrop is equivalent to ignoring every remaining row.

- [ ] **Step 1: Write the failing test**

Create `celhm-app-main/src/app/dashboard/sales/_components/PendingSalesModal.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { PendingSalesModal } from './PendingSalesModal'
import { Sale } from '../../../../lib/hooks/useSales'

const makeSale = (overrides: Partial<Sale> = {}): Sale => ({
  id: 1,
  folio: 'VTA-001-202607-0001',
  branchId: 1,
  customerId: 10,
  status: 'PENDIENTE',
  subtotal: 100,
  discount: 0,
  total: 116,
  paidAmount: 0,
  isReturn: false,
  createdAt: '2026-07-08T12:00:00.000Z',
  updatedAt: '2026-07-08T12:00:00.000Z',
  lines: [],
  payments: [],
  ...overrides,
})

describe('PendingSalesModal', () => {
  it('renders a row per pending sale with folio, total, paid and balance', () => {
    render(
      <PendingSalesModal
        sales={[makeSale({ total: 116, paidAmount: 16 })]}
        onContinue={jest.fn()}
        onCancel={jest.fn()}
        onClose={jest.fn()}
      />
    )

    expect(screen.getByText('VTA-001-202607-0001')).toBeInTheDocument()
    expect(screen.getByText('$116.00')).toBeInTheDocument()
    expect(screen.getByText('$16.00')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('calls onContinue with the sale when "Continuar" is clicked', () => {
    const onContinue = jest.fn()
    const sale = makeSale()
    render(
      <PendingSalesModal sales={[sale]} onContinue={onContinue} onCancel={jest.fn()} onClose={jest.fn()} />
    )

    fireEvent.click(screen.getByText('Continuar'))
    expect(onContinue).toHaveBeenCalledWith(sale)
  })

  it('disables "Cancelar" when the sale already has a payment', () => {
    render(
      <PendingSalesModal
        sales={[makeSale({ paidAmount: 50 })]}
        onContinue={jest.fn()}
        onCancel={jest.fn()}
        onClose={jest.fn()}
      />
    )

    expect(screen.getByText('Cancelar')).toBeDisabled()
  })

  it('calls onCancel with the sale when "Cancelar" is clicked and there is no payment', () => {
    const onCancel = jest.fn()
    const sale = makeSale({ paidAmount: 0 })
    render(
      <PendingSalesModal sales={[sale]} onContinue={jest.fn()} onCancel={onCancel} onClose={jest.fn()} />
    )

    fireEvent.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalledWith(sale)
  })

  it('hides a row locally when "Ignorar" is clicked, without calling onClose', () => {
    const onClose = jest.fn()
    render(
      <PendingSalesModal sales={[makeSale()]} onContinue={jest.fn()} onCancel={jest.fn()} onClose={onClose} />
    )

    fireEvent.click(screen.getByText('Ignorar'))
    expect(screen.queryByText('VTA-001-202607-0001')).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <PendingSalesModal sales={[makeSale()]} onContinue={jest.fn()} onCancel={jest.fn()} onClose={onClose} />
    )

    fireEvent.click(screen.getByTitle('Cerrar'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd celhm-app-main && pnpm test -- PendingSalesModal`
Expected: FAIL — cannot find module `./PendingSalesModal`

- [ ] **Step 3: Implement the component**

Create `celhm-app-main/src/app/dashboard/sales/_components/PendingSalesModal.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Sale } from '../../../../lib/hooks/useSales'

interface PendingSalesModalProps {
  sales: Sale[]
  onContinue: (sale: Sale) => void
  onCancel: (sale: Sale) => void
  onClose: () => void
}

const formatMoney = (value: number) =>
  `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })

export function PendingSalesModal({ sales, onContinue, onCancel, onClose }: PendingSalesModalProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set())

  const visibleSales = sales.filter((sale) => !dismissedIds.has(sale.id))

  const handleIgnore = (saleId: number) => {
    setDismissedIds((prev) => new Set(prev).add(saleId))
  }

  const handleCancel = (sale: Sale) => {
    onCancel(sale)
    setDismissedIds((prev) => new Set(prev).add(sale.id))
  }

  if (visibleSales.length === 0) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-lg font-bold">Documentos pendientes de este cliente</h2>
          <button onClick={onClose} title="Cerrar" className="text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            Este cliente tiene ventas sin cerrar. Puedes continuarlas, cancelarlas o ignorarlas — la venta nueva
            se puede guardar de todas formas.
          </p>
          {visibleSales.map((sale) => {
            const balance = sale.total - sale.paidAmount
            const hasPayment = sale.paidAmount > 0
            return (
              <div
                key={sale.id}
                className="border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-medium">{sale.folio}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(sale.createdAt)}</div>
                  <div className="text-sm mt-1 space-x-3">
                    <span>Total: {formatMoney(sale.total)}</span>
                    <span>Abonado: {formatMoney(sale.paidAmount)}</span>
                    <span className="font-medium">Saldo: {formatMoney(balance)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => onContinue(sale)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Continuar
                  </button>
                  <button
                    onClick={() => handleCancel(sale)}
                    disabled={hasPayment}
                    title={hasPayment ? 'No se puede cancelar: ya tiene un abono registrado' : ''}
                    className="px-3 py-1.5 border border-red-300 text-red-700 rounded-md hover:bg-red-50 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleIgnore(sale.id)}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Ignorar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd celhm-app-main && pnpm test -- PendingSalesModal`
Expected: PASS — all 6 tests green

- [ ] **Step 5: Commit**

```bash
cd celhm-app-main
git add src/app/dashboard/sales/_components/PendingSalesModal.tsx src/app/dashboard/sales/_components/PendingSalesModal.test.tsx
git commit -m "feat: add PendingSalesModal for handling a customer's pending sales"
```

---

### Task 6: Frontend — integrate the modal into `CashRegister.tsx`

**Files:**
- Modify: `celhm-app-main/src/app/dashboard/sales/_components/CashRegister.tsx`

**Interfaces:**
- Consumes: `usePendingSalesByCustomer`, `useCancelSale` from Task 3; `PendingSalesModal` from Task 5; `CashRegisterForm.continuingFromSaleId` from Task 4
- Produces: no new props on `CashRegister` — the pending-sales check, fetch, and modal are self-contained inside it, matching how it already calls `useCashRegisters`/`useOrganization` directly.

- [ ] **Step 1: Add imports and state**

In `celhm-app-main/src/app/dashboard/sales/_components/CashRegister.tsx`, replace the import block:

```typescript
import { PaymentMethod, CreateSaleLine } from "../../../../lib/hooks/useSales";
```

with:

```typescript
import { PaymentMethod, CreateSaleLine, Sale, usePendingSalesByCustomer, useCancelSale } from "../../../../lib/hooks/useSales";
import { PendingSalesModal } from "./PendingSalesModal";
```

Then, inside the `CashRegister` function body, right after the existing `const { data: organization } = useOrganization();` line, add:

```typescript
  const numericCustomerId = form.customerId ? parseInt(form.customerId) : undefined;
  const { data: pendingSalesData } = usePendingSalesByCustomer(numericCustomerId);
  const pendingSales = pendingSalesData?.data ?? [];
  const cancelSaleMutation = useCancelSale();
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [checkedCustomerId, setCheckedCustomerId] = useState<string | null>(null);
```

- [ ] **Step 2: Trigger the modal when a new customer with pending sales is selected**

Add this `useEffect` right after the existing hotkeys `useEffect` blocks (after the one ending `}, [isOpen]);`):

```typescript
  useEffect(() => {
    if (!form.customerId) {
      setCheckedCustomerId(null);
      return;
    }
    if (form.customerId !== checkedCustomerId && pendingSalesData) {
      setCheckedCustomerId(form.customerId);
      if (pendingSales.length > 0) {
        setShowPendingModal(true);
      }
    }
  }, [form.customerId, pendingSalesData, checkedCustomerId, pendingSales.length]);
```

- [ ] **Step 3: Add the "Continuar" and "Cancelar" handlers**

Add these functions right after `const { toast } = useToast();`:

```typescript
  const handleContinuePendingSale = (sale: Sale) => {
    const mappedLines: SaleLineItem[] = sale.lines.map((line) => {
      if (line.ticketId) {
        return {
          variantId: undefined,
          code: `TICKET-${line.ticketId}`,
          product: line.description,
          qty: line.qty,
          unitPrice: Number(line.unitPrice),
          amount: Number(line.unitPrice) * line.qty - Number(line.discount || 0),
          isPriceEditable: false,
        };
      }
      const stockItem = stockItems.find((item) => item.variantId === line.variantId);
      return {
        variantId: line.variantId,
        code: stockItem?.sku || "",
        product: line.description,
        qty: line.qty,
        unitPrice: Number(line.unitPrice),
        amount: Number(line.unitPrice) * line.qty - Number(line.discount || 0),
        isPriceEditable: stockItem?.isPriceEditable,
      };
    });

    onFormChange({
      ...form,
      customerId: sale.customerId ? String(sale.customerId) : form.customerId,
      customerName: sale.customer?.name || form.customerName,
      lines: mappedLines,
      discount: Number(sale.discount),
      continuingFromSaleId: sale.id,
    });
    setShowPendingModal(false);
  };
```

Note: `SaleLineItem.advance` (the "already paid" badge shown for repair-order lines) is intentionally left unset here — `Sale.lines` doesn't carry the ticket's `advancePayment`, and re-fetching the ticket just to restore a cosmetic badge is out of scope. The charged amount is unaffected either way, since `unitPrice` on repair-order lines is always the full ticket price.

```typescript

  const handleCancelPendingSale = async (sale: Sale) => {
    try {
      await cancelSaleMutation.mutateAsync(sale.id);
      toast({
        title: "Venta pendiente cancelada",
        description: `El folio ${sale.folio} fue cancelado y el stock fue restaurado.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo cancelar",
        description: "Intenta de nuevo.",
      });
    }
  };
```

- [ ] **Step 4: Render the modal**

Add this right after the closing `</div>` of the "Modal para seleccionar orden de reparación" block (right before the final closing `</div>` of the component, i.e. right after the block that ends with the `{showTicketModal && ( ... )}` closing):

```typescript
      {showPendingModal && (
        <PendingSalesModal
          sales={pendingSales}
          onContinue={handleContinuePendingSale}
          onCancel={handleCancelPendingSale}
          onClose={() => setShowPendingModal(false)}
        />
      )}
```

- [ ] **Step 5: Typecheck**

Run: `cd celhm-app-main && pnpm typecheck`
Expected: exits 0

- [ ] **Step 6: Commit**

```bash
cd celhm-app-main
git add src/app/dashboard/sales/_components/CashRegister.tsx
git commit -m "feat: show pending-sales modal when selecting a customer in the POS"
```

---

### Task 7: Frontend — cancel the original sale before creating the replacement

**Files:**
- Modify: `celhm-app-main/src/app/dashboard/sales/page.tsx`

**Interfaces:**
- Consumes: `useCancelSale` from Task 3, `cashRegisterForm.continuingFromSaleId` from Task 4

- [ ] **Step 1: Import and instantiate the mutation**

In `celhm-app-main/src/app/dashboard/sales/page.tsx`, update the import of sales hooks to include `useCancelSale`, and add the hook call next to `createSale`:

```typescript
  const createSale = useCreateSale();
  const cancelSale = useCancelSale();
```

(Add `useCancelSale` to the existing `import { useSales, useCreateSale, ... } from "../../../lib/hooks/useSales";` import list at the top of the file.)

- [ ] **Step 2: Cancel the original pending sale before creating the new one**

In `handlePay`, replace:

```typescript
    try {
      // Convertir CashRegisterForm a CreateSaleRequest
      const lines: CreateSaleLine[] = cashRegisterForm.lines.map((line) => {
```

with:

```typescript
    try {
      if (cashRegisterForm.continuingFromSaleId) {
        await cancelSale.mutateAsync(cashRegisterForm.continuingFromSaleId);
        setCashRegisterForm((prev) => ({ ...prev, continuingFromSaleId: undefined }));
      }

      // Convertir CashRegisterForm a CreateSaleRequest
      const lines: CreateSaleLine[] = cashRegisterForm.lines.map((line) => {
```

- [ ] **Step 3: Give a clearer error if cancellation succeeded but creation failed**

Replace the `catch` block of `handlePay`:

```typescript
    } catch (error) {
      console.error("Error creating sale:", error);
      toast({
        variant: "destructive",
        title: "Error al crear venta",
        description: "Por favor, intenta de nuevo.",
      });
    }
```

with:

```typescript
    } catch (error) {
      console.error("Error creating sale:", error);
      toast({
        variant: "destructive",
        title: "Error al crear venta",
        description: cashRegisterForm.continuingFromSaleId
          ? "La venta pendiente original fue cancelada, pero no se pudo crear la venta nueva. Verifica el carrito e intenta de nuevo."
          : "Por favor, intenta de nuevo.",
      });
    }
```

- [ ] **Step 4: Typecheck**

Run: `cd celhm-app-main && pnpm typecheck`
Expected: exits 0

- [ ] **Step 5: Commit**

```bash
cd celhm-app-main
git add src/app/dashboard/sales/page.tsx
git commit -m "feat: cancel the originating pending sale when continuing it in the POS"
```

---

### Task 8: E2E — pending sale never blocks the new-sale flow

**Files:**
- Create: `celhm-app-main/tests/e2e/sales-pending-documents.spec.ts`

**Interfaces:**
- Consumes: real backend at `http://localhost:3001` (started by `playwright.config.ts`'s `webServer` entry `pnpm --filter api dev`), seeded user `direccion@acme-repair.com` / `ChangeMe123!` (already used by `tests/e2e/auth.spec.ts`)

- [ ] **Step 1: Write the test**

Create `celhm-app-main/tests/e2e/sales-pending-documents.spec.ts`:

```typescript
import { test, expect, APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';
const CREDENTIALS = { email: 'direccion@acme-repair.com', password: 'ChangeMe123!' };

async function apiLogin(request: APIRequestContext) {
  const response = await request.post(`${API_URL}/auth/login`, { data: CREDENTIALS });
  const body = await response.json();
  return { token: body.access_token as string, user: body.user as { branchId: number } };
}

test.describe('Pending sales handling in POS', () => {
  test('offers Continuar/Cancelar/Ignorar for a customer with a pending sale, never blocking the flow', async ({
    page,
    request,
  }) => {
    const { token, user } = await apiLogin(request);
    const authHeaders = { Authorization: `Bearer ${token}` };

    const customerRes = await request.post(`${API_URL}/customers`, {
      headers: authHeaders,
      data: { name: 'Cliente Pendiente E2E', phone: '5215555555555' },
    });
    const customer = await customerRes.json();

    const registersRes = await request.get(`${API_URL}/cash/registers?branchId=${user.branchId}`, {
      headers: authHeaders,
    });
    const registers = await registersRes.json();
    const cashRegisterId = registers[0].id;

    const stockRes = await request.get(`${API_URL}/stock?pageSize=1`, { headers: authHeaders });
    const stockBody = await stockRes.json();
    const variantId = stockBody.data[0].variantId;
    const unitPrice = stockBody.data[0].price;

    // No `payments` sent at all -> the sale stays PENDIENTE (see sales.service.ts create()).
    const saleRes = await request.post(`${API_URL}/sales`, {
      headers: authHeaders,
      data: {
        branchId: user.branchId,
        customerId: customer.id,
        cashRegisterId,
        lines: [{ variantId, description: 'Producto de prueba E2E', qty: 1, unitPrice }],
      },
    });
    const pendingSale = await saleRes.json();
    expect(pendingSale.status).toBe('PENDIENTE');

    await page.goto('/login');
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    await page.goto('/dashboard/sales');
    await page.click('text=+ Nueva Venta');
    await page.fill('input[placeholder="CLIENTE DE MOSTRADOR"]', 'Cliente Pendiente E2E');
    await page.click(`text=${customer.name}`);

    await expect(page.locator('text=Documentos pendientes de este cliente')).toBeVisible();
    await expect(page.locator(`text=${pendingSale.folio}`)).toBeVisible();

    // The new-sale form must remain usable while the modal is open.
    await expect(page.locator('text=PAGAR')).toBeEnabled();

    // Ignoring must close the modal without blocking the flow.
    await page.click('text=Ignorar');
    await expect(page.locator('text=Documentos pendientes de este cliente')).not.toBeVisible();
  });
});
```

- [ ] **Step 2: Run the E2E test**

Run: `cd celhm-app-main && pnpm test:e2e -- sales-pending-documents`
Expected: PASS (Playwright starts both the frontend and API dev servers per `playwright.config.ts`, so this can take ~30-60s to boot the first time)

- [ ] **Step 3: Commit**

```bash
cd celhm-app-main
git add tests/e2e/sales-pending-documents.spec.ts
git commit -m "test: add E2E coverage for the pending-sales POS modal"
```

---

## Spec coverage check

- Detect pending sales on customer selection → Task 3 (query hooks) + Task 6 (trigger effect)
- Modal with folio/fecha/total/abonado/saldo → Task 5
- Continuar (recreate, no backend edit endpoint) → Task 6 (`handleContinuePendingSale`) + Task 7 (cancel-then-create in `handlePay`)
- Cancelar (backend, blocks if paid, restores stock) → Task 1 + Task 2
- Ignorar / close = ignore all → Task 5
- Never blocks the new-sale flow → Task 8 verifies this explicitly; no task disables the PAGAR button based on pending sales
- Multiple pendientes, resolving one doesn't affect others → Task 5 (`dismissedIds` is per-row)
