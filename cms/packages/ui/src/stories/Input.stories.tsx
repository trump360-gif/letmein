import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '../input'
import { Label } from '../label'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
    },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { placeholder: '텍스트를 입력하세요' },
}

export const Email: Story = {
  args: { type: 'email', placeholder: 'email@example.com' },
}

export const Password: Story = {
  args: { type: 'password', placeholder: '비밀번호' },
}

export const Disabled: Story = {
  args: { disabled: true, placeholder: '비활성화', value: '수정 불가' },
}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="email">이메일</Label>
      <Input type="email" id="email" placeholder="admin@beauti.com" />
    </div>
  ),
}

export const Search: Story = {
  args: { type: 'search', placeholder: '검색어를 입력하세요...' },
}

export const File: Story = {
  args: { type: 'file' },
}
