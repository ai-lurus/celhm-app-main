import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '../stores/auth'
import { Role } from '@celhm/types'

const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      router: {
        pathname: '/dashboard',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      // Set mock user data for Storybook
      useAuthStore.setState({
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMINISTRADOR' as Role,
          branchId: 1,
          organizationId: 1,
        },
        token: 'mock-token',
      })
      return <Story />
    },
  ],
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-100 p-8">
        <h2 className="text-xl font-bold">Main Content Area</h2>
        <p className="mt-4 text-gray-600">
          This is the main content area. The sidebar is on the left.
        </p>
      </div>
    </div>
  ),
}

export const WithNavigation: Story = {
  render: () => (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-100 p-8">
        <h2 className="text-xl font-bold">Dashboard Content</h2>
        <p className="mt-4 text-gray-600">
          Navigate using the sidebar menu items.
        </p>
      </div>
    </div>
  ),
}

