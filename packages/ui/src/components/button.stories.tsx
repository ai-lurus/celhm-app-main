import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

/**
 * Ejemplo de Story para el componente Button
 * 
 * Este archivo demuestra cómo documentar componentes en Storybook.
 * El componente Button usa Radix UI (Slot) y class-variance-authority para variantes.
 */
const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Variante visual del botón',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Tamaño del botón',
    },
    disabled: {
      control: 'boolean',
      description: 'Estado deshabilitado',
    },
    asChild: {
      control: 'boolean',
      description: 'Renderizar como child (usando Radix Slot)',
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Botón por defecto (primary)
 */
export const Default: Story = {
  args: {
    children: 'Button',
  },
}

/**
 * Botón destructivo (rojo, para acciones peligrosas)
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
}

/**
 * Botón outline (borde, sin fondo)
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
}

/**
 * Botón secondary (gris)
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

/**
 * Botón ghost (sin borde, solo hover)
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
}

/**
 * Botón link (estilo de enlace)
 */
export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link',
  },
}

/**
 * Tamaños disponibles
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

/**
 * Estado deshabilitado
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
}

/**
 * Botón como child (usando Radix Slot)
 * Útil para renderizar como enlace u otro elemento
 */
export const AsChild: Story = {
  args: {
    asChild: true,
    children: <a href="#test">Link Button</a>,
  },
}

/**
 * Todas las variantes en una vista
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  ),
}
