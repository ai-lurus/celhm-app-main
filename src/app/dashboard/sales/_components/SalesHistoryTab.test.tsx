import { render, screen, fireEvent } from '@testing-library/react'
import { SalesHistoryTab } from './SalesHistoryTab'
import { Sale } from '../../../../lib/hooks/useSales'

const makeSale = (overrides: Partial<Sale> = {}): Sale => ({
  id: 1,
  folio: 'VTA-001-202607-0001',
  branchId: 1,
  customerId: 10,
  status: 'PAGADO',
  subtotal: 100,
  discount: 0,
  total: 116,
  paidAmount: 116,
  isReturn: false,
  createdAt: '2026-07-08T18:30:00.000Z',
  updatedAt: '2026-07-08T18:30:00.000Z',
  lines: [],
  payments: [{ id: 1, saleId: 1, amount: 116, method: 'EFECTIVO', createdAt: '2026-07-08T18:30:00.000Z' }],
  customer: { id: 10, name: 'Juan Perez', phone: '5551234567' },
  ...overrides,
})

const noop = () => {}

describe('SalesHistoryTab', () => {
  it('renders a row per sale with folio, customer, total and payment method', () => {
    render(
      <SalesHistoryTab
        sales={[makeSale()]}
        isLoading={false}
        startDate="2026-07-08"
        endDate="2026-07-08"
        onStartDateChange={noop}
        onEndDateChange={noop}
        onReprint={noop}
      />
    )

    expect(screen.getByText('VTA-001-202607-0001')).toBeInTheDocument()
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    expect(screen.getByText('$116.00')).toBeInTheDocument()
    expect(screen.getByText('Efectivo')).toBeInTheDocument()
  })

  it('shows the walk-in customer label when the sale has no customer', () => {
    render(
      <SalesHistoryTab
        sales={[makeSale({ customer: undefined, customerId: undefined })]}
        isLoading={false}
        startDate="2026-07-08"
        endDate="2026-07-08"
        onStartDateChange={noop}
        onEndDateChange={noop}
        onReprint={noop}
      />
    )

    expect(screen.getByText('CLIENTE DE MOSTRADOR')).toBeInTheDocument()
  })

  it('calls onReprint with the sale when "Reimprimir" is clicked', () => {
    const onReprint = jest.fn()
    const sale = makeSale()
    render(
      <SalesHistoryTab
        sales={[sale]}
        isLoading={false}
        startDate="2026-07-08"
        endDate="2026-07-08"
        onStartDateChange={noop}
        onEndDateChange={noop}
        onReprint={onReprint}
      />
    )

    fireEvent.click(screen.getByText('Reimprimir'))
    expect(onReprint).toHaveBeenCalledWith(sale)
  })

  it('calls onStartDateChange / onEndDateChange when filter inputs change', () => {
    const onStartDateChange = jest.fn()
    const onEndDateChange = jest.fn()
    render(
      <SalesHistoryTab
        sales={[]}
        isLoading={false}
        startDate="2026-07-08"
        endDate="2026-07-08"
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onReprint={noop}
      />
    )

    fireEvent.change(screen.getByLabelText('Desde:'), { target: { value: '2026-07-01' } })
    expect(onStartDateChange).toHaveBeenCalledWith('2026-07-01')

    fireEvent.change(screen.getByLabelText('Hasta:'), { target: { value: '2026-07-09' } })
    expect(onEndDateChange).toHaveBeenCalledWith('2026-07-09')
  })

  it('shows an empty state message when there are no sales', () => {
    render(
      <SalesHistoryTab
        sales={[]}
        isLoading={false}
        startDate="2026-07-08"
        endDate="2026-07-08"
        onStartDateChange={noop}
        onEndDateChange={noop}
        onReprint={noop}
      />
    )

    expect(screen.getByText('No hay tickets en el rango seleccionado')).toBeInTheDocument()
  })
})
