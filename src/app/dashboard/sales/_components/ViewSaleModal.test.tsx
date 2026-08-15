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
