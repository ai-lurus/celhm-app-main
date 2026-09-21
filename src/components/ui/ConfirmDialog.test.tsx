import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renders nothing while closed', () => {
    render(
      <ConfirmDialog isOpen={false} title="Título" onConfirm={jest.fn()} onCancel={jest.fn()}>
        Cuerpo
      </ConfirmDialog>
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('is an accessible dialog labelled by its title', () => {
    render(
      <ConfirmDialog isOpen title="Reemplazar regla" onConfirm={jest.fn()} onCancel={jest.fn()}>
        Cuerpo
      </ConfirmDialog>
    )
    expect(screen.getByRole('dialog', { name: 'Reemplazar regla' })).toBeInTheDocument()
    expect(screen.getByText('Cuerpo')).toBeInTheDocument()
  })

  it('calls onConfirm and onCancel from the buttons', () => {
    const onConfirm = jest.fn()
    const onCancel = jest.fn()
    render(
      <ConfirmDialog isOpen title="T" confirmLabel="Sí, reemplazar" onConfirm={onConfirm} onCancel={onCancel}>
        Cuerpo
      </ConfirmDialog>
    )
    fireEvent.click(screen.getByText('Sí, reemplazar'))
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('cancels with Escape, except while saving', () => {
    const onCancel = jest.fn()
    const { rerender } = render(
      <ConfirmDialog isOpen title="T" onConfirm={jest.fn()} onCancel={onCancel}>
        Cuerpo
      </ConfirmDialog>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)

    rerender(
      <ConfirmDialog isOpen isLoading title="T" onConfirm={jest.fn()} onCancel={onCancel}>
        Cuerpo
      </ConfirmDialog>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Guardando...')).toBeDisabled()
  })
})
