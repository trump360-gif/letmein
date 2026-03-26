import type { Meta, StoryObj } from '@storybook/react'
import { Label } from '../label'
import { Input } from '../input'

const meta = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: '라벨' },
}

export const WithInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="username">사용자명</Label>
      <Input id="username" placeholder="사용자명을 입력하세요" />
    </div>
  ),
}

export const Required: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="req">
        필수 항목 <span className="text-destructive">*</span>
      </Label>
      <Input id="req" placeholder="필수 입력" />
    </div>
  ),
}
