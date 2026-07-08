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
