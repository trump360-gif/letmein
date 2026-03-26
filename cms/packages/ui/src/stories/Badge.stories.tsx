import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: '활성' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: '대기' },
}

export const Destructive: Story = {
  args: { variant: 'destructive', children: '정지' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: '일반' },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge>활성</Badge>
      <Badge variant="secondary">대기</Badge>
      <Badge variant="destructive">정지</Badge>
      <Badge variant="outline">휴면</Badge>
    </div>
  ),
}

export const StatusBadges: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">처리됨</Badge>
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">대기</Badge>
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">기각</Badge>
    </div>
  ),
}
