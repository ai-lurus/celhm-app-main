import type { Meta, StoryObj } from '@storybook/react'
import { SalesChart } from './SalesChart'

const meta = {
  title: 'Components/SalesChart',
  component: SalesChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title of the chart',
    },
    data: {
      control: 'object',
      description: 'Array of sales data with month and value',
    },
  },
} satisfies Meta<typeof SalesChart>

export default meta
type Story = StoryObj<typeof meta>

const sampleData = [
  { month: 'Jan', value: 45000 },
  { month: 'Feb', value: 42000 },
  { month: 'Mar', value: 55000 },
  { month: 'Apr', value: 62000 },
  { month: 'May', value: 58000 },
  { month: 'Jun', value: 65000 },
]

export const Default: Story = {
  args: {
    data: sampleData,
    title: 'Sales Trend',
  },
}

export const IncreasingTrend: Story = {
  args: {
    data: [
      { month: 'Jan', value: 20000 },
      { month: 'Feb', value: 30000 },
      { month: 'Mar', value: 40000 },
      { month: 'Apr', value: 50000 },
      { month: 'May', value: 60000 },
      { month: 'Jun', value: 70000 },
    ],
    title: 'Sales Trend',
  },
}

export const DecreasingTrend: Story = {
  args: {
    data: [
      { month: 'Jan', value: 70000 },
      { month: 'Feb', value: 60000 },
      { month: 'Mar', value: 50000 },
      { month: 'Apr', value: 40000 },
      { month: 'May', value: 30000 },
      { month: 'Jun', value: 20000 },
    ],
    title: 'Sales Trend',
  },
}

export const VolatileTrend: Story = {
  args: {
    data: [
      { month: 'Jan', value: 50000 },
      { month: 'Feb', value: 30000 },
      { month: 'Mar', value: 70000 },
      { month: 'Apr', value: 40000 },
      { month: 'May', value: 60000 },
      { month: 'Jun', value: 55000 },
    ],
    title: 'Sales Trend',
  },
}

