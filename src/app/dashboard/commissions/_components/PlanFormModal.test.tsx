import { render, screen, fireEvent } from '@testing-library/react'
import PlanFormModal from './PlanFormModal'

describe('PlanFormModal', () => {
  it('disables submit when name is empty', () => {
    render(<PlanFormModal isOpen planToEdit={null} isSaving={false} onClose={jest.fn()} onSave={jest.fn()} />)
    expect(screen.getByText('Guardar')).toBeDisabled()
  })

  it('submits name and role when creating a new plan', () => {
    const onSave = jest.fn()
    render(<PlanFormModal isOpen planToEdit={null} isSaving={false} onClose={jest.fn()} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Vendedor estándar' } })
    fireEvent.change(screen.getByLabelText('Rol (opcional)'), { target: { value: 'VENDEDOR' } })
    fireEvent.click(screen.getByText('Guardar'))

    expect(onSave).toHaveBeenCalledWith({ name: 'Vendedor estándar', role: 'VENDEDOR' })
  })

  it('does not show the role field when editing an existing plan', () => {
    render(
      <PlanFormModal
        isOpen
        planToEdit={{ id: 1, name: 'Vendedor', role: 'VENDEDOR', active: true, rules: [] }}
        isSaving={false}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    )
    expect(screen.queryByLabelText('Rol (opcional)')).not.toBeInTheDocument()
    expect(screen.getByText('Actualizar')).toBeInTheDocument()
  })
})
