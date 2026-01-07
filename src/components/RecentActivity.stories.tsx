import type { Meta, StoryObj } from '@storybook/react'
import { RecentActivity } from './RecentActivity'

const meta = {
  title: 'Components/RecentActivity',
  component: RecentActivity,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title of the component',
    },
    activities: {
      control: 'object',
      description: 'Array of activity items with type, message, and time',
    },
  },
} satisfies Meta<typeof RecentActivity>

export default meta
type Story = StoryObj<typeof meta>

const sampleActivities = [
  {
    type: 'sale' as const,
    message: 'New sale: iPhone 15 Pro - $999',
    time: '5 minutes ago',
  },
  {
    type: 'ticket' as const,
    message: 'New ticket: Customer support request #TK-1245',
    time: '15 minutes ago',
  },
  {
    type: 'stock' as const,
    message: 'Low stock alert: Samsung Galaxy S24 - Only 5 units left',
    time: '1 hour ago',
  },
  {
    type: 'client' as const,
    message: 'New client: Maria Rodriguez added to system',
    time: '2 hours ago',
  },
]

export const Default: Story = {
  args: {
    activities: sampleActivities,
    title: 'Recent Activity',
  },
}

export const OnlySales: Story = {
  args: {
    activities: [
      {
        type: 'sale' as const,
        message: 'New sale: iPhone 15 Pro - $999',
        time: '5 minutes ago',
      },
      {
        type: 'sale' as const,
        message: 'New sale: Samsung Galaxy S24 - $899',
        time: '10 minutes ago',
      },
      {
        type: 'sale' as const,
        message: 'New sale: Google Pixel 8 - $699',
        time: '20 minutes ago',
      },
    ],
    title: 'Recent Activity',
  },
}

export const MixedActivities: Story = {
  args: {
    activities: [
      {
        type: 'sale' as const,
        message: 'New sale: iPhone 15 Pro - $999',
        time: '5 minutes ago',
      },
      {
        type: 'ticket' as const,
        message: 'New ticket: Customer support request #TK-1245',
        time: '15 minutes ago',
      },
      {
        type: 'stock' as const,
        message: 'Low stock alert: Samsung Galaxy S24 - Only 5 units left',
        time: '1 hour ago',
      },
    ],
    title: 'Recent Activity',
  },
}

export const Empty: Story = {
  args: {
    activities: [],
    title: 'Recent Activity',
  },
}

