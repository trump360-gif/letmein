import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Switch } from '../switch'
import { Label } from '../label'

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const Checked: Story = {
  args: { checked: true },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const WithLabel: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)
    return (
      <div className="flex items-center space-x-2">
        <Switch checked={checked} onCheckedChange={setChecked} />
        <Label>{checked ? '활성화됨' : '비활성화됨'}</Label>
      </div>
    )
  },
}

export const SettingsExample: Story = {
  render: () => (
    <div className="space-y-4 w-[300px]">
      {[
        { id: 'maintenance', label: '유지보수 모드', desc: '사이트를 점검 모드로 전환합니다.' },
        { id: 'signup', label: '회원가입 허용', desc: '새로운 회원가입을 허용합니다.' },
        { id: 'email', label: '이메일 알림', desc: '관리자 이메일 알림을 활성화합니다.' },
      ].map((item) => (
        <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor={item.id} className="text-base">{item.label}</Label>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
          <Switch id={item.id} />
        </div>
      ))}
    </div>
  ),
}
