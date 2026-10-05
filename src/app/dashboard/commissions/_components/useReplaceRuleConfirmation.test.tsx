import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { CommissionRule, CommissionRuleInput } from '../../../../lib/hooks/useCommissionPlans'
import { useReplaceRuleConfirmation } from './useReplaceRuleConfirmation'

const openGeneral: CommissionRule = {
  id: 1,
  planId: null,
  membershipId: 9,
  basis: 'SALE_TOTAL',
  scopeType: 'GENERAL',
  scopeValue: null,
  calcMethod: 'PERCENTAGE',
  value: 5,
  validFrom: '2026-08-01T06:00:00.000Z',
  validTo: null,
  label: null,
}

function Harness({ rules, save }: { rules: CommissionRule[]; save: (data: CommissionRuleInput) => Promise<void> }) {
  const { submit, dialog } = useReplaceRuleConfirmation(rules, save)
  return (
    <div>
      <button onClick={() => submit({ basis: 'SALE_TOTAL', scopeType: 'GENERAL', calcMethod: 'PERCENTAGE', value: 7 })}>
        Guardar regla
      </button>
      {dialog}
    </div>
  )
}

describe('useReplaceRuleConfirmation', () => {
  it('saves straight away when no open rule shares the scope', () => {
    const save = jest.fn().mockResolvedValue(undefined)
    render(<Harness rules={[]} save={save} />)

    fireEvent.click(screen.getByText('Guardar regla'))

    expect(save).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('asks first when an open rule shares the scope, and names what will happen', () => {
    const save = jest.fn().mockResolvedValue(undefined)
    render(<Harness rules={[openGeneral]} save={save} />)

    fireEvent.click(screen.getByText('Guardar regla'))

    expect(save).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Ya existe una regla para este alcance' })).toBeInTheDocument()
    expect(screen.getByText(/5% de venta total\) terminará al iniciar hoy/)).toBeInTheDocument()
  })

  it('saves only after the user confirms the replacement', async () => {
    const save = jest.fn().mockResolvedValue(undefined)
    render(<Harness rules={[openGeneral]} save={save} />)

    fireEvent.click(screen.getByText('Guardar regla'))
    fireEvent.click(screen.getByText('Reemplazar regla'))

    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ value: 7, scopeType: 'GENERAL' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('does not save when the user cancels', () => {
    const save = jest.fn().mockResolvedValue(undefined)
    render(<Harness rules={[openGeneral]} save={save} />)

    fireEvent.click(screen.getByText('Guardar regla'))
    fireEvent.click(screen.getByText('Cancelar'))

    expect(save).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
