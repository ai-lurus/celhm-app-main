import type { Meta, StoryObj } from '@storybook/react'
import { TopProducts } from './TopProducts'

const meta = {
  title: 'Components/TopProducts',
  component: TopProducts,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title of the component',
    },
    products: {
      control: 'object',
      description: 'Array of top products with name, units, and revenue',
    },
  },
} satisfies Meta<typeof TopProducts>

export default meta
type Story = StoryObj<typeof meta>

const sampleProducts = [
  { name: 'iPhone 15 Pro', units: 145, revenue: 145000 },
  { name: 'Samsung Galaxy S24', units: 132, revenue: 118800 },
  { name: 'Google Pixel 8', units: 98, revenue: 68600 },
  { name: 'OnePlus 12', units: 76, revenue: 53200 },
  { name: 'Xiaomi 14', units: 64, revenue: 38400 },
]

export const Default: Story = {
  args: {
    products: sampleProducts,
    title: 'Top Selling Products',
  },
}

export const FewProducts: Story = {
  args: {
    products: [
      { name: 'iPhone 15 Pro', units: 145, revenue: 145000 },
      { name: 'Samsung Galaxy S24', units: 132, revenue: 118800 },
    ],
    title: 'Top Selling Products',
  },
}

export const ManyProducts: Story = {
  args: {
    products: [
      { name: 'iPhone 15 Pro', units: 145, revenue: 145000 },
      { name: 'Samsung Galaxy S24', units: 132, revenue: 118800 },
      { name: 'Google Pixel 8', units: 98, revenue: 68600 },
      { name: 'OnePlus 12', units: 76, revenue: 53200 },
      { name: 'Xiaomi 14', units: 64, revenue: 38400 },
      { name: 'Huawei P60', units: 52, revenue: 31200 },
      { name: 'Oppo Find X6', units: 48, revenue: 28800 },
    ],
    title: 'Top Selling Products',
  },
}

export const Empty: Story = {
  args: {
    products: [],
    title: 'Top Selling Products',
  },
}

