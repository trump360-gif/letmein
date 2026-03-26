import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../button'
import { Mail, Loader2, ChevronRight, Plus } from 'lucide-react'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: '버튼' },
}

export const Destructive: Story = {
  args: { variant: 'destructive', children: '삭제' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: '취소' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: '보조' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
}

export const Link: Story = {
  args: { variant: 'link', children: '링크 버튼' },
}

export const Small: Story = {
  args: { size: 'sm', children: '작은 버튼' },
}

export const Large: Story = {
  args: { size: 'lg', children: '큰 버튼' },
}

export const Icon: Story = {
  args: { size: 'icon', children: <Plus className="h-4 w-4" /> },
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Mail className="mr-2 h-4 w-4" /> 이메일 발송
      </>
    ),
  },
}

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 처리 중...
      </>
    ),
  },
}

export const WithTrailingIcon: Story = {
  args: {
    children: (
      <>
        다음 <ChevronRight className="ml-2 h-4 w-4" />
      </>
    ),
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon"><Plus className="h-4 w-4" /></Button>
    </div>
  ),
}
