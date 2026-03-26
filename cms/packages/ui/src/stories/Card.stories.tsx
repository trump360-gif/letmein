import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card'
import { Button } from '../button'
import { Input } from '../input'
import { Label } from '../label'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>카드 제목</CardTitle>
        <CardDescription>카드 설명 텍스트입니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>카드 콘텐츠 영역입니다.</p>
      </CardContent>
    </Card>
  ),
}

export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>설정 변경</CardTitle>
        <CardDescription>사이트 설정을 변경합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="siteName">사이트 이름</Label>
            <Input id="siteName" defaultValue="Beauti Admin" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="siteUrl">사이트 URL</Label>
            <Input id="siteUrl" defaultValue="https://admin.beauti.com" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">취소</Button>
        <Button>저장</Button>
      </CardFooter>
    </Card>
  ),
}

export const StatCard: Story = {
  render: () => (
    <Card className="w-[200px]">
      <CardHeader className="pb-2">
        <CardDescription>전체 회원</CardDescription>
        <CardTitle className="text-3xl">12,458</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">어제 대비 +2.5%</p>
      </CardContent>
    </Card>
  ),
}

export const StatCards: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      {[
        { label: '전체 회원', value: '12,458', change: '+2.5%' },
        { label: '오늘 가입', value: '48', change: '+12%' },
        { label: '게시물', value: '3,204', change: '+5.1%' },
        { label: '신고 대기', value: '7', change: '-3건' },
      ].map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-3xl">{stat.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
}
