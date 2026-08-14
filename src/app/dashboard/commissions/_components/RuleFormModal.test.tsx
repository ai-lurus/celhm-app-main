import { render, screen, fireEvent } from '@testing-library/react'
import RuleFormModal from './RuleFormModal'

jest.mock('../../../../lib/hooks/useCommissionPlans', () => ({
  useCommissionCategories: () => ({ data: ['Accesorios', 'Pantallas'] }),
}))
jest.mock('../../../../lib/hooks/useCustomerGroups', () => ({
  useCustomerGroups: () => ({ data: [{ id: 1, name: 'Mayorista', discountPercent: 10, isDefault: false, isFrequentBuyerTarget: false }] }),
}))

describe('RuleFormModal', () => {
  it('disables submit until a scope value is chosen when scope is not GENERAL', () => {
    render(
      <RuleFormModal
        isOpen
        mode="add"
        ruleToRevise={null}
        isSaving={false}
        onClose={jest.fn()}
        onSubmitAdd={jest.fn()}
        onSubmitRevise={jest.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('Alcance'), { target: { value: 'PRODUCT_CATEGORY' } })
    fireEvent.change(screen.getByLabelText('Valor (%)'), { target: { value: '10' } })

    expect(screen.getByText('Guardar')).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'Accesorios' } })
    expect(screen.getByText('Guardar')).not.toBeDisabled()
  })

  it('submits the add payload with the chosen fields', () => {
    const onSubmitAdd = jest.fn()
    render(
      <RuleFormModal
        isOpen
        mode="add"
        ruleToRevise={null}
        isSaving={false}
        onClose={jest.fn()}
        onSubmitAdd={onSubmitAdd}
        onSubmitRevise={jest.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('Valor (%)'), { target: { value: '15' } })
    fireEvent.click(screen.getByText('Guardar'))

    expect(onSubmitAdd).toHaveBeenCalledWith({
      basis: 'SALE_TOTAL',
      scopeType: 'GENERAL',
      scopeValue: undefined,
      calcMethod: 'PERCENTAGE',
      value: 15,
      label: undefined,
    })
  })

  it('renders only the revise fields in revise mode, prefilled from the rule', () => {
    render(
      <RuleFormModal
        isOpen
        mode="revise"
        ruleToRevise={{
          id: 1, planId: 2, membershipId: null, basis: 'SALE_TOTAL', scopeType: 'GENERAL',
          scopeValue: null, calcMethod: 'PERCENTAGE', value: 8, validFrom: '2026-01-01',
          validTo: null, label: null,
        }}
        isSaving={false}
        onClose={jest.fn()}
        onSubmitAdd={jest.fn()}
        onSubmitRevise={jest.fn()}
      />
    )

    expect(screen.queryByLabelText('Alcance')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Valor (%)')).toHaveValue(8)
  })
})
