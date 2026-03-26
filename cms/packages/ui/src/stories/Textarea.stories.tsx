import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from '../textarea'
import { Label } from '../label'

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { placeholder: '내용을 입력하세요...' },
}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message">메모</Label>
      <Textarea id="message" placeholder="관리자 메모를 입력하세요..." />
    </div>
  ),
}

export const Disabled: Story = {
  args: { disabled: true, value: '수정 불가 영역' },
}

export const WithCounter: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="desc">설명</Label>
      <Textarea id="desc" placeholder="설명을 입력하세요..." maxLength={200} />
      <p className="text-sm text-muted-foreground">최대 200자</p>
    </div>
  ),
}
